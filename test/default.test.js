import favicons from "../src";
import { logo_png } from "./util";

test("should generate the expected default result", async () => {
  expect.assertions(1);

  const result = await new Promise((resolve, reject) => {
    favicons(logo_png, {}, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

  await expect(result).toMatchFaviconsSnapshot();
});
