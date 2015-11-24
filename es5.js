'use strict';

var _ = require('underscore'),
    async = require('async'),
    mergeDefaults = require('merge-defaults'),
    config = require('require-directory')(module, 'config'),
    helpers = require('./helpers.js');

(function () {
    'use strict';

    _.mergeDefaults = mergeDefaults;

    function favicons(source, parameters, next) {

        var options = _.mergeDefaults(parameters || {}, config.defaults),
            µ = helpers(options),
            background = µ.General.background(options.background);

        function createFavicon(sourceset, properties, name, callback) {
            var minimum = Math.min(properties.width, properties.height),
                icon = _.min(sourceset, function (ico) {
                return ico.size >= minimum;
            });

            async.waterfall([function (cb) {
                return µ.Images.read(icon.file, function (error, buffer) {
                    return cb(error, buffer);
                });
            }, function (buffer, cb) {
                return µ.Images.resize(buffer, minimum, function (error, resizedBuffer) {
                    return cb(error, resizedBuffer);
                });
            }, function (resizedBuffer, cb) {
                return µ.Images.create(properties, background, function (error, canvas) {
                    return cb(error, resizedBuffer, canvas);
                });
            }, function (resizedBuffer, canvas, cb) {
                return µ.Images.composite(canvas, resizedBuffer, properties, minimum, function (error, composite) {
                    return cb(error, composite);
                });
            }, function (composite, cb) {
                return µ.Images.getBuffer(composite, function (error, buffer) {
                    return cb(error, buffer);
                });
            }], function (error, buffer) {
                return callback(error, { name: name, contents: buffer });
            });
        }

        function createHTML(platform, callback) {
            var html = [];

            async.each(config.html[platform], function (code, cb) {
                return µ.HTML.parse(code, function (error, metadata) {
                    return cb(html.push(metadata) && error);
                });
            }, function (error) {
                return callback(error, html);
            });
        }

        function createFiles(platform, callback) {
            var files = [];

            async.forEachOf(config.files[platform], function (properties, name, cb) {
                return µ.Files.create(properties, name, function (error, file) {
                    return cb(files.push(file) && error);
                });
            }, function (error) {
                return callback(error, files);
            });
        }

        function createFavicons(sourceset, platform, callback) {
            var images = [];

            async.forEachOf(config.icons[platform], function (properties, name, cb) {
                return createFavicon(sourceset, properties, name, function (error, image) {
                    return cb(images.push(image) && error);
                });
            }, function (error) {
                return callback(error, images);
            });
        }

        function createPlatform(sourceset, platform, callback) {
            async.parallel([function (cb) {
                return createFavicons(sourceset, platform, function (error, images) {
                    return cb(error, images);
                });
            }, function (cb) {
                return createFiles(platform, function (error, files) {
                    return cb(error, files);
                });
            }, function (cb) {
                return createHTML(platform, function (error, code) {
                    return cb(error, code);
                });
            }], function (error, results) {
                return callback(error, results[0], results[1], results[2]);
            });
        }

        function createOffline(sourceset, callback) {
            var response = { images: [], files: [], html: [] };

            async.forEachOf(options.icons, function (enabled, platform, cb) {
                if (enabled) {
                    createPlatform(sourceset, platform, function (error, images, files, html) {
                        response.images = response.images.concat(images);
                        response.files = response.files.concat(files);
                        response.html = response.html.concat(html);
                        return cb(error);
                    });
                } else {
                    return cb(null);
                }
            }, function (error) {
                return callback(error, response);
            });
        }

        function unpack(pack, callback) {
            var response = { images: [], files: [], html: pack.html.split(',') };

            async.each(pack.files, function (url, cb) {
                return µ.RFG.fetch(url, function (error, box) {
                    return cb(response.images.push(box.image) && response.files.push(box.file) && error);
                });
            }, function () {
                return callback(null, response);
            });
        }

        function createOnline(sourceset, callback) {
            async.waterfall([function (cb) {
                return µ.RFG.configure(sourceset, config.rfg, function (error, request) {
                    return cb(error, request);
                });
            }, function (request, cb) {
                return µ.RFG.request(request, function (error, pack) {
                    return cb(error, pack);
                });
            }, function (pack, cb) {
                return unpack(pack, function (error, response) {
                    return cb(error, response);
                });
            }], function (error, results) {
                return callback(error, results);
            });
        }

        function create(sourceset, callback) {
            options.online ? createOnline(sourceset, function (error, response) {
                return callback(error, response);
            }) : createOffline(sourceset, function (error, response) {
                return callback(error, response);
            });
        }

        async.waterfall([function (callback) {
            return µ.General.source(source, function (error, sourceset) {
                return callback(error, sourceset);
            });
        }, function (sourceset, callback) {
            return create(sourceset, function (error, response) {
                return callback(error, response);
            });
        }], function (error, response) {
            if (error && typeof error === 'string') {
                error = { status: null, error: error, message: null };
            }
            next(error ? {
                status: error.status,
                error: error.name || 'Error',
                message: error.message || 'An unknown error has occured'
            } : null, {
                images: _.compact(response.images),
                files: _.compact(response.files),
                html: _.compact(response.html)
            });
        });
    }

    module.exports = favicons;
})();
