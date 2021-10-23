import favicons from "../src";
import { logo_png } from "./util";

test("should add crossOrigin to manifest tag when loadManifestWithCredentials is true", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    loadManifestWithCredentials: true,
    icons: {
      android: true,
      appleIcon: false,
      appleStartup: false,
      coast: false,
      favicons: false,
      firefox: false,
      windows: false,
      yandex: false,
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
