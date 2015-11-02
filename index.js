/*jslint node:true, nomen:true*/
(function () {

    'use strict';

    // Node modules
    var _ = require('underscore'),
        defaults = require('data/defaults.json');

    module.exports = function (source, configuration, callback) {

        // 1. Take a set of icon parameters (default all to true)
        var options = _.defaults(configuration || {}, defaults);

        function print(message) {
            if (options.settings.logging && message) {
                console.log(message + '...');
            }
        }

        // 2. Take a single image or an object of images { size: image }
        print('Favicons source is ' + (typeof source === 'object' ? 'an object' : 'a string') + '.');

        // 3. Resize each image into it's appropriate size (solve object->resize logic)
        if (typeof source === 'object') {

        } else {

        }

        /*
            async.each(icons, function (platform) {
                // Platform: Apple, Android, Coast, etc.

            });
        */

        // 4. Generate code for each favicon

        // 5. Return code and images into a buffer? Promise? Whatever. { code: '', images: { ... } }
        return callback();

    };

}());
