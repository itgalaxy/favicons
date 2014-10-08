# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=node)](https://travis-ci.org/haydenbleasel/favicons)

Favicons generator for Node.js. Produces a multi-size favicon from a single image. Port of [grunt-favicons](https://github.com/gleero/grunt-favicons/) (the good parts at least). Originally "favicon-generator" and "metaimage-generator". Installed through NPM with:

```
npm install favicons --save-dev
```

Requires ImageMagick which you can get through Brew with:

```
brew install imagemagick
```

Simply require the module and execute it with an optional object of configuration.

- I/O
    - Source: The source image used to produce the favicon `string` or `object`
    - Dest: The destination path `string`
- Icons
    - Android: create Android homescreen icon `boolean`
    - Apple: create Apple touch icons `boolean`
    - Coast: create Opera Coast icon `boolean`
    - Favicons: create regular favicons `boolean`
    - Firefox: create Firefox OS icons `boolean`
    - OpenGraph: create OpenGraph image for Facebook `boolean`
    - Windows: create Windows 8 tiles `boolean`
- Miscellaneous:
    - HTML: optional file to write metadata links to `string`, typically "index.html"
    - Background: background for Windows 8 tiles and Apple touch icons `#string`
    - TileBlackWhite: make white-only icon on Windows 8 tile `boolean`
    - Manifest: path to Firefox manifest you want to add links to icons `string`, typically "manifest.webapp"
    - TrueColor: use true color for favicon.ico or 256 сolor. True color is larger `boolean`
    - URL: OpenGraph requires an absolute image URL. This is the URL for your website.
    - Logging: print logs to console
    - Callback: function to execute upon completion `function` (params include 'response' and 'html')

You can either specify a string for the source e.g. `logo.png` or a series of images e.g.

```
source: {
    small: 'logo-small.png',    // Should be 64x64px or smaller
    medium: 'logo-medium.png',  // Should be between 65x65px to 310x310px
    large: 'logo-large.png'     // Should be 311x311px or larger
}
```

Defaults are shown below:

```
var favicons = require('favicons');

favicons({
    // I/O
    source: 'logo.png',
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
    url: null,
    logging: false,
    callback: null
});
```

Note: If you're going to write the HTML metadata to a file, make sure the tags aren't already there or there will be duplicates. Also, Favicons currently only supports JPG, PNG, GIF and SVG files. You can try other file types but it might explode.

Thanks to [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images for v1.4.0.
