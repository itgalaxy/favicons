const favicons = require('../src');
const test = require('ava');

const {logo_png, normalize} = require('./util');

test('should allow configuring background color on selected platforms', async t => {
    t.plan(1);

    const result = await favicons(logo_png, {
      icons: {
        android: {background: true},
        appleIcon: {background: true},
        appleStartup: {background: true},
        coast: {background: true},
        firefox: {background: true},
        windows: {background: true},
        yandex: {background: true},
      },
    });

    t.snapshot(normalize(result));
});
