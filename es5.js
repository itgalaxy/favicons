'use strict';

var favicons = require('favicons/es5');

(function () {
    'use strict';

    module.exports = function (params) {
        return favicons.stream(params);
    };
    module.exports.config = favicons.config;
})();
