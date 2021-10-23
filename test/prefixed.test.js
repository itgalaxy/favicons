import favicons from "../src";
import { logo_png } from "./util";

test("should allow setting an URL prefix", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    path: "https://domain/subdomain",
  });

  await expect(result).toMatchFaviconsSnapshot();
});
