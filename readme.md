# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=master)](https://travis-ci.org/haydenbleasel/favicons)

A Node.js module for generating favicons and their associated files. Originally built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Requires Node 4+. Installed through NPM with:

```
npm install favicons
```

## Usage

### Node.js

To use Favicons, require the appropriate module and call it, optionally specifying configuration and callback objects. A sample is shown on the right. The full list of options can be found on GitHub.

The Gulp / Grunt wrapper modules have a few extra properties. You can also configure and use Favicons from the terminal with dot syntax.

Favicons generates it’s icons locally using pure Javascript with no external dependencies. However, due to extensive collaboration with RealFaviconGenerator, you can opt to have your favicons generated using their online API.

Please note: Favicons is written in ES6, meaning you need Node 4.x or above.

```js
var favicons = require('favicons'),
    source = 'test/logo.png',           // Source image(s). `string`, `buffer` or array of `{ size: filepath }`
    configuration = {
        appName: null,                  // Your application's name. `string`
        appDescription: null,           // Your application's description. `string`
        developerName: null,            // Your (or your developer's) name. `string`
        developerURL: null,             // Your (or your developer's) URL. `string`
        background: "#fff",             // Background colour for flattened icons. `string`
        path: "/",                      // Path for overriding default icons path. `string`
        url: "/",                       // Absolute URL for OpenGraph image. `string`
        display: "standalone",          // Android display: "browser" or "standalone". `string`
        orientation: "portrait",        // Android orientation: "portrait" or "landscape". `string`
        version: "1.0",                 // Your application's version number. `number`
        logging: false,                 // Print logs to console? `boolean`
        online: false,                  // Use RealFaviconGenerator to create favicons? `boolean`
        icons: {
            android: true,              // Create Android homescreen icon. `boolean`
            appleIcon: true,            // Create Apple touch icons. `boolean`
            appleStartup: true,         // Create Apple startup images. `boolean`
            coast: true,                // Create Opera Coast icon. `boolean`
            favicons: true,             // Create regular favicons. `boolean`
            firefox: true,              // Create Firefox OS icons. `boolean`
            opengraph: true,            // Create Facebook OpenGraph image. `boolean`
            twitter: true,              // Create Twitter Summary Card image. `boolean`
            windows: true,              // Create Windows 8 tile icons. `boolean`
            yandex: true                // Create Yandex browser icon. `boolean`
        }
    },
    callback = function (error, response) {
        if (error) {
            console.log(error.status);  // HTTP error code (e.g. `200`) or `null`
            console.log(error.name);    // Error name e.g. "API Error"
            console.log(error.message); // Error description e.g. "An unknown error has occurred"
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
var favicons = require("gulp-favicons");

gulp.task("default", function () {
    gulp.src("logo.png").pipe(favicons({
        appName: "My App",
        appDescription: "This is my application",
        developerName: "Hayden Bleasel",
        developerURL: "http://haydenbleasel.com/",
        background: "#020307",
        path: "favicons/",
        url: "http://haydenbleasel.com/",
        display: "standalone",
        orientation: "portrait",
        version: 1.0,
        logging: false,
        online: false,
        html: "index.html",
        replace: true
    })).pipe(gulp.dest("./"));
});
```

If you need an ES5 build for legacy purposes, just require the ES5 file:

```js
var favicons = require('gulp-favicons/es5');
```

### Shell

You can also configure and use Favicons from the terminal with dot syntax:

```sh
Coming soon: https://github.com/haydenbleasel/favicons/issues/54
```

## Output

For the full list of files, check `config/files.json`. For the full HTML code, check `config/html.json`. Finally, for the full list of icons, check `config/icons.json`.

## Contributing

### Testing

This module is planning on using Mocha tests in the near future. If you add a feature, please implement the corresponding test(s).

### Favicon generation

Favicon generation is tested in `test/favicons.js`. To add a test:

- Add your own test case (if you don't know Mocha, just copy/paste an existing test case... you know the story).
- Choose a short test case name (eg. `android_background`) and create a directory named after it, eg. `test/expected/favicons/android_background`.
- In this directory, create a file named `html.txt`. In this file, put the HTML markups you expect the module will produce.
- Run the test by running `mocha` (you may need to install it with `npm install mocha -g`). It should fail, because there are no expected images yet.
- Look at the images the test case generated, eg. in `test/output/favicons/android_background/images` and inspect them: are they correct? If so, copy them in the expected directory, eg. in `test/expected/favicons/android_background/images`.
- Run the test again: it should now pass regarding the images. Yet, it may fail again because of the other files (`browserconfig.xml`, other manifests...). If so, you can repeat the process above: inspect the generated files and copy them (eg. from `test/output/favicons/android_background/files` to `test/expected/favicons/android_background/files`).


### ES5 compatibility

To build the ES5 version for Node.js:

```sh
npm install -g babel-cli
babel --presets es2015 index.js --out-file es5.js
babel --presets es2015 helpers-es6.js --out-file helpers.js
```

To build the ES5 version for Gulp, run the following and remember to require the ES5 version.

```sh
npm install -g babel-cli
babel --presets es2015 index.js --out-file es5.js
```

## Credits

Thank you to...

- [@phbernard](https://github.com/phbernard) for all the work we did together on [RealFaviconGenerator](https://github.com/realfavicongenerator) to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)
