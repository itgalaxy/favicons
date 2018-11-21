const favicons = require("../src");
const test = require("ava");

const { logo_png, normalize } = require("./util");

test("should images without options.path to manifests when manifestRelativePaths is true", async t => {
  t.plan(1);

  const result = await favicons(logo_png, {
    manifestRelativePaths: true,
    path: "favicons/",
    icons: {
      android: true,
      firefox: true,
      windows: true,
      yandex: true,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: false
    }
  });

  t.snapshot(normalize(result));
});
