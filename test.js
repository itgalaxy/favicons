/*jslint node:true, nomen:true, stupid:true*/
(function () {

    'use strict';

    var favicons = require('./index'),
        fs = require('fs'),
        mkdirp = require('mkdirp');
    favicons('./test/logo.png', {
        logging: true,
        path: 'test/images/',
        background: '#26353F'
    }, function (error, images, files, html) {

        // error: any error that occurred in the process (string)
        if (error) {
            throw error;
        }

        console.log('Images: ' + images);
        console.log('Files: ' + files);
        console.log('HTML: ' + html);

        if (images) {
            mkdirp.sync('./test/images/');
            images.forEach(function (image) {
                fs.writeFileSync('./test/images/' + image.name, image.contents);
            });
        }

        if (files) {
            mkdirp.sync('./test/files/');
            files.forEach(function (file) {
                fs.writeFileSync('./test/files/' + file.name, file.contents);
            });
        }

    });

}());
