const favicons = require("../src");
const fs = require("fs");
const { logo_png, logo_svg } = require("./util");

test("should add `maskable` to manifest purpose when manifestMaskable is true", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    manifestMaskable: true,
  });

  await expect(result).toMatchFaviconsSnapshot();
});

test("manifestMaskable should accept an array of either buffers or paths to source images", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    // eslint-disable-next-line no-sync
    manifestMaskable: [logo_png, fs.readFileSync(logo_svg)],
  });

  await expect(result).toMatchFaviconsSnapshot();
});
