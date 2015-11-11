/*jslint node:true, nomen:true*/

(function () {

    'use strict';

    var path = require('path'),
        fs = require('fs'),
        _ = require('underscore'),
        color = require('tinycolor2'),
        cheerio = require('cheerio'),
        colors = require('colors'),
        jsonxml = require('jsontoxml'),
        sizeOf = require('image-size'),
        async = require('async'),
        Jimp = require('jimp'),
        NRC = require('node-rest-client').Client,
        xmlconfig = { prettyPrint: true, xmlHeader: true, indent: '  ' };

    module.exports = function (options) {

        Array.prototype.contains = function(element) {
            return this.indexOf(element.toLowerCase()) > -1;
        };

        function print(context, message) {
            var newMessage = '';
            if (options.logging && message) {
                _.each(message.split(' '), function (item) {
                    newMessage += ' ' + ((/^\d+x\d+$/gm).test(item) ? colors.magenta(item) : item);
                });
                console.log('[Favicons] '.green + context.yellow + ':' + newMessage + '...');
            }
        }

        function relative(name) {
            return path.join(options.path, name);
        }

        function readFile(filepath, callback) {
            fs.readFile(filepath, function (error, buffer) {
                return callback(error, buffer);
            });
        }

        return {

            General: {
                background: function (hex) {
                    print('General:background', 'Parsing colour ' + hex);
                    var rgba = color(hex).toRgb();
                    return Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * 255);
                },
                source: function (source, callback) {
                    var sourceset = [];
                    print('General:source', 'Source type is ' + typeof source);
                    if (!source || !source.length) {
                        return callback('No source provided');
                    } else if (Buffer.isBuffer(source)) {
                        sourceset = [{ size: sizeOf(source), file: source }];
                        return callback((sourceset.length ? null : 'Favicons source is invalid'), sourceset);
                    } else if (typeof source === 'object') {
                        async.each(source, function (file, size) {
                            readFile(file, function (error, buffer) {
                                sourceset.push({
                                    size: { width: size, height: size, type: 'png' },
                                    file: buffer
                                });
                            });
                        }, function (error) {
                            return callback((sourceset.length ? null : 'Favicons source is invalid'), sourceset);
                        });
                    } else if (typeof source === 'string') {
                        readFile(source, function (error, buffer) {
                            sourceset = [{ size: sizeOf(buffer), file: buffer }];
                            return callback((sourceset.length ? null : 'Favicons source is invalid'), sourceset);
                        });
                    } else {
                        return callback('Invalid source type provided');
                    }
                }
            },

            HTML: {
                parse: function (html, callback) {
                    print('HTML:parse', 'HTML found, parsing and modifying source');
                    var $ = cheerio.load(html),
                        link = $('*').is('link'),
                        attribute = (link ? 'href' : 'content'),
                        value = $('*').first().attr(attribute);
                    if (path.extname(value)) {
                        $('*').first().attr(attribute, relative(value));
                    }
                    return callback(null, $.html());
                }
            },

            Files: {
                create: function (properties, name, callback) {
                    print('Files:create', 'Creating file: ' + name);
                    if (name === 'android-chrome-manifest.json') {
                        properties.name = options.appName;
                        _.map(properties.icons, function (icon) {
                            icon.src = relative(icon.src);
                        });
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'manifest.webapp') {
                        properties.version = options.version;
                        properties.name = options.appName;
                        properties.description = options.appDescription;
                        properties.developer.name = options.developerName;
                        properties.developer.url = options.developerURL;
                        _.map(properties.icons, function (property) {
                            property = relative(property);
                        });
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'browserconfig.xml') {
                        _.map(properties[0].children[0].children[0].children, function (property) {
                            if (property.name === 'TileColor') {
                                property.text = options.background;
                            } else {
                                property.attrs.src = relative(property.attrs.src);
                            }
                        });
                        properties = jsonxml(properties, xmlconfig);
                    } else if (name === 'yandex-browser-manifest.json') {
                        properties.version = options.version;
                        properties.api_version = 1;
                        properties.layout.logo = relative(properties.layout.logo);
                        properties.layout.color = options.background;
                        properties = JSON.stringify(properties, null, 2);
                    }
                    return callback(null, { name: name, contents: properties });
                }
            },

            Images: {
                create: function (width, height, background, callback) {
                    print('Image:create', 'Creating empty ' + width + 'x' + height + ' canvas with ' + background + ' background');
                    var jimp = new Jimp(width, height, background, function (error, canvas) {
                        return callback(error, canvas, jimp);
                    });
                },
                read: function (file, callback) {
                    print('Image:read', 'Reading file: ' + file.buffer);
                    Jimp.read(file, function (error, image) {
                        return callback(error, image);
                    });
                },
                resize: function (image, minimum, callback) {
                    print('Images:resize', 'Resizing image to ' + minimum + 'x' + minimum);
                    image.resize(minimum, Jimp.AUTO);
                    return callback(null, image);
                },
                composite: function (canvas, image, height, width, minimum, callback) {
                    var offsetHeight = (height - minimum > 0 ? (height - minimum) / 2 : 0),
                        offsetWidth = (width - minimum > 0 ? (width - minimum) / 2 : 0);
                    print('Images:composite', 'Compositing ' + minimum + 'x' + minimum + ' favicon on ' + width + 'x' + height + ' canvas');
                    canvas.composite(image, offsetWidth, offsetHeight);
                    return callback(null, canvas);
                },
                getBuffer: function (canvas, callback) {
                    print('Images:getBuffer', 'Collecting image buffer from canvas');
                    canvas.getBuffer(Jimp.MIME_PNG, function (error, buffer) {
                        return callback(error, buffer);
                    });
                }
            },

            RFG: {
                configure: function (sourceset, request, callback) {
                    print('RFG:configure', 'Configuring RFG API request');
                    request.master_picture.content = _.max(sourceset, image => image.size.width).file.toString('base64');
                    request.files_location.path = options.path;

                    if (options.icons.android) {
                        request.favicon_design.android_chrome.manifest.name = options.appName;
                        request.favicon_design.android_chrome.manifest.display = options.display;
                        request.favicon_design.android_chrome.manifest.orientation = options.orientation;
                        request.favicon_design.android_chrome.manifest.theme_color = options.background;
                    } else {
                        delete request.favicon_design.android_chrome;
                    }

                    if (options.icons.appleIcon) {
                        request.favicon_design.ios.background_color = options.background;
                    } else {
                        delete request.favicon_design.ios;
                    }

                    if (options.icons.appleStartup) {
                        request.favicon_design.ios.startup_image.background_color = options.background;
                    } else {
                        delete request.favicon_design.ios.startup_image;
                    }

                    if (options.icons.coast) {
                        request.favicon_design.coast.background_color = options.background;
                    } else {
                        delete request.favicon_design.coast;
                    }

                    if (!options.icons.favicons) {
                        delete request.favicon_design.desktop_browser;
                    }

                    if (options.icons.firefox) {
                        request.favicon_design.firefox_app.background_color = options.background;
                        request.favicon_design.firefox_app.manifest.app_name = options.appName;
                        request.favicon_design.firefox_app.manifest.app_description = options.appDescription;
                        request.favicon_design.firefox_app.manifest.developer_name = options.developerName;
                        request.favicon_design.firefox_app.manifest.developer_url = options.developerURL;
                    } else {
                        delete request.favicon_design.firefox_app;
                    }

                    if (options.icons.opengraph) {
                        request.favicon_design.open_graph.background_color = options.background;
                    } else {
                        delete request.favicon_design.open_graph;
                    }

                    if (options.icons.windows) {
                        request.favicon_design.windows.background_color = options.background;
                    } else {
                        delete request.favicon_design.windows;
                    }

                    if (options.icons.yandex) {
                        request.favicon_design.yandex_browser.background_color = options.background;
                        request.favicon_design.yandex_browser.manifest.version = options.version;
                    } else {
                        delete request.favicon_design.yandex_browser;
                    }

                    return callback(null, request);
                },
                request: function (request, callback) {
                    print('RFG:request', 'Posting a request to the RFG API');
                    var client = new NRC();
                    client.post("http://realfavicongenerator.net/api/favicon", {
                        data: { "favicon_generation": request },
                        headers: { "Content-Type": "application/json" }
                    }, function(data, response) {
                        if (data.favicon_generation_result && response.statusCode === 200) {
                            return callback(null, {
                                files: data.favicon_generation_result.favicon.files_urls,
                                html: data.favicon_generation_result.favicon.html_code
                            });
                        } else {
                            return callback(data.favicon_generation_result.result.error_message);
                        }
                    });
                },
                fetch: function (url, callback) {
                    var client = new NRC(),
                        name = path.basename(url),
                        image = ['.png', '.jpg', '.bmp', '.ico', '.svg'].contains(path.extname(name));
                    print('RFG:fetch', 'Fetching ' + (image ? 'image' : 'file') + ' from RFG: ' + url);
                    client.get(url, function(buffer, response) {
                        if (buffer && response.statusCode === 200) {
                            return callback(null, {
                                file: (image ? null : { name: name, contents: buffer }),
                                image: (image ? { name: name, contents: buffer } : null)
                            });
                        } else {
                            return callback('Could not fetch URL: ' + url);
                        }
                    });
                }
            }

        };

    };

}());
