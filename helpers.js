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
        Jimp = require('jimp'),
        xmlconfig = { prettyPrint: true, xmlHeader: true, indent: '  ' };

    module.exports = function (options) {

        function print(context, message) {
            var newMessage = '';
            if (options.logging && message) {
                _.each(message.split(' '), function (item) {
                    newMessage += ' ' + ((/^\d+x\d+$/gm).test(item) ? colors.magenta(item) : item);
                });
                console.log('[Favicons] '.green + context.yellow + ':' + newMessage + '...');
            }
        }

        function relative(name) {
            return path.join(options.path, name);
        }

        return {

            General: {
                background: function (hex) {
                    print('General:background', 'Parsing colour ' + hex);
                    var rgba = color(hex).toRgb();
                    return Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * 255);
                },
                source: function (source, callback) {
                    var sourceset = [];
                    print('General:source', 'Source type is ' + typeof source);
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
                    print('General:finale', 'Returning response');
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
                parse: function (html, callback) {
                    print('HTML:parse', 'HTML found, parsing and modifying source');
                    var $ = cheerio.load(html),
                        link = $('*').is('link'),
                        attribute = (link ? 'href' : 'content'),
                        value = $('*').first().attr(attribute);
                    if (path.extname(value)) {
                        $('*').first().attr(attribute, relative(value));
                    }
                    return callback(null, $.html());
                }
            },

            Files: {
                create: function (properties, name, callback) {
                    print('Files:create', 'Creating file: ' + name);
                    if (name === 'android-chrome-manifest.json') {
                        properties.name = options.appName;
                        _.map(properties.icons, function (icon) {
                            icon.src = relative(icon.src);
                        });
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'manifest.webapp') {
                        properties.version = options.version;
                        properties.name = options.appName;
                        properties.description = options.appDescription;
                        properties.developer.name = options.developerName;
                        properties.developer.url = options.developerURL;
                        _.map(properties.icons, function (property) {
                            property = relative(property);
                        });
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'browserconfig.xml') {
                        _.map(properties[0].children[0].children[0].children, function (property) {
                            if (property.name === 'TileColor') {
                                property.text = options.background;
                            } else {
                                property.attrs.src = relative(property.attrs.src);
                            }
                        });
                        properties = jsonxml(properties, xmlconfig);
                    } else if (name === 'yandex-browser-manifest.json') {
                        properties.version = options.version;
                        properties.api_version = 1;
                        properties.layout.logo = relative(properties.layout.logo);
                        properties.layout.color = options.background;
                        properties = JSON.stringify(properties, null, 2);
                    }
                    return callback(null, { name: name, contents: properties });
                }
            },

            Images: {
                create: function (width, height, background, callback) {
                    print('Image:create', 'Creating empty ' + width + 'x' + height + ' canvas with ' + background + ' background');
                    var jimp = new Jimp(width, height, background, function (error, canvas) {
                        return callback(error, canvas, jimp);
                    });
                },
                read: function (file, callback) {
                    print('Image:create', 'Reading file: ' + file);
                    Jimp.read(file, function (error, image) {
                        return callback(error, image);
                    });
                },
                resize: function (image, minimum, callback) {
                    print('Images:resize', 'Resizing image to ' + minimum + 'x' + minimum);
                    image.resize(minimum, Jimp.AUTO);
                    return callback(null, image);
                },
                composite: function (canvas, image, height, width, minimum, callback) {
                    var offsetHeight = (height - minimum > 0 ? (height - minimum) / 2 : 0),
                        offsetWidth = (width - minimum > 0 ? (width - minimum) / 2 : 0);
                    print('Images:composite', 'Compositing ' + minimum + 'x' + minimum + ' favicon on ' + width + 'x' + height + ' canvas');
                    canvas.composite(image, offsetWidth, offsetHeight);
                    return callback(null, canvas);
                },
                getBuffer: function (canvas, callback) {
                    print('Images:getBuffer', 'Collecting image buffer from canvas');
                    canvas.getBuffer(Jimp.MIME_PNG, function (error, buffer) {
                        return callback(error, buffer);
                    });
                }
            }

        };

    };

}());
