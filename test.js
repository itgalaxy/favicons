/*jslint node:true*/
var fav = require('./index.js'),
  config = {
    files: {
        //src: 'test/logo.png',
        src: {
            "android": 'test/logo.png',
            "appleIcon": 'test/logo.png',
            "appleStartup": 'test/logo.png',
            "coast": 'test/logo.png',
            "favicons": 'test/logo.png',
            "firefox": 'test/logo.png',
            "opengraph": 'test/logo.png',
            "windows": 'test/logo.png',
            "yandex": 'test/logo.png'
        },
        dest: 'test/favicons',
        html: 'test/test.html',
        iconsPath: 'favicons'
    },
    settings: {
        appName: 'Favicons',
        appDescription: 'Favicon generator for Node.js',
        developer: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com',
        background: '#27353f',
        index: 'test/favicons.html',
        url: 'http://haydenbleasel.com',
        logging: true
    }
  };

fav(config, function (error, metadata) {
    'use strict';
    console.log(error, metadata);
});
