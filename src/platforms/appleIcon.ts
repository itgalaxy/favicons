import escapeHtml from "escape-html";
import { FaviconHtmlElement } from "../index";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { opaqueIcon } from "../config/icons";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Record<string, IconOptions> = {
  "apple-touch-icon-57x57.png": opaqueIcon(57),
  "apple-touch-icon-60x60.png": opaqueIcon(60),
  "apple-touch-icon-72x72.png": opaqueIcon(72),
  "apple-touch-icon-76x76.png": opaqueIcon(76),
  "apple-touch-icon-114x114.png": opaqueIcon(114),
  "apple-touch-icon-120x120.png": opaqueIcon(120),
  "apple-touch-icon-144x144.png": opaqueIcon(144),
  "apple-touch-icon-152x152.png": opaqueIcon(152),
  "apple-touch-icon-167x167.png": opaqueIcon(167),
  "apple-touch-icon-180x180.png": opaqueIcon(180),
  "apple-touch-icon-1024x1024.png": opaqueIcon(1024),
  "apple-touch-icon.png": opaqueIcon(180),
  "apple-touch-icon-precomposed.png": opaqueIcon(180),
};

export class AppleIconPlatform extends Platform {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.appleIcon, ICONS_OPTIONS)
    );
  }

  override async createHtml(): Promise<FaviconHtmlElement[]> {
    const icons = Object.entries(this.iconOptions)
      .filter(([name]) => /\d/.test(name)) // with a size in a name
      .map(([name, options]) => {
        const { width, height } = options.sizes[0];

        // prettier-ignore
        return `<link rel="apple-touch-icon" sizes="${width}x${height}" href="${this.relative(name)}">`;
      });

    const name = this.options.appShortName || this.options.appName;

    // prettier-ignore
    return [
      ...icons,
      `<meta name="apple-mobile-web-app-capable" content="yes">`,
      `<meta name="apple-mobile-web-app-status-bar-style" content="${this.options.appleStatusBarStyle}">`,
      name
        ? `<meta name="apple-mobile-web-app-title" content="${escapeHtml(name)}">`
        : `<meta name="apple-mobile-web-app-title">`
    ];
  }
}
