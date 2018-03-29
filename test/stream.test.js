const favicons = require('../src').stream;
const test = require('ava');
const path = require('path');
const gulp = require('gulp');

test.cb('should provide stream interface', t => {
    t.plan(1);

    const result = {};

    gulp.src(path.join(__dirname, 'logo.png'))
        .pipe(favicons({ html: 'index.html', pipeHTML: true }))
        .on('data', chunk => result[chunk.path] = chunk.contents)
        .on('end', () => {
            t.snapshot(result);
            t.end();
        });
});
