const favicons = require("../src");
const { pixel_art } = require("./util");

test("should support pixel art", async () => {
  expect.assertions(1);

  const result = await favicons(pixel_art, {
    pixel_art: true,
  });

  await expect(result).toMatchFaviconsSnapshot();
});
