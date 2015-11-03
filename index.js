/*jslint node:true, nomen:true*/
(function () {

    'use strict';

    // Node modules
    var _ = require('underscore'),
        async = require('async'),
        Jimp = require('jimp'),
        color = require('tinycolor2'),

        // Configuration files
        icons = require('./data/icons.json'),
        defaults = require('./data/defaults.json');

    module.exports = function (source, configuration, callback) {

        // 1. Take a set of icon parameters (default all to true)
        var options = _.defaults(configuration || {}, defaults),
            rgba = color(options.background).toRgb(),
            background = Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * 255);

        function print(message) {
            if (options.logging && message) {
                console.log(message + '...');
            }
        }

        function createFile(config, name, callback) {
            print('Generating file: ' + name);
            return callback();
        }

        function createImage(config, name, callback) {
            var minimum = Math.min(config.width, config.height),
                offset = {
                    height: (config.height - minimum > 0 ? (config.height - minimum) / 2 : 0),
                    width: (config.width - minimum > 0 ? (config.width - minimum) / 2 : 0)
                },
                jimp = new Jimp(config.width, config.height, background, function (error, canvas) {
                    if (error) {
                        return callback(error);
                    }
                    Jimp.read(source).then(function (image) {
                        image.resize(minimum, Jimp.AUTO);
                        canvas.composite(image, offset.width, offset.height);
                        image.getBuffer(Jimp.MIME_PNG, function (image, error, buffer) {
                            return callback(error, { name: name, buffer: buffer });
                        });
                    }).catch(function (error) {
                        return callback(error);
                    });
                });
        }

        function generateFavicons(files, callback) {
            var html = [];
            async.forEachOf(files, function (config, name, callback) {
                html.push(config.html || null);
                if (config.type === 'file') {
                    createFile(config, name, function () {
                        return callback(null);
                    });
                } else if (config.type === 'image') {
                    createImage(config, name, function () {
                        return callback(null);
                    });
                } else {
                    return callback('Something went wrong with icon configuration.');
                }
            }, function (error) {
                return callback(error, _.compact(html));
            });
        }

        function createFavicons(platforms) {
            async.forEachOf(platforms, function (enabled, platform, callback) {
                if (enabled) {
                    print('Generating favicons for platform: ' + platform);
                    generateFavicons(icons[platform], function (error, images, html) {
                        return callback(error, images, html);
                    });
                } else {
                    return callback(null);
                }
            }, function (error) {
                return callback(error);
            });
        }

        // 2. Take a single image or an object of images { size: image }
        print('Favicons source is ' + (typeof source === 'object' ? 'an object' : 'a string') + '.');

        // 3. Resize each image and generate code (solve object->resize logic)
        createFavicons(options.icons, function (error) {

            // 4. Return code and images into a buffer? Promise? Whatever. { code: '', images: { ... } }
            return callback(error);
        });

    };

}());
