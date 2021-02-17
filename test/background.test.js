const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, (v) => new Image(v[0], v[1])));

test("should allow configuring background color on selected platforms", async (t) => {
  t.plan(1);

  const result = await favicons(logo_png, {
    icons: {
      android: { background: true },
      appleIcon: { background: true },
      appleStartup: { background: true },
      coast: { background: true },
      firefox: { background: true },
      windows: { background: true },
      yandex: { background: true },
    },
  });

  await snapshotResult(t, result);
});
