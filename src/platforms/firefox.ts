import { FaviconFile } from "..";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { glowIcon } from "../config/icons";
import { Dictionary, relativeTo } from "../helpers";
import { logContext, Logger } from "../logger";
import { Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: Dictionary<IconOptions> = {
  "firefox_app_60x60.png": glowIcon(60),
  "firefox_app_128x128.png": glowIcon(128),
  "firefox_app_512x512.png": glowIcon(512),
};

function firefoxManifest(
  options: FaviconOptions,
  iconOptions: Dictionary<IconOptions>
): FaviconFile {
  const basePath = options.manifestRelativePaths ? null : options.path;
  const properties = {
    version: options.version ?? "1.0",
    name: options.appName,
    description: options.appDescription,
    icons: {},
    developer: {
      name: options.developerName,
      url: options.developerURL,
    },
  };

  for (const [name, { sizes }] of Object.entries(iconOptions)) {
    const size = sizes[0].width; // any size

    properties.icons[size] = relativeTo(basePath, name);
  }

  return {
    name: "manifest.webapp",
    contents: JSON.stringify(properties, null, 2),
  };
}

export class FirefoxPlatform extends Platform {
  constructor(options: FaviconOptions, logger: Logger) {
    super(
      options,
      uniformIconOptions(options, options.icons.firefox, ICONS_OPTIONS),
      logContext(logger, "firefox")
    );
  }

  async createFiles(): Promise<FaviconFile[]> {
    return [firefoxManifest(this.options, this.iconOptions)];
  }
}
