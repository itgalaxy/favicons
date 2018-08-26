const gulp = require("gulp");
const babel = require("gulp-babel");
const eslint = require("gulp-eslint");

gulp.task("default", () =>
  Promise.all([
    gulp
      .src(["src/index.js", "src/helpers.js"])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError())
      .pipe(babel())
      .pipe(gulp.dest("dist/")),

    gulp.src(["src/mask.png", "src/overlay-*.png"]).pipe(gulp.dest("dist/")),

    gulp.src(["src/config/*"]).pipe(gulp.dest("dist/config/"))
  ])
);
