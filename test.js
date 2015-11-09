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
    }, function (error, response) {

        // error: any error that occurred in the process (string)
        if (error) {
            throw error;
        }

        console.log('Images: ' + response.images);
        console.log('Files: ' + response.files);
        console.log('HTML: ' + response.html);

        if (response.images) {
            mkdirp.sync('./test/images/');
            response.images.forEach(function (image) {
                fs.writeFileSync('./test/images/' + image.name, image.contents);
            });
        }

        if (response.files) {
            mkdirp.sync('./test/files/');
            response.files.forEach(function (file) {
                fs.writeFileSync('./test/files/' + file.name, file.contents);
            });
        }

    });

}());
