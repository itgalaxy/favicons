var favicons = require('./index.js');
favicons({
    src: {
        small: 'test/source/logo-small.png',
        medium: 'test/source/logo-medium.png',
        large: 'test/source/logo-large.png'
    },
    dest: 'test/images',
    html: 'test/favicons.html',
    background: '#1d1d1d',
    manifest: 'test/manifest.webapp',
    url: 'http://haydenbleasel.com',
    logging: true,
}, function (err, css, images) {
    // Callback is running before RFG finishes.
    console.log(css);
    console.log(images);
});
