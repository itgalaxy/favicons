const path = require("path");

module.exports.logo_png = path.resolve(__dirname, "fixtures", "logo.png");
module.exports.logo_svg = path.resolve(__dirname, "fixtures", "logo.svg");
module.exports.logo_small_svg = path.resolve(
  __dirname,
  "fixtures",
  "logo_small.svg"
);
module.exports.pixel_art = path.resolve(__dirname, "fixtures", "pixel_art.png");

module.exports.normalize = ({ files, images, html }) =>
  [...files, ...images].reduce(
    (obj, { name, contents }) => Object.assign(obj, { [name]: contents }),
    { "index.html": html }
  );
