import favicons from "../src";
import { chess_8x6 } from "./util";

it("preserves aspect ratio", async () => {
  expect.assertions(1);

  const result = await favicons(chess_8x6);

  await expect(result).toMatchFaviconsSnapshot();
});
