const gulp = require('gulp'),
    test = require('ava'),
    gutil = require('gutil'),
    path = require('path'),
    favicons = require('../src/').stream,
    dircompare = require('dir-compare');

test.cb('should provide stream interface', t => {
    t.plan(1);

    const output = path.join(__dirname, 'stream');
    const fixtures = path.join(__dirname, 'fixtures');

    gulp.src(path.join(__dirname, 'logo.png'))
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
        .pipe(gulp.dest(output));

    dircompare.compare(output, fixtures, {compareContent: true}).then(diff => {
        const failed = diff.diffSet
            .filter(result => result.state !== 'equal')
            .map(result => `${path.join(result.path1 || '', result.name1 + '')} ≠ ${path.join(result.path2 || '', result.name2 + '')}`);

        t.deepEqual(failed, []);
        t.end();
    });
});
