const favicons = require('../src');
const test = require('ava');

const {logo_png} = require('./util');

test('should allow enabling verbose output', async t => {
    await favicons(logo_png, {
      logging: true,
    });

    t.pass();
});
