const gulp = require('gulp'),
    gutil = require('gutil'),
    path = require('path'),
    favicons = require('../').stream,
    dircompare = require('dir-compare');

(() => {

    'use strict';

    gulp.task('default', () =>
        gulp.src('logo.png')
            .pipe(favicons({
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
                html: 'index.html',
                pipeHTML: true,
                replace: false
            }))
            .on('error', gutil.log)
            .pipe(gulp.dest('stream/')));

    const output = path.join(__dirname, 'stream');
    const fixtures = path.join(__dirname, 'fixtures');

    dircompare.compare(output, fixtures, {compareContent: true}).then(diff => {
        const failed = diff.diffSet
            .filter(result => result.state !== 'equal')
            .map(result => `${path.join(result.path1 || '', result.name1 + '')} ≠ ${path.join(result.path2 || '', result.name2 + '')}`);

        if (failed.length) {
            console.log(failed.join('\n'));
            process.exit(failed.length);
        }
    });
})();
