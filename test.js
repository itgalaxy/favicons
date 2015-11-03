/*jslint node:true*/
var favicons = require('./index');
favicons('./test/logo.png', {
    logging: true,
    background: '#26353F'
}, function () {
    // if writing, make directory
    console.log('done');
});
