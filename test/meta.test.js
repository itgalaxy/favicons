import favicons from "../src";
import { logo_png } from "./util";

test("should allow specifying metadata", async () => {
  expect.assertions(1);

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

  await expect(result).toMatchFaviconsSnapshot();
});
