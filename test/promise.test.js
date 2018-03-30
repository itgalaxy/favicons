const favicons = require('../src');
const test = require('ava');
const path = require('path');

test('should return a promise if callback is undefined', t => {
    t.plan(1);

    return favicons(path.join(__dirname, 'logo.png'), {}).then(response => {
        const result = [...response.files, ...response.images].reduce(
            (obj, {name, contents}) => Object.assign(obj, {[name]: contents}),
            {'index.html': response.html}
        );

        t.snapshot(result);
    });
});
