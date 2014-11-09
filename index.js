/*jslint devel:true*/
/*global module, require*/

(function () {

    'use strict';

    var path = require('path'),
        exec = require('child_process').exec,
        async = require('async'),
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

        // Execute RealFaviconGenerator
        function realFaviconGenerator(design) {
            rfg({
                src: options.source.large,
                dest: 'test/images-rfg/',
                icons_path: path.relative(path.dirname(options.html), options.dest),
                html: options.html,
                design: design,
                settings: {
                    compression: 5
                }
            });
        }

        // Create design object for RFG
        function design(callback) {
            var settings = {};

            if (options.apple) {
                settings.apple = {
                    picture_aspect: 'background_and_margin',
                    background_color: options.background,
                    margin: 0
                };
            }

            if (options.windows) {
                settings.windows = {
                    picture_aspect: 'white_silhouette',
                    background_color: options.background
                };
            }

            if (options.firefox) {
                settings.firefox_app = {
                    picture_aspect: "circle",
                    keep_picture_in_circle: "true",
                    circle_inner_margin: "5",
                    background_color: "#456789",
                    app_name: "My sample app",
                    app_description: "Yet another sample application",
                    developer_name: "Philippe Bernard",
                    developer_url: "http://stackoverflow.com/users/499917/philippe-b"
                };
            }

            if (options.android) {
                settings.android_chrome = {
                    picture_aspect: "shadow",
                    manifest: {
                        name: "My sample app",
                        display: "standalone",
                        orientation: "portrait",
                        start_url: "/homepage.html"
                    }
                };
            }

            if (options.coast) {
                settings.coast = {
                    picture_aspect: "background_and_margin",
                    background_color: "#136497",
                    margin: "12%"
                };
            }

            return callback(settings);
        }

        // Initialise
        function init() {
            if (!options.source) {
                return console.log('A source image is required');
            }
            mkdirp(options.dest, function () {
                design(function (settings) {
                    realFaviconGenerator(settings);
                });
                makeIcons(function () {
                    if (options.callback) {
                        return options.callback('Generated favicons');
                    }
                    return;
                });
            });
        }

        init();

    };

}());
