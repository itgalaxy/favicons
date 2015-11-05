/*jslint node:true, nomen:true, stupid:true*/
(function () {

    'use strict';

    var favicons = require('./index'),
        fs = require('fs'),
        cheerio = require('cheerio'),
        mkdirp = require('mkdirp');
    favicons('./test/logo.png', {
        logging: true,
        path: 'test/images/',
        background: '#26353F'
    }, function (error, images, html) {

        var $ = cheerio.load('index.html', { decodeEntities: true });

        // error: any error that occurred in the process (string)
        if (error) {
            throw error;
        }

        // images: an object of buffers e.g. { apple-touch-icon.png: <Buffer>, favicon.ico: <buffer> }
        mkdirp.sync('./test/images/');
        images.forEach(function (favicon) {
            fs.writeFileSync('./test/images/' + favicon.name, favicon.contents);
        });

        // html: a snippet of HTML (string) e.g.

        $('head').append(html);

    });

}());
