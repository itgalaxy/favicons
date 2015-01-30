/*jslint node:true*/

(function () {

    'use strict';

    var path = require('path'),
        defaults = require('lodash.defaults'),
        rfg = require('real-favicon');

    module.exports = function (params, callback) {

        // Default options
        var options = defaults(params || {}, {
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
                silhouette: false,
                version: 1.0,
                logging: false
            }
        }),
            tags = {
                add: [],
                remove: ['link[rel="favicons"]']
            },
            design = {};

        if (options.icons.appleIcon) {
            design.ios = {
                picture_aspect: 'background_and_margin',
                margin: "0",
                background_color: options.settings.background
            };
        }

        if (options.icons.appleStartup) {
            design.ios = design.ios || {};
            design.ios.startup_image = {
                background_color: options.settings.background
            };
        }


        if (options.icons.windows) {
            design.windows = {
                picture_aspect: options.settings.silhouette ? 'white_silhouette' : 'no_change',
                background_color: options.settings.background
            };
        }

        if (options.icons.firefox) {
            design.firefox_app = {
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
            design.android_chrome = {
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
            design.coast = {
                picture_aspect: "background_and_margin",
                background_color: options.settings.background,
                margin: "12%"
            };
        }

        if (options.icons.favicons) {
            design.desktop_browser = {};
        }

        if (options.icons.opengraph) {
            design.open_graph = {
                picture_aspect: "background_and_margin",
                background_color: options.settings.background,
                margin: "12%",
                ratio: "1.91:1"
            };
        }

        if (options.icons.yandex) {
            design.yandex_browser = {
                background_color: options.settings.background,
                manifest: {
                    show_title: true,
                    version: options.settings.version
                }
            };
        }

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
                return callback ? callback(metadata) : null;
            }
        });

    };

}());
