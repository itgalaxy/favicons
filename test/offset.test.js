const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should allow offsetting the icon on selected platforms", async t => {
  t.plan(1);

  const result = await favicons(logo_png, {
    icons: {
      android: { offset: 10 },
      appleIcon: { offset: 10 },
      appleStartup: { offset: 10 },
      coast: { offset: 10 },
      firefox: { offset: 10 }
    }
  });

  await snapshotResult(t, result);
});
