import { FaviconHtmlElement } from "../index";
import { FaviconOptions, NamedIconOptions } from "../config/defaults";
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
  { deviceWidth: 393, deviceHeight: 852, pixelRatio: 3 }, // iPhone 14 Pro, iPhone 15 Pro, iPhone 15
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 2 }, // iPhone 11, iPhone XR
  { deviceWidth: 414, deviceHeight: 896, pixelRatio: 3 }, // iPhone 11 Pro Max, iPhone XS Max
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3 }, // iPhone 8 Plus, iPhone 7 Plus
  { deviceWidth: 414, deviceHeight: 736, pixelRatio: 3 }, // iPhone 6 Plus, iPhone 6s Plus
  { deviceWidth: 428, deviceHeight: 926, pixelRatio: 3 }, // iPhone 12 Pro Max, iPhone 13 Pro Max, iPhone 14 Plus
  { deviceWidth: 430, deviceHeight: 932, pixelRatio: 3 }, // iPhone 14 Pro Max, iPhone 15 Pro Max, iPhone 15 Plus
  { deviceWidth: 744, deviceHeight: 1133, pixelRatio: 2 }, // 8.3" iPad Mini
  { deviceWidth: 768, deviceHeight: 1024, pixelRatio: 2 }, // 9.7" iPad Pro. 7.9" iPad mini, 9.7" iPad Air, 9.7" iPad
  { deviceWidth: 810, deviceHeight: 1080, pixelRatio: 2 }, // 10.2" iPad
  { deviceWidth: 820, deviceHeight: 1080, pixelRatio: 2 }, // 10.9" iPad Air
  { deviceWidth: 834, deviceHeight: 1194, pixelRatio: 2 }, // 11" iPad Pro, 10.5" iPad Pro
  { deviceWidth: 834, deviceHeight: 1112, pixelRatio: 2 }, // 10.5" iPad Air
  { deviceWidth: 1024, deviceHeight: 1366, pixelRatio: 2 }, // 12.9" iPad Pro
];

interface AppleStartupImage extends NamedIconOptions, ScreenSize {
  readonly orientation: string;
}

function iconOptions(): AppleStartupImage[] {
  const result = {};
  for (const size of SCREEN_SIZES) {
    const pixelWidth = size.deviceWidth * size.pixelRatio;
    const pixelHeight = size.deviceHeight * size.pixelRatio;

    const namePortrait = `apple-touch-startup-image-${pixelWidth}x${pixelHeight}.png`;
    result[namePortrait] = {
      name: namePortrait,
      ...opaqueIcon(pixelWidth, pixelHeight),
      ...size,
      orientation: "portrait",
    };

    const nameLandscape = `apple-touch-startup-image-${pixelHeight}x${pixelWidth}.png`;
    result[nameLandscape] = {
      name: nameLandscape,
      ...opaqueIcon(pixelHeight, pixelWidth),
      ...size,
      orientation: "landscape",
    };
  }
  return Object.values(result);
}

const ICONS_OPTIONS: AppleStartupImage[] = iconOptions();

export class AppleStartupPlatform extends Platform<AppleStartupImage> {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.appleStartup, ICONS_OPTIONS),
    );
  }

  override async createHtml(): Promise<FaviconHtmlElement[]> {
    // prettier-ignore
    return this.iconOptions.map((item) =>
      `<link rel="apple-touch-startup-image" media="(device-width: ${item.deviceWidth}px) and (device-height: ${item.deviceHeight}px) and (-webkit-device-pixel-ratio: ${item.pixelRatio}) and (orientation: ${item.orientation})" href="${this.cacheBusting(this.relative(item.name))}">`
    );
  }
}
