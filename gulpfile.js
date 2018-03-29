var gulp   = require('gulp'),
    babel  = require('gulp-babel');

gulp.task('default', () => Promise.all([
    gulp.src(['src/index.js', 'src/helpers.js'])
    .pipe(babel({
        presets: [
            ['env', {
                targets: {
                    node: "4"
                },
                exclude: [
                    'transform-regenerator'
                ]
            }]
        ]
    }))
    .pipe(gulp.dest('dist/')),

    gulp.src(['src/mask.png', 'src/overlay.png'])
    .pipe(gulp.dest('dist/')),

    gulp.src(['src/config/*'])
    .pipe(gulp.dest('dist/config/')),
]));
