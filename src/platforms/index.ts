import { FaviconOptions } from "../config/defaults.js";
import { Logger } from "../logger.js";
import { Platform } from "./base.js";
import { AndroidPlatform } from "./android.js";
import { AppleIconPlatform } from "./appleIcon.js";
import { AppleStartupPlatform } from "./appleStartup.js";
import { FaviconsPlatform } from "./favicons.js";
import { WindowsPlatform } from "./windows.js";
import { YandexPlatform } from "./yandex.js";

export function getPlatform(
  name: string,
  options: FaviconOptions,
  logger: Logger
): Platform {
  switch (name) {
    case "android":
      return new AndroidPlatform(options, logger);
    case "appleIcon":
      return new AppleIconPlatform(options, logger);
    case "appleStartup":
      return new AppleStartupPlatform(options, logger);
    case "favicons":
      return new FaviconsPlatform(options, logger);
    case "windows":
      return new WindowsPlatform(options, logger);
    case "yandex":
      return new YandexPlatform(options, logger);
    default:
      throw new Error(`Unsupported platform ${name}`);
  }
}
