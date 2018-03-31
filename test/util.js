const path = require('path');

module.exports.logo = path.resolve(__dirname, 'logo.png');

module.exports.normalize = ({files, images, html}) => (
    [...files, ...images].reduce(
        (obj, {name, contents}) => Object.assign(obj, {[name]: contents}),
        {'index.html': html}
    )
);
