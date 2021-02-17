const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_svg } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, (v) => new Image(v[0], v[1])));

test("should support svg images", async (t) => {
  t.plan(1);
  await snapshotResult(t, await favicons(logo_svg));
});
