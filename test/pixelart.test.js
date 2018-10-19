const favicons = require("../src");
const test = require("ava");

const { pixel_art, normalize } = require("./util");

test("should support pixel art", async t => {
  t.plan(1);

  const result = await favicons(pixel_art, {
    pixel_art: true
  });

  t.snapshot(normalize(result));
});
