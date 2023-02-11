import { FaviconFile, FaviconHtmlElement } from "../index";
import { FaviconOptions, NamedIconOptions } from "../config/defaults";
import { transparentIcon } from "../config/icons";
import { relativeTo } from "../helpers";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: NamedIconOptions[] = [
  { name: "yandex-browser-50x50.png", ...transparentIcon(50) },
];

export class YandexPlatform extends Platform {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.yandex, ICONS_OPTIONS)
    );
  }

  override async createFiles(): Promise<FaviconFile[]> {
    return [this.manifest()];
  }

  override async createHtml(): Promise<FaviconHtmlElement[]> {
    // prettier-ignore
    return [
      `<link rel="yandex-tableau-widget" href="${this.cacheBusting(this.relative(this.manifestFileName()))}">`
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

    const logo = this.iconOptions[0].name;

    const properties = {
      version: this.options.version,
      api_version: 1,
      layout: {
        logo: this.cacheBusting(relativeTo(basePath, logo)),
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
