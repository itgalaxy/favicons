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

    module.exports = function (source, configuration, callback) {

        // 1. Take a set of icon parameters (default all to true)
        var options = _.defaults(configuration || {}, defaults),
            rgba = color(options.background).toRgb(),
            background = Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * 255);

        function print(context, message) {
            var newMessage = '';
            if (options.logging && context && message) {
                _.each(message.split(' '), function (item) {
                    newMessage += ' ';
                    if ((/^\d+x\d+$/gm).test(item)) {
                        newMessage += colors.magenta(item);
                    } else if ((/^<\w+/gm).test(item) || (/^\w+="\S+"/gm).test(item)) {
                        newMessage += item.yellow;
                    } else {
                        newMessage += item;
                    }
                });
                console.log(colors.green(context) + ':' + newMessage + '...');
            }
        }

        function createFile(config, name, callback) {
            print(name, 'Creating new file');
            return callback();
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
                        image.getBuffer(Jimp.MIME_PNG, function (error, buffer) {
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

        function generateHTML(html, name) {
            print(name, 'HTML found, parsing and injecting source');
            var $ = cheerio.load(typeof html === 'string' ? html : html.join(' '));
            $('link').attr('href', path.join(options.path, name));
            $('meta').attr('content', path.join(options.path, name));
            print(name, 'HTML modified to ' + $.html());
            return callback(null, $.html());
        }

        function generateFavicons(sourceset, files, callback) {
            var images = [], html = [];
            async.forEachOf(files, function (config, name, callback) {
                if (config.type === 'file') {
                    createFile(config, name, function () {
                        return callback(null);
                    });
                } else if (config.type === 'image') {
                    createImage(sourceset, config, name, function (error, image) {
                        print(image.name, 'Image has been created');
                        images.push(image);
                        if (config.html) {
                            generateHTML(config.html, name, function (code) {
                                print(image.name, 'Generated HTML: ' + code);
                                html.push(code);
                                return callback(error);
                            });
                        } else {
                            return callback(error);
                        }
                    });
                } else {
                    return callback('Something went wrong with icon configuration.');
                }
            }, function (error) {
                console.log(images, html, 'stuff');
                return callback(error, images, html);
            });
        }

        function createFavicons(sourceset, platforms) {
            async.forEachOf(platforms, function (enabled, platform, callback) {
                if (enabled) {
                    print(platform, 'Creating favicons for platform');
                    generateFavicons(sourceset, icons[platform], function (error, images, html) {
                        return callback(error, images, html);
                    });
                } else {
                    return callback(null);
                }
            }, function (error) {
                return callback(error);
            });
        }

        async.waterfall([
            function (callback) {
                var sourceset = [], key;
                if (typeof source === 'object') {
                    print('Favicons source is an object');
                    for (key in source) {
                        if (source.hasOwnProperty(key)) {
                            sourceset.push({ size: key, file: source[key] });
                        }
                    }
                } else if (typeof source === 'string') {
                    sourceset = [{ size: 1500, file: source }];
                    print('Favicons source is a string');
                }
                return callback(sourceset.length ? null : 'Favicons source is invalid', sourceset);
            },
            function (sourceset, callback) {
                createFavicons(sourceset, options.icons, function (error) {
                    return callback(error);
                });
            }
        ], function (error) {
            return callback(error ? {
                status: error.status,
                error: error.name || 'Error',
                message: error.message || 'An unknown error has occured'
            } : null);
        });

    };

}());
