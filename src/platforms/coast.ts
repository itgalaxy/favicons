import { FaviconHtmlElement } from "..";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { opaqueIcon } from "../config/icons";
import { Dictionary } from "../helpers";
import { logContext, Logger } from "../logger";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Dictionary<IconOptions> = {
  "coast-228x228.png": opaqueIcon(228),
};

export class CoastPlatform extends Platform {
  constructor(options: FaviconOptions, logger: Logger) {
    super(
      options,
      uniformIconOptions(options, options.icons.coast, ICONS_OPTIONS),
      logContext(logger, "coast")
    );
  }

  async createHtml(): Promise<FaviconHtmlElement[]> {
    return Object.entries(this.iconOptions).map(([name, options]) => {
      const { width, height } = options.sizes[0];

      // prettier-ignore
      return `<link rel="icon" type="image/png" sizes="${width}x${height}" href="${this.relative(name)}">`;
    });
  }
}
