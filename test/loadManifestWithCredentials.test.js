const favicons = require("../src");
const test = require("ava");

const { logo_png, normalize } = require("./util");

test("should add crossOrigin to manifest tag when loadManifestWithCredentials is true", async t => {
  t.plan(1);

  const result = await favicons(logo_png, {
    loadManifestWithCredentials: true,
    icons: {
      android: true,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: false,
      firefox: false,
      windows: false,
      yandex: false
    }
  });

  t.snapshot(normalize(result));
});
