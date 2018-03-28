var gulp   = require('gulp'),
    babel  = require('gulp-babel');

gulp.task('default', () => {
    gulp.src(['src/index.js', 'src/helpers.js'])
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(gulp.dest('dist/'));

    gulp.src(['src/mask.png', 'src/overlay.png'])
    .pipe(gulp.dest('dist/'));

    gulp.src(['src/config/*'])
    .pipe(gulp.dest('dist/config/'));
});
