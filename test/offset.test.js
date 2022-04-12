import favicons from "../src";
import { logo_png } from "./util";

test("should allow offsetting the icon on selected platforms", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    icons: {
      android: { offset: 10 },
      appleIcon: { offset: 10 },
      appleStartup: { offset: 10 },
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
