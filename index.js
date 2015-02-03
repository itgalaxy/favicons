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
                    throw console.log('Could not publish request to the RealFaviconGenerator API: ', data);
                }
                var parserStream = unzip.Parse(),
                    writeStream = fstream.Writer(dest).on('close', function () {
                        callback(data.favicon_generation_result);
                    });
                http.get(data.favicon_generation_result.favicon.package_url, function (response) {
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
                add = add.concat(typeof params.tags.add === 'string' ? [params.tags.add] : params.tags.add);
                remove = remove.concat(typeof params.tags.remove === 'string' ? [params.tags.remove] : params.tags.remove);
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

    function real_favicon() {

        setConfig();

        var favicons_params = {
            src: options.files.src,
            dest: options.files.dest,
            icons_path: options.files.iconsPath || path.relative(path.dirname(options.files.html), options.files.dest),
            html: typeof options.files.html === 'string' ? [options.files.html] : options.files.html,
            design: config.data.favicon_generation.favicon_design,
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
        };
        config.data.favicon_generation.favicon_design = favicons_params.design;
        config.data.favicon_generation.settings = favicons_params.settings;
        if (favicons_params.icons_path === undefined) {
            config.data.favicon_generation.files_location.type = 'root';
        } else {
            config.data.favicon_generation.files_location.type = 'path';
            config.data.favicon_generation.files_location.path = favicons_params.icons_path;
        }

        async.waterfall([
            function (callback) {
                if (is_url(favicons_params.src)) {
                    config.data.favicon_generation.master_picture.type = 'url';
                    config.data.favicon_generation.master_picture.url = favicons_params.src;
                    callback(null);
                } else {
                    config.data.favicon_generation.master_picture.type = 'inline';
                    encodeBase64(favicons_params.src, function (error, file) {
                        config.data.favicon_generation.master_picture.content = file;
                        callback(error);
                    });
                }
            },
            function (callback) {
                if (config.data.favicon_generation.favicon_design !== undefined) {
                    if ((config.data.favicon_generation.favicon_design.windows !== undefined) && (config.data.favicon_generation.favicon_design.windows.picture_aspect === 'dedicated_picture')) {
                        encodeBase64(config.data.favicon_generation.favicon_design.windows.dedicated_picture, function (error, file) {
                            config.data.favicon_generation.favicon_design.windows.dedicated_picture = file;
                            callback(error);
                        });
                    } else {
                        callback(null);
                    }
                } else {
                    callback(null);
                }
            },
            function (callback) {
                if (config.data.favicon_generation.favicon_design !== undefined) {
                    if ((config.data.favicon_generation.favicon_design.ios !== undefined) && (config.data.favicon_generation.favicon_design.ios.picture_aspect === 'dedicated_picture')) {
                        encodeBase64(config.data.favicon_generation.favicon_design.ios.dedicated_picture, function (error, file) {
                            config.data.favicon_generation.favicon_design.ios.dedicated_picture = file;
                            callback(error);
                        });
                    } else {
                        callback(null);
                    }
                } else {
                    callback(null);
                }
            },
            function (callback) {
                generateFavicons(config.data.favicon_generation, favicons_params.dest, function (favicon) {
                    return callback(null, favicon);
                });
            },
            function (favicon, callback) {
                var codes = [];
                async.each(favicons_params.html, function (html, callback) {
                    writeHTML(html, favicon.favicon.html_code, function (error, code) {
                        codes.push(code);
                        callback(error, code);
                    });
                }, function (err, files) {
                    console.log(files, codes, 'files and codes');
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

    real_favicon();

};
