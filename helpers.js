/*jslint node:true, nomen:true*/

(function () {

    'use strict';

    var path = require('path'),
        _ = require('underscore'),
        color = require('tinycolor2'),
        cheerio = require('cheerio'),
        colors = require('colors'),
        jsonxml = require('jsontoxml'),
        sizeOf = require('image-size'),
        Jimp = require('jimp');

    module.exports = function (options) {

        return {

            General: {
                background: function (hex) {
                    var rgba = color(hex).toRgb();
                    return Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * 255);
                },
                relative: function (name) {
                    return path.join(options.path, name);
                },
                print: function (context, message) {
                    var newMessage = '';
                    if (options.logging && message) {
                        _.each(message.split(' '), function (item) {
                            newMessage += ' ' + ((/^\d+x\d+$/gm).test(item) ? colors.magenta(item) : item);
                        });
                        console.log('[Favicons] '.green + context.yellow + ':' + newMessage + '...');
                    }
                },
                source: function (source, callback) {
                    var sourceset = [];
                    module.exports.General.print('General:source', 'Source type is ' + typeof source);
                    if (typeof source === 'object') {
                        _.each(source, function (file, size) {
                            sourceset.push({ size: size, file: file });
                        });
                    } else if (typeof source === 'string') {
                        sourceset = [{ size: sizeOf(source), file: source }];
                    }
                    return callback((sourceset.length ? null : 'Favicons source is invalid'), sourceset);
                },
                finale: function (error, response, callback) {
                    return callback((error ? {
                        status: error.status,
                        error: error.name || 'Error',
                        message: error.message || 'An unknown error has occured'
                    } : null), {
                        images: response.images,
                        files: response.files,
                        html: response.html
                    });
                }
            },

            HTML: {
                parse: function (name, html, callback) {
                    module.exports.General.print('HTML:parse', 'HTML found, parsing and injecting source');
                    var $ = cheerio.load(html);

                    // Better logic here
                    $('link').attr('href', module.exports.General.relative(name));
                    $('meta').attr('content', module.exports.General.relative(name));
                    return callback(null, $.html());
                }
            },

            Files: {
                create: function (properties, name, callback) {
                    if (name === 'android-chrome-manifest.json') {
                        properties.name = options.appName;
                        _.each(properties.icons, function (icon) {
                            icon.src = module.exports.General.relative('android-chrome-' + icon.sizes + '.png');
                        });
                    } else if (name === 'manifest.webapp') {
                        properties.version = options.version;
                        properties.name = options.appName;
                        properties.description = options.appDescription;
                        properties.icons[60] = module.exports.General.relative('firefox_app_60x60.png');
                        properties.icons[128] = module.exports.General.relative('firefox_app_128x128.png');
                        properties.icons[512] = module.exports.General.relative('firefox_app_512x512.png');
                        properties.developer.name = options.developerName;
                        properties.developer.url = options.developerURL;
                    } else if (name === 'browserconfig.xml') {
                        properties.square70x70logo['-src'] = module.exports.General.relative('mstile-70x70.png');
                        properties.square150x150logo['-src'] = module.exports.General.relative('mstile-150x150.png');
                        properties.wide310x150logo['-src'] = module.exports.General.relative('mstile-310x150.png');
                        properties.square310x310logo['-src'] = module.exports.General.relative('mstile-310x310.png');
                        properties = jsonxml(properties);
                    } else if (name === 'yandex-browser-manifest.json') {
                        properties.version = options.version;
                        properties.api_version = 1;
                        properties.layout.logo = module.exports.General.relative("yandex-browser-50x50.png");
                        properties.layout.color = options.background;
                    }
                    return callback(null, { name: name, contents: properties });
                }
            },

            Images: {
                create: function (width, height, background, callback) {
                    module.exports.General.print('Image:create', 'Creating empty ' + width + 'x' + height + ' canvas with ' + background + ' background');
                    var jimp = new Jimp(width, height, background, function (error, canvas) {
                        return callback(error, canvas, jimp);
                    });
                },
                read: function (file, callback) {
                    Jimp.read(file, function (error, image) {
                        return callback(error, image);
                    });
                },
                resize: function (image, minimum, callback) {
                    module.exports.General.print('Images:resize', 'Resizing image to ' + minimum + 'x' + minimum);
                    image.resize(minimum, Jimp.AUTO);
                    return callback(null, image);
                },
                composite: function (canvas, image, height, width, minimum, callback) {
                    var offsetHeight = (height - minimum > 0 ? (height - minimum) / 2 : 0),
                        offsetWidth = (width - minimum > 0 ? (width - minimum) / 2 : 0);
                    module.exports.General.print('Images:composite', 'Compositing ' + minimum + 'x' + minimum + ' favicon on ' + width + 'x' + height + ' canvas');
                    canvas.composite(image, offsetWidth, offsetHeight);
                    return callback(null, canvas);
                },
                getBuffer: function (canvas, mime, callback) {
                    module.exports.General.print('Images:getBuffer', 'Collecting image buffer from canvas');
                    canvas.getBuffer(mime, function (error, buffer) {
                        return callback(error, buffer);
                    });
                }
            }

        };

    };

}());
