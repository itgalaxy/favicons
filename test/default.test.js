const favicons = require("../src");
const test = require("ava");

const { logo_png, normalize } = require("./util");

test.cb("should generate the expected default result", t => {
  t.plan(1);

  favicons(logo_png, {}, (error, result) => {
    if (error) {
      throw error;
    }

    t.snapshot(normalize(result));
    t.end();
  });
});
