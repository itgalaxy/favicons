var gulp = require('gulp'),
    favicons = require('../');

gulp.task('default', function () {
    gulp.src('index.html')
        .pipe(favicons({ dest: 'images/' }))
        .pipe(gulp.dest('./'));
});
