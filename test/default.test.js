const favicons = require('../src');
const test = require('ava');
const path = require('path');

test.cb('should generate the expected default result', t => {
    t.plan(1);

    favicons(path.join(__dirname, 'logo.png'), {}, (error, response) => {

        if (error) {
            throw error;
        }

        const result = [...response.files, ...response.images].reduce(
            (obj, {name, contents}) => Object.assign(obj, {[name]: contents}),
            {'index.html': response.html}
        );

        t.snapshot(result);
        t.end();
    });
});
