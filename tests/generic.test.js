const crypto = require('crypto');
const { write: fWrite, contents: fContents } = require('../src/helpers/file');
const { sha256, asInt10, requestDateUTC, dateFormat  } = require('../src/helpers/generic');

describe('sha256', () => {
  it('should return a sha256 hash string', () => {
  const input = 'test';
  const expectedHash = crypto.createHash('sha256').update(input).digest('hex');
  const result = sha256(input);
  expect(result).toEqual(expectedHash);
  });
  });

  describe('asInt10', () => {
    it('should return an integer representation of a string', () => {
      const strToInt = '123';
      const expectedInt = 123;
      const result = asInt10(strToInt);
      expect(result).toEqual(expectedInt);
    });
  });

describe('fWrite', () => {
  it('should write contents to a file', () => {
    const filePath = './testfile.txt';
    const fileContents = 'test contents';
    fWrite(filePath, fileContents);
    const result = fContents(filePath);
    expect(result).toEqual(fileContents);
  });
});

describe('fContents', () => {
  it('should return the contents of a file', () => {
    const filePath = './testfile.txt';
    const fileContents = 'test contents';
    fWrite(filePath, fileContents);
    const result = fContents(filePath);
    expect(result).toEqual(fileContents);
  });
});

describe('requestDateUTC', () => {
  it('should return the current UTC time as an integer', () => {
    const expectedDateInt = parseInt(Date.now() / 1000, 10);
    const result = requestDateUTC;
    expect(result).toEqual(expectedDateInt);
  });
});

describe('dateFormat', () => {
  it('should convert a human-readable date string to a UTC integer', () => {
    const dateStr = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const expectedInt = 0;
    const result = dateFormat.fromHumanToUTCInt(dateStr);
    expect(result).toEqual(expectedInt);
  });

  it('should convert a UTC integer to a human-readable date string', () => {
    const intDate = 0;
    const expectedStr = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const result = dateFormat.fromUTCIntToHuman(intDate);
    expect(result).toEqual(expectedStr);
  });
});
