const favicons = require("../src");
const test = require("ava");

const { logo_png, normalize } = require("./util");

test("should allow configuring 'overlayShadow'", async t => {
  t.plan(1);

  const result = await favicons(logo_png, {
    icons: {
      android: {
        background: true,
        mask: true,
        overlayShadow: true
      },
      appleIcon: false,
      appleStartup: false,
      coast: false,
      firefox: false,
      windows: false,
      favicons: false,
      yandex: false
    }
  });

  t.snapshot(normalize(result));
});
