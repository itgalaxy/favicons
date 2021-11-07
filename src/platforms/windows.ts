import xml2js from "xml2js";
import { FaviconFile, FaviconHtmlElement } from "..";
import { FaviconOptions, IconOptions, IconSize } from "../config/defaults";
import { transparentIcon } from "../config/icons";
import { Dictionary, relativeTo } from "../helpers";
import { logContext, Logger } from "../logger";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Dictionary<IconOptions> = {
  "mstile-70x70.png": transparentIcon(70),
  "mstile-144x144.png": transparentIcon(144),
  "mstile-150x150.png": transparentIcon(150),
  "mstile-310x150.png": transparentIcon(310, 150),
  "mstile-310x310.png": transparentIcon(310),
};

const SUPPORTED_TILES = [
  { name: "square70x70logo", width: 70, height: 70 },
  { name: "square150x150logo", width: 150, height: 150 },
  { name: "wide310x150logo", width: 310, height: 150 },
  { name: "square310x310logo", width: 310, height: 310 },
];

function hasSize(size: IconSize, icon: IconOptions): boolean {
  return (
    icon.sizes.length === 1 &&
    icon.sizes[0].width === size.width &&
    icon.sizes[0].height === size.height
  );
}

function browserConfig(
  options: FaviconOptions,
  iconOptions: Dictionary<IconOptions>
): FaviconFile {
  const basePath = options.manifestRelativePaths ? null : options.path;

  const tile: Dictionary<unknown> = {};

  for (const { name, ...size } of SUPPORTED_TILES) {
    const icon = Object.entries(iconOptions).find((icon) =>
      hasSize(size, icon[1])
    );

    if (icon) {
      tile[name] = {
        $: { src: relativeTo(basePath, icon[0]) },
      };
    }
  }

  const browserconfig = {
    browserconfig: {
      msapplication: {
        tile: { ...tile, TileColor: { _: options.background } },
      },
    },
  };

  const contents = new xml2js.Builder({
    xmldec: { version: "1.0", encoding: "utf-8", standalone: null },
  }).buildObject(browserconfig);

  return { name: "browserconfig.xml", contents };
}

export class WindowsPlatform extends Platform {
  constructor(options: FaviconOptions, logger: Logger) {
    super(
      options,
      uniformIconOptions(options, options.icons.windows, ICONS_OPTIONS),
      logContext(logger, "windows")
    );
  }

  async createFiles(): Promise<FaviconFile[]> {
    return [browserConfig(this.options, this.iconOptions)];
  }

  async createHtml(): Promise<FaviconHtmlElement[]> {
    const tile = "mstile-144x144.png";

    // prettier-ignore
    return [
      `<meta name="msapplication-TileColor" content="${this.options.background}">`,
      tile in this.iconOptions
        ? `<meta name="msapplication-TileImage" content="${this.relative(tile)}">`
        : "",
      `<meta name="msapplication-config" content="${this.relative("browserconfig.xml")}">`,
    ];
  }
}
