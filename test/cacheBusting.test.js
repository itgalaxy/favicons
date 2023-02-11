import favicons from "../src";
import { logo_png } from "./util";

test("should allow setting an URL query parameter for cache busting", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    output: { images: false },
    cacheBustingQueryParam: "v=1",
  });

  await expect(result).toMatchFaviconsSnapshot();
});
