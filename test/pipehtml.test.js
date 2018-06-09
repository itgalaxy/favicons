const favicons = require("../src");
const test = require("ava");

const { logo_png } = require("./util");

test("should allow piping HTML as a file", async t => {
  t.plan(1);

  const html = "filename.html";
  const { files } = await favicons(logo_png, { html, pipeHTML: true });

  t.snapshot(files.find(({ name }) => name === html));
});
