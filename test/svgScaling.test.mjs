import favicons from "../src";
import { logo_small_svg } from "./util";

// Only one iconset is required that contains large enough images to compare the
// difference between the generated files.
const icons = {
  android: false,
  appleIcon: true,
  appleStartup: false,
  favicons: false,
  windows: false,
  yandex: false,
};

test("should scale the SVG image properly", async () => {
  expect.assertions(1);
  const result = await favicons(logo_small_svg, { icons });

  result.images = result.images.filter(
    (image) => image.name === "apple-touch-icon-1024x1024.png",
  );

  await expect(result).toMatchFaviconsSnapshot();
});
