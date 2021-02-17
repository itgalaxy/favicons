const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, (v) => new Image(v[0], v[1])));

test("should generate the expected default result", async (t) => {
  t.plan(1);

  return new Promise((resolve, reject) => {
    favicons(logo_png, {}, (error, result) => {
      if (error) {
        reject(error);
      }

      snapshotResult(t, result).then(resolve, reject);
    });
  });
});
