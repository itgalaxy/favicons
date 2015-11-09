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
        jsonxml = require('jsontoxml'),
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

        function relative(name) {
            return path.join(options.path, name);
        }

        function createFile(properties, name, callback) {
            if (name === 'android-chrome-manifest.json') {
                properties.name = options.appName;
                _.each(properties.icons, function (icon) {
                    icon.src = relative('android-chrome-' + icon.sizes + '.png');
                });
            } else if (name === 'manifest.webapp') {
                properties.version = options.version;
                properties.name = options.appName;
                properties.description = options.appDescription;
                properties.icons[60] = relative('firefox_app_60x60.png');
                properties.icons[128] = relative('firefox_app_128x128.png');
                properties.icons[512] = relative('firefox_app_512x512.png');
                properties.developer.name = options.developerName;
                properties.developer.url = options.developerURL;
            } else if (name === 'browserconfig.xml') {
                properties.square70x70logo['-src'] = relative('mstile-70x70.png');
                properties.square150x150logo['-src'] = relative('mstile-150x150.png');
                properties.wide310x150logo['-src'] = relative('mstile-310x150.png');
                properties.square310x310logo['-src'] = relative('mstile-310x310.png');
                properties = jsonxml(properties);
            } else if (name === 'yandex-browser-manifest.json') {
                properties.version = options.version;
                properties.api_version = 1;
                properties.layout.logo = relative("yandex-browser-50x50.png");
                properties.layout.color = options.background;
            }
            return callback(null, {
                name: name,
                contents: properties
            });
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
                                contents: buffer
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
            $('link').attr('href', relative(name));
            $('meta').attr('content', relative(name));
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
                console.log(results, 'results');
                return callback(error, results[0][0], results[0][1], results[1]);
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
