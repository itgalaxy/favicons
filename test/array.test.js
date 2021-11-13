import favicons from "..";
import * as fs from "fs";
import { logo_png, logo_svg, pixel_art } from "./util";

test("should accept an array of either buffers or paths to source images", async () => {
  expect.assertions(1);

  // eslint-disable-next-line no-sync
  const result = await favicons([logo_png, fs.readFileSync(logo_svg)]);

  await expect(result).toMatchFaviconsSnapshot();
});

test("should select best source image by its size", async () => {
  expect.assertions(1);

  const result = await favicons([logo_png, pixel_art]);

  await expect(result).toMatchFaviconsSnapshot();
});
