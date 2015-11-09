/*jslint node:true, nomen:true*/
(function () {

    'use strict';

    var _ = require('underscore'),
        async = require('async'),
        Jimp = require('jimp'),
        config = require('loadobjects').sync('config');

    module.exports = function (source, parameters, next) {

        var options = _.defaults(parameters || {}, config.defaults),
            Helpers = require('./helpers.js')(options),
            background = Helpers.General.background(options.background);

        function createFavicon(sourceset, properties, name, callback) {
            var minimum = Math.min(properties.width, properties.height),
                icon = _.min(sourceset, function (image) {
                    return image.size >= minimum;
                });
            async.waterfall([
                function (callback) {
                    Helpers.Images.read(icon.file, function (error, image) {
                        return callback(error, image);
                    });
                },
                function (image, callback) {
                    Helpers.Images.Resize(image, minimum, Jimp.AUTO, function (error, image) {
                        return callback(error, image);
                    });
                },
                function (image, callback) {
                    Helpers.Images.create(properties.width, properties.height, background, function (error, canvas) {
                        return callback(error, image, canvas);
                    });
                },
                function (image, canvas, callback) {
                    Helpers.Images.composite(canvas, image, properties.height, properties.width, minimum, function (error, canvas) {
                        return callback(error, canvas);
                    });
                },
                function (canvas, callback) {
                    Helpers.Images.getBuffer(canvas, Jimp.MIME_PNG, function (error, buffer) {
                        return callback(error, buffer);
                    });
                },
            ], function (error, buffer) {
                return callback(error, { name: name, contents: buffer });
            });
        }

        function createHTML(platform, callback) {
            var html = [];
            async.forEachOf(config.html[platform], function (code, name, callback) {
                Helpers.HTML.parse(name, code, function (error, html) {
                    return callback(html.push(html) && error);
                });
            }, function (error) {
                return callback(error, _.compact(html));
            });

        }

        function createFiles(platform, callback) {
            var files = [];
            async.forEachOf(config.files[platform], function (properties, name, callback) {
                Helpers.Files.create(properties, name, function (file) {
                    return callback(files.push(file) && null);
                });
            }, function (error) {
                return callback(error, _.compact(files));
            });
        }

        function createFavicons(sourceset, platform, callback) {
            var images = [];
            async.forEachOf(config.icons[platform], function (properties, name, callback) {
                createFavicon(sourceset, properties, name, function (error, image) {
                    return callback(images.push(image) && error);
                });
            }, function (error) {
                return callback(error, _.compact(images));
            });
        }

        function createPlatform(sourceset, platform, callback) {
            async.parallel([
                function (callback) {
                    createFavicons(sourceset, platform, function (error, images) {
                        return callback(error, images);
                    });
                },
                function (callback) {
                    createFiles(platform, function (error, files) {
                        return callback(error, files);
                    });
                },
                function (callback) {
                    createHTML(platform, function (error, code) {
                        return callback(error, code);
                    });
                }
            ], function (error, results) {
                return callback(error, results[0], results[1], results[2]);
            });
        }

        function create(sourceset, platforms, callback) {
            var response = { images: [], files: [], html: [] };
            async.forEachOf(platforms, function (enabled, platform, callback) {
                if (enabled) {
                    Helpers.General.print(platform, 'Creating favicons for platform');
                    createPlatform(sourceset, platform, function (error, images, files, html) {
                        response.images = response.images.concat(images);
                        response.files = response.files.concat(files);
                        response.html = response.html.concat(html);
                        return callback(error);
                    });
                } else {
                    return callback(null);
                }
            }, function (error) {
                return callback(error, response);
            });
        }

        async.waterfall([
            function (callback) {
                Helpers.General.source(source, function (error, sourceset) {
                    return callback(error, sourceset);
                });
            },
            function (sourceset, callback) {
                create(sourceset, options.icons, function (error, response) {
                    return callback(error, response);
                });
            }
        ], function (error, response) {
            return Helpers.General.finale(error, response, next);
        });

    };

}());
