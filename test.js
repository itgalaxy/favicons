var favicons = require('./index.js');
favicons({
    source: 'test/logo.png',
    dest: 'test/images',
    html: 'test/favicons.html',
    background: '#1d1d1d',
    logging: true
});
