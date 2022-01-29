/* eslint-disable */

/**
    Make sure you have the lates build. Run `npm run build` to rebuild.
    Run `node createExamples.js` to create the icons, splashs and files.
**/

const favicons = require("../dist/index.js"),
  fs = require("fs"),
  source = "./fixtures/logo.png", // Source image(s). `string`, `buffer` or array of `string`
  configuration = {
    path: "/", // Path for overriding default icons path. `string`
    appName: null, // Your application's name. `string`
    appShortName: null, // Your application's short_name. `string`. Optional. If not set, appName will be used
    appDescription: null, // Your application's description. `string`
    developerName: null, // Your (or your developer's) name. `string`
    developerURL: null, // Your (or your developer's) URL. `string`
    dir: "auto", // Primary text direction for name, short_name, and description
    lang: "en-US", // Primary language for name and short_name
    background: "#fff", // Background colour for flattened icons. `string`
    theme_color: "#fff", // Theme color user for example in Android's task switcher. `string`
    appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
    display: "standalone", // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
    orientation: "any", // Default orientation: "any", "natural", "portrait" or "landscape". `string`
    scope: "/", // set of URLs that the browser considers within your app
    start_url: "/?homescreen=1", // Start URL when launching the application from a device. `string`
    preferRelatedApplications: false, // Should the browser prompt the user to install the native companion app. `boolean`
    relatedApplications: undefined, // Information about the native companion apps. This will only be used if `preferRelatedApplications` is `true`. `Array<{ id: string, url: string, platform: string }>`
    version: "1.0", // Your application's version string. `string`
    logging: false, // Print logs to console? `boolean`
    pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
    loadManifestWithCredentials: false, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
    icons: {
      android: true, // Create Android homescreen icon. `boolean` or `{ offset, background }`
      appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset, background }`
      appleStartup: true, // Create Apple startup images. `boolean` or `{ offset, background }`
      favicons: true, // Create regular favicons. `boolean` or `{ offset, background }`
      windows: true, // Create Windows 8 tile icons. `boolean` or `{ offset, background }`
      yandex: true, // Create Yandex browser icon. `boolean` or `{ offset, background }`
    },
  },
  callback = (error, response) => {
    if (error) {
      throw Error(error.message); // Error description e.g. "An unknown error has occurred"
      return;
    }

    // Check if tmp dir exists, if not create
    if (!fs.existsSync(`${__dirname}/tmp/`)) {
      fs.mkdirSync(`${__dirname}/tmp/`);
    }

    // Save images
    response.images.forEach((item) => {
      fs.writeFile(
        `${__dirname}/tmp/${item.name}`,
        item.contents,
        "binary",
        function (err) {
          if (err) throw err;
          console.log(`${item.name} saved.`);
        }
      );
    });

    // Save files
    response.files.forEach((item) => {
      fs.writeFile(
        `${__dirname}/tmp/${item.name}`,
        item.contents,
        "binary",
        function (err) {
          if (err) throw err;
          console.log(`${item.name} saved.`);
        }
      );
    });

    // Save HTML files
    fs.writeFile(
      `${__dirname}/tmp/index.html`,
      response.html,
      "binary",
      function (err) {
        if (err) throw err;
        console.log("index.html saved.");
      }
    );
  };

favicons(source, configuration, callback);
