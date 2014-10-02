/*jslint devel:true*/
/*global module, require*/

(function () {

    'use strict';

    var path = require('path'),
        fs = require('fs'),
        exec = require('child_process').exec,
        async = require('async'),
        cheerio = require('cheerio'),
        defaults = require('lodash.defaults'),
        mkdirp = require('mkdirp');

    module.exports = function (params) {

        // Default options
        var options = defaults(params || {}, {

            // I/O
            source: null,
            dest: 'images',

            // Icon Types
            android: true,
            apple: true,
            coast: true,
            favicons: true,
            firefox: true,
            opengraph: true,
            windows: true,

            // Miscellaneous
            html: null,
            background: '#1d1d1d',
            tileBlackWhite: false,
            manifest: null,
            trueColor: false,
            logging: false,
            callback: null

        }),

            elements = [],
            opts = ['-background', '"' + options.background + '"', '-flatten'];

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

        // Execute external command
        function execute(cmd, callback) {
            exec(cmd, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Convert image with Imagemagick
        function convert(args, name, callback) {
            args.unshift('convert');
            execute(args.join(' '), function () {
                print('Created ' + name);
                return callback();
            });
        }

        // Combine arguments into command
        function combine(src, dest, size, fname, opts) {
            var out = [src, '-resize', size].concat(opts);
            out.push(path.join(dest, fname));
            return out;
        }

        // Clean unused files
        function clean(callback) {
            async.each([16, 32, 48], function (size, callback) {
                var file = path.join(options.dest, size + 'x' + size + '.png');
                fs.exists(file, function (exists) {
                    if (exists) {
                        fs.unlink(file, function (error) {
                            if (error) {
                                throw error;
                            }
                            return callback();
                        });
                    }
                });
            }, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Delete and rewrite HTML tags
        function writeTags(callback) {
            var $, html = '';
            if (options.html) {
                fs.readFile(options.html, function (error, data) {
                    if (!error) {
                        $ = cheerio.load(data, { decodeEntities: false });
                        $('link[rel="shortcut icon"]', 'link[rel="icon"]', 'link[rel="apple-touch-icon"]').remove();
                        $('meta').each(function () {
                            var name = $(this).attr('name');
                            if (name && (name === 'msapplication-TileImage' || name === 'msapplication-TileColor' || name.indexOf('msapplication-square') >= 0 || name === 'mobile-web-app-capable')) {
                                $(this).remove();
                            }
                        });
                        html = $.html().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
                        if (html === '') {
                            $ = cheerio.load('');
                        }
                        if ($('head').length > 0) {
                            $('head').append(elements.join('\n'));
                            return callback($.html());
                        }
                    }
                    return callback(elements.join('\n'));
                });
            } else {
                return callback(elements.join('\n'));
            }
        }

        // Make PNG favicons
        function makeNewFavicons(callback) {
            async.each([16, 32, 96, 160, 196], function (size, callback) {
                var dimensions = size + 'x' + size,
                    name = 'favicon-' + dimensions + '.png',
                    command = combine(options.source, options.dest, dimensions, name, opts);
                convert(command, name, function () {
                    elements.push('<link rel="icon" type="image/png" sizes="' + dimensions + '" href="' + name + '" />');
                    return callback();
                });
            }, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Make regular favicon files
        function makeFavicons(callback) {
            var files = [];
            async.each([16, 32, 48], function (size, callback) {
                var dimensions = size + 'x' + size,
                    name = dimensions + '.png',
                    command = combine(options.source, options.dest, dimensions, name, opts);
                convert(command, name, function () {
                    files.push(path.join(options.dest, name));
                    return callback();
                });
            }, function (error) {
                if (error) {
                    throw error;
                }
                convert(files.concat([
                    '-background none',
                    options.trueColor ? '' : '-bordercolor white -border 0 -colors 64',
                    path.join(options.dest, 'favicon.ico')
                ]), 'favicon.ico', function () {
                    elements.push('<link rel="shortcut icon" href="favicon.ico" />');
                    clean(function (error) {
                        if (error) {
                            throw error;
                        }
                        return callback();
                    });
                });
            });
        }

        // Make Apple touch icons
        function makeApple(callback) {
            async.each([57, 60, 72, 76, 144, 120, 144, 152, 180], function (size, callback) {
                var dimensions = size + 'x' + size,
                    rule = (size === 57 ? '' : '-' + dimensions),
                    name = 'apple-touch-icon' + rule + '.png',
                    command = combine(options.source, options.dest, dimensions, name, opts);
                convert(command, name, function () {
                    elements.push('<link rel="apple-touch-icon" sizes="' + dimensions + '" href="' + name + '" />');
                    return callback();
                });
            }, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Make Coast icon
        function makeCoast(callback) {
            var dimensions = '228x228',
                name = 'coast-icon-' + dimensions + '.png',
                command = combine(options.source, options.dest, dimensions, name, opts);
            convert(command, name, function () {
                elements.push('<link rel="icon" sizes="' + dimensions + '" href="' + name + '" />');
                return callback();
            });
        }

        // Make Android homescreen icon
        function makeAndroid(callback) {
            var dimensions = '192x192',
                name = 'homescreen-' + dimensions + '.png',
                command = combine(options.source, options.dest, dimensions, name, opts);
            convert(command, name, function () {
                elements.push('<meta name="mobile-web-app-capable" content="yes" />', '<link rel="icon" sizes="' + dimensions + '" href="' + name + '" />');
                return callback();
            });
        }

        // Make Firefox icons
        function makeFirefox(callback) {
            var updateManifest = (options.manifest && options.manifest !== ''),
                contentsFirefox,
                contentFirefox;
            if (updateManifest) {
                fs.readFile(options.manifest, function (error, data) {
                    if (error || data.length === 0) {
                        contentsFirefox = '{}';
                    } else {
                        contentsFirefox = data;
                    }
                    contentFirefox = JSON.parse(contentsFirefox);
                    contentFirefox.icons = {};
                });
            }
            async.each([16, 30, 32, 48, 60, 64, 90, 120, 128, 256], function (size, callback) {
                var dimensions = size + 'x' + size,
                    name = 'firefox-icon-' + dimensions + '.png',
                    command = combine(options.source, options.dest, dimensions, name, opts);
                convert(command, name, function () {
                    if (updateManifest) {
                        contentFirefox.icons[size] = name;
                    }
                    return callback();
                });
            }, function (error) {
                if (updateManifest) {
                    print('Updating Firefox manifest... ');
                    fs.writeFile(options.manifest, JSON.stringify(contentFirefox, null, 2), function () {
                        if (error) {
                            throw error;
                        }
                        return callback();
                    });
                } else {
                    if (error) {
                        throw error;
                    }
                    return callback();
                }
            });
        }

        // Make OpenGraph icon
        function makeOpenGraph(callback) {
            var dimensions = '1500x1500',
                name = 'opengraph.png',
                command = combine(options.source, options.dest, dimensions, name, opts);
            convert(command, name, function () {
                return callback();
            });
        }

        // Make Windows 8 tile icons
        function makeWindows(callback) {
            if (writeHTML()) {
                opts = [];
                elements.push('<meta name="msapplication-TileColor" content="' + options.background + '" />');
            }
            if (options.tileBlackWhite) {
                opts.push('-fuzz 100%', '-fill black', '-opaque red', '-fuzz 100%', '-fill black', '-opaque blue', '-fuzz 100%', '-fill white', '-opaque green');
            }
            async.each([70, 144, 150, 310], function (size, callback) {
                var dimensions = size + 'x' + size,
                    name = 'windows-tile-' + dimensions + '.png',
                    command = combine(options.source, options.dest, dimensions, name, opts);
                convert(command, name, function () {
                    elements.push('<meta name="msapplication-' + (size === 144 ? 'TileImage' : 'square' + dimensions + 'logo') + '" content="' + name + '" />');
                    return callback();
                });
            }, function (error) {
                if (error) {
                    throw error;
                }
                return callback();
            });
        }

        // Create the appropriate icons
        function makeIcons(callback) {
            async.parallel([
                function (callback) {
                    if (options.favicons) {
                        makeFavicons(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.favicons) {
                        makeNewFavicons(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.apple) {
                        makeApple(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.coast) {
                        makeCoast(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.android) {
                        makeAndroid(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.firefox) {
                        makeFirefox(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.opengraph) {
                        makeOpenGraph(function () {
                            callback(null);
                        });
                    }
                },
                function (callback) {
                    if (options.windows) {
                        makeWindows(function () {
                            callback(null);
                        });
                    }
                }
            ], function () {
                return callback();
            });
        }

        // Initialise
        function init() {
            if (!options.source) {
                return console.log('A source image is required');
            }
            mkdirp(options.dest, function () {
                makeIcons(function () {
                    writeTags(function (data) {
                        if (writeHTML()) {
                            fs.writeFile(options.html, data, function () {
                                if (options.callback) {
                                    return options.callback('Generated favicons');
                                }
                            });
                        } else if (options.callback) {
                            return options.callback('Generated favicons', data);
                        }
                    });
                });
            });
        }

        init();

    };

}());
