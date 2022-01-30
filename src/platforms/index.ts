import { FaviconOptions } from "../config/defaults.js";
import { Platform } from "./base.js";
import { AndroidPlatform } from "./android.js";
import { AppleIconPlatform } from "./appleIcon.js";
import { AppleStartupPlatform } from "./appleStartup.js";
import { FaviconsPlatform } from "./favicons.js";
import { WindowsPlatform } from "./windows.js";
import { YandexPlatform } from "./yandex.js";

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
