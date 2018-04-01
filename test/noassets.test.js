const favicons = require('../src');
const test = require('ava');

const {logo_png, normalize} = require('./util');

test('should allow disabling asset generation', async t => {
    t.plan(3);

    const {files, images, html} = await favicons(logo_png, {
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: false,
        firefox: false,
        windows: false,
        yandex: false,
      },
    });

    t.deepEqual(files, []);
    t.deepEqual(images, []);
    t.deepEqual(html, []);
});
