/* eslint no-sync: 0 */

const favicons = require('./index'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

(() => {

    'use strict';

    favicons('./test/logo.png', {
        appName: 'Favicons 4.0',
        appDescription: 'Testing suite for Favicons',
        developerName: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com/',
        background: '#26353F',
        path: 'test/images/',
        url: 'http://haydenbleasel.com/',
        display: 'browser',
        orientation: 'landscape',
        version: '1.0',
        logging: true,
        online: false,
        icons: {
            coast: false
        }
    }, (error, response) => {

        if (error) {
            throw error;
        }

        console.log(`Images: ${ response.images }`);
        console.log(`Files: ${ response.files }`);
        console.log(`HTML: ${ response.html }`);

        if (response.images) {
            mkdirp.sync('./test/images-offline/');
            response.images.forEach((image) =>
                fs.writeFileSync(`./test/images-offline/${ image.name }`, image.contents));
        }

        if (response.files) {
            mkdirp.sync('./test/files-offline/');
            response.files.forEach((file) =>
                fs.writeFileSync(`./test/files-offline/${ file.name }`, file.contents));
        }

        if (response.html) {
            fs.writeFileSync('./test/test.html', response.html.join('\n'));
        }

    });

    favicons('./test/logo.png', {
        appName: 'Favicons 4.0',
        appDescription: 'Testing suite for Favicons',
        developerName: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com/',
        background: '#26353F',
        path: 'test/images/',
        display: 'browser',
        orientation: 'landscape',
        version: '1.0',
        online: true
    }, (error, response) => {

        if (error) {
            throw error;
        }

        console.log(`Images: ${ response.images }`);
        console.log(`Files: ${ response.files }`);
        console.log(`HTML: ${ response.html }`);

        if (response.images) {
            mkdirp.sync('./test/images-online/');
            response.images.forEach((image) =>
                fs.writeFileSync(`./test/images-online/${ image.name }`, image.contents));
        }

        if (response.files) {
            mkdirp.sync('./test/files-online/');
            response.files.forEach((file) =>
                fs.writeFileSync(`./test/files-online/${ file.name }`, file.contents));
        }

    });

})();
