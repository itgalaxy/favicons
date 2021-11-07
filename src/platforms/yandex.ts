import { FaviconFile, FaviconHtmlElement } from "..";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { transparentIcon } from "../config/icons";
import { Dictionary, relativeTo } from "../helpers";
import { logContext, Logger } from "../logger";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Dictionary<IconOptions> = {
  "yandex-browser-50x50.png": transparentIcon(50),
};

function yandexManifest(
  options: FaviconOptions,
  iconOptions: Dictionary<IconOptions>
): FaviconFile {
  const basePath = options.manifestRelativePaths ? null : options.path;

  const logo = Object.keys(iconOptions)[0];

  const properties = {
    version: options.version,
    api_version: 1,
    layout: {
      logo: relativeTo(basePath, logo),
      color: options.background,
      show_title: true,
    },
  };

  return {
    name: "yandex-browser-manifest.json",
    contents: JSON.stringify(properties, null, 2),
  };
}

export class YandexPlatform extends Platform {
  constructor(options: FaviconOptions, logger: Logger) {
    super(
      options,
      uniformIconOptions(options, options.icons.yandex, ICONS_OPTIONS),
      logContext(logger, "yandex")
    );
  }

  async createFiles(): Promise<FaviconFile[]> {
    return [yandexManifest(this.options, this.iconOptions)];
  }

  async createHtml(): Promise<FaviconHtmlElement[]> {
    // prettier-ignore
    return [
      `<link rel="yandex-tableau-widget" href="${this.relative("yandex-browser-manifest.json")}">`
    ];
  }
}
