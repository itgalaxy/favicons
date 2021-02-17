const favicons = require("../src");
const test = require("ava");

const { snapshotManager } = require("ava/lib/concordance-options");
const { factory } = require("concordance-comparator");

const { logo_png } = require("./util");
const { Image, snapshotResult } = require("./Image");

snapshotManager.plugins.push(factory(Image, (v) => new Image(v[0], v[1])));

test("should allow specifying metadata", async (t) => {
  t.plan(1);

  const result = await favicons(logo_png, {
    appName: "PWA",
    appShortName: "PWA",
    appDescription: "Progressive Web App",
    developerName: "John Doe",
    developerURL: "https://john.doe.com",
    dir: "rtl",
    lang: "ar",
    background: "#333",
    theme_color: "#abc",
    appleStatusBarStyle: "default",
    display: "fullscreen",
    orientation: "portrait",
    scope: "/",
    start_url: "/subdomain/",
    version: "3.2.1",
  });

  await snapshotResult(t, result);
});
