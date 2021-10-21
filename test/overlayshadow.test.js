const favicons = require("../src");
const { logo_png } = require("./util");

test("should allow configuring 'overlayShadow'", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    icons: {
      android: {
        background: true,
        mask: true,
        overlayShadow: true,
      },
      appleIcon: false,
      appleStartup: false,
      coast: false,
      firefox: false,
      windows: false,
      favicons: false,
      yandex: false,
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
