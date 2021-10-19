const favicons = require("../src");
const { logo_svg } = require("./util");

test("should support svg images", async () => {
  expect.assertions(1);
  const result = await favicons(logo_svg);

  await expect(result).toMatchFaviconsSnapshot();
});
