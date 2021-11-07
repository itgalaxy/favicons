import { FaviconHtmlElement } from "..";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { transparentIcon, transparentIcons } from "../config/icons";
import { Dictionary } from "../helpers";
import { logContext, Logger } from "../logger";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Dictionary<IconOptions> = {
  "favicon.ico": transparentIcons(16, 24, 32, 48, 64),
  "favicon-16x16.png": transparentIcon(16),
  "favicon-32x32.png": transparentIcon(32),
  "favicon-48x48.png": transparentIcon(48),
};

export class FaviconsPlatform extends Platform {
  constructor(options: FaviconOptions, logger: Logger) {
    super(
      options,
      uniformIconOptions(options, options.icons.favicons, ICONS_OPTIONS),
      logContext(logger, "favicons")
    );
  }

  async createHtml(): Promise<FaviconHtmlElement[]> {
    return Object.entries(this.iconOptions).map(([name, options]) => {
      if (name.endsWith(".ico")) {
        return `<link rel="shortcut icon" href="${this.relative(name)}">`;
      }

      const { width, height } = options.sizes[0];

      // prettier-ignore
      return `<link rel="icon" type="image/png" sizes="${width}x${height}" href="${this.relative(name)}">`;
    });
  }
}
