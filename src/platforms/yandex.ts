import { FaviconFile, FaviconHtmlElement } from "..";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { transparentIcon } from "../config/icons";
import { Dictionary, relativeTo } from "../helpers";
import { logContext, Logger } from "../logger";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Dictionary<IconOptions> = {
  "yandex-browser-50x50.png": transparentIcon(50),
};

export class YandexPlatform extends Platform {
  constructor(options: FaviconOptions, logger: Logger) {
    super(
      options,
      uniformIconOptions(options, options.icons.yandex, ICONS_OPTIONS),
      logContext(logger, "yandex")
    );
  }

  async createFiles(): Promise<FaviconFile[]> {
    return [this.manifest()];
  }

  async createHtml(): Promise<FaviconHtmlElement[]> {
    // prettier-ignore
    return [
      `<link rel="yandex-tableau-widget" href="${this.relative(this.manifestFileName())}">`
    ];
  }

  private manifestFileName(): string {
    return (
      this.options.files?.yandex?.manifestFileName ??
      "yandex-browser-manifest.json"
    );
  }

  private manifest(): FaviconFile {
    const basePath = this.options.manifestRelativePaths
      ? null
      : this.options.path;

    const logo = Object.keys(this.iconOptions)[0];

    const properties = {
      version: this.options.version,
      api_version: 1,
      layout: {
        logo: relativeTo(basePath, logo),
        color: this.options.background,
        show_title: true,
      },
    };

    return {
      name: this.manifestFileName(),
      contents: JSON.stringify(properties, null, 2),
    };
  }
}
