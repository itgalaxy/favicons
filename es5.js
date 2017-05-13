'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _ = require('underscore'),
    async = require('async'),
    through2 = require('through2'),
    clone = require('clone'),
    mergeDefaults = require('merge-defaults'),
    configDefaults = require('require-directory')(module, 'config'),
    helpers = require('./helpers-es5.js'),
    path = require('path'),
    toIco = require('to-ico');

(function () {

    'use strict';

    _.mergeDefaults = mergeDefaults;

    function favicons(source, parameters, next) {

        var config = clone(configDefaults),
            options = _.mergeDefaults(parameters || {}, config.defaults),
            µ = helpers(options);

        function createFavicon(sourceset, properties, name, platformOptions, callback) {
            if (path.extname(name) === '.ico') {
                async.map(properties.sizes, function (sizeProperties, cb) {
                    var newProperties = clone(properties);

                    newProperties.width = sizeProperties.width;
                    newProperties.height = sizeProperties.height;

                    var tempName = 'favicon-temp-' + newProperties.width + 'x' + newProperties.height + '.png';

                    createFavicon(sourceset, newProperties, tempName, platformOptions, cb);
                }, function (error, results) {
                    if (error) {
                        return callback(error);
                    }

                    var files = results.map(function (icoImage) {
                        return icoImage.contents;
                    });

                    toIco(files).then(function (buffer) {
                        return callback(null, { name: name, contents: buffer });
                    }).catch(callback);
                });
            } else {
                var maximum = Math.max(properties.width, properties.height),
                    offset = Math.round(maximum / 100 * platformOptions.offset) || 0,
                    background = µ.General.background(platformOptions.background);

                if (platformOptions.disableTransparency) {
                    properties.transparent = false;
                }

                async.waterfall([function (cb) {
                    return µ.Images.nearest(sourceset, properties, offset, cb);
                }, function (nearest, cb) {
                    return µ.Images.read(nearest.file, cb);
                }, function (buffer, cb) {
                    return µ.Images.resize(buffer, properties, offset, cb);
                }, function (resizedBuffer, cb) {
                    return µ.Images.create(properties, background, function (error, canvas) {
                        return cb(error, resizedBuffer, canvas);
                    });
                }, function (resizedBuffer, canvas, cb) {
                    return µ.Images.composite(canvas, resizedBuffer, properties, offset, maximum, cb);
                }, function (composite, cb) {
                    µ.Images.getBuffer(composite, cb);
                }], function (error, buffer) {
                    return callback(error, { name: name, contents: buffer });
                });
            }
        }

        function createHTML(platform, callback) {
            var html = [];

            async.forEachOf(config.html[platform], function (tag, selector, cb) {
                return µ.HTML.parse(tag, function (error, metadata) {
                    return cb(html.push(metadata) && error);
                });
            }, function (error) {
                return callback(error, html);
            });
        }

        function createFiles(platform, platformOptions, callback) {
            var files = [];

            async.forEachOf(config.files[platform], function (properties, name, cb) {
                return µ.Files.create(properties, name, platformOptions, function (error, file) {
                    return cb(files.push(file) && error);
                });
            }, function (error) {
                return callback(error, files);
            });
        }

        function createFavicons(sourceset, platform, platformOptions, callback) {
            var images = [];

            async.forEachOf(config.icons[platform], function (properties, name, cb) {
                return createFavicon(sourceset, properties, name, platformOptions, function (error, image) {
                    return cb(images.push(image) && error);
                });
            }, function (error) {
                return callback(error, images);
            });
        }

        function createPlatform(sourceset, platform, platformOptions, callback) {
            async.parallel([function (cb) {
                return createFavicons(sourceset, platform, platformOptions, cb);
            }, function (cb) {
                return createFiles(platform, platformOptions, cb);
            }, function (cb) {
                return createHTML(platform, cb);
            }], function (error, results) {
                return callback(error, results[0], results[1], results[2]);
            });
        }

        function createOffline(sourceset, callback) {
            var response = { images: [], files: [], html: [] };

            async.forEachOf(options.icons, function (enabled, platform, cb) {
                var platformOptions = µ.General.preparePlatformOptions(platform, enabled, options);

                if (enabled) {
                    createPlatform(sourceset, platform, platformOptions, function (error, images, files, html) {
                        response.images = response.images.concat(images);
                        response.files = response.files.concat(files);
                        response.html = response.html.concat(html);
                        cb(error);
                    });
                } else {
                    return cb(null);
                }
            }, function (error) {
                return callback(error, response);
            });
        }

        function unpack(pack, callback) {
            var response = { images: [], files: [], html: pack.html.split('\n') };

            async.each(pack.files, function (url, cb) {
                return µ.RFG.fetch(url, function (error, box) {
                    return cb(response.images.push(box.image) && response.files.push(box.file) && error);
                });
            }, function (error) {
                return callback(error, response);
            });
        }

        function createOnline(sourceset, callback) {
            async.waterfall([function (cb) {
                return µ.RFG.configure(sourceset, config.rfg, cb);
            }, function (request, cb) {
                return µ.RFG.request(request, cb);
            }, function (pack, cb) {
                return unpack(pack, cb);
            }], function (error, results) {
                if (error && options.preferOnline) {
                    createOffline(sourceset, callback);
                } else {
                    return callback(error, results);
                }
            });
        }

        function create(sourceset, callback) {
            options.online || options.preferOnline ? createOnline(sourceset, callback) : createOffline(sourceset, callback);
        }

        async.waterfall([function (callback) {
            return µ.General.source(source, callback);
        }, function (sourceset, callback) {
            return create(sourceset, callback);
        }, function (response, callback) {
            if (options.pipeHTML) {
                µ.Files.create(response.html, options.html, false, function (error, file) {
                    response.files = response.files.concat([file]);
                    return callback(error, response);
                });
            } else {
                return callback(null, response);
            }
        }], function (error, response) {
            return error ? next(error) : next(null, {
                images: _.compact(response.images),
                files: _.compact(response.files),
                html: _.compact(response.html)
            });
        });
    }

    function stream(params, handleHtml) {

        var config = clone(configDefaults),
            µ = helpers(params);

        function processDocuments(documents, html, callback) {
            async.each(documents, function (document, cb) {
                return µ.HTML.update(document, html, config.html, cb);
            }, function (error) {
                return callback(error);
            });
        }

        /* eslint func-names: 0, no-invalid-this: 0 */
        return through2.obj(function (file, encoding, callback) {
            var that = this;

            if (file.isNull()) {
                return callback(null, file);
            }

            if (file.isStream()) {
                return callback(new Error('[gulp-favicons] Streaming not supported'));
            }

            async.waterfall([function (cb) {
                return favicons(file.contents, params, cb);
            }, function (response, cb) {
                return async.each(response.images.concat(response.files), function (image, c) {
                    that.push(µ.General.vinyl(image, file));
                    c();
                }, function (error) {
                    return cb(error, response);
                });
            }, function (response, cb) {
                if (handleHtml) {
                    handleHtml(response.html);
                    return cb(null);
                }
                if (params.html && !params.pipeHTML) {
                    var documents = _typeof(params.html) === 'object' ? params.html : [params.html];

                    processDocuments(documents, response.html, cb);
                } else {
                    return cb(null);
                }
            }], function (error) {
                return callback(error);
            });
        });
    }

    module.exports = favicons;
    module.exports.config = configDefaults;
    module.exports.stream = stream;
})();