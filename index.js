/*jslint node:true, nomen:true, unparam:true*/

(function() {

  'use strict';

  var _ = require('underscore');
  var mergeDefaults = require('merge-defaults');
  var through2 = require('through2');
  var fs = require('fs');
  var cheerio = require('cheerio');
  var util = require('gulp-util');
  var path = require('path');
  var favicons = require('favicons');

  function findInfo(source, callback) {
    // Read in the source HTML file
    fs.readFile(source, function(error, data) {
      var $;
      var info = {};

      if (error) {
        throw error;
      }

      // Cheerio is a jquery core for node
      $ = cheerio.load(data);

      // Populate info with the appropriate data from the
      // HTML page
      info.favicon = $('link[rel="favicons"]').attr('href');
      info.url = $('link[rel="canonical"]').attr('href');
      info.title = $('title').text();
      info.description = $('meta[name="description"]').attr('content');
      info.author = $('meta[name="author"]').attr('content');

      return callback(info);
    });
  }

  module.exports = function(params) {

    // Extend lodash with mergeDefaults
    _.mixin({
      'mergeDefaults': mergeDefaults
    });

    return through2.obj(function(file, enc, cb) {
      // file.path will be the input file
      findInfo(file.path, function(info) {
        var faviconImageSrc = null;
        if (params.files.src) {
          // Use file.cwd here since the path is relative to the gulp file
          faviconImageSrc = path.join(path.dirname(file.path), params.files.src);
        } else if (info && info.favicon) {
          // Use file.path here since the path is relative to the html page
          // for link[rel="favicons"]
          faviconImageSrc = path.join(path.dirname(file.path), info.favicon);
        }

        // We need favicon
        if (!faviconImageSrc) {
          throw new Error('No link[rel="favicons"] defined OR files.src defined');
        }

        // Merge a set of default params with our supplied
        // config
        var options = _.mergeDefaults(params || {}, {
          files: {
            src: faviconImageSrc,
            dest: params.dest,
            html: file.path,
            iconsPath: null,
            androidManifest: null,
            browserConfig: null,
            firefoxManifest: null,
            yandexManifest: null
          },
          icons: {
            android: true,
            appleIcon: true,
            appleStartup: true,
            coast: true,
            favicons: true,
            firefox: true,
            opengraph: true,
            windows: true,
            yandex: true
          },
          settings: {
            appName: info.title,
            appDescription: info.description,
            developer: info.author,
            developerURL: info ? (info.url ? path.join(info.url, '/') : null) : null,
            background: null,
            index: null,
            url: info ? (info.url ? path.join(info.url, '/') : null) : null,
            logging: false
          }
        });

        if (!fs.existsSync(options.files.src)) {
          throw new Error('The favicon image doesn\'t exist: ' + options.files.src);
        }

        if (file.isNull()) {
          cb(null, file);
          return;
        }

        if (file.isStream()) {
          cb(new util.PluginError('gulp-favicons', 'Streaming not supported'));
          return;
        }

        // Get full path for destination of assets
        options.files.dest = path.join(file.cwd, options.files.dest);

        favicons(options, function(error, html) {
          if (error) {
            throw error;
          }

          file.contents = new Buffer(_.flatten(html).join(' '));
          return cb(error, file);
        });

      });

    });

  };

}());
