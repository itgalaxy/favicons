import favicons from "../src";
import { logo_png } from "./util";

test("should allow configuring background color on selected platforms", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    icons: {
      android: { background: true },
      appleIcon: { background: true },
      appleStartup: { background: true },
      windows: { background: true },
      yandex: { background: true },
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
