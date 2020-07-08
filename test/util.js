const path = require("path");

function fixture(uri) {
  return path.resolve(__dirname, "fixtures", uri);
}

["logo.png", "logo.svg", "logo_small.svg", "pixel_art.png"].forEach(img => {
  const key = img.replace(/\.([^.]+)$/, "_$1");

  module.exports[key] = fixture(img);
});
module.exports.pixel_art = module.exports.pixel_art_png;

module.exports.normalize = ({ files, images, html }) =>
  [...files, ...images].reduce(
    (obj, { name, contents }) => Object.assign(obj, { [name]: contents }),
    { "index.html": html }
  );
