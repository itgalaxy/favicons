import favicons from "../src";
import { logo_png } from "./util";

test("should images without options.path to manifests when manifestRelativePaths is true", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    manifestRelativePaths: true,
    path: "favicons/",
    icons: {
      android: true,
      windows: true,
      yandex: true,
      appleIcon: false,
      appleStartup: false,
      favicons: false,
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
