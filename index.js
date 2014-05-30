/*jslint devel:true*/
/*global module, require*/

(function () {

    'use strict';

    var sys = require('sys'),
        exec = require('child_process').exec,
        defaults = require('lodash.defaults');
    
    module.exports = function (params) {

        var options = defaults(params || {}, {
            source: 'apple-touch-icon.png',
            sizes: [16, 32, 48, 64],
            out: 'favicon.ico'
        }),
            command,
            i,
            size;

        command = 'convert ' + options.source + ' -bordercolor white -border 0 ';

        for (i = 0; i < options.sizes.length; i += 1) {
            size = options.sizes[i];
            command += '\\( -clone 0 -resize ' + size + 'x' + size + ' \\) ';
        }

        command += '-delete 0 -alpha off -colors 256 ' + options.out;

        exec(command);

        console.log('Generated favicon.ico');

    };

}());
