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
        background: '#27353f',
        index: 'test/favicons.html',
        url: 'http://haydenbleasel.com',
        logging: true
    }
}, function (metadata) {
    console.log(metadata, 'meta');
});
