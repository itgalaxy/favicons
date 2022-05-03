import { FaviconHtmlElement } from "../index";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { opaqueIcon } from "../config/icons";
import { Platform, uniformIconOptions } from "./base";

interface ScreenSize {
  readonly deviceWidth: number;
  readonly deviceHeight: number;
  readonly pixelRatio: number;
}

// https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/#device-screen-sizes-and-orientations
const SCREEN_SIZES: ScreenSize[] = [
  { deviceWidth: 320, deviceHeight: 568, pixelRatio: 2 }, // 4" iPhone SE, iPod touch 5th generation and later
  { deviceWidth: 375, deviceHeight: 667, pixelRatio: 2 }, // iPhone 8, iPhone 7, iPhone 6s, iPhone 6, 4.7" iPhone SE
  { deviceWidth: 375, deviceHeight: 812, pixelRatio: 3 }, // iPhone 12 mini, iPhone 11 Pro, iPhone XS, iPhone X
  { deviceWidth: 390, deviceHeight: 844, pixelRatio: 3 }, // iPhone 12, iPhone 12 Pro
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 2 }, // iPhone 11, iPhone XR
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 3 }, // iPhone 11 Pro Max, iPhone XS Max
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3 }, // iPhone 8 Plus, iPhone 7 Plus
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3 }, // iPhone 6 Plus, iPhone 6s Plus
  { deviceWidth: 428, deviceHeight: 926, pixelRatio: 3 }, // iPhone 12 Pro Max
  { deviceWidth: 768, deviceHeight: 1024, pixelRatio: 2 }, // 9.7" iPad Pro. 7.9" iPad mini, 9.7" iPad Air, 9.7" iPad
  { deviceWidth: 810, deviceHeight: 1080, pixelRatio: 2 }, // 10.2" iPad
  { deviceWidth: 834, deviceHeight: 1194, pixelRatio: 2 }, // 11" iPad Pro, 10.5" iPad Pro
  { deviceWidth: 834, deviceHeight: 1112, pixelRatio: 2 }, // 10.5" iPad Air
  { deviceWidth: 1024, deviceHeight: 1366, pixelRatio: 2 }, // 12.9" iPad Pro
];

interface AppleStartupImage extends IconOptions, ScreenSize {
  readonly orientation: string;
}

function iconOptions(): Record<string, AppleStartupImage> {
  const result = {};
  for (const size of SCREEN_SIZES) {
    const pixelWidth = size.deviceWidth * size.pixelRatio;
    const pixelHeight = size.deviceHeight * size.pixelRatio;

    result[`apple-touch-startup-image-${pixelWidth}x${pixelHeight}.png`] = {
      ...opaqueIcon(pixelWidth, pixelHeight),
      ...size,
      orientation: "portrait",
    };
    result[`apple-touch-startup-image-${pixelHeight}x${pixelWidth}.png`] = {
      ...opaqueIcon(pixelHeight, pixelWidth),
      ...size,
      orientation: "landscape",
    };
  }
  return result;
}

const ICONS_OPTIONS: Record<string, AppleStartupImage> = iconOptions();

export class AppleStartupPlatform extends Platform<AppleStartupImage> {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.appleStartup, ICONS_OPTIONS)
    );
  }

  override async createHtml(): Promise<FaviconHtmlElement[]> {
    // prettier-ignore
    return Object.entries(this.iconOptions).map(([name, item]) =>
      `<link rel="apple-touch-startup-image" media="(device-width: ${item.deviceWidth}px) and (device-height: ${item.deviceHeight}px) and (-webkit-device-pixel-ratio: ${item.pixelRatio}) and (orientation: ${item.orientation})" href="${this.relative(name)}">`
    );
  }
}
