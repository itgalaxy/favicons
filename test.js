var favicons = require('./index.js');

favicons({
    files: {
        src: 'test/logo.png',
        dest: 'test/favicons',
        html: 'test/test.html',
        iconsPath: 'favicons'
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
