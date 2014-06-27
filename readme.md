# Favicon Generator [![Build Status](https://travis-ci.org/haydenbleasel/favicon-generator.svg?branch=node)](https://travis-ci.org/haydenbleasel/favicon-generator)

Favicon.ico generator for Node.js. Produces a multi-size favicon from a single image. Installed through NPM with:

```
npm install favicon-generator --save-dev
```

Requires ImageMagick which you can get through Brew with:

```
brew install imagemagick
```

Simply require the module and execute it with an optional array of configuration.

- Source: The source image used to produce the favicon.
- Sizes: An array of favicon sizes to be stored within the file.
- Out: The destination path and filename.
- Upscale: Whether to resize smaller images to larger favicons.
- Callback: Function to execute upon completion.

Defaults are shown below:

```
var favicon = require('favicon-generator');

favicon({
  source: 'apple-touch-icon.png',
  sizes: [16, 32, 48, 64],
  out: 'favicon.ico',
  upscale: false,
  callback: null
});
```
