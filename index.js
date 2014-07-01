/*jslint devel:true*/
/*global module, require*/

(function () {

    'use strict';

    var exec = require('child_process').exec,
        defaults = require('lodash.defaults');

    module.exports = function (params) {

        var options = defaults(params || {}, {
            source: 'apple-touch-icon.png',
            sizes: [16, 32, 48, 64],
            out: 'favicon.ico',
            upscale: false,
            callback: null
        }),
            command = 'convert ' + options.source + ' -bordercolor white -border 0 ',
            size;

        exec('identify -format "%[fx:w]" ' + options.source, function (err, stdout) {
            if (err) {
                console.log(err);
                return;
            }
            var i;
            for (i = 0; i < options.sizes.length; i += 1) {
                size = options.sizes[i];
                if (options.upscale || (!options.upscale && parseInt(stdout, 10) >= size)) {
                    command += '\\( -clone 0 -resize ' + size + 'x' + size + ' \\) ';
                }
            }

            command += '-delete 0 -alpha off -colors 256 ' + options.out;

            exec(command, function (err) {
                if (options.callback) {
                    options.callback(err, 'Generated favicon.ico');
                }
            });

        });

    };

}());
