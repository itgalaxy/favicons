const favicons = require("../src");
const test = require("ava");

// const { snapshotManager } = require("ava/lib/concordance-options");
// const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
// const { Image } = require("./Image");

// snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should allow to restrict the icons to generate", async t => {
  // eslint-disable-next-line no-magic-numbers
  t.plan(1);

  const { images } = await favicons(logo_png, {
    icons: {
      favicons: ["favicon-32x32.png"],
      android: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      firefox: false,
      windows: false,
      yandex: false
    }
  });

  t.deepEqual(images.length, 1);
});
