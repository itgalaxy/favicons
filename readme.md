# Favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=master)](https://travis-ci.org/haydenbleasel/favicons)

## Installation

The Node.js RealFaviconGenerator implementation for generating Favicons, originally built for [Google's Web Starter Kit](https://github.com/google/web-starter-kit) and [Catalyst](https://github.com/haydenbleasel/catalyst). Installed through NPM with:

```
npm install favicons --save-dev
```

## Usage

Require the module and call it, optionally specifying configuration and callback objects i.e.

```js
var favicons = require('favicons');
favicons(configuration, callback);
```

### Configuration

To keep things organised, the configuration object contains 4 sub-objects: `files`, `icons`, `settings` and `favicon_generation`. An example of usage with the default values is shown below:

```js
{
    files: {
        src: null,                // Path(s) for file to produce the favicons. `string` or `object`
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

#### Custom Overwrites

The `favicon_generation` object is optional and is used to completely overwrite the [RealFaviconGenerator request](http://realfavicongenerator.net/api/non_interactive_api). An example of this would be:

```js
favicon_generation: {
    favicon_design: {
            ios: {
                margin: 0
            }
        }
    }
    settings: {
        compression: 1
    }
}
```

You can overwrite any options you'd like and they are merged in with the recommended default configuration.

#### Multiple Sources

You can specify custom source images for each platform with the following syntax for `files.src`:

```js
src: {
    android: 'images/android.png',
    appleIcon: 'images/apple-icon.png',
    // ...
}
```

Note: If you choose to specify custom source images for each platform, you will need to specify every platform individually for it to work - there's nothing to default to.

### Callback

Favicons follows the typical error-first callback syntax. The callback accepts two parameters:

```js
function (error, metadata) {
    if (error) {
        throw error;
    }
    console.log(metadata, 'Metadata produced during the build process');
}
```

## Output

Depending on which platforms you opt for, the output includes:

```
android-chrome-144x144.png
android-chrome-192x192.png
android-chrome-36x36.png
android-chrome-48x48.png
android-chrome-72x72.png
android-chrome-96x96.png
android-chrome-manifest.json
apple-touch-icon-114x114.png
apple-touch-icon-120x120.png
apple-touch-icon-144x144.png
apple-touch-icon-152x152.png
apple-touch-icon-180x180.png
apple-touch-icon-57x57.png
apple-touch-icon-60x60.png
apple-touch-icon-72x72.png
apple-touch-icon-76x76.png
apple-touch-icon-precomposed.png
apple-touch-icon.png
apple-touch-startup-image-1024x748.png
apple-touch-startup-image-1536x2008.png
apple-touch-startup-image-2048x1496.png
apple-touch-startup-image-320x460.png
apple-touch-startup-image-640x1096.png
apple-touch-startup-image-640x920.png
apple-touch-startup-image-768x1004.png
browserconfig.xml
coast-228x228.png
favicon-16x16.png
favicon-230x230.png
favicon-32x32.png
favicon-96x96.png
favicon.ico
firefox_app_128x128.png
firefox_app_512x512.png
firefox_app_60x60.png
manifest.webapp
mstile-144x144.png
mstile-150x150.png
mstile-310x150.png
mstile-310x310.png
mstile-70x70.png
open-graph.png
yandex-browser-50x50.png
yandex-browser-manifest.json
```

It will also create the following HTML:

```html
<link rel="apple-touch-icon" sizes="57x57" href="favicons/apple-touch-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="favicons/apple-touch-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="favicons/apple-touch-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="favicons/apple-touch-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="favicons/apple-touch-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="favicons/apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="favicons/apple-touch-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="favicons/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon-180x180.png">
<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)" href="favicons/apple-touch-startup-image-1024x748.png">
<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)" href="favicons/apple-touch-startup-image-1536x2008.png">
<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)" href="favicons/apple-touch-startup-image-2048x1496.png">
<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)" href="favicons/apple-touch-startup-image-320x460.png">
<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="favicons/apple-touch-startup-image-640x1096.png">
<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)" href="favicons/apple-touch-startup-image-640x920.png">
<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)" href="favicons/apple-touch-startup-image-768x1004.png">
<link rel="icon" type="image/png" href="favicons/favicon-32x32.png" sizes="32x32">
<link rel="icon" type="image/png" href="favicons/favicon-230x230.png" sizes="230x230">
<link rel="icon" type="image/png" href="favicons/favicon-96x96.png" sizes="96x96">
<link rel="icon" type="image/png" href="favicons/android-chrome-192x192.png" sizes="192x192">
<link rel="icon" type="image/png" href="favicons/coast-228x228.png" sizes="228x228">
<link rel="icon" type="image/png" href="favicons/favicon-16x16.png" sizes="16x16">
<link rel="manifest" href="favicons/android-chrome-manifest.json">
<link rel="shortcut icon" href="favicons/favicon.ico">
<link rel="yandex-tableau-widget" href="favicons/yandex-browser-manifest.json">
<meta property="og:image" content="favicons/open-graph.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="msapplication-TileColor" content="#27353f">
<meta name="msapplication-TileImage" content="favicons/mstile-144x144.png">
<meta name="msapplication-config" content="favicons/browserconfig.xml">
<meta name="theme-color" content="#27353f">
```

## Credits

Thank you to...

- [@phbernard](https://github.com/phbernard) for all the work we did together on [RealFaviconGenerator](https://github.com/realfavicongenerator) to make Favicons and RFG awesome.
- [@addyosmani](https://github.com/addyosmani), [@gauntface](https://github.com/gauntface), [@paulirish](https://github.com/paulirish), [@mathiasbynens](https://github.com/mathiasbynens) and [@pbakaus](https://github.com/pbakaus) for [their input](https://github.com/google/web-starter-kit/pull/442) on multiple source images.
- [@sindresorhus](https://github.com/sindresorhus) for his help on documentation and parameter improvements.
- Everyone who opens an issue or submits a pull request to this repo :)
