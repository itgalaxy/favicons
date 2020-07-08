const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image } = require("./Image");

snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should allow to restrict the icons to generate", async t => {
  t.plan(1);

  const { files, images, html } = await favicons(logo_png, {
    icons: { favicons: ["favicon-32x32.png"] }
  });

  t.deepEqual(files, []);
  t.deepEqual(images.length, 1);
  t.deepEqual(html, []);
});
