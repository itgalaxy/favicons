import favicons from "../src";
import { logo_png } from "./util";

// eslint-disable no-magic-numbers

test("should fail gracefully if no source is provided", async () => {
  expect.assertions(1);
  await expect(favicons([])).rejects.toThrow("No source provided");
});

test("should fail gracefully if source is neither a buffer or a string", async () => {
  expect.assertions(2);
  await expect(favicons(42)).rejects.toThrow("Invalid source type provided");
  await expect(favicons([42])).rejects.toThrow("Invalid source type provided");
});

test("should fail gracefully if buffer is empty", async () => {
  expect.assertions(2);

  await expect(favicons(Buffer.from(""))).rejects.toThrow(
    "Invalid image buffer",
  );
  await expect(favicons([Buffer.from("")])).rejects.toThrow(
    "Invalid image buffer",
  );
});

test("should fail gracefully if path to source image is invalid", async () => {
  expect.assertions(2);

  await expect(favicons("missing.png")).rejects.toThrow(
    /ENOENT: no such file or directory/,
  );
  await expect(favicons(["missing.png"])).rejects.toThrow(
    /ENOENT: no such file or directory/,
  );
});

test.skip("should fail gracefully if option is not supported on platform", async () => {
  expect.assertions(1);

  await expect(
    favicons(logo_png, {
      icons: {
        favicons: { foo: 10 },
      },
    }),
  ).rejects.toThrow("Unsupported option 'foo' on platform 'favicons'");
});
