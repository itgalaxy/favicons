import favicons from "../src";
import { logo_png } from "./util";

test("should allow to restrict the icons to generate a favicon only", async () => {
  expect.assertions(2);
  const { html, images } = await favicons(logo_png, {
    icons: {
      favicons: ["favicon-32x32.png"],
      android: false,
      appleIcon: false,
      appleStartup: false,
      windows: false,
      yandex: false,
    },
  });
  expect(images.length).toBe(1);
  expect(html).toEqual([expect.stringMatching(/<link .*png/)]);
});

test("should allow to restrict the icons to generate android icons only", async () => {
  expect.assertions(2);
  const { html, images } = await favicons(logo_png, {
    icons: {
      favicons: false,
      android: ["android-chrome-48x48.png"],
      appleIcon: false,
      appleStartup: false,
      windows: false,
      yandex: false,
    },
  });
  expect(images.length).toBe(1);
  expect(html).toEqual([
    expect.stringMatching(/webmanifest/),
    expect.stringMatching(/mobile-web-app-capable/),
    expect.stringMatching(/theme-color/),
    expect.stringMatching(/application-name/),
  ]);
});

test("should allow to restrict the icons to generate apple icons only", async () => {
  expect.assertions(2);
  const { html, images } = await favicons(logo_png, {
    icons: {
      favicons: false,
      android: false,
      appleIcon: ["apple-touch-icon-60x60.png"],
      appleStartup: false,
      windows: false,
      yandex: false,
    },
  });
  expect(images.length).toBe(1);
  expect(html).toEqual([
    expect.stringMatching(/<link .*png/),
    expect.stringMatching(/apple-mobile-web-app-capable/),
    expect.stringMatching(/apple-mobile-web-app-status-bar-style/),
    expect.stringMatching(/apple-mobile-web-app-title/),
  ]);
});

test("should allow to restrict the icons to generate and configure them simultaneously", async () => {
  const options = {
    icons: {
      favicons: false,
      android: false,
      appleStartup: false,
      windows: false,
      yandex: false,
      appleIcon: [
        {
          name: "apple-touch-icon-60x60.png",
          background: "#CCF",
        },
        "apple-touch-icon-76x76.png",
      ],
    },
  };

  const result = await favicons(logo_png, options);
  await expect(result).toMatchFaviconsSnapshot();
});
