const favicons = require("../src").stream;
const test = require("ava");
const gulp = require("gulp");

const { logo_png } = require("./util");

test.cb("should provide stream interface", t => {
  t.plan(1);

  const result = {};

  gulp
    .src(logo_png)
    .pipe(favicons({}, html => (result["index.html"] = html)))
    .on("data", chunk => (result[chunk.path] = chunk.contents))
    .on("end", () => {
      t.snapshot(result);
      t.end();
    });
});
