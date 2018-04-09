const favicons = require("../src");
const test = require("ava");

const { logo_png, normalize } = require("./util");

test("should return a promise if callback is undefined", t => {
  t.plan(1);

  return favicons(logo_png).then(result => {
    t.snapshot(normalize(result));
  });
});
