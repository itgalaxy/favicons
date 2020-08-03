const favicons = require("../src");
const test = require("ava");

// const { snapshotManager } = require("ava/lib/concordance-options");
// const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
// const { Image } = require("./Image");

// snapshotManager.plugins.push(factory(Image, v => new Image(v[0], v[1])));

const source = logo_png;

const options = {
  icons: {
    favicons: ["favicon-32x32.png"],
    android: false,
    appleIcon: false,
    appleStartup: false,
    coast: false,
    firefox: false,
    windows: false,
    yandex: false
  }
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
  return html.filter(str => str.length > 0);
}

test("should allow to restrict the icons to generate", async t => {
  // eslint-disable-next-line no-magic-numbers
  const testCases = [
    {
      // favicons
      source,
      options
    },
    {
      // android
      source,
      options: {
        ...options,
        icons: {
          ...options.icons,
          favicons: false,
          android: ["android-chrome-48x48.png"]
        }
      }
    },
    {
      // appleIcon
      source,
      options: {
        ...options,
        icons: {
          ...options.icons,
          favicons: false,
          appleIcon: ["apple-touch-icon-60x60.png"]
        }
      }
    }
  ];

  t.plan(testCases.length);

  const promises = testCases.map(async ({ source, options }) => {
    const { images } = await favicons(source, options);

    t.deepEqual(images.length, expectedLength);
  });

  await Promise.all(promises);
});

test("should allow to restrict the HTML tags generated", async t => {
  // eslint-disable-next-line no-magic-numbers
  t.plan(1);

  const { html } = await processSource();

  const useful = generatedHTML(html);

  t.deepEqual(useful.length, expectedLength);
});

test("should allow to restrict the HTML tags taking into account manifests and others", async t => {
  const testCases = [
    {
      // android
      testOptions: {
        favicons: false,
        android: ["android-chrome-48x48.png"],
        appleIcon: false,
        appleStartup: false,
        coast: false,
        firefox: false,
        windows: false,
        yandex: false
      },
      expectedLength: 4 // (manifest + capable + theme color + app name)
    },
    {
      // firefox
      testOptions: {
        favicons: false,
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        firefox: ["firefox_app_128x128.png"],
        windows: false,
        yandex: false
      },
      expectedLength: 0 // nothing
    },
    {
      // appleIcon
      testOptions: {
        favicons: false,
        android: false,
        appleIcon: ["apple-touch-icon-60x60.png"],
        appleStartup: false,
        coast: false,
        firefox: false,
        windows: false,
        yandex: false
      },
      expectedLength: 4 // icons + (capable + status bar + app name)
    }
  ];

  t.plan(testCases.length);

  const promises = testCases.map(async ({ testOptions, expectedLength }) => {
    const { html } = await favicons(source, {
      icons: testOptions
    });
    const useful = generatedHTML(html);

    t.deepEqual(useful.length, expectedLength);
  });

  await Promise.all(promises);
});
