var favicons = require('../')
var argv = require('minimist')(process.argv.slice(2))
favicons(argv, console.log)
