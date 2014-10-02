var favicons = require('./index.js');
favicons({
    source: {
        small: 'test/source/logo-small.png',
        medium: 'test/source/logo-medium.png',
        large: 'test/source/logo-large.png'
    },
    dest: 'test/images',
    html: 'test/favicons.html',
    background: '#1d1d1d',
    manifest: 'test/manifest.webapp',
    logging: true
});
