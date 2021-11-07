import { FaviconOptions } from "../config/defaults";
import { Logger } from "../logger";
import { Platform } from "./base";
import { AndroidPlatform } from "./android";
import { AppleIconPlatform } from "./appleIcon";
import { AppleStartupPlatform } from "./appleStartup";
import { CoastPlatform } from "./coast";
import { FaviconsPlatform } from "./favicons";
import { FirefoxPlatform } from "./firefox";
import { WindowsPlatform } from "./windows";
import { YandexPlatform } from "./yandex";

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
    case "coast":
      return new CoastPlatform(options, logger);
    case "favicons":
      return new FaviconsPlatform(options, logger);
    case "firefox":
      return new FirefoxPlatform(options, logger);
    case "windows":
      return new WindowsPlatform(options, logger);
    case "yandex":
      return new YandexPlatform(options, logger);
    default:
      throw new Error(`Unsupported platform ${name}`);
  }
}
