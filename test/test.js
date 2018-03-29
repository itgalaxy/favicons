/* eslint no-sync: 0 */

const favicons = require('../'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    dircompare = require('dir-compare');

(() => {

    'use strict';

    favicons('./logo.png', {
        appName: 'Favicons',
        appDescription: 'Testing suite for Favicons',
        developerName: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com/',
        background: '#26353F',
        theme_color: 'aliceblue',
        dir: 'ltr',
        lang: 'en-US',
        path: '',
        url: 'http://haydenbleasel.com/',
        display: 'browser',
        orientation: 'landscape',
        start_url: "/?homescreen=1",
        version: '1.0',
        logging: true,
    }, (error, response) => {

        if (error) {
            throw error;
        }

        const output = path.join(__dirname, 'output');
        const fixtures = path.join(__dirname, 'fixtures');

        mkdirp.sync(output);

        if (response.images) {
            response.images.forEach((image) =>
                fs.writeFileSync(path.join(output, image.name), image.contents));
        }

        if (response.files) {
            response.files.forEach((file) =>
                fs.writeFileSync(path.join(output, file.name), file.contents));
        }

        if (response.html) {
            fs.writeFileSync(path.join(output, 'index.html'), response.html.join('\n'));
        }

        dircompare.compare(output, fixtures, {compareContent: true}).then(diff => {
            const failed = diff.diffSet
                .filter(result => result.state !== 'equal')
                .map(result => `${path.join(result.path1 || '', result.name1 + '')} ≠ ${path.join(result.path2 || '', result.name2 + '')}`);

            if (failed.length) {
                console.log(failed.join('\n'));
                process.exit(failed.length);
            }
        });
    });

})();
