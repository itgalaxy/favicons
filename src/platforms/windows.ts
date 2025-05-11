import xml2js from "xml2js";
import { FaviconHtmlTag, FaviconFile } from "../index";
import { FaviconOptions, IconSize, NamedIconOptions } from "../config/defaults";
import { transparentIcon } from "../config/icons";
import { relativeTo } from "../helpers";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: NamedIconOptions[] = [
  { name: "mstile-70x70.png", ...transparentIcon(70) },
  { name: "mstile-144x144.png", ...transparentIcon(144) },
  { name: "mstile-150x150.png", ...transparentIcon(150) },
  { name: "mstile-310x150.png", ...transparentIcon(310, 150) },
  { name: "mstile-310x310.png", ...transparentIcon(310) },
];

const SUPPORTED_TILES = [
  { name: "square70x70logo", width: 70, height: 70 },
  { name: "square150x150logo", width: 150, height: 150 },
  { name: "wide310x150logo", width: 310, height: 150 },
  { name: "square310x310logo", width: 310, height: 310 },
];

function hasSize(size: IconSize, icon: NamedIconOptions): boolean {
  return (
    icon.sizes.length === 1 &&
    icon.sizes[0].width === size.width &&
    icon.sizes[0].height === size.height
  );
}

export class WindowsPlatform extends Platform {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.windows, ICONS_OPTIONS),
    );
    if (!this.options.background) {
      throw new Error("`background` is required for Windows icons");
    }
  }

  override async createFiles(): Promise<FaviconFile[]> {
    return [this.browserConfig()];
  }

  override async createHtml(): Promise<FaviconHtmlTag[]> {
    const tile = "mstile-144x144.png";

    return [
      {
        tag: "meta",
        attrs: {
          name: "msapplication-TileColor",
          content: this.options.background,
        },
      },
      this.iconOptions.find((iconOption) => iconOption.name === tile)
        ? {
            tag: "meta",
            attrs: {
              name: "msapplication-TileImage",
              content: this.cacheBusting(this.relative(tile)),
            },
          }
        : undefined,
      {
        tag: "meta",
        attrs: {
          name: "msapplication-config",
          content: this.cacheBusting(this.relative(this.manifestFileName())),
        },
      },
    ];
  }

  private manifestFileName(): string {
    return this.options.files?.windows?.manifestFileName ?? "browserconfig.xml";
  }

  private browserConfig(): FaviconFile {
    const basePath = this.options.manifestRelativePaths
      ? null
      : this.options.path;

    const tile: Record<string, unknown> = {};

    for (const { name, ...size } of SUPPORTED_TILES) {
      const icon = this.iconOptions.find((iconOption) =>
        hasSize(size, iconOption),
      );

      if (icon) {
        tile[name] = {
          $: { src: this.cacheBusting(relativeTo(basePath, icon.name)) },
        };
      }
    }

    const browserconfig = {
      browserconfig: {
        msapplication: {
          tile: { ...tile, TileColor: { _: this.options.background } },
        },
      },
    };

    const contents = new xml2js.Builder({
      xmldec: { version: "1.0", encoding: "utf-8", standalone: null },
    }).buildObject(browserconfig);

    return { name: this.manifestFileName(), contents };
  }
}
