/* eslint-disable */

/**
    Make sure you have the lates build. Run `npm run build` to rebuild.
    Run `node createExamples.js` to create the icons, splashs and files.
**/

import { favicons } from "../dist/index.mjs";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const source = fileURLToPath(new URL("fixtures/logo.png", import.meta.url)); // Source image(s). `string`, `buffer` or array of `string`

const configuration = {
  path: "/", // Path for overriding default icons path. `string`
  appName: null, // Your application's name. `string`
  appShortName: null, // Your application's short_name. `string`. Optional. If not set, appName will be used
  appDescription: null, // Your application's description. `string`
  developerName: null, // Your (or your developer's) name. `string`
  developerURL: null, // Your (or your developer's) URL. `string`
  cacheBustingQueryParam: null, // Query parameter added to all URLs that acts as a cache busting system. `string | null`
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
};

const response = await favicons(source, configuration);

const outputDir = fileURLToPath(new URL("tmp/", import.meta.url));
await fs.mkdir(outputDir, { recursive: true });

// Save images
for (let item of response.images) {
  await fs.writeFile(`${outputDir}${item.name}`, item.contents, "binary");
  console.log(`${item.name} saved.`);
}

// Save files
for (let item of response.files) {
  await fs.writeFile(`${outputDir}${item.name}`, item.contents, "binary");
  console.log(`${item.name} saved.`);
}

// Save HTML files
await fs.writeFile(`${outputDir}index.html`, response.html, "binary");
console.log("index.html saved.");
