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
                var $, info = {};
                if (error) {
                    throw error;
                }
                $ = cheerio.load(data);
                info.favicon = $('link[rel="favicons"]').attr('href');
                info.url = $('link[rel="canonical"]').attr('href');
                info.title = $('title').text();
                info.description = $('meta[name="description"]').attr('content');
                info.author = $('meta[name="author"]').attr('content');
                return callback(info);
            });
        }

        _.mixin({ 'mergeDefaults': mergeDefaults });

        return through2.obj(function (file, enc, cb) {

            findInfo(file.path, function (info) {

                var options = _.mergeDefaults(params || {}, {
                    files: {
                        src: info.favicon ? path.join(path.dirname(file.path), info.favicon) : null,
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
                        developerURL: info.url ? path.join(info.url, '/') : null,
                        background: null,
                        index: null,
                        url: info.url ? path.join(info.url, '/') : null,
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
