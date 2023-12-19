import favicons from "../src";
import { logo_png } from "./util";

test("should allow disabling asset generation", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    icons: {
      android: false,
      appleIcon: false,
      appleStartup: false,
      favicons: false,
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
