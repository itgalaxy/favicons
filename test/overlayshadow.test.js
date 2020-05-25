const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should allow configuring 'overlayShadow'", async t => {
  t.plan(1);

  const result = await favicons(logo_png, {
    icons: {
      android: {
        background: true,
        mask: true,
        overlayShadow: true
      },
      apple: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      firefox: false,
      windows: false,
      favicons: false,
      yandex: false
    }
  });

  await snapshotResult(t, result);
});
