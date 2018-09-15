# Favicons

[![NPM version](https://img.shields.io/npm/v/favicons.svg)](https://www.npmjs.org/package/favicons)
[![Build Status](https://travis-ci.org/itgalaxy/favicons.svg?branch=master)](https://travis-ci.org/itgalaxy/favicons)
[![Coverage Status](https://coveralls.io/repos/github/itgalaxy/favicons/badge.svg?branch=master)](https://coveralls.io/github/itgalaxy/favicons?branch=master)
[![Dependencies Status](https://david-dm.org/itgalaxy/favicons/status.svg)](https://david-dm.org/itgalaxy/favicons)
[![DevDependencies Status](https://david-dm.org/itgalaxy/favicons/dev-status.svg)](https://david-dm.org/itgalaxy/favicons?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/itgalaxy/favicons.svg)](https://greenkeeper.io)

A Node.js module for generating favicons and their associated files. Originally built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Requires Node 4+. Installed through NPM with:

```
npm install favicons
```

## Usage

### Node.js

To use Favicons, require the appropriate module and call it, optionally specifying configuration and callback objects. A sample is shown on the right. The full list of options can be found on GitHub.

The Gulp / Grunt wrapper modules have a few extra properties. You can also configure and use Favicons from the terminal with dot syntax.

Favicons generates its icons locally using pure Javascript with no external dependencies.

Please note: Favicons is tested on Node 4.x and above.

```js
var favicons = require('favicons'),
    source = 'test/logo.png',                     // Source image(s). `string`, `buffer` or array of `string`
    configuration = {          
        path: "/",                                // Path for overriding default icons path. `string`
        appName: null,                            // Your application's name. `string`
        appDescription: null,                     // Your application's description. `string`
        developerName: null,                      // Your (or your developer's) name. `string`
        developerURL: null,                       // Your (or your developer's) URL. `string`
        dir: "auto",                              // Primary text direction for name, short_name, and description
        lang: "en-US",                            // Primary language for name and short_name
        background: "#fff",                       // Background colour for flattened icons. `string`
        theme_color: "#fff",                      // Theme color user for example in Android's task switcher. `string`
        appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
        display: "standalone",                    // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
        orientation: "any",                       // Default orientation: "any", "natural", "portrait" or "landscape". `string`
        scope: "/",                               // set of URLs that the browser considers within your app
        start_url: "/?homescreen=1",              // Start URL when launching the application from a device. `string`
        version: "1.0",                           // Your application's version string. `string`
        logging: false,                           // Print logs to console? `boolean`
        icons: {
            // Platform Options:
            // - offset - offset in percentage
            // - background:
            //   * false - use default
            //   * true - force use default, e.g. set background for Android icons
            //   * color - set background for the specified icons
            //   * mask - apply mask in order to create circle icon (applied by default for firefox). `boolean`
            //   * overlayGlow - apply glow effect after mask has been applied (applied by default for firefox). `boolean`
            //   * overlayShadow - apply drop shadow after mask has been applied .`boolean`
            //
            android: true,              // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            appleIcon: true,            // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            appleStartup: true,         // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            coast: true,                // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            favicons: true,             // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            firefox: true,              // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            windows: true,              // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
            yandex: true                // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
        }
    },
    callback = function (error, response) {
        if (error) {
            console.log(error.message); // Error description e.g. "An unknown error has occurred"
            return;
        }
        console.log(response.images);   // Array of { name: string, contents: <buffer> }
        console.log(response.files);    // Array of { name: string, contents: <string> }
        console.log(response.html);     // Array of strings (html elements)
    };

favicons(source, configuration, callback);
```

You can programmatically access Favicons configuration (icon filenames, HTML, manifest files, etc) with:

```js
var config = require('favicons').config;
```

### Gulp

To use Favicons with Gulp, do as follows:

```js
var favicons = require("favicons").stream,
    gutil = require("gulp-util");

gulp.task("default", function () {
    return gulp.src("logo.png").pipe(favicons({
        appName: "My App",
        appDescription: "This is my application",
        developerName: "Hayden Bleasel",
        developerURL: "http://haydenbleasel.com/",
        background: "#020307",
        path: "favicons/",
        url: "http://haydenbleasel.com/",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/?homescreen=1",
        version: 1.0,
        logging: false,
        html: "index.html",
        pipeHTML: true,
        replace: true
    }))
    .on("error", gutil.log)
    .pipe(gulp.dest("./"));
});
```

## Output

For the full list of files, check `config/files.json`. For the full HTML code, check `config/html.json`. Finally, for the full list of icons, check `config/icons.json`.

## Questions

> Why are you missing certain favicons?

Because pure Javascript modules aren't available at the moment. For example, the [El Capitan SVG favicon](https://github.com/haydenbleasel/favicons/issues/61) and the [Windows tile silhouette ability](https://github.com/haydenbleasel/favicons/issues/58) both require [SVG support](https://github.com/haydenbleasel/favicons/issues/53). If modules for these task begin to appear, please jump on the appropriate issue and we'll get on it ASAP.

## Thank you

- [@haydenbleasel](https://github.com/haydenbleasel) for this great project.
- [@phbernard](https://github.com/phbernard) for all the work we did together to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
