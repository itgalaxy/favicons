# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=node)](https://travis-ci.org/haydenbleasel/favicons)

## Installation

Favicons generator for Node.js. Basically a simplicity wrapper around RealFaviconGenerator built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Originally a port of [grunt-favicons](https://github.com/gleero/grunt-favicons/) (the good parts at least). Installed through NPM with:

    npm install favicons --save-dev

Requires ImageMagick which you can get through Brew with:

    brew install imagemagick

## Usage

Require the module and call it, optionally specifying configuration and callback objects i.e.

```js
var favicons = require('favicons');
favicons(config, callback);
```

### Configuration

To keep things organised, configuration contains 3 objects: `files`, `icons` and `settings`. An example of usage with the default values is shown below:

```js
{
    files: {
        src: null,                // Path for file to produce the favicons. `string` or `object`
        dest: null,               // Path for writing the favicons to. `string`
        html: null,               // Path for HTML file to write metadata. `string`
        androidManifest: null,    // Path for an existing android_chrome_manifest.json. `string`
        browserConfig: null,      // Path for an existing browserconfig.xml. `string`
        firefoxManifest: null,    // Path for an existing manifest.webapp. `string`
        yandexManifest: null      // Path for an existing yandex-browser-manifest.json. `string`
    },
    icons: {
        android: true,            // Create Android homescreen icon. `boolean`
        appleIcon: true,          // Create Apple touch icons. `boolean`
        appleStartup: true,       // Create Apple startup images. `boolean`
        coast: true,              // Create Opera Coast icon. `boolean`
        favicons: true,           // Create regular favicons. `boolean`
        firefox: true,            // Create Firefox OS icons. `boolean`
        opengraph: true,          // Create Facebook OpenGraph. `boolean`
        windows: true,            // Create Windows 8 tiles. `boolean`
        yandex: true              // Create Yandex browser icon. `boolean`
    },
    settings: {
        appName: null,            // Your application's name. `string`
        appDescription: null,     // Your application's description. `string`
        developer: null,          // Your (or your developer's) name. `string`
        developerURL: null,       // Your (or your developer's) URL. `string`
        background: null,         // Background colour for flattened icons. `string`
        index: null,              // Path for the initial page on the site. `string`
        url: null,                // URL for your website. `string`
        logging: false            // Print logs to console?
    }
}
```

You can either specify a string for the source e.g. `logo.png` or a series of images e.g.

```js
src: {
    android: 'logo-android.png',
    appleIcon: 'logo-appleIcon.png',
    appleStartup: 'logo-appleStartup.png',
    coast: 'logo-coast.png',
    favicons: 'logo-favicons.png',
    firefox: 'logo-firefox.png',
    opengraph: 'logo-opengraph.png',
    windows: 'logo-windows.png',
    yandex: 'logo-yandex.png'
}
```

### Callback

The callback accepts three parameters:

```js
function (err, css, images) {
    // err: An error that may have occurred during the Favicons build. `object`
    // css: The CSS produced for the range of favicons. `string`
    // images: An array of favicon images. `array`
}
```

## Output

Depending on which platforms you opt for, the output includes:

- android: Android Chrome images (36x36 -> 192x192) with Android manifest.json
- appleIcon: Apple touch icons (57x57 -> 180x180).
- appleStartup: Apple startup images (320x460 -> 1536x2008).
- coast: Opera coast icon (228x228)
- favicons: PNG favicons (16x16 -> 192x192) and ICO favicon (multi-size).
- firefox: Firefox OS icons (60x60 -> 512x512) with manifest.webapp
- opengraph: Facebook OpenGraph image (1500x1500).
- windows: Windows tiles (70x70 -> 310x310) with browserconfig.xml
- yandex: Yandex browser icoon (50x50) with Yandex manifest.json

## Credits

Thank you to...

- [@phbernard](https://github.com/phbernard) for all the work we did together on [RealFaviconGenerator](https://github.com/realfavicongenerator) to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)
