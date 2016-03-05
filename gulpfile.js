var gulp   = require('gulp'),
	gulpif = require('gulp-if'),
    babel  = require('gulp-babel'),
    rename = require("gulp-rename");

gulp.task('default', () => {
    return gulp.src(['index.js', 'helpers.js'])
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(gulpif(/^index\.js$/, rename('es5.js')))
    .pipe(gulpif(/^helpers\.js$/, rename('helpers-es5.js')))
    .pipe(gulp.dest('.'));
});
