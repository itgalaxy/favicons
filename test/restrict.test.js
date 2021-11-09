import favicons from "../src";
import { logo_png } from "./util";

const source = logo_png;

const options = {
  icons: {
    favicons: ["favicon-32x32.png"],
    android: false,
    appleIcon: false,
    appleStartup: false,
    windows: false,
    yandex: false,
  },
};

const metaLength = 0;

const expectedLength =
  Object.values(options.icons).reduce(
    (acc, elem) => acc + (Array.isArray(elem) ? elem.length : 0),
    0
  ) + metaLength;

function processSource() {
  return favicons(source, options);
}

function generatedHTML(html) {
  return html.filter((str) => str.length > 0);
}

test("should allow to restrict the icons to generate", async () => {
  // eslint-disable-next-line no-magic-numbers
  const testCases = [
    {
      // favicons
      source,
      options,
    },
    {
      // android
      source,
      options: {
        ...options,
        icons: {
          ...options.icons,
          favicons: false,
          android: ["android-chrome-48x48.png"],
        },
      },
    },
    {
      // appleIcon
      source,
      options: {
        ...options,
        icons: {
          ...options.icons,
          favicons: false,
          appleIcon: ["apple-touch-icon-60x60.png"],
        },
      },
    },
  ];

  expect.assertions(testCases.length);

  for (const { source, options } of testCases) {
    const { images } = await favicons(source, options);

    expect(images.length).toBe(expectedLength);
  }
});

test("should allow to restrict the HTML tags generated", async () => {
  // eslint-disable-next-line no-magic-numbers
  expect.assertions(1);

  const { html } = await processSource();

  const useful = generatedHTML(html);

  expect(useful.length).toBe(expectedLength);
});

test("should allow to restrict the HTML tags taking into account manifests and others", async () => {
  const testCases = [
    {
      // android
      testOptions: {
        favicons: false,
        android: ["android-chrome-48x48.png"],
        appleIcon: false,
        appleStartup: false,
        windows: false,
        yandex: false,
      },
      expectedLength: 4, // (manifest + capable + theme color + app name)
    },
    {
      // appleIcon
      testOptions: {
        favicons: false,
        android: false,
        appleIcon: ["apple-touch-icon-60x60.png"],
        appleStartup: false,
        windows: false,
        yandex: false,
      },
      expectedLength: 4, // icons + (capable + status bar + app name)
    },
  ];

  expect.assertions(testCases.length);

  for (const { testOptions, expectedLength } of testCases) {
    const { html } = await favicons(source, {
      icons: testOptions,
    });
    const useful = generatedHTML(html);

    expect(useful.length).toBe(expectedLength);
  }
});
