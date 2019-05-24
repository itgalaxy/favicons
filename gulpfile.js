const gulp = require("gulp");
const babel = require("gulp-babel");
const eslint = require("gulp-eslint");
const del = require("del");

gulp.task("clean", () => del("dist/**", { force: true }));

gulp.task("build", () =>
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

gulp.task("default", gulp.series("clean", "build"));
