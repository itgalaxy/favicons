import {
  FaviconFile,
  FaviconHtmlElement,
  FaviconImage,
  FaviconResponse,
} from "..";
import { FaviconOptions, IconOptions } from "../config/defaults";
import {
  asString,
  Dictionary,
  filterKeys,
  Images,
  mapValues,
  relativeTo,
  SourceImage,
} from "../helpers";
import { Logger } from "../logger";

export function uniformIconOptions(
  options: FaviconOptions,
  iconsChoice: IconOptions | boolean | string[] | undefined,
  platformConfig: Dictionary<IconOptions>
): Dictionary<IconOptions> {
  let result = platformConfig;
  if (Array.isArray(iconsChoice)) {
    result = filterKeys(platformConfig, (name) => iconsChoice.includes(name));
  } else if (typeof iconsChoice === "object") {
    result = mapValues(platformConfig, (iconOptions: IconOptions) => ({
      ...iconOptions,
      ...iconsChoice,
    }));
  }

  result = mapValues(result, (iconOptions: IconOptions) => ({
    pixelArt: options.pixel_art,
    ...iconOptions,
    background:
      iconOptions.background === true
        ? options.background
        : asString(iconOptions.background),
  }));

  return result;
}

export class Platform {
  protected options: FaviconOptions;
  protected iconOptions: Dictionary<IconOptions>;
  protected log: Logger;

  constructor(
    options: FaviconOptions,
    iconOptions: Dictionary<IconOptions>,
    logger: Logger
  ) {
    this.options = options;
    this.iconOptions = iconOptions;
    this.log = logger;
  }

  async create(sourceset: SourceImage[]): Promise<FaviconResponse> {
    const { output } = this.options;
    return {
      images: output.images ? await this.createImages(sourceset) : [],
      files: output.files ? await this.createFiles() : [],
      html: output.html ? await this.createHtml() : [],
    };
  }

  async createImages(sourceset: SourceImage[]): Promise<FaviconImage[]> {
    const images = new Images(this.log);
    return await Promise.all(
      Object.entries(this.iconOptions).map(([iconName, iconOption]) =>
        images.createFavicon(sourceset, iconName, iconOption)
      )
    );
  }

  async createFiles(): Promise<FaviconFile[]> {
    return [];
  }

  async createHtml(): Promise<FaviconHtmlElement[]> {
    return [];
  }

  protected relative(path: string): string {
    return relativeTo(this.options.path, path);
  }
}
