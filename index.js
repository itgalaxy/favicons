/*jslint node:true, nomen:true, unparam:true*/

(function () {

    'use strict';

    var _ = require('underscore'),
        mergeDefaults = require('merge-defaults'),
        through2 = require('through2'),
        fs = require('fs'),
        cheerio = require('cheerio'),
        util = require('gulp-util'),
        path = require('path'),
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

        _.mixin({ 'mergeDefaults': mergeDefaults });

        return through2.obj(function (file, enc, cb) {

            findInfo(file.path, function (image) {

                var options = _.mergeDefaults(params || {}, {
                    files: {
                        src: path.join(path.dirname(file.path), image),
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

                options.files.dest = path.join(path.dirname(file.path), options.files.dest);

                favicons(options, function (error, html) {
                    file.contents = new Buffer(_.flatten(html).join(' '));
                    return cb(error, file);
                });

            });

        });

    };

}());
