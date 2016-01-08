'use strict';

var favicons = require('favicons');

(function () {
    'use strict';

    module.exports = function (params) {
        return favicons.stream(params);
    };
    module.exports.config = favicons.config;
})();
