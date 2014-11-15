/*jslint devel:true*/
/*global module, require*/

(function () {

    'use strict';

    var path = require('path'),
        exec = require('child_process').exec,
        async = require('async'),
        defaults = require('lodash.defaults'),
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
            appleTouch: true,
            appleStartup: true,
            coast: true,
            favicons: true,
            firefox: true,
            opengraph: true,
            windows: true,

            // Miscellaneous
            html: null,
            background: '#1d1d1d',
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

        /*<!-- iOS 6 & 7 iPad (retina, portrait) -->
        <link href="/static/images/apple-touch-startup-image-1536x2008.png"
              media="(device-width: 768px) and (device-height: 1024px)
                 and (orientation: portrait)
                 and (-webkit-device-pixel-ratio: 2)"
              rel="apple-touch-startup-image">

        <!-- iOS 6 & 7 iPad (retina, landscape) -->
        <link href="/static/images/apple-touch-startup-image-1496x2048.png"
              media="(device-width: 768px) and (device-height: 1024px)
                 and (orientation: landscape)
                 and (-webkit-device-pixel-ratio: 2)"
              rel="apple-touch-startup-image">

        <!-- iOS 6 iPad (portrait) -->
        <link href="/static/images/apple-touch-startup-image-768x1004.png"
              media="(device-width: 768px) and (device-height: 1024px)
                 and (orientation: portrait)
                 and (-webkit-device-pixel-ratio: 1)"
              rel="apple-touch-startup-image">

        <!-- iOS 6 iPad (landscape) -->
        <link href="/static/images/apple-touch-startup-image-748x1024.png"
              media="(device-width: 768px) and (device-height: 1024px)
                 and (orientation: landscape)
                 and (-webkit-device-pixel-ratio: 1)"
              rel="apple-touch-startup-image">

        <!-- iOS 6 & 7 iPhone 5 -->
        <link href="/static/images/apple-touch-startup-image-640x1096.png"
              media="(device-width: 320px) and (device-height: 568px)
                 and (-webkit-device-pixel-ratio: 2)"
              rel="apple-touch-startup-image">

        <!-- iOS 6 & 7 iPhone (retina) -->
        <link href="/static/images/apple-touch-startup-image-640x920.png"
              media="(device-width: 320px) and (device-height: 480px)
                 and (-webkit-device-pixel-ratio: 2)"
              rel="apple-touch-startup-image">

        <!-- iOS 6 iPhone -->
        <link href="/static/images/apple-touch-startup-image-320x460.png"
              media="(device-width: 320px) and (device-height: 480px)
                 and (-webkit-device-pixel-ratio: 1)"
              rel="apple-touch-startup-image">*/

        // Make Apple Startup Images
        function makeAppleStartup(callback) {
            async.each(['1536x2008', '1496x2048', '768x1004', '748x1024', '640x1096', '640x920', '320x460'], function (size, callback) {
                var name = 'apple-touch-startup-image-' + size + '.png',
                    ratio = (size === '640x920' || size === '640x1096' || size === '1496x2048' || size === '1536x2008' ? 2 : 1),
                    media = '(device-width: ' + size.substr(0, size.indexOf('x')) + ') and (device-height: ' + size.substr(size.indexOf('x'), size.length - 1) + ')',
                    command = combine(whichImage(320), options.dest, size, name, opts);
                convert(command, name, function () {
                    elements.push('<link href="' + filePath(name) + '" media="' + media + ' and (-webkit-device-pixel-ratio: ' + ratio + ')" rel="apple-touch-startup-image" />');
                    return callback();
                });
            }, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Create the appropriate icons
        function makeIcons(callback) {
            async.parallel([
                function (callback) {
                    if (options.appleStartup) {
                        makeAppleStartup(function () {
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

            if (options.appleTouch) {
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
                    background_color: options.background,
                    app_name: "My sample app",
                    app_description: "Yet another sample application",
                    developer_name: "Philippe Bernard",
                    developer_url: options.url
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
                    background_color: options.background,
                    margin: "12%"
                };
            }

            if (options.opengraph) {
                settings.open_graph = {
                    picture_aspect: "background_and_margin",
                    background_color: "#136497",
                    margin: "12%",
                    ratio: "1.91:1"
                };
            }

            if (options.yandex) {
                settings.yandex_browser = {
                    background_color: options.background,
                    manifest: {
                        show_title: true,
                        version: "1.0"
                    }
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
