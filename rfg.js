(function () {

    'use strict';

    const Client = require('node-rest-client').Client,
        http = require('http'),
        fs = require('fs'),
        unzip = require('unzip'),
        metaparser = require('metaparser'),
        fstream = require('fstream'),
        mkdirp = require('mkdirp');

    function fileToBase64 (file, callback) {
        fs.readFile(file, { encoding: null }, function(error, file) {
            if (error) {
                callback(error);
            } else {
                callback(undefined, file.toString('base64'));
            }
        });
    };

    function fileToBase64Sync (file) {
        return fs.readFileSync(file, {
            encoding: null
        }).toString('base64');
    };

    module.exports.init = function() {

        var exports = {};

        exports.generateFavicon = function(request, dest, callback) {
            var client = new Client();
            var args = {
                data: {
                    "favicon_generation": request
                },
                headers: {
                    "Content-Type": "application/json"
                }
            };

            client.post("http://realfavicongenerator.net/api/favicon", args, function(data, response) {

                console.log(data, response, 'response from RFG');

                if (response.statusCode !== 200) {
                    var err = (
                        data &&
                        data.favicon_generation_result &&
                        data.favicon_generation_result.result &&
                        data.favicon_generation_result.result.error_message) ? data.favicon_generation_result.result.error_message : data;
                    callback(err, args);
                }

                /*var parserStream = unzip.Parse();
                var request = http.get(data.favicon_generation_result.favicon.package_url, function(response) {
                    response.pipe(parserStream).pipe(writeStream);
                });*/
            });
        };

        exports.injectFaviconMarkups = function(fileContent, htmlCode, opts, callback) {
            var defaultRemove = [
                'link[rel="shortcut icon"]',
                'link[rel="icon"]',
                'link[rel^="apple-touch-icon"]',
                'link[rel="manifest"]',
                'link[rel="yandex-tableau-widget"]',
                'meta[name^="msapplication"]',
                'meta[name="mobile-web-app-capable"]',
                'meta[name="theme-color"]',
                'meta[property="og:image"]'
            ];
            var add = typeof html_code === 'string' ? [htmlCode] : htmlCode;
            var remove = defaultRemove;

            if (opts) {
                if (opts.add) {
                    add = add.concat(typeof opts.add === 'string' ? [opts.add] : opts.add);
                }
                if (opts.remove) {
                    remove = remove.concat(typeof opts.remove === 'string' ? [opts.remove] : opts.remove);
                }
            }

            metaparser({
                data: fileContent,
                add: add,
                remove: remove,
                callback: function(error, html) {
                    return callback(error, html);
                }
            });
        };

        exports.camelCaseToUnderscore = function(s) {
            return s.replace(/(?:^|\.?)([A-Z])/g, function(x, y) {
                return "_" + y.toLowerCase()
            }).replace(/^_/, "");
        }

        exports.camelCaseToUnderscoreRequest = function(request) {
            if (request === undefined) {
                return undefined;
            }
            if (request.constructor === Array) {
                for (var i = 0; i < request.length; i++) {
                    request[i] = exports.camelCaseToUnderscoreRequest(request[i]);
                }
            } else if (request.constructor === String) {
                return exports.camelCaseToUnderscore(request);
            } else if (request.constructor === Object) {
                var keys = Object.keys(request);
                for (var j = 0; j < keys.length; j++) {
                    var key = keys[j];
                    var uKey = exports.camelCaseToUnderscore(keys[j]);

                    // Special case for some keys: content should be passed as is
                    var keysToIgnore = [
                        'scaling_algorithm',
                        'name',
                        'content',
                        'param_name',
                        'param_value',
                        'description',
                        'app_description',
                        'developer_name',
                        'app_name'
                    ];
                    var newContent = (keysToIgnore.indexOf(uKey) >= 0) ? request[key] : exports.camelCaseToUnderscoreRequest(request[key]);

                    if (key !== uKey) {
                        request[uKey] = newContent;
                        delete request[key];
                    } else {
                        request[key] = newContent;
                    }
                }
            }

            return request;
        }

        function startsWith(str, prefix) {
            return str.lastIndexOf(prefix, 0) === 0;
        }

        exports.isUrl = function(urlOrPath) {
            return startsWith(urlOrPath, 'http://') ||
                startsWith(urlOrPath, 'https://') ||
                startsWith(urlOrPath, '//');
        }

        exports.normalizeMasterPicture = function(masterPicture) {
            if ((masterPicture.type === 'inline') || (masterPicture.content !== undefined)) {
                masterPicture.type = 'inline';
                masterPicture.content = exports.fileToBase64Sync(masterPicture.content);
            }
            return masterPicture;
        }

        exports.normalizeAllMasterPictures = function(request) {
            if (request.constructor === Array) {
                for (var i = 0; i < request.length; i++) {
                    request[i] = exports.normalizeAllMasterPictures(request[i]);
                }
                return request;
            } else if (request.constructor === Object) {
                var keys = Object.keys(request);
                for (var j = 0; j < keys.length; j++) {
                    if (keys[j] === 'master_picture') {
                        request[keys[j]] = exports.normalizeMasterPicture(request[keys[j]]);
                    } else {
                        request[keys[j]] = exports.normalizeAllMasterPictures(request[keys[j]]);
                    }
                }
                return request;
            } else {
                return request;
            }
        }

        // opts should contain:
        // - apiKey
        // - masterPicture (can be a URL or a path to a local file)
        // - iconsPath (or undefined if the files are in the root)
        // - design
        // - settings
        // - versioning
        exports.createRequest = function(opts) {
            // Build favicon generation request
            var request = {};
            request.api_key = opts.apiKey;
            // Master picture
            request.master_picture = {};
            if (exports.isUrl(opts.masterPicture)) {
                request.master_picture.type = 'url';
                request.master_picture.url = opts.masterPicture;
            } else {
                request.master_picture.type = 'inline';
                request.master_picture.content = exports.fileToBase64Sync(opts.masterPicture);
            }
            // Path
            request.files_location = {};
            if (opts.iconsPath === undefined) {
                request.files_location.type = 'root';
            } else {
                request.files_location.type = 'path';
                request.files_location.path = opts.iconsPath;
            }
            // Design
            request.favicon_design = exports.normalizeAllMasterPictures(
                exports.camelCaseToUnderscoreRequest(opts.design));

            // Settings
            if (opts.settings) {
                request.settings = exports.camelCaseToUnderscoreRequest(opts.settings);
            }

            // Versioning
            if (opts.versioning) {
                request.versioning = exports.camelCaseToUnderscoreRequest(opts.versioning);
            }

            return request;
        };

        return exports;
    };
})();
