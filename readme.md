# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=node)](https://travis-ci.org/haydenbleasel/favicons)

## Installation

Favicons generator for Node.js. Basically an intelligence wrapper around RealFaviconGenerator built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Originally a port of [grunt-favicons](https://github.com/gleero/grunt-favicons/) (the good parts at least) and two other repositories: "favicon-generator" and "metaimage-generator". Installed through NPM with:

    npm install favicons --save-dev

Requires ImageMagick which you can get through Brew with:

    brew install imagemagick

## Configuration

Simply require the module and execute it with an optional object of configuration. The second argument (after options) is the callback. This accepts three parameters:

- `err`: An error that may have occurred during the Favicons build.
- `css`: The CSS produced for the range of favicons.
- `images`: An array of favicon images.

You can either specify a string for the source e.g. `logo.png` or a series of images e.g.

    src: {
        small: 'logo-small.png',    // Should be 64x64px or smaller
        medium: 'logo-medium.png',  // Should be between 65x65px to 310x310px
        large: 'logo-large.png'     // Should be 311x311px or larger
    }

## Usage

An example of usage with the default configuration is shown below:

```js
var favicons = require('favicons');

favicons({
    src: 'logo.png',            // The source image used to produce the favicon `string` or `object`
    dest: 'images',             // The destination path `string`
    iconTypes: {
        android: true,          // Create Android homescreen icon `boolean`
        appleIcon: true,        // Create Apple touch icons `boolean`
        appleStartup: true,     // Create Apple startup images `boolean`
        coast: true,            // Create Opera Coast icon `boolean`
        favicons: true,         // Create regular favicons `boolean`
        firefox: true,          // Create Firefox OS icons `boolean`
        opengraph: true,        // Create OpenGraph image for Facebook `boolean`
        windows: true,          // Create Windows 8 tiles `boolean`
        yandex: true            // Create Yandex Browser icon `boolean`
    },
    html: null,                 // Optional file to write metadata links to `string`, typically "index.html"
    background: '#1d1d1d',      // Background for Windows 8 tiles and Apple touch icons `#string`
    tileBlackWhite: false,      // Make white-only icon on Windows 8 tile `boolean`
    manifest: null,             // Path to Firefox manifest you want to add links to icons `string`, typically "manifest.webapp"
    trueColor: false,           // Use true color for favicon.ico or 256 сolor. True color is larger `boolean`
    url: null,                  // OpenGraph requires an absolute image URL. This is the URL for your website.
    logging: false,             // Print logs to console
}, function (err, css, images) {
    console.log(css);
    console.log(images);
});
```

## Credits

Thanks to [@phbernard](https://github.com/phbernard) for all the work we did together on [RealFaviconGenerator](https://github.com/realfavicongenerator) to make Favicons awesome.

Thanks to [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images for v1.4.0.

Thanks to [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.

And naturally, thanks to everyone who opens an issue or submits a pull request to this repo :)
