import favicons from "../src";
import { logo_png } from "./util";

test("should not generate images", async () => {
  expect.assertions(3);
  const { images, files, html } = await favicons(logo_png, {
    icons: {
      android: true,
      appleIcon: false,
      appleStartup: false,
      favicons: true,
      windows: false,
      yandex: false,
    },
    output: {
      images: false,
    },
  });

  expect(images).toStrictEqual([]);
  expect(files.length).toBeGreaterThanOrEqual(1);
  expect(html.length).toBeGreaterThanOrEqual(1);
});

test("should not generate files", async () => {
  expect.assertions(3);
  const { images, files, html } = await favicons(logo_png, {
    icons: {
      android: true,
      appleIcon: false,
      appleStartup: false,
      favicons: true,
      windows: false,
      yandex: false,
    },
    output: {
      files: false,
    },
  });

  expect(files).toStrictEqual([]);
  expect(images.length).toBeGreaterThanOrEqual(1);
  expect(html.length).toBeGreaterThanOrEqual(1);
});

test("should not generate html", async () => {
  expect.assertions(3);
  const { images, files, html } = await favicons(logo_png, {
    icons: {
      android: true,
      appleIcon: false,
      appleStartup: false,
      favicons: true,
      windows: false,
      yandex: false,
    },
    output: {
      html: false,
    },
  });

  expect(html).toStrictEqual([]);
  expect(images.length).toBeGreaterThanOrEqual(1);
  expect(files.length).toBeGreaterThanOrEqual(1);
});
