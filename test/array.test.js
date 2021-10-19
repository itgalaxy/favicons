const favicons = require("../src");
const fs = require("fs");
const { logo_png, logo_svg } = require("./util");

test("should accept an array of either buffers or paths to source images", async () => {
  expect.assertions(1);

  // eslint-disable-next-line no-sync
  const result = await favicons([logo_png, fs.readFileSync(logo_svg)]);

  await expect(result).toMatchFaviconsSnapshot();
});
