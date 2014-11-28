/*jslint node:true, nomen:true*/

(function () {

    'use strict';

    var path = require('path'),
        async = require('async'),
        _ = require('underscore'),
        mkdirp = require('mkdirp'),
        rfg = require('real-favicon'),
        metaparser = require('metaparser'),
        gm = require('gm');

    module.exports = function (params, next) {

        // Default options
        var options = _.defaults(params || {}, {
            src: null,
            dest: 'images',
            iconTypes: {
                android: true,
                appleTouch: true,
                appleStartup: true,
                coast: true,
                favicons: true,
                firefox: true,
                opengraph: true,
                windows: true
            },
            html: null,
            background: '#1d1d1d',
            manifest: null,
            trueColor: false,
            url: null,
            logging: false
        }),
            elements = [];

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

        // Write HTML
        function writeTags(callback) {
            metaparser({
                source: options.html,
                add: elements.join('\n'),
                remove: 'link[rel="apple-touch-startup-image"]',
                out: options.html,
                callback: function (error) {
                    return callback(error);
                }
            });
        }

        // Convert image with Imagemagick
        function resize(opts, callback) {
            gm(opts.source)
                .resize(opts.width, opts.height)
                .noProfile()
                .write(path.join(options.dest, opts.name), function (error) {
                    print('Created ' + opts.name);
                    return callback(error);
                });

            // WIP for Apple Startup Images
            /*gm(opts.width, opts.height, options.background)
                .noProfile()
                .write(path.join(options.dest, opts.name), function (error) {
                    print('Created ' + opts.name);
                    return callback(error);
                });*/
        }

        function whichImage(size) {
            var source = options.src,
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
                var opts = {
                    source: whichImage(320),
                    height: size.substr(size.indexOf('x') + 1, size.length - 1),
                    width: size.substr(0, size.indexOf('x')),
                    name: 'apple-touch-startup-image-' + size + '.png'
                },
                    media = '(device-width: ' + opts.width + 'px) and (device-height: ' + opts.height + 'px)',
                    ratio = (size === '640x920' || size === '640x1096' || size === '1496x2048' || size === '1536x2008' ? 2 : 1);
                resize(opts, function (error) {
                    elements.push('<link href="' + filePath(opts.name) + '" media="' + media + ' and (-webkit-device-pixel-ratio: ' + ratio + ')" rel="apple-touch-startup-image" />');
                    return callback(error);
                });
            }, function (error) {
                return callback(error);
            });
        }

        // Create the appropriate icons
        function makeIcons(callback) {
            async.parallel([
                function (callback) {
                    if (options.iconTypes.appleStartup) {
                        makeAppleStartup(function (error) {
                            callback(error);
                        });
                    } else {
                        callback(null);
                    }
                }
            ], function (error) {
                return callback(error);
            });
        }

        // Execute RealFaviconGenerator
        function realFaviconGenerator(design) {
            rfg({
                src: options.src.large,
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

            if (options.iconTypes.appleTouch) {
                settings.apple = {
                    picture_aspect: 'background_and_margin',
                    background_color: options.background,
                    margin: 0
                };
            }

            if (options.iconTypes.windows) {
                settings.windows = {
                    picture_aspect: 'white_silhouette',
                    background_color: options.background
                };
            }

            if (options.iconTypes.firefox) {
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

            if (options.iconTypes.android) {
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

            if (options.iconTypes.coast) {
                settings.coast = {
                    picture_aspect: "background_and_margin",
                    background_color: options.background,
                    margin: "12%"
                };
            }

            if (options.iconTypes.opengraph) {
                settings.open_graph = {
                    picture_aspect: "background_and_margin",
                    background_color: options.background,
                    margin: "12%",
                    ratio: "1.91:1"
                };
            }

            if (options.iconTypes.yandex) {
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

        async.waterfall([
            function (callback) {
                mkdirp(options.dest, function (error) {
                    callback(error);
                });
            },
            function (callback) {
                makeIcons(function (error) {
                    callback(error);
                });
            },
            function (callback) {
                writeTags(function (error) {
                    callback(error);
                });
            },
            function (callback) {
                design(function (settings) {
                    callback(null, settings);
                });
            },
            function (settings, callback) {
                realFaviconGenerator(settings);
                callback(null);
            }
        ], function (error) {
            if (next) {
                return next(error);
            }
        });

    };

}());
