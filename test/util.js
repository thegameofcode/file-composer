var assert = require('chai').assert;
var sinon = require('sinon');
var render = require('../lib/file-composer').render;

var fs = require('fs');

function test(inputText, expectedOutputText, includeFiles, options) {
  includeFiles = includeFiles || [];

  fs.readFileSync
          .withArgs('input.txt', 'utf8')
          .returns(inputText);

  for (var fileName in includeFiles) {
    var contentFile = includeFiles[fileName];
    fs.readFileSync
            .withArgs(fileName, 'utf8')
            .returns(contentFile);
  }

  fs.writeFile
          .withArgs('out.txt', sinon.match.string, sinon.match.func);

  options = options || {};
  options.i = 'input.txt';
  options.o = 'out.txt';

  render(options);

  assert.equal(fs.writeFile.getCall(0).args[1], expectedOutputText);

}

module.exports = {
  test: test
};