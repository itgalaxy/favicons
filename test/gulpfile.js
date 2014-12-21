var gulp = require('gulp'),
    favicons = require('../');

gulp.task('default', function () {
    gulp.src('styles.css')
        .pipe(favicons({ img: 'images/' }))
        .pipe(gulp.dest('./'));
});
