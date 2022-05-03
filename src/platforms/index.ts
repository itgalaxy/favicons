import { FaviconOptions } from "../config/defaults";
import { Platform } from "./base";
import { AndroidPlatform } from "./android";
import { AppleIconPlatform } from "./appleIcon";
import { AppleStartupPlatform } from "./appleStartup";
import { FaviconsPlatform } from "./favicons";
import { WindowsPlatform } from "./windows";
import { YandexPlatform } from "./yandex";

export type PlatformName =
  | "android"
  | "appleIcon"
  | "appleStartup"
  | "favicons"
  | "windows"
  | "yandex";

export function getPlatform(name: string, options: FaviconOptions): Platform {
  switch (name) {
    case "android":
      return new AndroidPlatform(options);
    case "appleIcon":
      return new AppleIconPlatform(options);
    case "appleStartup":
      return new AppleStartupPlatform(options);
    case "favicons":
      return new FaviconsPlatform(options);
    case "windows":
      return new WindowsPlatform(options);
    case "yandex":
      return new YandexPlatform(options);
    default:
      throw new Error(`Unsupported platform ${name}`);
  }
}
