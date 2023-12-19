import favicons from "../src";
import { readFile } from "fs/promises";
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
        icon: [logo_png, await readFile(logo_png)],
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
