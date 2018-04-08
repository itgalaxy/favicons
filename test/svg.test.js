const favicons = require('../src');
const test = require('ava');

const {logo_svg, normalize} = require('./util');

test('should support svg images', async t => {
    t.plan(1);

    const result = await favicons(logo_svg);

    t.snapshot(normalize(result));
});
