# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=master)](https://travis-ci.org/haydenbleasel/favicons)

A Node.js module for generating favicons and their associated files. Originally built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Requires Node 4+. Installed through NPM with:

```
npm install favicons
```

## Usage

### Node.js

To use Favicons, require the appropriate module and call it, optionally specifying configuration and callback objects. A sample is shown on the right. The full list of options can be found on GitHub.

The Gulp / Grunt wrapper modules have a few extra properties. You can also configure and use Favicons from the terminal with dot syntax.

Favicons generates its icons locally using pure Javascript with no external dependencies. However, due to extensive collaboration with RealFaviconGenerator, you can opt to have your favicons generated using their online API.

Please note: Favicons is written in ES6, meaning you need Node 4.x or above.

```js
var favicons = require('favicons'),
    source = 'test/logo.png',           // Source image(s). `string`, `buffer` or array of `string`
    configuration = {
        appName: null,                  // Your application's name. `string`
        appDescription: null,           // Your application's description. `string`
        developerName: null,            // Your (or your developer's) name. `string`
        developerURL: null,             // Your (or your developer's) URL. `string`
        background: "#fff",             // Background colour for flattened icons. `string`
        theme_color: "#fff",            // Theme color for browser chrome. `string`
        path: "/",                      // Path for overriding default icons path. `string`
        display: "standalone",          // Android display: "browser" or "standalone". `string`
        orientation: "portrait",        // Android orientation: "portrait" or "landscape". `string`
        start_url: "/?homescreen=1",    // Android start application's URL. `string`
        version: "1.0",                 // Your application's version number. `number`
        logging: false,                 // Print logs to console? `boolean`
        online: false,                  // Use RealFaviconGenerator to create favicons? `boolean`
        preferOnline: false,            // Use offline generation, if online generation has failed. `boolean`
        icons: {
            // Platform Options:
            // - offset - offset in percentage
            // - shadow - drop shadow for Android icons, available online only
            // - background:
            //   * false - use default
            //   * true - force use default, e.g. set background for Android icons
            //   * color - set background for the specified icons
            //
            android: true,              // Create Android homescreen icon. `boolean` or `{ offset, background, shadow }`
            appleIcon: true,            // Create Apple touch icons. `boolean` or `{ offset, background }`
            appleStartup: true,         // Create Apple startup images. `boolean` or `{ offset, background }`
            coast: { offset: 25 },      // Create Opera Coast icon with offset 25%. `boolean` or `{ offset, background }`
            favicons: true,             // Create regular favicons. `boolean`
            firefox: true,              // Create Firefox OS icons. `boolean` or `{ offset, background }`
            windows: true,              // Create Windows 8 tile icons. `boolean` or `{ background }`
            yandex: true                // Create Yandex browser icon. `boolean` or `{ background }`
        }
    },
    callback = function (error, response) {
        if (error) {
            console.log(error.status);  // HTTP error code (e.g. `200`) or `null`
            console.log(error.name);    // Error name e.g. "API Error"
            console.log(error.message); // Error description e.g. "An unknown error has occurred"
            return;
        }
        console.log(response.images);   // Array of { name: string, contents: <buffer> }
        console.log(response.files);    // Array of { name: string, contents: <string> }
        console.log(response.html);     // Array of strings (html elements)
    };

favicons(source, configuration, callback);
```

If you need an ES5 build for legacy purposes, just require the ES5 file:

```js
var favicons = require('favicons/es5');
```

You can programmatically access Favicons configuration (icon filenames, HTML, manifest files, etc) with:

```js
var config = require('favicons').config;
```

### Gulp

To use Favicons with Gulp, require the `gulp-favicons` wrapper and use it as follows:

```js
var favicons = require("gulp-favicons"),
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
        start_url: "/?homescreen=1",
        version: 1.0,
        logging: false,
        online: false,
        html: "index.html",
        pipeHTML: true,
        replace: true
    }))
    .on("error", gutil.log)
    .pipe(gulp.dest("./"));
});
```

If you need an ES5 build for legacy purposes, just require the ES5 file:

```js
var favicons = require('gulp-favicons/es5');
```

## Output

For the full list of files, check `config/files.json`. For the full HTML code, check `config/html.json`. Finally, for the full list of icons, check `config/icons.json`.

## Contributing

To build the ES5 version for Node.js:

```sh
gulp
```

## Questions

> What's the difference between offline and online?

Offline uses pure Javascript image manipulation (JIMP) in Node.js to create your Favicons. Online uses the [RealFaviconGenerator API](https://realfavicongenerator.net/) to generate a Favicons package and then we download it. When using offline, generating favicons is a lot faster and doesn't require an internet connection, however we're missing a few features from RFG at the moment.

> Why are you missing certain favicons?

Because pure Javascript modules aren't available at the moment. For example, the [El Capitan SVG favicon](https://github.com/haydenbleasel/favicons/issues/61) and the [Windows tile silhouette ability](https://github.com/haydenbleasel/favicons/issues/58) both require [SVG support](https://github.com/haydenbleasel/favicons/issues/53). If modules for these task begin to appear, please jump on the appropriate issue and we'll get on it ASAP.

## Credits

Thank you to...

- [@phbernard](https://github.com/phbernard) for all the work we did together to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)
