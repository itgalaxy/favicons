/*jslint devel:true, stupid:true*/
/*global module, require*/

(function () {

    'use strict';

    var path = require('path'),
        fs = require('fs'),
        execSync = require("execSync"),
        mkdirp = require('mkdirp'),
        defaults = require('lodash.defaults'),
        cheerio = require("cheerio");

    module.exports = function (params) {

        // Default options
        var options = defaults(params || {}, {
            source: 'logo.png',
            dest: 'images',
            trueColor: false,
            html: 'index.html',
            background: '#c00', // "color" or "none"
            windowsTile: true,
            coast: false,
            tileBlackWhite: true,
            firefox: false,
            apple: true,
            favicons: true,
            firefoxManifest: '',
            androidHomescreen: false,
            logging: true
        }),
            $,
            html,
            files = [],
            ext = path.extname(options.source),
            basename = path.basename(options.source, ext),
            dirname = path.dirname(options.source),
            additionalOpts,
            updateFirefoxManifest,
            contentsFirefox,
            contentFirefox,
            elements,
            output,
            appleSizes = [57, 60, 72, 76, 144, 120, 144, 152],
            faviconSizes = [16, 32, 48],
            windowsSizes = [70, 144, 150, 310];

        function print(message) {
            console.log(message);
        }

        // Determine whether HTML is to be produced
        function writeHTML() {
            return options.html !== undefined && options.html !== '';
        }

        // Execute external command
        function execute(cmd) {
            return execSync.exec(cmd);
        }

        // Convert image with Imagemagick
        function convert(args, message) {
            args.unshift('convert');
            var ret = execute(args.join(' '));
            if (ret.code === 127) {
                return print('You need to have ImageMagick installed in your PATH for this task to work.');
            }
            if (options.logging && message) {
                print(message);
            }
        }

        // Combine arguments into command
        function combine(src, dest, size, fname, additionalOpts) {
            var out = [src, "-resize", size].concat(additionalOpts);
            out.push(path.join(dest, fname));
            return out;
        }

        function removeTags() {
            $ = cheerio.load(fs.readFileSync(options.html));
            $('link[rel="shortcut icon"]').remove();
            $('link[rel="icon"]').remove();
            $('link[rel="apple-touch-icon"]').remove();
            $('meta').each(function () {
                var name = $(this).attr('name');
                if (name && (name === 'msapplication-TileImage' || name === 'msapplication-TileColor' || name.indexOf('msapplication-square') >= 0)) {
                    $(this).remove();
                }
            });
            html = $.html().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
            if (html === '') {
                $ = cheerio.load('');
            }
        }

        function makeFavicons() {
            faviconSizes.forEach(function (size) {
                var type = size + 'x' + size,
                    p = path.join(dirname, basename + "." + type + ext),
                    saveTo = path.join(options.dest, type + '.png'),
                    src = options.source;
                if (fs.existsSync(p)) {
                    src = p;
                }
                convert([src, '-resize', type, saveTo]);
                files.push(saveTo);
            });

            convert(files.concat([
                '-alpha on',
                '-background none',
                options.trueColor ? '' : '-bordercolor white -border 0 -colors 64',
                path.join(options.dest, 'favicon.ico')
            ]), 'Created favicon.ico');

            convert([options.source, '-resize', "64x64", path.join(options.dest, 'favicon.png')], 'Created favicon.png');
        }

        function makeIOS() {
            appleSizes.forEach(function (size) {
                var type = size + 'x' + size,
                    rule = (size === 57 ? '' : '-' + type);
                convert(combine(options.source, options.dest, type, 'apple-touch-icon' + rule + '.png', additionalOpts), 'Created apple-touch-icon' + rule + '.png');
            });
        }

        if (!fs.existsSync(options.dest) || !fs.lstatSync(options.dest).isDirectory()) {
            mkdirp(options.dest);
        }

        additionalOpts = options.background !== "none" ? [ "-background", '"' + options.background + '"', "-flatten"] : [];

        if (options.favicons) {
            makeFavicons();
        }

        ////// PNG's for iOS and Android icons

        // iOS
        if (options.apple) {
            makeIOS();
        }

        // Coast
        if (options.coast) {
            convert(combine(options.source, options.dest, "228x228", "coast-icon-228x228.png", additionalOpts), 'Created coast-icon-228x228.png');
        }

        // Android
        if (options.androidHomescreen) {
            convert(combine(options.source, options.dest, "196x196", "homescreen-196x196.png", additionalOpts), 'Created homescreen-196x196.png');
        }

        // Firefox
        if (options.firefox) {
            updateFirefoxManifest = (options.firefoxManifest !== undefined && options.firefoxManifest !== '');

            if (updateFirefoxManifest) {
                contentsFirefox = (fs.existsSync(options.firefoxManifest)) ? fs.read(options.firefoxManifest) : '{}';
                contentFirefox = JSON.parse(contentsFirefox);
                contentFirefox.icons = {};
            }

            [16, 30, 32, 48, 60, 64, 90, 120, 128, 256].forEach(function (size) {
                var dimensions = size + 'x' + size,
                    fifname = "firefox-icon-" + dimensions + ".png";
                console.log(fifname + '... ');
                convert(combine(options.source, options.dest, dimensions, fifname, []));

                if (updateFirefoxManifest) {
                    contentFirefox.icons[size] = fifname;
                }

            });

            if (updateFirefoxManifest) {
                console.log('Updating Firefox manifest... ');
                fs.writeFileSync(options.firefoxManifest, JSON.stringify(contentFirefox, null, 2));
            }


        }

        ////// Windows 8 Tile

        if (options.windowsTile) {

            // MS Tiles

            if (options.tileBlackWhite) {
                additionalOpts = [
                    "-fuzz 100%",
                    "-fill black",
                    "-opaque red",
                    "-fuzz 100%",
                    "-fill black",
                    "-opaque blue",
                    "-fuzz 100%",
                    "-fill white",
                    "-opaque green"
                ];
            } else {
                additionalOpts = [];
            }

            // Setting background color in image
            if (!writeHTML()) {
                if (options.background !== "none") {
                    additionalOpts = additionalOpts.concat([
                        "-background",
                        '"' + options.background + '"',
                        "-flatten"
                    ]);
                }
            }

            // Create Windows 8 icons
            windowsSizes.forEach(function (size) {
                var type = size + 'x' + size;
                convert(combine(options.source, options.dest, type, 'windows-tile-' + type + '.png', additionalOpts), 'Created windows-tile-' + type + '.png');
            });

        }

        // Append icons to <HEAD>
        if (writeHTML()) {
            removeTags();
            if (options.logging) {
                console.log('Updating HTML... ');
            }
            elements = '';

            if (options.windowsTile) {
                elements += '\t<meta name="msapplication-square70x70logo" content="windows-tile-70x70.png" />\n';
                elements += '\t<meta name="msapplication-square150x150logo" content="windows-tile-150x150.png" />\n';
                elements += '\t<meta name="msapplication-square310x310logo" content="windows-tile-310x310.png" />\n';
                elements += '\t<meta name="msapplication-TileImage" content="windows-tile-144x144.png" />\n';

                if (options.background !== "none") {
                    elements += '\t<meta name="msapplication-TileColor" content="' + options.background + '" />\n';
                }
            }

            // iOS
            if (options.apple) {
                appleSizes.forEach(function (size) {
                    var type = size + 'x' + size;
                    elements += '\t<link rel="apple-touch-icon" sizes="' + type + '" href="apple-touch-icon' + (size === 57 ? '' : '-' + type) + '.png" />\n';
                });
            }

            // Coast browser
            if (options.coast) {
                elements += '\t<link rel="icon" sizes="228x228" href="coast-icon-228x228.png" />\n';
            }

            // Android Homescreen app
            if (options.androidHomescreen) {
                elements += '\t<meta name="mobile-web-app-capable" value="yes" />\n';
                elements += '\t<link rel="icon" sizes="196x196" href="homescreen-196x196.png" />\n';
            }

            // Default
            if (options.favicons) {
                elements += '\t<link rel="shortcut icon" href="favicon.ico" />\n';
                elements += '\t<link rel="icon" type="image/png" sizes="64x64" href="favicon.png" />\n';
            }

            // Windows 8 tile. In HTML version background color will be as meta-tag

            if ($('head').length > 0) {
                $("head").append(elements);
            } else {
                $.root().append(elements);
            }

            output = $.html();

            // Hack for php tags
            if (path.extname(options.html) === ".php") {
                output = output.replace(/&lt;\?/gi, '<?').replace(/\?&gt;/gi, '?>');
            }

            // Saving HTML
            fs.writeFileSync(options.html, output);

        }

        // Cleanup
        if (options.favicons) {
            faviconSizes.forEach(function (size) {
                fs.unlink(path.join(options.dest, size + 'x' + size + '.png'));
            });
        }

    };

}());
