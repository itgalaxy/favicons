/*jslint devel:true*/
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
            HTMLPrefix: "",
            appleTouchBackgroundColor: "auto", // none, auto, #color
            windowsTile: true,
            coast: false,
            tileBlackWhite: true,
            tileColor: "auto", // none, auto, #color
            firefox: false,
            apple: true,
            favicons: true,
            firefoxManifest: "",
            androidHomescreen: false
        }),
            needHTML = options.html !== undefined && options.html !== "",
            contents,
            $,
            html,
            source,
            files,
            ext,
            basename,
            dirname,
            additionalOpts,
            updateFirefoxManifest,
            contentsFirefox,
            contentFirefox,
            elements,
            output;

        // Execute external command
        function execute(cmd) {
            return execSync.exec(cmd);
        }

        // Convert image with imagemagick
        function convert(args) {
            args.unshift("convert");
            var ret = execute(args.join(" "));
            if (ret.code === 127) {
                return console.log('You need to have ImageMagick installed in your PATH for this task to work.');
            }
        }

        // Generate background color for apple touch icons
        function generateColor(src) {
            var ret = execute("convert " + src + " -polaroid 180 -resize 1x1 -colors 1 -alpha off -unique-colors txt:- | grep -v ImageMagick | sed -n 's/.*\\(#[0-9A-F]*\\).*/\\1/p'");
            return ret.stdout.trim();
        }

        // Generate background color for windows 8 tile
        function generateTileColor(src) {
            var ret = execute("convert " + src + " +dither -colors 1 -alpha off -unique-colors txt:- | grep -v ImageMagick | sed -n 's/.*\\(#[0-9A-F]*\\).*/\\1/p'");
            return ret.stdout.trim();
        }

        function combine(src, dest, size, fname, additionalOpts, padding) {
            var out = [src, "-resize", size].concat(additionalOpts),
                thumb;

            // icon padding
            if (typeof padding === 'number' && padding >= 0 && padding < 100) {
                thumb = Math.round((100 - padding) * parseInt(size.split("x")[0], 10) / 100);
                out = out.concat([
                    "-gravity",
                    "center",
                    "-thumbnail",
                    "\"" + thumb + "x" + thumb + ">" + "\"",
                    "-extent",
                    size
                ]);
            }
            out.push(path.join(dest, fname));
            return out;
        }

        // Append all icons to HTML as meta tags (needs cheerio)
        if (needHTML) {
            contents = (fs.existsSync(options.html)) ? fs.read(options.html) : "";
            $ = cheerio.load(contents);
            // Removing exists favicon from HTML
            $('link[rel="shortcut icon"]').remove();
            $('link[rel="icon"]').remove();
            $('link[rel="apple-touch-icon"]').remove();
            $('meta').each(function () {
                var name = $(this).attr('name');
                if (name && (name === 'msapplication-TileImage' ||
                            name === 'msapplication-TileColor' ||
                            name.indexOf('msapplication-square') >= 0)) {
                    $(this).remove();
                }
            });
            html = $.html().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
            if (html === '') {
                $ = cheerio.load('');
            }
        }

        if (options.length === 0) {
            return console.log('Source file not found.');
        }

        if (!fs.existsSync(options.dest) || !fs.lstatSync(options.dest).isDirectory()) {
            mkdirp(options.dest);
            console.log('Created output folder at "', options.dest, '"');
        }

        source = options.source;

        // Create resized version of source image
        // 16x16: desktop browsers, address bar, tabs
        // 32x32: safari reading list, non-retina iPhone, windows 7+ taskbar
        // 48x48: windows desktop

        files = [];
        ext = path.extname(source);
        basename = path.basename(source, ext);
        dirname = path.dirname(source);
        additionalOpts = options.appleTouchBackgroundColor !== "none" ? [ "-background", '"' + options.appleTouchBackgroundColor + '"', "-flatten"] : [];
        console.log('Resizing images for "' + source + '"... ');

        if (options.favicons) {

            // regular png
            ['16x16', '32x32', '48x48'].forEach(function (size) {
                var p = path.join(dirname, basename + "." + size + ext),
                    saveTo = path.join(options.dest, size + '.png'),
                    src = source;
                if (fs.existsSync(p)) {
                    src = p;
                }
                convert([src, '-resize', size, saveTo]);
                files.push(saveTo);
            });


            // favicon.ico
            console.log('favicon.ico... ');
            convert(files.concat([
                "-alpha on",
                "-background none",
                options.trueColor ? "" : "-bordercolor white -border 0 -colors 64",
                path.join(options.dest, 'favicon.ico')
            ]));


            // 64x64 favicon.png higher priority than .ico
            console.log('favicon.png... ');
            convert([source, '-resize', "64x64", path.join(options.dest, 'favicon.png')]);

        }

        ////// PNG's for iOS and Android icons

        if (options.apple) {
            // Convert options for transparent and flatten
            if (options.appleTouchBackgroundColor === "auto") {
                options.appleTouchBackgroundColor = generateColor(source);
            }

            // 57x57: iPhone non-retina, Android 2.1+
            console.log('apple-touch-icon.png... ');
            convert(combine(source, options.dest, "57x57", "apple-touch-icon.png", additionalOpts));

            // 60x60: iPhone iOS 7 without size
            console.log('apple-touch-icon-60x60.png... ');
            convert(combine(source, options.dest, "60x60", "apple-touch-icon-60x60.png", additionalOpts));


            // 72x72: iPad non-retina, iOS 6 and lower
            console.log('apple-touch-icon-72x72' + '.png... ');
            convert(combine(source, options.dest, "72x72", "apple-touch-icon-72x72" + ".png", additionalOpts));


            // 76x76: iPad non-retina, iOS 7 and higher
            console.log('apple-touch-icon-76x76.png... ');
            convert(combine(source, options.dest, "76x76", "apple-touch-icon-76x76.png", additionalOpts));


            // 114x114: iPhone retina, iOS 6 and lower
            console.log('apple-touch-icon-114x114' + '.png... ');
            convert(combine(source, options.dest, "114x114", "apple-touch-icon-114x114" + ".png", additionalOpts));


            // 120x120: iPhone retina, iOS 7 and higher
            console.log('apple-touch-icon-120x120.png... ');
            convert(combine(source, options.dest, "120x120", "apple-touch-icon-120x120.png", additionalOpts));


            // 144x144: iPad retina, iOS 6 and lower
            console.log('apple-touch-icon-144x144' + '.png... ');
            convert(combine(source, options.dest, "144x144", "apple-touch-icon-144x144" + ".png", additionalOpts));


            // 152x152: iPad retina, iOS 7 and higher
            console.log('apple-touch-icon-152x152.png... ');
            convert(combine(source, options.dest, "152x152", "apple-touch-icon-152x152.png", additionalOpts));

        }

        // 228x228: Coast
        if (options.coast) {
            console.log('coast-icon-228x228.png... ');
            convert(combine(source, options.dest, "228x228", "coast-icon-228x228.png", additionalOpts));

        }

        // Android Homescreen app
        if (options.androidHomescreen) {
            console.log('homescreen-196x196.png... ');
            convert(combine(source, options.dest, "196x196", "homescreen-196x196.png", additionalOpts));

        }

        // Firefox
        if (options.firefox) {
            updateFirefoxManifest = (options.firefoxManifest !== undefined && options.firefoxManifest !== '');

            if (updateFirefoxManifest) {
                contentsFirefox = (fs.existsSync(options.firefoxManifest)) ? fs.read(options.firefoxManifest) : '{}';
                contentFirefox = JSON.parse(contentsFirefox);
                contentFirefox.icons = {};
            }

            ['16', '30', '32', '48', '60', '64', '90', '120', '128', '256'].forEach(function (size) {
                var dimensions = size + 'x' + size,
                    dhalf = "circle " + size / 2 + "," + size / 2 + " " + size / 2 + ",1",
                    fifname = "firefox-icon-" + dimensions + ".png";
                console.log(fifname + '... ');
                convert(combine(source, options.dest, dimensions, fifname, []));

                if (updateFirefoxManifest) {
                    contentFirefox.icons[size] = options.HTMLPrefix + fifname;
                }


            });

            if (updateFirefoxManifest) {
                console.log('Updating Firefox manifest... ');

                fs.writeFileSync(options.firefoxManifest, JSON.stringify(contentFirefox, null, 2));
            }


        }

        ////// Windows 8 Tile

        if (options.windowsTile) {

            console.log('windows-tile-144x144.png... ');

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

            // Tile BG color (experimental)
            if (options.tileColor === "auto") {
                options.tileColor = generateTileColor(source);
            }

            // Setting background color in image
            if (!needHTML) {
                if (options.tileColor !== "none") {
                    additionalOpts = additionalOpts.concat([
                        "-background",
                        '"' + options.tileColor + '"',
                        "-flatten"
                    ]);
                }
            }

            convert(combine(source, options.dest, "70x70", "windows-tile-70x70.png", additionalOpts));
            convert(combine(source, options.dest, "144x144", "windows-tile-144x144.png", additionalOpts));
            convert(combine(source, options.dest, "150x150", "windows-tile-150x150.png", additionalOpts));
            convert(combine(source, options.dest, "310x310", "windows-tile-310x310.png", additionalOpts));


        }

        // Append icons to <HEAD>
        if (needHTML) {
            console.log('Updating HTML... ');
            elements = "";

            if (options.windowsTile) {
                elements += "\t<meta name=\"msapplication-square70x70logo\" content=\"" + options.HTMLPrefix + "windows-tile-70x70.png\"/>\n";
                elements += "\t<meta name=\"msapplication-square150x150logo\" content=\"" + options.HTMLPrefix + "windows-tile-150x150.png\"/>\n";
                elements += "\t<meta name=\"msapplication-square310x310logo\" content=\"" + options.HTMLPrefix + "windows-tile-310x310.png\"/>\n";
                elements += "\t<meta name=\"msapplication-TileImage\" content=\"" + options.HTMLPrefix + "windows-tile-144x144.png\"/>\n";
                if (options.tileColor !== "none") {
                    elements += "\t<meta name=\"msapplication-TileColor\" content=\"" + options.tileColor + "\"/>\n";
                }
            }

            // iOS
            if (options.apple) {
                elements += "\t<link rel=\"apple-touch-icon\" sizes=\"152x152\" href=\"" + options.HTMLPrefix + "apple-touch-icon-152x152.png\">\n";
                elements += "\t<link rel=\"apple-touch-icon\" sizes=\"120x120\" href=\"" + options.HTMLPrefix + "apple-touch-icon-120x120.png\">\n";

                elements += "\t<link rel=\"apple-touch-icon\" sizes=\"76x76\" href=\"" + options.HTMLPrefix + "apple-touch-icon-76x76.png\">\n";
                elements += "\t<link rel=\"apple-touch-icon\" sizes=\"60x60\" href=\"" + options.HTMLPrefix + "apple-touch-icon-60x60.png\">\n";

                elements += "\t<link rel=\"apple-touch-icon" + "\" sizes=\"144x144\" href=\"" + options.HTMLPrefix + "apple-touch-icon-144x144" + ".png\">\n";
                elements += "\t<link rel=\"apple-touch-icon" + "\" sizes=\"114x114\" href=\"" + options.HTMLPrefix + "apple-touch-icon-114x114" + ".png\">\n";

                elements += "\t<link rel=\"apple-touch-icon" + "\" sizes=\"72x72\" href=\"" + options.HTMLPrefix + "apple-touch-icon-72x72" + ".png\">\n";
                elements += "\t<link rel=\"apple-touch-icon\" sizes=\"57x57\" href=\"" + options.HTMLPrefix + "apple-touch-icon.png\">\n";
            }

            // Coast browser
            if (options.coast) {
                elements += "\t<link rel=\"icon\" sizes=\"228x228\" href=\"" + options.HTMLPrefix + "coast-icon-228x228.png\" />\n";
            }

            // Android Homescreen app
            if (options.androidHomescreen) {
                elements += "\t<meta name=\"mobile-web-app-capable\" value=\"yes\" />\n";
                elements += "\t<link rel=\"icon\" sizes=\"196x196\" href=\"" + options.HTMLPrefix + "homescreen-196x196.png\" />\n";
            }

            // Default
            if (options.favicon) {
                elements += "\t<link rel=\"shortcut icon\" href=\"" + options.HTMLPrefix + "favicon.ico\" />\n";
                elements += "\t<link rel=\"icon\" type=\"image/png\" sizes=\"64x64\" href=\"" + options.HTMLPrefix + "favicon.png\" />\n";
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
            fs.writeSync(options.html, output);


        }

        // Cleanup
        if (options.favicons) {
            ['16x16', '32x32', '48x48'].forEach(function (size) {
                fs.unlink(path.join(options.dest, size + '.png'));
            });
        }

    };

}());
