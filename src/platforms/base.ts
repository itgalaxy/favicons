import {
  FaviconFile,
  FaviconHtmlElement,
  FaviconImage,
  FaviconResponse,
} from "../index";
import {
  FaviconOptions,
  IconOptions,
  NamedIconOptions,
} from "../config/defaults";
import { asString, createFavicon, relativeTo, SourceImage } from "../helpers";

export function uniformIconOptions<T extends NamedIconOptions>(
  options: FaviconOptions,
  iconsChoice:
    | IconOptions
    | boolean
    | (string | NamedIconOptions)[]
    | undefined,
  platformConfig: T[]
): T[] {
  let result = [];
  if (Array.isArray(iconsChoice)) {
    const iconsChoices = Object.fromEntries(
      iconsChoice.map((choice) =>
        typeof choice === "object"
          ? [choice.name, choice]
          : [choice, { name: choice }]
      )
    );
    result = platformConfig
      .filter((iconOptions) => iconOptions.name in iconsChoices)
      .map((iconOptions) => ({
        ...iconOptions,
        ...iconsChoices[iconOptions.name],
      }));
  } else if (typeof iconsChoice === "object") {
    result = platformConfig.map((iconOptions) => ({
      ...iconOptions,
      ...iconsChoice,
    }));
  } else {
    result = platformConfig;
  }

  return result.map((iconOptions) => ({
    pixelArt: options.pixel_art,
    ...iconOptions,
    background:
      iconOptions.background === true
        ? options.background
        : asString(iconOptions.background),
  }));
}

export class Platform<IO extends NamedIconOptions = NamedIconOptions> {
  protected options: FaviconOptions;
  protected iconOptions: IO[];

  constructor(options: FaviconOptions, iconOptions: IO[]) {
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
    return await Promise.all(
      this.iconOptions.map((iconOption) =>
        createFavicon(sourceset, iconOption.name, iconOption)
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
