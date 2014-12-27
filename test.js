var favicons = require('./index.js');

favicons({
    files: {
        src: 'test/source/logo.png',
        dest: 'test/images',
        html: 'test/favicons.html',
        iconsPath: 'images'
    },
    settings: {
        appName: 'Favicons',
        appDescription: 'Favicon generator for Node.js',
        developer: 'Hayden Bleasel',
        developerURL: 'http://haydenbleasel.com',
        background: '#1d1d1d',
        index: 'test/favicons.html',
        url: 'http://haydenbleasel.com',
        logging: true
    }
}, function (err, metadata) {
    if (err) throw err;
    console.log(metadata, 'meta');
});
