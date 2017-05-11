/* eslint camelcase: 0, no-shadow: 0 */

const path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    color = require('tinycolor2'),
    cheerio = require('cheerio'),
    colors = require('colors'),
    jsonxml = require('jsontoxml'),
    sizeOf = require('image-size'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    Jimp = require('jimp'),
    svg2png = require('svg2png'),
    File = require('vinyl'),
    Reflect = require('harmony-reflect'),
    NRC = require('node-rest-client').Client,
    PLATFORM_OPTIONS = require('./config/platform-options.json'),
    ANDROID_BASE_SIZE = 36,
    IOS_BASE_SIZE = 57,
    IOS_STARTUP_BASE_SIZE = 320,
    COAST_BASE_SIZE = 228,
    FIREFOX_BASE_SIZE = 60;

(() => {

    'use strict';

    const xmlconfig = { prettyPrint: true, xmlHeader: true, indent: '  ' },
        client = new NRC(),
        HEX_MAX = 255,
        NON_EXISTANT = -1,
        ROTATE_DEGREES = 90,
        HTTP_SUCCESS = 200;

    client.setMaxListeners(0);

    function helpers (options) {

        function contains (array, element) {
            return array.indexOf(element.toLowerCase()) > NON_EXISTANT;
        }

        function relative (directory) {
            return path.join(options.path, directory).replace(/\\/g, '/');
        }

        function print (context, message) {
            let newMessage = '';

            if (options.logging && message) {
                _.each(message.split(' '), (item) => {
                    newMessage += ` ${ ((/^\d+x\d+$/gm).test(item) ? colors.magenta(item) : item) }`;
                });
                console.log(`${ colors.green('[Favicons]') } ${ context.yellow }:${ newMessage }...`);
            }
        }

        function readFile (filepath, callback) {
            fs.readFile(filepath, callback);
        }

        function updateDocument (document, code, tags, next) {
            const $ = cheerio.load(document, { decodeEntities: false }),
                target = $('head').length > 0 ? $('head') : $.root(),
                newCode = cheerio.load(code.join('\n'), { decodeEntities: false });

            async.each(tags, (platform, callback) => {
                async.forEachOf(platform, (tag, selector, cb) => {
                    if (options.replace) {
                        $(selector).remove();
                    } else if ($(selector).length) {
                        newCode(selector).remove();
                    }
                    return cb(null);
                }, callback);
            }, (error) => {
                target.append(newCode.html());
                return next(error, $.html().replace(/^\s*$[\n\r]{1,}/gm, ''));
            });
        }

        function preparePlatformOptions (platform, options, baseOptions) {
            if (typeof options !== 'object') {
                options = {};
            }

            _.each(options, (value, key) => {
                const platformOptionsRef = PLATFORM_OPTIONS[key];

                if (typeof platformOptionsRef === 'undefined' || platformOptionsRef.platforms.indexOf(platform) === -1) {
                    return Reflect.deleteProperty(options, key);
                }
            });

            _.each(PLATFORM_OPTIONS, ({ platforms, defaultTo }, key) => {
                if (typeof options[key] === 'undefined' && platforms.indexOf(platform) !== -1) {
                    options[key] = defaultTo;
                }
            });

            if (typeof options.background === 'boolean') {

                if (platform === 'android' && !options.background) {
                    options.background = 'transparent';
                } else {
                    options.background = baseOptions.background;
                }
            }

            if (platform === 'android' && options.background !== 'transparent') {
                options.disableTransparency = true;
            }

            return options;
        }

        return {

            General: {
                preparePlatformOptions,
                background: (hex) => {
                    print('General:background', `Parsing colour ${ hex }`);
                    const rgba = color(hex).toRgb();

                    return Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * HEX_MAX);
                },
                source: (source, callback) => {
                    let sourceset = [];

                    print('General:source', `Source type is ${ typeof source }`);
                    if (!source || !source.length) {
                        return callback('No source provided');
                    } else if (Buffer.isBuffer(source)) {
                        sourceset = [{ size: sizeOf(source), file: source }];
                        return callback(null, sourceset);
                    } else if (Array.isArray(source)) {
                        async.each(source, (file, cb) =>
                            readFile(file, (error, buffer) => {
                                if (error) {
                                    return cb(error);
                                }

                                sourceset.push({
                                    size: sizeOf(buffer),
                                    file: buffer
                                });
                                cb(null);
                            }),
                            (error) =>
                                callback(error || sourceset.length ? null : 'Favicons source is invalid', sourceset)
                        );
                    } else if (typeof source === 'string') {
                        readFile(source, (error, buffer) => {
                            if (error) {
                                return callback(error);
                            }

                            sourceset = [{ size: sizeOf(buffer), file: buffer }];
                            return callback(null, sourceset);
                        });
                    } else {
                        return callback('Invalid source type provided');
                    }
                },
                /* eslint no-underscore-dangle: 0 */
                vinyl: (object, input) => {
                    const output = new File({
                        path: object.name,
                        contents: Buffer.isBuffer(object.contents) ? object.contents : new Buffer(object.contents)
                    });

                    // gulp-cache support
                    if (typeof input._cachedKey !== 'undefined') {
                        output._cachedKey = input._cachedKey;
                    }

                    return output;
                }
            },

            HTML: {
                parse: (html, callback) => {
                    print('HTML:parse', 'HTML found, parsing and modifying source');
                    const $ = cheerio.load(html),
                        link = $('*').is('link'),
                        attribute = link ? 'href' : 'content',
                        value = $('*').first().attr(attribute);

                    if (path.extname(value)) {
                        $('*').first().attr(attribute, relative(value));
                    } else if (value.slice(0, 1) === '#') {
                        $('*').first().attr(attribute, options.background);
                    } else if (html.indexOf('application-name') !== NON_EXISTANT || html.indexOf('apple-mobile-web-app-title') !== NON_EXISTANT) {
                        $('*').first().attr(attribute, options.appName);
                    }
                    return callback(null, $.html());
                },
                update: (document, code, tags, callback) => {
                    const encoding = { encoding: 'utf8' };

                    async.waterfall([
                        (cb) =>
                            mkdirp(path.dirname(document), cb),
                        (made, cb) =>
                            fs.readFile(document, encoding, (error, data) => cb(null, error ? null : data)),
                        (data, cb) =>
                            (data ? updateDocument(data, code, tags, cb) : cb(null, code.join('\n'))),
                        (html, cb) =>
                            fs.writeFile(document, html, options, cb)
                    ], callback);
                }
            },

            Files: {
                create: (properties, name, platformOptions, callback) => {
                    print('Files:create', `Creating file: ${ name }`);
                    if (name === 'manifest.json') {
                        properties.name = options.appName;
                        properties.short_name = options.appName;
                        properties.description = options.appDescription;
                        properties.dir = options.dir;
                        properties.lang = options.lang;
                        properties.display = options.display;
                        properties.orientation = options.orientation;
                        properties.start_url = options.start_url;
                        properties.background_color = options.background;
                        properties.theme_color = options.theme_color;
                        _.map(properties.icons, (icon) => (icon.src = relative(icon.src)));
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'manifest.webapp') {
                        properties.version = options.version;
                        properties.name = options.appName;
                        properties.description = options.appDescription;
                        properties.developer.name = options.developerName;
                        properties.developer.url = options.developerURL;
                        properties.icons = _.mapObject(properties.icons, (property) => relative(property));
                        properties = JSON.stringify(properties, null, 2);
                    } else if (name === 'browserconfig.xml') {
                        _.map(properties[0].children[0].children[0].children, (property) => {
                            if (property.name === 'TileColor') {
                                property.text = platformOptions.background;
                            } else {
                                property.attrs.src = relative(property.attrs.src);
                            }
                        });
                        properties = jsonxml(properties, xmlconfig);
                    } else if (name === 'yandex-browser-manifest.json') {
                        properties.version = options.version;
                        properties.api_version = 1;
                        properties.layout.logo = relative(properties.layout.logo);
                        properties.layout.color = platformOptions.background;
                        properties = JSON.stringify(properties, null, 2);
                    } else if (/\.html$/.test(name)) {
                        properties = properties.join('\n');
                    }
                    return callback(null, { name, contents: properties });
                }
            },

            Images: {
                create: (properties, background, callback) => {
                    let jimp = null;

                    print('Image:create', `Creating empty ${ properties.width }x${ properties.height } canvas with ${ (properties.transparent ? 'transparent' : background) } background`);
                    jimp = new Jimp(properties.width, properties.height, properties.transparent ? 0x00000000 : background, (error, canvas) =>
                        callback(error, canvas, jimp));
                },
                read: (file, callback) => {
                    print('Image:read', `Reading file: ${ file.buffer }`);
                    return Jimp.read(file, callback);
                },
                nearest: (sourceset, properties, offset, callback) => {
                    print('Image:nearest', `Find nearest icon to ${ properties.width }x${ properties.height } with offset ${ offset }`);

                    const offsetSize = offset * 2,
                        width = properties.width - offsetSize,
                        height = properties.height - offsetSize,
                        sideSize = Math.max(width, height),
                        svgSource = _.find(sourceset, (source) => source.size.type === 'svg');

                    let nearestIcon = sourceset[0],
                        nearestSideSize = Math.max(nearestIcon.size.width, nearestIcon.size.height);

                    if (svgSource) {
                            print('Image:nearest', `SVG source will be saved as ${ width }x${ height }`);
                            svg2png(svgSource.file, { height, width })
                                .then((resizedBuffer) => callback(null, {
                                    size: sizeOf(resizedBuffer),
                                    file: resizedBuffer
                                }))
                                .catch(callback);
                    } else {
                        _.each(sourceset, (icon) => {
                            const max = Math.max(icon.size.width, icon.size.height);

                            if ((nearestSideSize > max || nearestSideSize < sideSize) && max >= sideSize) {
                                nearestIcon = icon;
                                nearestSideSize = max;
                            }
                        });

                        return callback(null, nearestIcon);
                    }
                },
                resize: (image, properties, offset, callback) => {
                    print('Images:resize', `Resizing image to contain in ${ properties.width }x${ properties.height } with offset ${ offset }`);
                    const offsetSize = offset * 2;

                    if (properties.rotate) {
                        print('Images:resize', `Rotating image by ${ROTATE_DEGREES}`);
                        image.rotate(ROTATE_DEGREES, false);
                    }

                    image.contain(properties.width - offsetSize, properties.height - offsetSize, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
                    return callback(null, image);
                },
                composite: (canvas, image, properties, offset, maximum, callback) => {
                    const circle = path.join(__dirname, 'mask.png'),
                        overlay = path.join(__dirname, 'overlay.png');

                    function compositeIcon () {
                        print('Images:composite', `Compositing favicon on ${ properties.width }x${ properties.height } canvas with offset ${ offset }`);
                        canvas.composite(image, offset, offset);
                    }

                    if (properties.mask) {
                        print('Images:composite', 'Masking composite image on circle');
                        async.parallel([
                            (cb) => Jimp.read(circle, cb),
                            (cb) => Jimp.read(overlay, cb)
                        ], (error, images) => {
                            images[0].resize(maximum, Jimp.AUTO);
                            images[1].resize(maximum, Jimp.AUTO);
                            canvas.mask(images[0], 0, 0);
                            canvas.composite(images[1], 0, 0);
                            compositeIcon();
                            return callback(error, canvas);
                        });
                    } else {
                        compositeIcon();
                        return callback(null, canvas);
                    }
                },
                getBuffer: (canvas, callback) => {
                    print('Images:getBuffer', 'Collecting image buffer from canvas');
                    canvas.getBuffer(Jimp.MIME_PNG, callback);
                }
            },

            RFG: {
                configure: (sourceset, request, callback) => {
                    print('RFG:configure', 'Configuring RFG API request');
                    const svgSource = _.find(sourceset, (source) => source.size.type === 'svg');

                    options.background = `#${ color(options.background).toHex() }`;
                    request.master_picture.content = (svgSource || _.max(sourceset, ({ size: { width, height } }) => Math.max(width, height))).file.toString('base64');
                    request.files_location.path = options.path;

                    if (options.icons.android) {
                        const androidOptions = preparePlatformOptions('android', options.icons.android, options);

                        request.favicon_design.android_chrome.theme_color = options.background;
                        request.favicon_design.android_chrome.manifest.name = options.appName;
                        request.favicon_design.android_chrome.manifest.display = options.display;
                        request.favicon_design.android_chrome.manifest.orientation = options.orientation;

                        if (androidOptions.shadow) {
                            request.favicon_design.android_chrome.picture_aspect = 'shadow';
                        } else if (androidOptions.offset > 0 && androidOptions.background) {
                            request.favicon_design.android_chrome.picture_aspect = 'background_and_margin';
                            request.favicon_design.android_chrome.background_color = androidOptions.background;
                            request.favicon_design.android_chrome.margin = Math.round(ANDROID_BASE_SIZE / 100 * androidOptions.offset);
                        }

                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'android_chrome');
                    }

                    if (options.icons.appleIcon) {
                        const appleIconOptions = preparePlatformOptions('appleIcon', options.icons.appleIcon, options);

                        request.favicon_design.ios.background_color = appleIconOptions.background;
                        request.favicon_design.ios.margin = Math.round(IOS_BASE_SIZE / 100 * appleIconOptions.offset);
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'ios');
                    }

                    if (options.icons.appleIcon && options.icons.appleStartup) {
                        const appleStartupOptions = preparePlatformOptions('appleStartup', options.icons.appleStartup, options);

                        request.favicon_design.ios.startup_image.background_color = appleStartupOptions.background;
                        request.favicon_design.ios.startup_image.margin = Math.round(IOS_STARTUP_BASE_SIZE / 100 * appleStartupOptions.offset);
                    } else if (request.favicon_design.ios) {
                        Reflect.deleteProperty(request.favicon_design.ios, 'startup_image');
                    }

                    if (options.icons.coast) {
                        const coastOptions = preparePlatformOptions('coast', options.icons.coast, options);

                        request.favicon_design.coast.background_color = coastOptions.background;
                        request.favicon_design.coast.margin = Math.round(COAST_BASE_SIZE / 100 * coastOptions.offset);
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'coast');
                    }

                    if (!options.icons.favicons) {
                        Reflect.deleteProperty(request.favicon_design, 'desktop_browser');
                    }

                    if (options.icons.firefox) {
                        const firefoxOptions = preparePlatformOptions('firefox', options.icons.firefox, options);

                        request.favicon_design.firefox_app.background_color = firefoxOptions.background;
                        request.favicon_design.firefox_app.margin = Math.round(FIREFOX_BASE_SIZE / 100 * firefoxOptions.offset);
                        request.favicon_design.firefox_app.manifest.app_name = options.appName;
                        request.favicon_design.firefox_app.manifest.app_description = options.appDescription;
                        request.favicon_design.firefox_app.manifest.developer_name = options.developerName;
                        request.favicon_design.firefox_app.manifest.developer_url = options.developerURL;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'firefox_app');
                    }

                    if (options.icons.windows) {
                        const windowsOptions = preparePlatformOptions('windows', options.icons.windows, options);

                        request.favicon_design.windows.background_color = windowsOptions.background;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'windows');
                    }

                    if (options.icons.yandex) {
                        const yandexOptions = preparePlatformOptions('yandex', options.icons.yandex, options);

                        request.favicon_design.yandex_browser.background_color = yandexOptions.background;
                        request.favicon_design.yandex_browser.manifest.version = options.version;
                    } else {
                        Reflect.deleteProperty(request.favicon_design, 'yandex_browser');
                    }

                    return callback(null, request);
                },
                request: (request, callback) => {
                    print('RFG:request', 'Posting a request to the RFG API');
                    client.post('http://realfavicongenerator.net/api/favicon', {
                        data: { favicon_generation: request },
                        headers: { 'Content-Type': 'application/json' }
                    }, (data, response) => {
                        const result = data.favicon_generation_result;

                        return result && response.statusCode === HTTP_SUCCESS ? callback(null, {
                            files: result.favicon.files_urls,
                            html: result.favicon.html_code
                        }) : callback(result.result.error_message);
                    });
                },
                fetch: (address, callback) => {
                    const name = path.basename(address),
                        image = contains(['.png', '.jpg', '.bmp', '.ico', '.svg'], path.extname(name));

                    print('RFG:fetch', `Fetching ${ image ? 'image' : 'file' } from RFG: ${ address }`);
                    client.get(address, (buffer, response) => {
                        const success = buffer && response.statusCode === HTTP_SUCCESS;

                        return success ? callback(null, {
                            file: image ? null : { name, contents: buffer },
                            image: image ? { name, contents: buffer } : null
                        }) : callback(`Could not fetch URL: ${ address }`);
                    });
                }
            }

        };

    }

    module.exports = helpers;

})();
