const favicons = require("../src").stream;
const test = require("ava");
const gulp = require("gulp");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

test("should provide stream interface", async t => {
  t.plan(1);

  const result = {
    images: []
  };

  return new Promise((resolve, reject) => {
    gulp
      .src(logo_png)
      .pipe(favicons({}, html => (result["index.html"] = html)))
      .on("data", chunk => {
        result.images.push({
          name: chunk.path,
          contents: chunk.contents
        });
      })
      .on("end", () => {
        snapshotResult(t, result).then(resolve, reject);
      });
  });
});

test("should stream html file", async t => {
  let found = false;

  await new Promise(resolve => {
    gulp
      .src(logo_png)
      .pipe(favicons({ pipeHTML: true, html: "foo.html" }))
      .on("data", chunk => {
        if (chunk.basename === "foo.html") {
          found = true;
        }
      })
      .on("end", () => resolve());
  });

  t.true(found);
});
