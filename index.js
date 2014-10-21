/*jslint devel:true*/
/*global module, require*/

(function () {

    'use strict';

    var path = require('path'),
        fs = require('fs'),
        exec = require('child_process').exec,
        async = require('async'),
        cheerio = require('cheerio'),
        defaults = require('lodash.defaults'),
        sizeOf = require('image-size'),
        mkdirp = require('mkdirp'),
        rfg = require('real-favicon');

    module.exports = function (params) {

        // Default options
        var options = defaults(params || {}, {

            // I/O
            source: null,
            dest: 'images',

            // Icon Types
            android: true,
            apple: true,
            coast: true,
            favicons: true,
            firefox: true,
            opengraph: true,
            windows: true,

            // Miscellaneous
            html: null,
            background: '#1d1d1d',
            tileBlackWhite: false,
            manifest: null,
            trueColor: false,
            url: null,
            logging: false,
            callback: null

        }),

            elements = [],
            opts = ['-background', '"' + options.background + '"', '-flatten'];

        // Print to the console.
        function print(message) {
            if (message && options.logging) {
                console.log(message);
            }
        }

        // Determine whether HTML is to be produced
        function writeHTML() {
            return options.html && options.html !== '';
        }

        function getSize(source) {
            return path.extname(source) === '.svg' ? 1500 : sizeOf(source).width;
        }

        // Create a filepath.
        function filePath(filename) {
            var html = path.dirname(options.html),
                filepath = path.join(options.dest, filename);
            return writeHTML() ? path.relative(html, filepath) : filepath;
        }

        // Execute external command
        function execute(cmd, callback) {
            exec(cmd, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Convert image with Imagemagick
        function convert(args, name, callback) {
            args.unshift('convert');
            execute(args.join(' '), function () {
                print('Created ' + name);
                return callback();
            });
        }

        // Combine arguments into command
        function combine(src, dest, size, fname, opts) {
            var out = [src, '-resize', size].concat(opts);
            out.push(path.join(dest, fname));
            return out;
        }

        // Delete and rewrite HTML tags
        function writeTags(callback) {
            var $, html = '';
            if (options.html) {
                fs.readFile(options.html, function (error, data) {
                    if (!error) {
                        $ = cheerio.load(data, { decodeEntities: false });
                        html = $.html().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
                        if (html === '') {
                            $ = cheerio.load('');
                        }
                        if ($('head').length > 0) {
                            $('head').append(elements.join('\n'));
                            return callback($.html());
                        }
                    }
                    return callback(elements.join('\n'));
                });
            } else {
                return callback(elements.join('\n'));
            }
        }

        function whichImage(size) {
            var source = options.source,
                image = source;
            if (typeof source === 'object') {
                if (source.small && source.medium && source.large) {
                    if (size <= 64) {
                        image = source.small;
                    } else if (size > 64 && size <= 310) {
                        image = source.medium;
                    } else if (size > 310) {
                        image = source.large;
                    }
                } else {
                    throw 'Source configuration is invalid';
                }
            }
            return image;
        }

        // Make Coast icon
        function makeCoast(callback) {
            var size = 228,
                dimensions = size + 'x' + size,
                name = 'coast-icon-' + dimensions + '.png',
                command = combine(whichImage(size), options.dest, dimensions, name, opts);
            convert(command, name, function () {
                elements.push('<link rel="icon" sizes="' + dimensions + '" href="' + filePath(name) + '" />');
                return callback();
            });
        }

        // Make Android homescreen icon
        function makeAndroid(callback) {
            var size = 192,
                dimensions = size + 'x' + size,
                name = 'homescreen-' + dimensions + '.png',
                command = combine(whichImage(size), options.dest, dimensions, name, opts);
            convert(command, name, function () {
                elements.push('<meta name="mobile-web-app-capable" content="yes" />', '<link rel="icon" sizes="' + dimensions + '" href="' + filePath(name) + '" />');
                return callback();
            });
        }

        // Make Firefox icons
        function makeFirefox(callback) {
            var updateManifest = (options.manifest && options.manifest !== ''),
                contentFirefox;
            async.waterfall([
                function (callback) {
                    var contentsFirefox;
                    if (updateManifest) {
                        fs.readFile(options.manifest, function (error, data) {
                            contentsFirefox = error || data.length === 0 ? '{}' : data;
                            contentFirefox = JSON.parse(contentsFirefox);
                            contentFirefox.icons = {};
                            return callback(null, contentFirefox);
                        });
                    } else {
                        return callback(null, null);
                    }
                },
                function (contentFirefox, callback) {
                    async.each([16, 30, 32, 48, 60, 64, 90, 120, 128, 256], function (size, callback) {
                        var dimensions = size + 'x' + size,
                            name = 'firefox-icon-' + dimensions + '.png',
                            command = combine(whichImage(size), options.dest, dimensions, name, opts);
                        convert(command, name, function () {
                            if (updateManifest) {
                                contentFirefox.icons[size] = name;
                            }
                            return callback();
                        });
                    }, function (error) {
                        if (error) {
                            throw error;
                        }
                        return callback(null, contentFirefox);
                    });
                }
            ], function (error, contentFirefox) {
                if (error) {
                    throw error;
                }
                if (updateManifest) {
                    print('Updating Firefox manifest... ');
                    fs.writeFile(options.manifest, JSON.stringify(contentFirefox, null, 2), function (error) {
                        if (error) {
                            throw error;
                        }
                        return callback(null);
                    });
                } else {
                    return callback(null);
                }
            });
        }

        // Make OpenGraph icon
        function makeOpenGraph(callback) {
            var source = options.source,
                size = source.large ? getSize(source.large) : getSize(source),
                dimensions = size + 'x' + size,
                name = 'opengraph.png',
                command = combine(whichImage(size), options.dest, dimensions, name, opts);
            convert(command, name, function () {
                if (!options.url && writeHTML()) {
                    throw "URL must be specified for OpenGraph metadata";
                }
                elements.push('<meta property="og:image" content="' + path.join(options.url, filePath(name)) + '" />');
                return callback();
            });
        }

        // Create the appropriate icons
        function makeIcons(callback) {
            async.parallel([
                function (callback) {
                    if (options.coast) {
                        makeCoast(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.android) {
                        makeAndroid(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.firefox) {
                        makeFirefox(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.opengraph) {
                        makeOpenGraph(function () {
                            callback(null);
                        });
                    }
                }
            ], function () {
                return callback();
            });
        }

        function realFaviconGenerator() {
            rfg({
                src: options.source.large,
                dest: 'test/images-rfg/',
                icons_path: path.relative(path.dirname(options.html), options.dest),
                html: options.html,
                design: {
                    ios: {
                        picture_aspect: 'background_and_margin',
                        background_color: options.background,
                        margin: 0
                    },
                    windows: {
                        picture_aspect: 'white_silhouette',
                        background_color: options.background
                    }
                },
                settings: {
                    compression: 5
                }
            });
        }

        // Initialise
        function init() {
            realFaviconGenerator();
            if (!options.source) {
                return console.log('A source image is required');
            }
            mkdirp(options.dest, function () {
                makeIcons(function () {
                    writeTags(function (data) {
                        if (writeHTML()) {
                            fs.writeFile(options.html, data, function () {
                                if (options.callback) {
                                    return options.callback('Generated favicons');
                                }
                            });
                        } else if (options.callback) {
                            return options.callback('Generated favicons', data);
                        }
                    });
                });
            });
        }

        init();

    };

}());
