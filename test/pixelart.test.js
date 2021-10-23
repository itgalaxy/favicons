import favicons from "../src";
import { pixel_art } from "./util";

test("should support pixel art", async () => {
  expect.assertions(1);

  const result = await favicons(pixel_art, {
    pixel_art: true,
  });

  await expect(result).toMatchFaviconsSnapshot();
});
