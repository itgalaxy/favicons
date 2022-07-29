import {
  FaviconFile,
  FaviconHtmlElement,
  FaviconImage,
  FaviconResponse,
} from "../index";
import { FaviconOptions, IconOptions } from "../config/defaults";
import {
  asString,
  Dictionary,
  filterKeys,
  Images,
  mapValues,
  mapAsync,
  relativeTo,
  SourceImage,
} from "../helpers";

export function uniformIconOptions<T extends IconOptions>(
  options: FaviconOptions,
  iconsChoice: IconOptions | boolean | string[] | undefined,
  platformConfig: Dictionary<T>
): Dictionary<T> {
  let result = platformConfig;
  if (Array.isArray(iconsChoice)) {
    result = filterKeys(platformConfig, (name) => iconsChoice.includes(name));
  } else if (typeof iconsChoice === "object") {
    result = mapValues(platformConfig, (iconOptions: T) => ({
      ...iconOptions,
      ...iconsChoice,
    }));
  }

  result = mapValues(result, (iconOptions: T) => ({
    pixelArt: options.pixel_art,
    ...iconOptions,
    background:
      iconOptions.background === true
        ? options.background
        : asString(iconOptions.background),
  }));

  return result;
}

export class Platform<IO extends IconOptions = IconOptions> {
  protected options: FaviconOptions;
  protected iconOptions: Dictionary<IO>;

  constructor(options: FaviconOptions, iconOptions: Dictionary<IO>) {
    this.options = options;
    this.iconOptions = iconOptions;
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
    const images = new Images();
    return await mapAsync(
      Object.entries(this.iconOptions),
      ([iconName, iconOption]) =>
        images.createFavicon(sourceset, iconName, iconOption)
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
