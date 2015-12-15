'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/* eslint camelcase: 0 */

var path = require('path'),
    url = require('url'),
    fs = require('fs'),
    _ = require('underscore'),
    color = require('tinycolor2'),
    cheerio = require('cheerio'),
    colors = require('colors'),
    jsonxml = require('jsontoxml'),
    sizeOf = require('image-size'),
    async = require('async'),
    Jimp = require('jimp'),
    File = require('vinyl'),
    Reflect = require('harmony-reflect'),
    NRC = require('node-rest-client').Client;

(function () {
    'use strict';

    var xmlconfig = { prettyPrint: true, xmlHeader: true, indent: '  ' },
        client = new NRC(),
        HEX_MAX = 255,
        NON_EXISTANT = -1,
        ROTATE_DEGREES = 90,
        HTTP_SUCCESS = 200;

    client.setMaxListeners(0);

    function helpers(options) {

        function contains(array, element) {
            return array.indexOf(element.toLowerCase()) > NON_EXISTANT;
        }

        function relative(directory) {
            return url.resolve(options.path, directory);
        }

        function absolute(directory) {
            return url.resolve(options.path, directory);
        }

        function print(context, message) {
            var newMessage = '';

            if (options.logging && message) {
                _.each(message.split(' '), function (item) {
                    newMessage += ' ' + (/^\d+x\d+$/gm.test(item) ? colors.magenta(item) : item);
                });
                console.log(colors.green('[Favicons]') + ' ' + context.yellow + ': ' + newMessage + '...');
            }
        }

        function readFile(filepath, callback) {
            fs.readFile(filepath, function (error, buffer) {
                return callback(error, buffer);
            });
        }

        return {

            General: {
                background: function background(hex) {
                    print('General:background', 'Parsing colour ' + hex);
                    var rgba = color(hex).toRgb();

                    return Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * HEX_MAX);
                },
                source: function source(_source, callback) {
                    var sourceset = [];

                    print('General:source', 'Source type is ' + (typeof _source === 'undefined' ? 'undefined' : _typeof(_source)));
                    if (!_source || !_source.length) {
                        return callback('No source provided');
                    } else if (Buffer.isBuffer(_source)) {
                        sourceset = [{ size: sizeOf(_source), file: _source }];
                        return callback(sourceset.length ? null : 'Favicons source is invalid', sourceset);
                    } else if ((typeof _source === 'undefined' ? 'undefined' : _typeof(_source)) === 'object') {
                        async.each(_source, function (file, size, cb) {
                            return readFile(file, function (error, buffer) {
                                sourceset.push({
                                    size: { width: size, height: size, type: 'png' },
                                    file: buffer
                                });
                                return cb(error);
                            });
                        }, function (error) {
                            return callback(error || sourceset.length ? null : 'Favicons source is invalid');
                        }, sourceset);
                    } else if (typeof _source === 'string') {
                        readFile(_source, function (error, buffer) {
                            sourceset = [{ size: sizeOf(buffer), file: buffer }];
                            return callback(error || (sourceset.length ? null : 'Favicons source is invalid'), sourceset);
                        });
                    } else {
                        return callback('Invalid source type provided');
                    }
                },

                vinyl: function vinyl(object) {
                    return new File({
                        path: object.name,
                        contents: Buffer.isBuffer(object.contents) ? object.contents : new Buffer(object.contents)
                    });
                }
            },

            HTML: {
                parse: function parse(html, callback) {
                    print('HTML:parse', 'HTML found, parsing and modifying source');
                    var $ = cheerio.load(html),
                        link = $('*').is('link'),
                        attribute = link ? 'href' : 'content',
                        value = $('*').first().attr(attribute);

                    if (path.extname(value)) {
                        if (html.indexOf('og:image') !== -1 || html.indexOf('twitter:image') !== -1) {
                            $('*').first().attr(attribute, absolute(value));
                        } else {
                            $('*').first().attr(attribute, relative(value));
                        }
                    }
                    return callback(null, $.html());
                },
                update: function update(document, code, tags, callback) {
                    var encoding = { encoding: 'utf8' };

                    async.waterfall([function (cb) {
                        return fs.readFile(document, encoding, function (error, data) {
                            var err = error;

                            return err ? cb(null, null) : cb(error, data);
                        });
                    }, function (data, cb) {
                        if (data) {
                            (function () {
                                var $ = cheerio.load(data, { decodeEntities: false }),
                                    target = $('head').length > 0 ? $('head') : $.root();

                                async.each(tags, function (tag, c) {
                                    $(tag).remove();
                                    return c(null);
                                }, function (error) {
                                    target.append(code.join('\n'));
                                    return cb(error, $.html().replace(/^\s*$[\n\r]{1,}/gm, ''));
                                });
                            })();
                        } else {
                            return cb(null, code.join('\n'));
                        }
                    }, function (html, cb) {
                        return fs.writeFile(document, html, options, function (error) {
                            return cb(error);
                        });
                    }], function (error) {
                        return callback(error);
                    });
                }
            },

            Files: {
                create: function create(properties, name, callback) {
                    print('Files:create', 'Creating file: ' + name);
                    if (name === 'manifest.json') {
                        properties.name = options.appName;
                        properties.display = options.display;
                        properties.orientation = options.orientation;
                        _.map(properties.icons, function (icon) {
                            return icon.src = relative(icon.src);
                        });
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'manifest.webapp') {
                        properties.version = options.version;
                        properties.name = options.appName;
                        properties.description = options.appDescription;
                        properties.developer.name = options.developerName;
                        properties.developer.url = options.developerURL;
                        _.map(properties.icons, function (property) {
                            return property = relative(property);
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
                create: function create(properties, background, callback) {
                    var jimp = null;

                    print('Image:create', 'Creating empty ' + properties.width + 'x' + properties.height + ' canvas with ' + (properties.transparent ? 'transparent' : background) + ' background');
                    jimp = new Jimp(properties.width, properties.height, properties.transparent ? 0x00000000 : background, function (error, canvas) {
                        return callback(error, canvas, jimp);
                    });
                },
                read: function read(file, callback) {
                    print('Image:read', 'Reading file: ' + file.buffer);
                    Jimp.read(file, function (error, image) {
                        return callback(error, image);
                    });
                },
                resize: function resize(image, minimum, callback) {
                    print('Images:resize', 'Resizing image to ' + minimum + 'x' + minimum);
                    image.resize(minimum, Jimp.AUTO);
                    return callback(null, image);
                },
                composite: function composite(canvas, image, properties, minimum, callback) {
                    var offsetHeight = properties.height - minimum > 0 ? (properties.height - minimum) / 2 : 0,
                        offsetWidth = properties.width - minimum > 0 ? (properties.width - minimum) / 2 : 0;

                    image.rotate(properties.rotate ? ROTATE_DEGREES : 0);
                    print('Images:composite', 'Compositing ' + minimum + 'x' + minimum + ' favicon on ' + properties.width + 'x' + properties.height + ' canvas');
                    canvas.composite(image, offsetWidth, offsetHeight);
                    return callback(null, canvas);
                },
                getBuffer: function getBuffer(canvas, callback) {
                    print('Images:getBuffer', 'Collecting image buffer from canvas');
                    canvas.getBuffer(Jimp.MIME_PNG, function (error, buffer) {
                        return callback(error, buffer);
                    });
                }
            },

            RFG: {
                configure: function configure(sourceset, request, callback) {
                    print('RFG:configure', 'Configuring RFG API request');
                    request.master_picture.content = _.max(sourceset, function (image) {
                        return image.size.width;
                    }).file.toString('base64');
                    request.files_location.path = options.path;

                    if (options.icons.android) {
                        request.favicon_design.android_chrome.manifest.name = options.appName;
                        request.favicon_design.android_chrome.manifest.display = options.display;
                        request.favicon_design.android_chrome.manifest.orientation = options.orientation;
                        request.favicon_design.android_chrome.manifest.theme_color = options.background;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'android_chrome');
                    }

                    if (options.icons.appleIcon) {
                        request.favicon_design.ios.background_color = options.background;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'ios');
                    }

                    if (options.icons.appleStartup) {
                        request.favicon_design.ios.startup_image.background_color = options.background;
                    } else if (request.favicon_design.ios) {
                        Reflect.deleteProperty(request.favicon_design.ios, 'startup_image');
                    }

                    if (options.icons.coast) {
                        request.favicon_design.coast.background_color = options.background;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'coast');
                    }

                    if (!options.icons.favicons) {
                        Reflect.deleteProperty(request.favicon_design, 'desktop_browser');
                    }

                    if (options.icons.firefox) {
                        request.favicon_design.firefox_app.background_color = options.background;
                        request.favicon_design.firefox_app.manifest.app_name = options.appName;
                        request.favicon_design.firefox_app.manifest.app_description = options.appDescription;
                        request.favicon_design.firefox_app.manifest.developer_name = options.developerName;
                        request.favicon_design.firefox_app.manifest.developer_url = options.developerURL;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'firefox_app');
                    }

                    if (options.icons.opengraph) {
                        request.favicon_design.open_graph.background_color = options.background;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'open_graph');
                    }

                    if (options.icons.windows) {
                        request.favicon_design.windows.background_color = options.background;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'windows');
                    }

                    if (options.icons.yandex) {
                        request.favicon_design.yandex_browser.background_color = options.background;
                        request.favicon_design.yandex_browser.manifest.version = options.version;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'yandex_browser');
                    }

                    return callback(null, request);
                },
                request: function request(_request, callback) {
                    print('RFG:request', 'Posting a request to the RFG API');
                    client.post('http://realfavicongenerator.net/api/favicon', {
                        data: { favicon_generation: _request },
                        headers: { 'Content-Type': 'application/json' }
                    }, function (data, response) {
                        var result = data.favicon_generation_result;

                        return result && response.statusCode === HTTP_SUCCESS ? callback(null, {
                            files: result.favicon.files_urls,
                            html: result.favicon.html_code
                        }) : callback(result.result.error_message);
                    });
                },
                fetch: function fetch(address, callback) {
                    var name = path.basename(address),
                        image = contains(['.png', '.jpg', '.bmp', '.ico', '.svg'], path.extname(name));

                    print('RFG:fetch', 'Fetching ' + (image ? 'image' : 'file') + ' from RFG: ' + address);
                    client.get(address, function (buffer, response) {
                        var success = buffer && response.statusCode === HTTP_SUCCESS;

                        return success ? callback(null, {
                            file: image ? null : { name: name, contents: buffer },
                            image: image ? { name: name, contents: buffer } : null
                        }) : callback('Could not fetch URL: ' + address);
                    });
                }
            }

        };
    }

    module.exports = helpers;
})();
