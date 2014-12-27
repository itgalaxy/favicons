# gulp-favicons [![Build Status](https://travis-ci.org/haydenbleasel/favicons.svg?branch=gulp)](https://travis-ci.org/haydenbleasel/favicons)

Favicons generator for Gulp. Simple wrapper around [favicons](https://github.com/haydenbleasel/favicons). Installed through NPM with:

```
npm install gulp-favicons --save-dev
```

Check out favicons for example options. Example usage:

```
gulp.task('default', function () {
    gulp.src('index.html')
        .pipe(favicons({
            files: { dest: 'images/' },
            settings: { background: '#1d1d1d' }
        }))
        .pipe(gulp.dest('./'));
});
```

If you don't specify some options, gulp-humans checks your source HTML file for:

```
<title>...</title>
<meta name="author" content="..." />
<meta name="description" content="..." />
<link rel="canonical" href="..." />
<link rel="favicons" href="..." />
```

Note: `link[rel="favicons"]` is a custom tag designed for gulp-favicons. It will be removed upon processing.
