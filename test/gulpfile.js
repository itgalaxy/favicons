var gulp = require('gulp'),
    favicons = require('../');

gulp.task('default', function () {
    gulp.src('index.html')
        .pipe(favicons({
            files: { dest: 'images/' },
            settings: { background: '#1d1d1d' }
        }))
        .pipe(gulp.dest('./'));
});
