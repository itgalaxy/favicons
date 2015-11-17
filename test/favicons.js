/*jslint node:true*/

'use strict';

var favicons = require('../index');
var test = require('./test');
var assert = require('assert');

describe('Favicon local generation', function() {
  this.timeout(25000);

  it("should generate a favicon only for desktop browsers", function(done) {
    favicons('./test/logo.png', {
      logging: false,
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        opengraph: false,
        windows: false,
        yandex: false
      }
    }, function(err, result) {
      assert(! err);
      test.assertFaviconGeneration(result, 'favicons/desktop_only');
      done();
    });
  });
});
