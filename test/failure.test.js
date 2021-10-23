import favicons from "../src";
import { logo_png } from "./util";

test("should fail gracefully if no source is provided", async () => {
  expect.assertions(1);

  try {
    await favicons([]);
  } catch (err) {
    expect(err.message).toBe("No source provided");
  }
});

test("should fail gracefully if source is neither a buffer or a string", async () => {
  expect.assertions(2);

  try {
    // eslint-disable-next-line no-magic-numbers
    await favicons(42);
  } catch (err) {
    expect(err.message).toBe("Invalid source type provided");
  }

  try {
    // eslint-disable-next-line no-magic-numbers
    await favicons([42]);
  } catch (err) {
    expect(err.message).toBe("Invalid source type provided");
  }
});

test("should fail gracefully if buffer is empty", async () => {
  expect.assertions(2);

  try {
    await favicons(Buffer.from(""));
  } catch (err) {
    expect(err.message).toBe("Invalid image buffer");
  }

  try {
    await favicons([Buffer.from("")]);
  } catch (err) {
    expect(err.message).toBe("Invalid image buffer");
  }
});

test("should fail gracefully if path to source image is invalid", async () => {
  expect.assertions(2);

  try {
    await favicons("missing.png");
  } catch (err) {
    expect(err.message).toMatch("ENOENT: no such file or directory");
  }

  try {
    await favicons(["missing.png"]);
  } catch (err) {
    expect(err.message).toMatch("ENOENT: no such file or directory");
  }
});

xtest("should fail gracefully if option is not supported on platform", async () => {
  expect.assertions(1);

  try {
    await favicons(logo_png, {
      icons: {
        favicons: { foo: 10 },
      },
    });
  } catch (err) {
    expect(err.message).toBe("Unsupported option 'foo' on platform 'favicons'");
  }
});
