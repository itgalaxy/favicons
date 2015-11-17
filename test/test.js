/*jslint node:true*/

'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

function dumpAnyFiles(files, dir) {
  files.forEach(function(f) {
    fs.writeFileSync(path.join(dir, f.name), f.contents);
  });
}

function assertAnyFiles(fileList, scenarioPath, dirName) {
  var expImgDir = path.join('test', 'expected', scenarioPath, dirName);

  var obsImgDir = path.join('test', 'output', scenarioPath, dirName);
  if (fs.existsSync(obsImgDir)) {
    rimraf.sync(obsImgDir);
  }
  mkdirp.sync(obsImgDir);

  // Why do we dump the files before compariing the lists?
  // Because, when writing a new tests, we will review these
  // files and use them as the expected result.
  dumpAnyFiles(fileList, obsImgDir);

  // Make sure we generated all expected files,
  // and only these files.
  var expFiles = fs.readdirSync(expImgDir).sort();
  var obsFiles = fileList.map(function(i) {
    return i.name;
  }).sort();
  assert.deepEqual(obsFiles, expFiles);

  // Make sure the proper files were generated
  expFiles.forEach(function(img) {
    assert.equal(
      fs.readFileSync(path.join(obsImgDir, img)).toString(),
      fs.readFileSync(path.join(expImgDir, img)).toString());
  });
}

function assertHtml(result, scenarioPath) {
  var expected = fs.readFileSync(
    path.join('test', 'expected', scenarioPath, 'html.txt')).toString();
  assert.equal(result.html.join('\n'), expected);
}

function assertImages(result, scenarioPath) {
  assertAnyFiles(result.images, scenarioPath, 'images');
}

function assertFiles(result, scenarioPath) {
  assertAnyFiles(result.files, scenarioPath, 'files');
}

module.exports = {
  assertFaviconGeneration(result, scenarioPath) {
    assertHtml(result, scenarioPath);
    assertImages(result, scenarioPath);
    assertFiles(result, scenarioPath);
  }
}
