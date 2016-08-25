/* eslint no-sync: 0 */

const favicons = require('../'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

(() => {

    'use strict';

    favicons('./logo.png', {
        appName: 'Favicons 4.0',
        appDescription: 'Testing suite for Favicons',
        developerName: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com/',
        background: '#26353F',
        theme_color: 'aliceblue',
        dir: 'ltr',
        lang: 'en-US',
        path: 'images/',
        url: 'http://haydenbleasel.com/',
        display: 'browser',
        orientation: 'landscape',
        start_url: "/?android-homescreen=1",
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
            mkdirp.sync('./images-offline/');
            response.images.forEach((image) =>
                fs.writeFileSync(`./images-offline/${ image.name }`, image.contents));
        }

        if (response.files) {
            mkdirp.sync('./files-offline/');
            response.files.forEach((file) =>
                fs.writeFileSync(`./files-offline/${ file.name }`, file.contents));
        }

        if (response.html) {
            fs.writeFileSync('./test.html', response.html.join('\n'));
        }

    });

    favicons('./logo.png', {
        appName: 'Favicons 4.0',
        appDescription: 'Testing suite for Favicons',
        developerName: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com/',
        background: '#26353F',
        path: 'images/',
        display: 'browser',
        orientation: 'landscape',
        version: '1.0',
        online: true,
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
            mkdirp.sync('./images-online/');
            response.images.forEach((image) =>
                fs.writeFileSync(`./images-online/${ image.name }`, image.contents));
        }

        if (response.files) {
            mkdirp.sync('./files-online/');
            response.files.forEach((file) =>
                fs.writeFileSync(`./files-online/${ file.name }`, file.contents));
        }

        if (response.html) {
            fs.writeFileSync('./rfg.html', response.html.join('\n'));
        }

    });

})();
