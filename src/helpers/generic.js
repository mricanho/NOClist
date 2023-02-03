
const { write: fWrite, contents: fContents, errorLog } = require('./file');
const crypto = require('crypto');

const sha256 = input => crypto.createHash('sha256').update(input).digest('hex');
const asInt10 = strToInt => parseInt(strToInt, 10);
const requestDateUTC = asInt10(Date.now() / 1000);
const dateFormat = {
    fromHumanToUTCInt: dateStr => asInt10((new Date(dateStr)).getTime() / 1000),
    fromUTCIntToHuman: intDate => (new Date(intDate * 1000)).toGMTString(),
};

module.exports = {
  sha256,
  fWrite,
  fContents,
  asInt10,
  requestDateUTC,
  dateFormat,
  errorLog,
};