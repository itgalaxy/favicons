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

        // Configuration files
        icons = require('./data/icons.json'),
        defaults = require('./data/defaults.json');

    module.exports = function (source, configuration, next) {

        // 1. Take a set of icon parameters (default all to true)
        var options = _.defaults(configuration || {}, defaults),
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

        function createFile(config, name, callback) {
            print(name, 'Creating new file');
            return callback(null);
        }

        function createImage(sourceset, config, name, callback) {
            var minimum = Math.min(config.width, config.height),
                icon = _.min(sourceset, function (image) {
                    return image.size >= minimum;
                }),
                offset = {
                    height: (config.height - minimum > 0 ? (config.height - minimum) / 2 : 0),
                    width: (config.width - minimum > 0 ? (config.width - minimum) / 2 : 0)
                },
                jimp = new Jimp(config.width, config.height, background, function (error, canvas) {
                    if (error) {
                        return callback(error);
                    }
                    print(name, 'Generated empty ' + config.width + 'x' + config.height + ' canvas with ' + background + ' background');
                    Jimp.read(icon.file).then(function (image) {
                        image.resize(minimum, Jimp.AUTO);
                        print(name, 'Resized ' + icon.size + 'x' + icon.size + ' image to ' + minimum + 'x' + minimum);
                        canvas.composite(image, offset.width, offset.height);
                        print(name, 'Composited ' + minimum + 'x' + minimum + ' favicon on ' + config.width + 'x' + config.height + ' canvas');
                        canvas.getBuffer(Jimp.MIME_PNG, function (error, buffer) {
                            print(name, 'Collected image PNG buffer');
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

        function createFavicon(sourceset, config, name, callback) {
            async.parallel([
                function (callback) {
                    createImage(sourceset, config, name, function (error, image) {
                        print(name, 'Image has been created');
                        return callback(error, image);
                    });
                },
                function (callback) {
                    if (config.html) {
                        generateHTML(config.html, name, function (error, code) {
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

        function createPlatform(sourceset, icons, callback) {
            var images = [], files = [], html = [];
            async.forEachOf(icons, function (config, name, callback) {
                if (config.type === 'file') {
                    createFile(config, name, function (file) {
                        files.push(file);
                        return callback(null);
                    });
                } else if (config.type === 'image') {
                    createFavicon(sourceset, config, name, function (error, image, code) {
                        images.push(image);
                        html.push(code);
                        return callback(error);
                    });
                } else {
                    return callback('Something went wrong with icon configuration.');
                }
            }, function (error) {
                return callback(error, _.compact(images), _.compact(files), _.compact(html));
            });
        }

        function createFavicons(sourceset, platforms, callback) {
            var response = { images: [], files: [], html: [] };
            async.forEachOf(platforms, function (enabled, platform, callback) {
                if (enabled) {
                    print(platform, 'Creating favicons for platform');
                    createPlatform(sourceset, icons[platform], function (error, images, files, html) {
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
                createFavicons(sourceset, options.icons, function (error, response) {
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
