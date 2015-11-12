/*jslint node:true, nomen:true, stupid:true*/
(function () {

    'use strict';

    var favicons = require('./index'),
        fs = require('fs'),
        mkdirp = require('mkdirp')

    favicons('./test/logo.png', {
        appName: "Favicons 4.0",
        appDescription: "Testing suite for Favicons",
        developerName: "Hayden Bleasel",
        developerURL: "http://haydenbleasel.com/",
        background: "#26353F",
        path: "test/images/",
        url: "http://haydenbleasel.com/",
        version: "1.0",
        logging: true,
        online: false
    }, function callback (error, response) {

        // error: any error that occurred in the process (string)
        if (error) {
            throw error;
        }

        console.log('Images: ' + response.images);
        console.log('Files: ' + response.files);
        console.log('HTML: ' + response.html);

        if (response.images) {
            mkdirp.sync('./test/images-offline/');
            response.images.forEach(function (image) {
                fs.writeFileSync('./test/images-offline/' + image.name, image.contents);
            });
        }

        if (response.files) {
            mkdirp.sync('./test/files-offline/');
            response.files.forEach(function (file) {
                fs.writeFileSync('./test/files-offline/' + file.name, file.contents);
            });
        }

        if (response.html) {
            fs.writeFileSync('./test/test.html', response.html.join('\n'));
        }

    });

    favicons('./test/logo.png', {
        appName: "Favicons 4.0",
        appDescription: "Testing suite for Favicons",
        developerName: "Hayden Bleasel",
        developerURL: "http://haydenbleasel.com/",
        background: "#26353F",
        path: "test/images/",
        version: "1.0",
        online: true
    }, function callback (error, response) {

        // error: any error that occurred in the process (string)
        if (error) {
            throw error;
        }

        console.log('Images: ' + response.images);
        console.log('Files: ' + response.files);
        console.log('HTML: ' + response.html);

        if (response.images) {
            mkdirp.sync('./test/images-online/');
            response.images.forEach(function (image) {
                fs.writeFileSync('./test/images-online/' + image.name, image.contents);
            });
        }

        if (response.files) {
            mkdirp.sync('./test/files-online/');
            response.files.forEach(function (file) {
                fs.writeFileSync('./test/files-online/' + file.name, file.contents);
            });
        }

    });

}());
