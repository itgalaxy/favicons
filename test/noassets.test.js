const favicons = require("../src");
const { logo_png } = require("./util");

test("should allow disabling asset generation", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: false,
      firefox: false,
      windows: false,
      yandex: false,
    },
  });

  expect(result).toStrictEqual({
    files: [],
    images: [],
    html: [],
  });
});
