/*jslint node:true, nomen:true*/
module.exports = function (params, callback) {

    'use strict';

    // Node modules
    var fs = require('fs'),
        path = require('path'),
        http = require('http'),
        fstream = require('fstream'),

        // Other modules
        async = require('async'),
        Client = require('node-rest-client').Client,
        unzip = require('unzip'),
        metaparser = require('metaparser'),
        mkdirp = require('mkdirp'),
        mergeDefaults = require('merge-defaults'),
        tags = require('./data/tags.json'),
        config = require('./data/config.json'),
        options = mergeDefaults(params || {}, require('./data/defaults.json'));

    // Return base64 encoded file
    function encodeBase64(file, callback) {
        fs.readFile(file, { encoding: null }, function (error, file) {
            return callback(error, file.toString('base64'));
        });
    }

    // Publish request to the RealFaviconGenerator API, unzip response
    function generateFavicons(req, dest, callback) {
        var client = new Client();
        config.data.favicon_generation = req;
        mergeDefaults(params.favicon_generation || {}, config.data.favicon_generation);
        mkdirp(dest, function () {
            client.post("http://realfavicongenerator.net/api/favicon", config, function (data, response) {
                if (response.statusCode !== 200) {
                    return callback('Could not publish request to the RealFaviconGenerator API: ' + data, null);
                }
                var parserStream = unzip.Parse(),
                    writeStream = fstream.Writer(dest).on('close', function () {
                        callback(null, data.favicon_generation_result);
                    });
                return http.get(data.favicon_generation_result.favicon.package_url, function (response) {
                    response.pipe(parserStream).pipe(writeStream);
                });
            });
        });
    }

    // Return if string has prefix
    function starts_with(str, prefix) {
        return str.lastIndexOf(prefix, 0) === 0;
    }

    // Return if string is URL
    function is_url(str) {
        return starts_with(str, 'http://') || starts_with(str, 'https://') || starts_with(str, '//');
    }

    // Write metadata to HTML
    function writeHTML(file, html, callback) {
        var add = typeof html === 'string' ? [html] : html,
            remove = tags.remove;
        fs.exists(file, function (exists) {
            if (exists) {
                add = add.concat(typeof tags.add === 'string' ? [tags.add] : tags.add);
                remove = remove.concat(typeof tags.remove === 'string' ? [tags.remove] : tags.remove);
                metaparser({
                    source: file,
                    add: add,
                    remove: remove,
                    callback: function (error, html) {
                        return callback(error, html, add);
                    }
                });
            } else {
                fs.writeFile(file, html, function (error) {
                    callback(error, html);
                });
            }
        });
    }

    // Set global icon options for request
    function setConfig() {
        if (options.icons.appleIcon) {
            config.data.favicon_generation.favicon_design.ios = {
                picture_aspect: 'background_and_margin',
                margin: "0",
                background_color: options.settings.background
            };
        }
        if (options.icons.appleStartup) {
            config.data.favicon_generation.favicon_design.ios = config.data.favicon_generation.favicon_design.ios || {};
            config.data.favicon_generation.favicon_design.ios.startup_image = {
                background_color: options.settings.background
            };
        }
        if (options.icons.windows) {
            config.data.favicon_generation.favicon_design.windows = {
                picture_aspect: options.settings.silhouette ? 'white_silhouette' : 'no_change',
                background_color: options.settings.background
            };
        }
        if (options.icons.firefox) {
            config.data.favicon_generation.favicon_design.firefox_app = {
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
            config.data.favicon_generation.favicon_design.android_chrome = {
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
            config.data.favicon_generation.favicon_design.coast = {
                picture_aspect: "background_and_margin",
                background_color: options.settings.background,
                margin: "12%"
            };
        }
        if (options.icons.favicons) {
            config.data.favicon_generation.favicon_design.desktop_browser = {};
        }
        if (options.icons.opengraph) {
            config.data.favicon_generation.favicon_design.open_graph = {
                picture_aspect: "background_and_margin",
                background_color: options.settings.background,
                margin: "12%",
                ratio: "1.91:1"
            };
        }
        if (options.icons.yandex) {
            config.data.favicon_generation.favicon_design.yandex_browser = {
                background_color: options.settings.background,
                manifest: {
                    show_title: true,
                    version: options.settings.version
                }
            };
        }
    }

    // Kick everything off
    function favicons() {
        var source = options.files.src,
            icons_path = options.files.iconsPath || path.relative(path.dirname(options.files.html), options.files.dest),
            html = typeof options.files.html === 'string' ? [options.files.html] : options.files.html;

        setConfig();

        if (icons_path) {
            config.data.favicon_generation.files_location.type = 'path';
            config.data.favicon_generation.files_location.path = icons_path;
        } else {
            config.data.favicon_generation.files_location.type = 'root';
        }

        async.waterfall([
            function (callback) {
                if (is_url(source)) {
                    config.data.favicon_generation.master_picture.type = 'url';
                    config.data.favicon_generation.master_picture.url = source;
                    callback(null);
                } else {
                    config.data.favicon_generation.master_picture.type = 'inline';
                    encodeBase64(source, function (error, file) {
                        config.data.favicon_generation.master_picture.content = file;
                        callback(error);
                    });
                }
            },
            function (callback) {
                if ((config.data.favicon_generation.favicon_design.windows !== undefined) && (config.data.favicon_generation.favicon_design.windows.picture_aspect === 'dedicated_picture')) {
                    encodeBase64(config.data.favicon_generation.favicon_design.windows.dedicated_picture, function (error, file) {
                        config.data.favicon_generation.favicon_design.windows.dedicated_picture = file;
                        callback(error);
                    });
                } else {
                    callback(null);
                }
            },
            function (callback) {
                if ((config.data.favicon_generation.favicon_design.ios !== undefined) && (config.data.favicon_generation.favicon_design.ios.picture_aspect === 'dedicated_picture')) {
                    encodeBase64(config.data.favicon_generation.favicon_design.ios.dedicated_picture, function (error, file) {
                        config.data.favicon_generation.favicon_design.ios.dedicated_picture = file;
                        callback(error);
                    });
                } else {
                    callback(null);
                }
            },
            function (callback) {
                generateFavicons(config.data.favicon_generation, options.files.dest, function (error, favicon) {
                    return callback(error, favicon);
                });
            },
            function (favicon, callback) {
                var codes = [];
                async.each(html, function (html, callback) {
                    writeHTML(html, favicon.favicon.html_code, function (error, code) {
                        codes.push(code);
                        callback(error);
                    });
                }, function (error) {
                    return callback(error, codes);
                });
            }
        ], function (error, codes) {
            if (error) {
                throw error;
            }
            return callback ? callback(codes) : null;
        });

    }

    favicons();

};
