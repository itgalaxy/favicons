# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=node)](https://travis-ci.org/haydenbleasel/favicons)

Favicons generator for Node.js. Produces a multi-size favicon from a single image. Port of [grunt-favicons](https://github.com/gleero/grunt-favicons/) (the good parts at least). Originally "favicon-generator" and "metaimage-generator". Installed through NPM with:

```
npm install favicons --save-dev
```

Requires ImageMagick which you can get through Brew with:

```
brew install imagemagick
```

Simply require the module and execute it with an optional array of configuration.

- I/O
    - Source: The source image used to produce the favicon `string`
    - Dest: The destination path `string`
- Icons
    - Android: create Android homescreen icon `boolean`
    - Apple: create Apple touch icons `boolean`
    - Coast: create Opera Coast icon `boolean`
    - Favicons: create regular favicons `boolean`
    - Firefox: create Firefox OS icons `boolean`
    - Windows: create Windows 8 tiles `boolean`
- Miscellaneous:
    - HTML: optional file to write metadata links to `string`, typically "index.html"
    - Background: background for Windows 8 tiles and Apple touch icons `#string`
    - TileBlackWhite: make white-only icon on Windows 8 tile `boolean`
    - Manifest: path to Firefox manifest you want to add links to icons `string`, typically "manifest.webapp"
    - TrueColor: use true color for favicon.ico or 256 сolor. True color is larger `boolean`
    - Logging: print logs to console
    - Callback: function to execute upon completion `function` (params include 'response' and 'html')

Defaults are shown below:

```
var favicons = require('favicons');

favicon({
    // I/O
    source: 'logo.png',
    dest: 'images',

    // Icon Types
    android: true,
    apple: true,
    coast: true,
    favicons: true,
    firefox: true,
    windows: true,

    // Miscellaneous
    html: null,
    background: '#1d1d1d',
    tileBlackWhite: true,
    manifest: null,
    trueColor: false,
    logging: false,
    callback: null
});
```
