import favicons from "../src";
import { logo_png, logo_svg } from "./util";

test("should reuse svg as a favicon", async () => {
  expect.assertions(1);

  const result = await favicons(logo_svg, {
    icons: {
      favicons: ["favicon.svg"],
      android: false,
      appleIcon: false,
      appleStartup: false,
      windows: false,
      yandex: false,
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});

test("should generate svg favicon", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    icons: {
      favicons: ["favicon.svg"],
      android: false,
      appleIcon: false,
      appleStartup: false,
      windows: false,
      yandex: false,
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
