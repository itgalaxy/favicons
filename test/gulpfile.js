const gulp = require('gulp'),
    gutil = require('gutil'),
    favicons = require('../').stream;

(() => {

    'use strict';

    gulp.task('default', () =>
        gulp.src('logo.png')
            .pipe(favicons({
                appName: 'Favicons 4.0',
                appDescription: 'Testing suite for Favicons',
                developerName: 'Hayden Bleasel',
                developerURL: 'http://haydenbleasel.com/',
                background: '#26353F',
                path: 'stream/',
                url: 'http://haydenbleasel.com/',
                display: 'browser',
                orientation: 'landscape',
                version: '1.0',
                logging: true,
                online: false,
                icons: {
                    coast: false
                },
                html: 'stream.html',
                pipeHTML: true,
                replace: false
            }))
            .on('error', gutil.log)
            .pipe(gulp.dest('stream/')));

})();
