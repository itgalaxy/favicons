/*jslint node:true*/
var favicons = require('../index.js'),
    argv = require('minimist')(process.argv.slice(2));
favicons(argv, console.log);
