/*jslint node:true, nomen:true, unparam:true*/

(function () {

    'use strict';

    var _ = require('underscore'),
        through2 = require('through2'),
        fs = require('fs'),
        cheerio = require('cheerio'),
        util = require('gulp-util'),
        favicons = require('favicons');

    module.exports = function (params) {

        function findInfo(source, callback) {
            fs.readFile(source, function (error, data) {
                var $;
                if (error) {
                    throw error;
                }
                $ = cheerio.load(data);
                return callback($('link[rel="favicons"]').attr('href'));
            });
        }

        return through2.obj(function (file, enc, cb) {

            findInfo(file.path, function (image) {

                var options = _.defaults(params || {}, {
                    files: {
                        src: image,
                        dest: null,
                        html: file.path,
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
                        appName: null,
                        appDescription: null,
                        developer: null,
                        developerURL: null,
                        background: null,
                        index: null,
                        url: null,
                        logging: false
                    }
                });

                if (file.isNull()) {
                    cb(null, file);
                    return;
                }

                if (file.isStream()) {
                    cb(new util.PluginError('gulp-favicons', 'Streaming not supported'));
                    return;
                }

                favicons(options, function (err) {
                    file.contents = new Buffer(html);
                    return cb(error, file);
                });

            });

        });

    };

}());
