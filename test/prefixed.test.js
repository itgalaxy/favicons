const favicons = require('../src');
const test = require('ava');
const path = require('path');

test('should allow setting an URL prefix', async t => {
    t.plan(1);

    const response = await favicons(path.join(__dirname, 'logo.png'), {
        path: 'https://domain/subdomain'
    });

    const result = [...response.files, ...response.images].reduce(
        (obj, {name, contents}) => Object.assign(obj, {[name]: contents}),
        {'index.html': response.html}
    );

    t.snapshot(result);
});
