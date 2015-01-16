/*jslint node:true, nomen:true*/

(function () {

    'use strict';

    var path = require('path'),
        async = require('async'),
        _ = require('underscore'),
        mkdirp = require('mkdirp'),
        rfg = require('real-favicon'),
        gm = require('gm'),
        appleStartupImages = require('./appleStartup.json');

    module.exports = function (params, next) {

        // Default options
        var options = _.defaults(params || {}, {
            files: {
                src: null,
                dest: null,
                html: null,
                iconsPath: null,
                androidManifest: null,
                browserConfig: null,
                firefoxManifest: null,
                yandexManifest: null
            },
            icons: {
                android: true,
                appleIcon: true,
                appleStartup: true,
                coast: true,
                favicons: true,
                firefox: true,
                opengraph: true,
                windows: true,
                yandex: true
            },
            settings: {
                appName: null,
                appDescription: null,
                developer: null,
                developerURL: null,
                background: null,
                index: null,
                url: null,
                logging: false
            }
        }),
            tags = {
                add: [],
                remove: ['link[rel="favicons"]']
            };

        // Print to the console.
        function print(message) {
            if (message && options.settings.logging) {
                console.log(message);
            }
        }

        // Determine whether HTML is to be produced
        function writeHTML() {
            return options.files.html && options.files.html !== '';
        }

        // Create a filepath.
        function filePath(filename) {
            var html = path.dirname(options.files.html),
                filepath = path.join(options.files.dest, filename);
            return writeHTML() ? path.relative(html, filepath) : filepath;
        }

        // Convert image with Imagemagick
        function resize(opts, callback) {
            gm(opts.source)
                .background(options.settings.background)
                .resize(opts.width * 0.88, opts.height * 0.88)
                .gravity('Center')
                .extent(opts.width, opts.height)
                .noProfile()
                .write(path.join(options.files.dest, opts.name), function (error) {
                    print('Created ' + opts.name);
                    return callback(error);
                });
        }

        // Make Apple Startup Images
        function makeAppleStartup(callback) {
            var appleStartups = [];
            _.chain(appleStartupImages)
                .values(appleStartupImages)
                .each(function (object) {
                    appleStartups.push({
                        source: options.files.src,
                        height: object.height,
                        width: object.width,
                        name: 'apple-touch-startup-image-' + object.width + 'x' + object.height + '.png',
                        media: '(device-width: ' + object.deviceWidth + 'px) and (device-height: ' + object.deviceHeight + 'px)',
                        orientation: object.orientation ? ' and (orientation: ' + object.orientation + ')' : '',
                        ratio: ' and (-webkit-device-pixel-ratio: ' + object.ratio
                    });
                });
            async.each(appleStartups, function (opts, callback) {
                var iconsFilePath = options.files.iconsPath ? path.join(options.files.iconsPath, opts.name) : filePath(opts.name);
                resize(opts, function (error) {
                    tags.add.push('\n<link href="' + iconsFilePath + '" media="' + opts.media + opts.orientation + opts.ratio + ')" rel="apple-touch-startup-image" />');
                    callback(error);
                });
            }, function (error) {
                tags.remove.push('link[rel="apple-touch-startup-image"]');
                return callback(error);
            });
        }

        // Create the appropriate icons
        function makeIcons(callback) {
            async.parallel([
                function (callback) {
                    if (options.icons.appleStartup) {
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
        function realFaviconGenerator(design, callback) {
            rfg({
                src: options.files.src,
                dest: options.files.dest,
                icons_path: options.files.iconsPath || path.relative(path.dirname(options.files.html), options.files.dest),
                html: options.files.html,
                design: design,
                tags: {
                    add: tags.add,
                    remove: tags.remove
                },
                settings: {
                    compression: "5"
                },
                callback: function (metadata) {
                    return callback(metadata);
                }
            });
        }

        // Create design object for RFG
        function design(callback) {
            var settings = {};

            if (options.icons.appleTouch) {
                settings.ios = {
                    picture_aspect: 'background_and_margin',
                    margin: "0",
                    background_color: options.settings.background
                };
            }

            if (options.icons.windows) {
                settings.windows = {
                    picture_aspect: 'white_silhouette',
                    background_color: options.settings.background
                };
            }

            if (options.icons.firefox) {
                settings.firefox_app = {
                    picture_aspect: "circle",
                    keep_picture_in_circle: "true",
                    circle_inner_margin: "5",
                    background_color: options.settings.background,
                    manifest: {
                        app_name: options.settings.appName,
                        app_description: options.settings.appDescription,
                        developer_name: options.settings.developer,
                        developer_url: options.settings.developerURL
                    }
                };
            }

            if (options.icons.android) {
                settings.android_chrome = {
                    picture_aspect: "shadow",
                    manifest: {
                        name: options.settings.appName,
                        display: "standalone",
                        orientation: "portrait",
                        start_url: options.settings.index,
                        existing_manifest: options.files.androidManifest
                    },
                    theme_color: options.settings.background
                };
            }

            if (options.icons.coast) {
                settings.coast = {
                    picture_aspect: "background_and_margin",
                    background_color: options.settings.background,
                    margin: "12%"
                };
            }

            if (options.icons.favicons) {
                settings.desktop_browser = {};
            }

            if (options.icons.opengraph) {
                settings.open_graph = {
                    picture_aspect: "background_and_margin",
                    background_color: options.settings.background,
                    margin: "12%",
                    ratio: "1.91:1"
                };
            }

            if (options.icons.yandex) {
                settings.yandex_browser = {
                    background_color: options.settings.background,
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
                mkdirp(options.files.dest, function (error) {
                    callback(error);
                });
            },
            function (callback) {
                makeIcons(function (error) {
                    callback(error);
                });
            },
            function (callback) {
                design(function (settings) {
                    callback(null, settings);
                });
            },
            function (settings, callback) {
                realFaviconGenerator(settings, function (metadata) {
                    callback(null, metadata);
                });
            }
        ], function (error, metadata) {
            if (next) {
                return next(error, metadata);
            }
        });

    };

}());
