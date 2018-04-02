const favicons = require('../src');
const test = require('ava');
const fs = require('fs');

const {logo_png, logo_svg, normalize} = require('./util');

test('should accept an array of either buffers or paths to source images', async t => {
    t.plan(1);

    const result = await favicons([logo_png, fs.readFileSync(logo_svg)], {});

    t.snapshot(normalize(result));
});
