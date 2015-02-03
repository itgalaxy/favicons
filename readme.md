# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=master)](https://travis-ci.org/haydenbleasel/favicons)

## Installation

Favicons generator for Node.js. Basically a simplicity wrapper around RealFaviconGenerator built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Originally a port of [grunt-favicons](https://github.com/gleero/grunt-favicons/) (the good parts at least). Installed through NPM with:

    npm install favicons --save-dev

## Usage

Require the module and call it, optionally specifying configuration and callback objects i.e.

```js
var favicons = require('favicons');
favicons(config, callback);
```

### Configuration

To keep things organised, configuration contains 4 objects: `files`, `icons` and `settings` and `config`. An example of usage with the default values is shown below:

```js
{
    files: {
        src: null,                // Path for file to produce the favicons. `string`
        dest: null,               // Path for writing the favicons to. `string`
        html: null,               // Path(s) for HTML file to write or append metadata. `string` or `array`
        iconsPath: null,          // Path for overriding default icons path. `string`
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
        version: 1.0,             // Your application's version number. `number`
        background: null,         // Background colour for flattened icons. `string`
        index: null,              // Path for the initial page on the site. `string`
        url: null,                // URL for your website. `string`
        silhouette: false,        // Turn the logo into a white silhouette for Windows 8. `boolean`
        logging: false            // Print logs to console? `boolean`
    },
    favicon_generation: null,     // Complete JSON overwrite for the favicon_generation object. `object`
}
```

### Callback

The callback accepts one parameter:

```js
function (metadata) {
    console.log(metadata, 'Metadata produced during the build process');
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
- yandex: Yandex browser icon (50x50) with Yandex manifest.json

It will also create the following HTML:

```html
<link rel="apple-touch-icon" sizes="57x57" href="apple-touch-icon-57x57.png">
<link rel="apple-touch-icon" sizes="114x114" href="apple-touch-icon-114x114.png">
<link rel="apple-touch-icon" sizes="72x72" href="apple-touch-icon-72x72.png">
<link rel="apple-touch-icon" sizes="144x144" href="apple-touch-icon-144x144.png">
<link rel="apple-touch-icon" sizes="60x60" href="apple-touch-icon-60x60.png">
<link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="76x76" href="apple-touch-icon-76x76.png">
<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<link href="apple-touch-startup-image-1536x2008.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image">
<link href="apple-touch-startup-image-2048x1496.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image">
<link href="apple-touch-startup-image-768x1004.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)" rel="apple-touch-startup-image">
<link href="apple-touch-startup-image-1024x748.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)" rel="apple-touch-startup-image">
<link href="apple-touch-startup-image-640x1096.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image">
<link href="apple-touch-startup-image-640x920.png" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image">
<link href="apple-touch-startup-image-320x460.png" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)" rel="apple-touch-startup-image">
<link rel="shortcut icon" href="favicon.ico">
<link rel="icon" type="image/png" href="favicon-192x192.png" sizes="192x192">
<link rel="icon" type="image/png" href="favicon-160x160.png" sizes="160x160">
<link rel="icon" type="image/png" href="favicon-96x96.png" sizes="96x96">
<link rel="icon" type="image/png" href="favicon-16x16.png" sizes="16x16">
<link rel="icon" type="image/png" href="favicon-32x32.png" sizes="32x32">
<meta name="msapplication-TileColor" content="#1d1d1d">
<meta name="msapplication-TileImage" content="mstile-144x144.png">
<meta name="msapplication-config" content="browserconfig.xml">
<link rel="manifest" href="android_chrome_manifest.json">
<meta name="theme-color" content="#1d1d1d">
<link rel="icon" type="image/png" href="coast-228x228.png" sizes="228x228">
<meta property="og:image" content="open-graph.png">
<link rel="yandex-tableau-widget" href="yandex-browser-manifest.json">
```

## Credits

Thank you to...

- [@phbernard](https://github.com/phbernard) for all the work we did together on [RealFaviconGenerator](https://github.com/realfavicongenerator) to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)
