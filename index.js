/*jslint node:true, nomen:true*/
(function () {

    'use strict';

    // Node modules
    var path = require('path'),
        _ = require('underscore'),
        async = require('async'),
        Jimp = require('jimp'),
        color = require('tinycolor2'),
        cheerio = require('cheerio'),
        colors = require('colors'),
        config = require('loadobjects').sync('config');

    module.exports = function (source, parameters, next) {

        // 1. Take a set of icon parameters (default all to true)
        var options = _.defaults(parameters || {}, config.defaults),
            rgba = color(options.background).toRgb(),
            background = Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * 255);

        function print(context, message) {
            var newMessage = '';
            if (options.logging && message) {
                _.each(message.split(' '), function (item) {
                    newMessage += ' ' + ((/^\d+x\d+$/gm).test(item) ? colors.magenta(item) : item);
                });
                console.log('[Favicons] '.green + colors.yellow(context) + ':' + newMessage + '...');
            }
        }

        function createFile(properties, name, callback) {
            print(name, 'Creating new file' + properties);
            return callback(null);
        }

        function createImage(sourceset, properties, name, callback) {
            var minimum = Math.min(properties.width, properties.height),
                icon = _.min(sourceset, function (image) {
                    return image.size >= minimum;
                }),
                offset = {
                    height: (properties.height - minimum > 0 ? (properties.height - minimum) / 2 : 0),
                    width: (properties.width - minimum > 0 ? (properties.width - minimum) / 2 : 0)
                },
                jimp = new Jimp(properties.width, properties.height, background, function (error, canvas) {
                    if (error) {
                        return callback(error);
                    }
                    print(name, 'Generated empty ' + properties.width + 'x' + properties.height + ' canvas with ' + background + ' background');
                    Jimp.read(icon.file).then(function (image) {
                        image.resize(minimum, Jimp.AUTO);
                        print(name, 'Resized ' + icon.size + 'x' + icon.size + ' image to ' + minimum + 'x' + minimum);
                        canvas.composite(image, offset.width, offset.height);
                        print(name, 'Composited ' + minimum + 'x' + minimum + ' favicon on ' + properties.width + 'x' + properties.height + ' canvas');
                        canvas.getBuffer(Jimp.MIME_PNG, function (error, buffer) {
                            print(name, 'Collected image PNG buffer from ' + jimp);
                            return callback(error, {
                                name: name,
                                buffer: buffer
                            });
                        });
                    }).catch(function (error) {
                        return callback(error);
                    });
                });
        }

        function generateHTML(html, name, callback) {
            print(name, 'HTML found, parsing and injecting source');
            var $ = cheerio.load(typeof html === 'string' ? html : html.join(' '));
            $('link').attr('href', path.join(options.path, name));
            $('meta').attr('content', path.join(options.path, name));
            print(name, 'HTML modified, image path injected');
            return callback(null, $.html());
        }

        function createFavicon(sourceset, properties, name, callback) {
            async.parallel([
                function (callback) {
                    createImage(sourceset, properties, name, function (error, image) {
                        print(name, 'Image has been created');
                        return callback(error, image);
                    });
                },
                function (callback) {
                    if (properties.html) {
                        generateHTML(properties.html, name, function (error, code) {
                            print(name, 'Generated HTML: ' + code);
                            return callback(error, code);
                        });
                    } else {
                        return callback(null);
                    }
                }
            ], function (error, results) {
                return callback(error, results[0], results[1]);
            });
        }

        function createFiles(platform, callback) {
            var files = [];
            async.forEachOf(config.files[platform], function (properties, name, callback) {
                createFile(properties, name, function (file) {
                    files.push(file);
                    return callback(null);
                });
            }, function (error) {
                return callback(error, _.compact(files));
            });
        }

        function createFavicons(sourceset, platform, callback) {
            var images = [], html = [];
            async.forEachOf(config.icons[platform], function (properties, name, callback) {
                createFavicon(sourceset, properties, name, function (error, image, code) {
                    images.push(image);
                    html.push(code);
                    return callback(error);
                });
            }, function (error) {
                return callback(error, _.compact(images), _.compact(html));
            });
        }

        function createPlatform(sourceset, platform, callback) {
            async.parallel([
                function (callback) {
                    createFavicons(sourceset, platform, function (images, html) {
                        return callback(images, html);
                    });
                },
                function (callback) {
                    createFiles(platform, function (files) {
                        return callback(files);
                    });
                }
            ], function (error, results) {
                console.log(results, 'resu;ts');
                return callback(error, results[0], results[1]);
            });
        }

        function generate(sourceset, platforms, callback) {
            var response = { images: [], files: [], html: [] };
            async.forEachOf(platforms, function (enabled, platform, callback) {
                if (enabled) {
                    print(platform, 'Creating favicons for platform');
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
                var sourceset = [], key;
                if (typeof source === 'object') {
                    print('Favicons:root', 'Source is an object');
                    for (key in source) {
                        if (source.hasOwnProperty(key)) {
                            sourceset.push({ size: key, file: source[key] });
                        }
                    }
                } else if (typeof source === 'string') {
                    sourceset = [{ size: 1500, file: source }];
                    print('Favicons:root', 'Source is a string');
                }
                return callback(sourceset.length ? null : 'Favicons source is invalid', sourceset);
            },
            function (sourceset, callback) {
                print('Favicons:root', 'Creating favicons');
                generate(sourceset, options.icons, function (error, response) {
                    print('Favicons:root', 'Returning response');
                    return callback(error, response);
                });
            }
        ], function (error, response) {
            return next((error ? {
                status: error.status,
                error: error.name || 'Error',
                message: error.message || 'An unknown error has occured'
            } : null), response.images, response.files, response.html);
        });

    };

}());
