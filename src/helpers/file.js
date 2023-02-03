const { readFileSync, writeFileSync, appendFileSync, existsSync, statSync } = require('fs');

/**
 * @param {String} error Contains the error message.
 * @param {Int} errorLayer Indicates the layer: 0 = General/Local/Client error; 1 = HTTP/Server error.
 */
const errorLog = (error, errorLayer = 0) => {

  //  Max errorLog size: 10MiB;
  const maxErrorLogSize = 1024 * 1024 * 10;

  if (error) {

    const errorLogPaths = {
      general: 'error-local.log',
      remote: 'error-remote.log',
    };

    const { context: errorContext } = error || {};
    const raisedFrom = ( !!error.fileName || !!error.lineNumber );
    const errorLogPath = errorLogPaths[!errorLayer ? 'general' : 'remote'];
    const errorLogStat = existsSync( errorLogPath ) && statSync( errorLogPath );
    const { size: errorLogSize } = errorLogStat || {size: 0};

    const errorComponents = [
      'Error ',
      `@Time: ${(new Date).toISOString() }: \n`,
      !!errorContext      ? JSON.stringify(errorContext)+'\n' : '',
      !!raisedFrom        ? '['                               : '',
      !!error.fileName    ? `@${error.fileName}`              : '',
      !!error.lineNumber  ? `:${error.lineNumber}`            : '',
      !!raisedFrom        ? ']'                               : '',
      !!error.stack       ? error.stack                       : `\n${error.message||''}`,
    ];

    const errorMessage = errorComponents.join('').trim();

    // To avoid [errorLog attacks], verify the final log size before save:
    const isTooBigLogFile = ( errorLogSize + errorMessage.length + 1 ) > maxErrorLogSize;

    let prefix = isTooBigLogFile ? '' : '\n';
  
    // Save the error info.
    file[ isTooBigLogFile ? 'write' : 'append' ]( errorLogPath, prefix + errorMessage );

  }

  return errorLayer;

}

const file = {
  /**
   * @param {String} path The target file path.
   * @param {*} parseFn Expects a parse function to be called after load the file contents.
   * @returns File contents of the path. false if error.
   */
  contents: (path = null, parseFn = false) => {

    if (!path || !existsSync( path )) {
      return null;
    }
  
    let contents = null;

    try {
      contents = readFileSync(path).toString();
    } catch ( error ) {
      errorLog( error );
      contents = false;
    }

    if( parseFn instanceof Function ) {

      try{
        contents = parseFn( contents );
      } catch ( error ) {
        errorLog( error );
        contents = false;
      }

    }
  
    return contents;

  },

  /**
   * @param {String} path The target file path.
   * @param {String | NodeJS.ArrayBufferView} contents The file contents to save.
   * @returns {number | false | null} The string length of contents, false if error or null for bad path or false contents.
   */
  write: (path = null, contents = false) => {

    if (!path || contents === false) {
      return null;
    }
  
    let savedBytes = contents !== false && contents.toString().length;
  
    try {
      writeFileSync(path, contents);
    } catch ( error ) {
      errorLog( error );
      savedBytes = false;
    }
  
    return savedBytes;

  },

  /**
   * @param {String} path The target file path.
   * @param {String | NodeJS.ArrayBufferView} contents The file contents to append at the end of the file.
   * @returns {number | false | null} The string length of contents, false if error or null for bad path or false contents.
   */
  append: (path = null, contents = false) => {

    if (!path || contents === false) {
      return null;
    }
  
    let savedBytes = contents !== false && contents.toString().length;
  
    try {
      appendFileSync(path, contents);
    } catch ( error ) {
      errorLog( error );
      savedBytes = false;
    }
  
    return savedBytes;

  },
};

module.exports = { ...file, errorLog };