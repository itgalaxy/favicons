import favicons from "../src";
import * as fs from "fs";
import { logo_png, logo_svg } from "./util";

test("manifest should support shortcuts", async () => {
  expect.assertions(1);

  const result = await favicons(logo_png, {
    shortcuts: [
      {
        name: "View your Inbox",
        short_name: "inbox",
        description: "View your inbox messages",
        url: "/inbox",
        icon: [logo_png, fs.readFileSync(logo_png)], // eslint-disable-line no-sync
      },
      {
        name: "Picture Gallery",
        short_name: "pictures",
        url: "/pictures",
        icon: logo_svg,
      },
    ],
    icons: {
      android: true,
      appleIcon: false,
      appleStartup: false,
      favicons: false,
      windows: false,
      yandex: false,
    },
  });

  await expect(result).toMatchFaviconsSnapshot();
});
