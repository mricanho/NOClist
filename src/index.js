const yargs = require("yargs");
const NocListClient = require('./NocListClient');

const cliOptions = yargs
  .usage("Usage: node ./src/index.js -c [, --client] [-d, --debug] [-P,-S http] [-h 0.0.0.0] [-p 8888] [-o N] [-f 5]")
  .option("c", { alias: "client", describe: "Start client", type: "boolean", demandOption: true })
  .option("d", { alias: "debug", describe: "Enable debug mode", type: "boolean" })
  .option("P", { alias: "protocol", describe: "Request schema", type: "string" })
  .option("S", { alias: "schema", describe: "Request schema", type: "string" })
  .option("h", { alias: "host", describe: "Remote host/domain", type: "string" })
  .option("p", { alias: "port", describe: "Remote port", type: "string" })
  .option("t", { alias: "timeOut", describe: "Request time out in secs.", type: "int" })
  .argv;

// Deconstruction CLI options.
const { debug, protocol, schema, host, port, timeOut } = cliOptions;

let options = {};

// Integrating options.
if( debug ){ options = { ...options, debug };}
if( protocol ){ options = { ...options, protocol };}
if( schema ){ options = { ...options, schema };}
if( host ){ options = { ...options, host };}
if( port ){ options = { ...options, port };}
if( timeOut ){ options = { ...options, timeOut: parseInt( timeOut, 10 ) };}

// Start execution only if client parameters are specified
if( cliOptions.client ){

  let config = Object.keys( options ).length ? options : null;
  NocListClient.start( config );

}