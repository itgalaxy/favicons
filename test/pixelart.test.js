const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { pixel_art } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should support pixel art", async t => {
  t.plan(1);

  const result = await favicons(pixel_art, {
    pixel_art: true
  });

  await snapshotResult(t, result);
});
