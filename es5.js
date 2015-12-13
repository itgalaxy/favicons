'use strict';

var favicons = require('favicons/es5').stream;

(function () {
    'use strict';

    module.exports = function (params) {
        return favicons(params);
    };
})();
