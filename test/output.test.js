const favicons = require("../src");
const test = require("ava");
const { logo_png } = require("./util");

test("should not generate images", async (t) => {
  t.plan(3);
  const { images, files, html } = await favicons(logo_png, {
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: true,
      firefox: true,
      windows: false,
      yandex: false,
    },
    output: {
      images: false,
    },
  });

  t.deepEqual(images, []);
  t.true(files.length > 0, "should generate file.");
  t.true(html.length > 0, "should generate html file.");
});

test("should not generate files", async (t) => {
  t.plan(3);
  const { images, files, html } = await favicons(logo_png, {
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: true,
      firefox: true,
      windows: false,
      yandex: false,
    },
    output: {
      files: false,
    },
  });

  t.deepEqual(files, []);
  t.true(images.length > 0, "should generate images.");
  t.true(html.length > 0, "should generate html file.");
});

test("should not generate html", async (t) => {
  t.plan(3);
  const { images, files, html } = await favicons(logo_png, {
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: true,
      firefox: true,
      windows: false,
      yandex: false,
    },
    output: {
      html: false,
    },
  });

  t.deepEqual(html, []);
  t.true(images.length > 0, "should generate images.");
  t.true(files.length > 0, "should generate file.");
});
