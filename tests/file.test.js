const { readFileSync, writeFileSync, appendFileSync, existsSync, statSync } = require('fs');
const { errorLog, write, append, contents } = require('../src/helpers/file');

describe('file operations', () => {
  const filePath = 'file.txt';

  beforeEach(() => {
    writeFileSync(filePath, '');
  });

  afterEach(() => {
    writeFileSync(filePath, '');
  });

  test('write file', () => {
    const contents = 'hello world';
    const savedBytes = write(filePath, contents);
    expect(savedBytes).toBe(contents.length);
  });

  test('append file', () => {
    const contents = 'hello world';
    const savedBytes = append(filePath, contents);
    expect(savedBytes).toBe(contents.length);
  });

  test('read file contents', () => {
    const contents = 'hello world';
    writeFileSync(filePath, contents);
    const fileContents = readFileSync(filePath, 'utf-8');
    expect(fileContents).toBe(contents);
  });

  test('read non-existent file', () => {
    const fileContents = contents('non-existent-file.txt');
    expect(fileContents).toBe(null);
  });
});
