const fetch = require('node-fetch');
const { sha256, fWrite, fContents, asInt10, requestDateUTC, dateFormat, errorLog } = require('./helpers/generic');

const NocListClient = {
	debugMode: false,

	authToken: null,
	responseBody: null,
	httpTryCount: 0,
	maxHTTPRetryTimes: 3,

	remoteServer: 'http://0.0.0.0:8888',

	routes: {
		auth: '/auth',
		users: '/users',
		tokenCachePath: '/token.json',
	},

	// Identify where an error was thrown
	exitCodeComponents: {
		local: 0,
		remote: 0,
		emptyToken: 0,
		emptyBody: 0,
	},

	// Static info about auth token
	requests: {
		tokenCache: __dirname,
		expires: 0,
		timeout: 10,
	},

	/**
	* Returns the error status by binary parsing of this.exitCodeComponents.
	* @returns {Int16} Identify the error:
	* *  0 = success
	* *  1 = empty token
	* *  2 = empty body
	* *  3 = empty token and body
	* *  4 = local error
	* *  5 = local error and empty token
	* *  6 = local error and empty body
	* *  7 = local error, empty body and empty token
	* *  8 = remote error.
	* *  9 = remote error and empty token
	* * 10 = remote error and empty body
	* * 11 = remote error, empty body and empty token
	* * 12 = remote and local error
	* * 13 = remote and local error with empty token
	* * 14 = remote and local error with empty body
	* * 15 = General error
	*/
	get exitStatus() {
		let { local, remote, emptyToken, emptyBody } = this.exitCodeComponents;
		return parseInt(`${remote}${local}${emptyBody}${emptyToken}`, 2);
	},

	// Prepare client
	start: function (remoteOptions = {}) {

		// Check for specific received configuration
		const { timeOut = 0, debug = false } = remoteOptions || {};
		const { protocol = null, scheme = null, host = null, port = null } = remoteOptions || {};
		this.remoteServer = `${protocol || scheme || 'http'}://${host || '0.0.0.0'}:${port || '8888'}`;

		this.debugMode = !!debug;

		// Set token cache path
		this.requests.tokenCache += this.routes.tokenCachePath;

		this.requests.timeout = timeOut || this.requests.timeout;

		if (this.requests.timeout) {

			let token = null;

			// Try get the token
			if ( token = this.token() ) {
				this.users();
			}

		}

	},

	fetchData: async function (url, fetchOptions = {}, helpFns = {}) {

		const noFn = () => {}, traceConfigInfo = {url, fetchOptions};
		NocListClient.debugMode && console.log( 'new Fetch Request: ', traceConfigInfo );
		
		const {
			onReadyFn = res => res.status === 200 && res,
			parser = res => res && res.text(),
			onDoneFn = noFn,
			onErrorFn = error => {
				console.error( error.message );
				this.exitCodeComponents.remote = 1;
				error.context = { fetchArguments: traceConfigInfo };
				errorLog( error, 1 );
			},
			alwaysFn = noFn,
		} = helpFns;

		return fetch( url, fetchOptions )
				.then( onReadyFn )
					.then( parser )
						.then( onDoneFn )
							.catch( onErrorFn )
								.finally( alwaysFn );
	},

	// Check token cache expiration. Request a new if expired.
	token: function () {

		this.authToken = this.tokenAuthCache();
		this.exitCodeComponents.emptyToken = !this.authToken ? 1 : 0;

		if( this.authToken ){
			return this.authToken;
		}
		
		this.tokenAuthRequest();

	},

	tokenSave: function (tokenInfo) {

		const saveInfo = {
			path: this.requests.tokenCache,
			contents: JSON.stringify(tokenInfo)
		};

		this.authToken = tokenInfo && tokenInfo.token;

		return fWrite(saveInfo.path, saveInfo.contents);

	},

	// Make and HTTP request to /auto.
	tokenAuthRequest: function () {

		let attempts = this.maxHTTPRetryTimes, isOk = false;
		const url = this.remoteServer + this.routes.auth;
		const options = {};
		const helpFns = {
			parser: response => {
				const { headers } = response;
				let expires = -1, generated = requestDateUTC, token = null;

				try {

					if( !headers || !headers.get ){
						throw new Error(`Invalid header response` );
					}

					generated = headers.get('date') || generated;
					token = headers.get('badsec-authentication-token') || token;
					NocListClient.authToken = token;

					if ( NocListClient.authToken ) {
						expires = 0;
					} else {
						throw new Error('Invalid token');
					}

				} catch (error) {

					NocListClient.exitCodeComponents.remote = 1;
					error.context = { clientConfig: NocListClient };
					errorLog(error);

				} finally {

					// URI was requested so, save values.
					NocListClient.tokenSave({ token, expires, generated });

				}

				return response;
			},
			onDoneFn: () => {
				--attempts;
				NocListClient.httpTryCount = attempts;
				isOk = !!NocListClient.authToken;
			},
			onErrorFn: error => {
				--attempts;
				NocListClient.exitCodeComponents.remote = 1;
				error.context = { clientConfig: NocListClient };
				errorLog( error, 1 );
			},
			alwaysFn: () => {
				NocListClient.debugMode && console.log( `Client status when: [${NocListClient.routes.auth}]`, NocListClient );

				NocListClient.httpTryCount = attempts;

				if( isOk ) {
					NocListClient.users();
				} else if( attempts > 0 ) {
					NocListClient.fetchData( url, options, helpFns );
				}

			},
		};

		attempts && this.fetchData( url, options, helpFns );

	},

	/**  Get token from local saved cache file */
	tokenAuthCache: function () {

		let tokenAuthCache = null, tokenCachePath = __dirname + this.routes.tokenCachePath;

		try {

			const tokenCacheInfo = fContents(tokenCachePath, s => JSON.parse(s)) || {};

			if ( this.isValidToken( tokenCacheInfo ) ) {
				tokenAuthCache = tokenCacheInfo.token;
			}

		} catch (error) {

			this.exitCodeComponents.local = 1;
			tokenAuthCache = null;
			error.context = { clientConfig: NocListClient };
			errorLog(error);

		}

		return tokenAuthCache;

	},

	/** Check expiration time, expiration time frame and valid token */
	isValidToken: function (tokenInfo) {

		let expiresInt = 0, tokenDateInt = null;
		const { fromHumanToUTCInt: humanToInt } = dateFormat;
		const { token, expires, generated: tokenDate } = tokenInfo || {};

		try {

			if (expiresInt = asInt10(expires)) {

				// Negative value represents a forced expiration.
				if (expiresInt < 1) {
					NocListClient.tokenSave({ token: null, expires: expiresInt, generated: null });
					return false;
				}

				// Get the token requested date
				tokenDateInt = tokenDate ? humanToInt(tokenDate) : requestDateUTC;

				// Get the token expiration date
				this.requests.expires = tokenDateInt + expiresInt;

				const isExpired = requestDateUTC > this.requests.expires;

				// If the script may ends after expiration, avoid attempts.
				if (isExpired) {
					return false;
				}

				return !!token;

			}

		} catch (error) {

			this.exitCodeComponents.local = 1;
			error.context = { clientConfig: NocListClient };
			errorLog(error);

		}

		return !!token;

	},

	users: function () {

		let attempts = this.maxHTTPRetryTimes, isOk = false;
		const url = this.remoteServer + this.routes.users;
		const options = {
			headers: {
				"X-Request-Checksum": sha256(`${this.authToken}${this.routes.users}`)
			}
		};
		const helpFns = {
			onReadyFn: res => {

				/**
				 * The correct HTTP Status Code for Unauthorized requests is HTTP 401.
				 * but the docker container responds with HTTP 500 so,
				 * I will request the auth on whatever non HTTP 404 status.
				*/
				if( res.status === 200 ){
					return res;
				} else if( !!res && res.status >= 300 && res.status !== 404 ){

					// Clean attempts and start again.
					attempts = 0;
					NocListClient.tokenAuthRequest();
				}

				return false;
			},
			onDoneFn: body => {
				--attempts;
				NocListClient.httpTryCount = attempts;
				
				const multiOSLineBr = /[\r\n]+/g, jsBr = '\n';
				const content = body.toString();
				
				if( isOk = !!body && content.length ){
					
					const validationIterator = id => {
						let validInt = id.replace(/[\D]+/g, '');
						validInt = validInt.match(/^[\d+]{19}$/g);
						return ( validInt && validInt[0] );
					};
					
					let listIDs = !isOk ? [] : content.replace(multiOSLineBr, jsBr).split(jsBr);
					listIDs = listIDs.map( validationIterator );
					listIDs = listIDs.filter( int => !!int );
					
					if( listIDs.length ){
						NocListClient.responseBody = JSON.stringify( listIDs );
					}
					
				}
				
			},
			onErrorFn: error => {
				--attempts;
				NocListClient.exitCodeComponents.remote = 1;
				error.context = { clientConfig: NocListClient };
				errorLog( error, 1 );
			},
			alwaysFn: () => {
				NocListClient.debugMode && console.log( `Client status when: [${NocListClient.routes.users}]`, NocListClient );

				NocListClient.httpTryCount = attempts;

				const {responseBody: body} = NocListClient;

				NocListClient.exitCodeComponents.emptyBody = !body ? 1 : 0;

				if( isOk ){
					console.log( body );
					process.exit( 0 );
				}

				if( !isOk && attempts > 0 ) {
					NocListClient.fetchData( url, options, helpFns );
				}

			},
		};

		attempts && this.fetchData( url, options, helpFns );

	}

};

module.exports = NocListClient;