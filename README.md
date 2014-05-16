# Favicon [![Build Status](https://travis-ci.org/haydenbleasel/favicon-generator.svg?branch=master)](https://travis-ci.org/haydenbleasel/favicon-generator)

Favicon.ico generator for Node.js. Requires ImageMagick. Needs some work with upscaling and other rules. Usage:

```
var favicon = require('favicon-generator');

favicon({
  source: 'apple-touch-icon.png',
  sizes: [16, 32, 48, 64],
  out: 'favicon.ico'
});
```
