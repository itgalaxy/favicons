const favicons = require('favicons');

(() => {

    'use strict';

    module.exports = (params) => favicons.stream(params);
    module.exports.config = favicons.config;

})();
