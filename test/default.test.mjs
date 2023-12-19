import favicons from "../src";
import { logo_png } from "./util";

test("should generate the expected default result", async () => {
  expect.assertions(1);
  const result = await favicons(logo_png, {});
  await expect(result).toMatchFaviconsSnapshot();
});
