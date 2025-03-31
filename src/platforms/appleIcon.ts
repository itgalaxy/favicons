import escapeHtml from "escape-html";
import { FaviconHtmlTag } from "../index";
import { FaviconOptions, NamedIconOptions } from "../config/defaults";
import { opaqueIcon } from "../config/icons";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: NamedIconOptions[] = [
  { name: "apple-touch-icon-57x57.png", ...opaqueIcon(57) },
  { name: "apple-touch-icon-60x60.png", ...opaqueIcon(60) },
  { name: "apple-touch-icon-72x72.png", ...opaqueIcon(72) },
  { name: "apple-touch-icon-76x76.png", ...opaqueIcon(76) },
  { name: "apple-touch-icon-114x114.png", ...opaqueIcon(114) },
  { name: "apple-touch-icon-120x120.png", ...opaqueIcon(120) },
  { name: "apple-touch-icon-144x144.png", ...opaqueIcon(144) },
  { name: "apple-touch-icon-152x152.png", ...opaqueIcon(152) },
  { name: "apple-touch-icon-167x167.png", ...opaqueIcon(167) },
  { name: "apple-touch-icon-180x180.png", ...opaqueIcon(180) },
  { name: "apple-touch-icon-1024x1024.png", ...opaqueIcon(1024) },
  { name: "apple-touch-icon.png", ...opaqueIcon(180) },
  { name: "apple-touch-icon-precomposed.png", ...opaqueIcon(180) },
];

export class AppleIconPlatform extends Platform {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.appleIcon, ICONS_OPTIONS),
    );
  }

  override async createHtml(): Promise<FaviconHtmlTag[]> {
    const icons = this.iconOptions
      .filter(({ name }) => /\d/.test(name)) // with a size in a name
      .map((options) => {
        const { width, height } = options.sizes[0];
        return new FaviconHtmlTag("link", {
          rel: "apple-touch-icon",
          sizes: `${width}x${height}`,
          href: this.cacheBusting(this.relative(options.name)),
        });
      });

    const name = this.options.appShortName || this.options.appName;

    return [
      ...icons,
      new FaviconHtmlTag("meta", {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      }),
      new FaviconHtmlTag("meta", {
        name: "apple-mobile-web-app-status-bar-style",
        content: this.options.appleStatusBarStyle,
      }),
      name
        ? new FaviconHtmlTag("meta", {
            name: "apple-mobile-web-app-title",
            content: escapeHtml(name),
          })
        : new FaviconHtmlTag("meta", {
            name: "apple-mobile-web-app-title",
          }),
    ];
  }
}
