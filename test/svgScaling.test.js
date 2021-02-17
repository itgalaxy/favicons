const favicons = require("../src");
const test = require("ava");

const { logo_small_svg } = require("./util");

// Only one iconset is required that contains large enough images to compare the
// difference between the generated files.
const icons = {
  android: false,
  appleIcon: true,
  appleStartup: false,
  coast: false,
  favicons: false,
  firefox: false,
  windows: false,
  yandex: false,
};

test("should scale the SVG image properly", async (t) => {
  const result = await favicons(logo_small_svg, { icons });
  const largeImage = result.images.find(
    (image) => image.name === "apple-touch-icon-1024x1024.png"
  );

  t.plan(1);
  t.snapshot(largeImage.contents);
});
