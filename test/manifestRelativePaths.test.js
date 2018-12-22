const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should images without options.path to manifests when manifestRelativePaths is true", async t => {
  t.plan(1);

  const result = await favicons(logo_png, {
    manifestRelativePaths: true,
    path: "favicons/",
    icons: {
      android: true,
      firefox: true,
      windows: true,
      yandex: true,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: false
    }
  });

  await snapshotResult(t, result);
});
