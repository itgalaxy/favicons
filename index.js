/*jslint node:true*/
module.exports = function (params, callback) {

    'use strict';

    var fs = require('fs'),
        async = require('async'),
        path = require('path'),
        defaults = require('lodash.defaults'),
        Client = require('node-rest-client').Client,
        http = require('http'),
        unzip = require('unzip'),
        metaparser = require('metaparser'),
        fstream = require('fstream'),
        mkdirp = require('mkdirp');

    function file_to_base64(file, callback) {
        fs.readFile(file, { encoding: null }, function (error, file) {
            if (error) {
                throw error;
            }
            return callback(file.toString('base64'));
        });
    }

    function generate_favicon(favicon_generation_request, dest, callback) {
        var client = new Client(),
            args = {
                data: {
                    "favicon_generation": favicon_generation_request
                },
                headers: {
                    "Content-Type": "application/json"
                }
            };
        mkdirp(dest, function () {
            client.post("http://realfavicongenerator.net/api/favicon", args, function (data, response) {
                if (response.statusCode !== 200) {
                    throw console.log(data);
                }
                var writeStream = fstream.Writer(dest),
                    parserStream = unzip.Parse(),
                    request = http.get(data.favicon_generation_result.favicon.package_url, function (response) {
                        response.pipe(parserStream).pipe(writeStream);
                    });
                writeStream.on('close', function () {
                    callback(data.favicon_generation_result);
                });
            });
        });
    }

    function generate_favicon_markups(file, html_code, opts, callback) {
        var defaultRemove = [
            'link[rel="shortcut icon"]',
            'link[rel="icon"]',
            'link[rel^="apple-touch-icon"]',
            'link[rel="manifest"]',
            'link[rel="yandex-tableau-widget"]',
            'link[rel="apple-touch-startup-image"]',
            'meta[name^="msapplication"]',
            'meta[name="mobile-web-app-capable"]',
            'meta[name="theme-color"]',
            'meta[name="apple-mobile-web-app-capable"]',
            'meta[property="og:image"]'
        ],
            add = typeof html_code === 'string' ? [html_code] : html_code,
            remove = defaultRemove;

        if (opts) {
            if (opts.add) {
                add = add.concat(typeof opts.add === 'string' ? [opts.add] : opts.add);
            }
            if (opts.remove) {
                remove = remove.concat(typeof opts.remove === 'string' ? [opts.remove] : opts.remove);
            }
        }

        metaparser({
            source: file,
            add: add,
            remove: remove,
            callback: function (error, html) {
                if (error) {
                    throw error;
                }
                return callback(html, add);
            }
        });
    }

    function starts_with(str, prefix) {
        return str.lastIndexOf(prefix, 0) === 0;
    }

    function is_url(str) {
        return starts_with(str, 'http://') || starts_with(str, 'https://') || starts_with(str, '//');
    }

    function make_favicons(file, favicon, callback) {
        fs.exists(file, function (exists) {
            if (exists) {
                generate_favicon_markups(file, favicon.favicon.html_code, params.tags, function (html, add) {
                    fs.writeFile(file, html, function (err) {
                        if (err) {
                            throw err;
                        }
                        callback(html);
                    });
                });
            } else {
                fs.writeFile(file, favicon.favicon.html_code, function (err) {
                    if (err) {
                        throw err;
                    }
                    callback(favicon.favicon.html_code);
                });
            }
        });
    }

    function real_favicon(favicons_params) {
        var html_files = typeof favicons_params.html === 'string' ? [favicons_params.html] : favicons_params.html,
            request = {
                api_key: 'f26d432783a1856427f32ed8793e1d457cc120f1',
                master_picture: {},
                files_location: {},
                favicon_design: favicons_params.design,
                settings: favicons_params.settings
            };

        if (favicons_params.icons_path === undefined) {
            request.files_location.type = 'root';
        } else {
            request.files_location.type = 'path';
            request.files_location.path = favicons_params.icons_path;
        }

        async.waterfall([
            function (callback) {
                if (is_url(favicons_params.src)) {
                    request.master_picture.type = 'url';
                    request.master_picture.url = favicons_params.src;
                    callback(null);
                } else {
                    request.master_picture.type = 'inline';
                    file_to_base64(favicons_params.src, function (file) {
                        request.master_picture.content = file;
                        callback(null);
                    });
                }
            },
            function (callback) {
                if (request.favicon_design !== undefined) {
                    if ((request.favicon_design.windows !== undefined) && (request.favicon_design.windows.picture_aspect === 'dedicated_picture')) {
                        file_to_base64(request.favicon_design.windows.dedicated_picture, function (file) {
                            request.favicon_design.windows.dedicated_picture = file;
                            callback(null);
                        });
                    } else {
                        callback(null);
                    }
                } else {
                    callback(null);
                }
            },
            function (callback) {
                if (request.favicon_design !== undefined) {
                    if ((request.favicon_design.ios !== undefined) && (request.favicon_design.ios.picture_aspect === 'dedicated_picture')) {
                        file_to_base64(request.favicon_design.ios.dedicated_picture, function (file) {
                            request.favicon_design.ios.dedicated_picture = file;
                            callback(null);
                        });
                    } else {
                        callback(null);
                    }
                } else {
                    callback(null);
                }
            },
            function (callback) {
                generate_favicon(request, favicons_params.dest, function (favicon) {
                    return callback(null, favicon);
                });
            },
            function (favicon, callback) {
                var codes = [];
                async.each(html_files, function (html, callback) {
                    make_favicons(html, favicon, function (code) {
                        codes.push(code);
                        callback(null, code);
                    });
                }, function (err, files) {
                    return callback(err, codes);
                });
            }
        ], function (err, codes) {
            if (err) {
                throw err;
            }
            return (params && favicons_params.callback) ? favicons_params.callback(codes) : null;
        });

    }

    function favicons() {

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

        real_favicon({
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
    }

    favicons();

};
