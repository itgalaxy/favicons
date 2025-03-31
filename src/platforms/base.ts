import {
  FaviconFile,
  FaviconHtmlTag,
  FaviconImage,
  FaviconResponse,
} from "../index";
import {
  FaviconOptions,
  IconOptions,
  NamedIconOptions,
} from "../config/defaults";
import { asString, createFavicon, relativeTo, SourceImage } from "../helpers";

export interface OptionalMixin {
  readonly optional?: boolean;
}

export function uniformIconOptions<T extends NamedIconOptions>(
  options: FaviconOptions,
  iconsChoice:
    | IconOptions
    | boolean
    | (string | NamedIconOptions)[]
    | undefined,
  platformConfig: (T & OptionalMixin)[],
): T[] {
  let result = [];
  if (Array.isArray(iconsChoice)) {
    const iconsChoices = Object.fromEntries(
      iconsChoice.map((choice) =>
        typeof choice === "object"
          ? [choice.name, choice]
          : [choice, { name: choice }],
      ),
    );
    result = platformConfig
      .filter((iconOptions) => iconOptions.name in iconsChoices)
      .map((iconOptions) => ({
        ...iconOptions,
        ...iconsChoices[iconOptions.name],
      }));
  } else if (typeof iconsChoice === "object") {
    result = platformConfig
      .filter((iconOptions) => !iconOptions.optional)
      .map((iconOptions) => ({
        ...iconOptions,
        ...iconsChoice,
      }));
  } else {
    result = platformConfig.filter((iconOptions) => !iconOptions.optional);
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
  protected options: FaviconOptions & { readonly htmlUnStringified?: boolean };
  protected iconOptions: IO[];

  constructor(
    options: FaviconOptions & { readonly htmlUnStringified?: boolean },
    iconOptions: IO[],
  ) {
    this.options = options;
    this.iconOptions = iconOptions;
  }

  async create(sourceset: SourceImage[]): Promise<FaviconResponse> {
    const { output } = this.options;
    const images = output.images ? await this.createImages(sourceset) : [];
    const files = output.files ? await this.createFiles() : [];
    let htmlTags = [];
    if (output.html) {
      htmlTags = await this.createHtml();
    }
    return {
      images,
      files,
      html: htmlTags.map((element) => element.stringify()),
      htmlTags,
    };
  }

  async createImages(sourceset: SourceImage[]): Promise<FaviconImage[]> {
    return await Promise.all(
      this.iconOptions.map((iconOption) =>
        createFavicon(sourceset, iconOption.name, iconOption),
      ),
    );
  }

  async createFiles(): Promise<FaviconFile[]> {
    return [];
  }

  async createHtml(): Promise<FaviconHtmlTag[]> {
    return [];
  }

  protected relative(path: string): string {
    return relativeTo(this.options.path, path);
  }

  protected cacheBusting(path: string): string {
    if (typeof this.options.cacheBustingQueryParam !== "string") {
      return path;
    }

    const paramParts = this.options.cacheBustingQueryParam.split("=");

    if (paramParts.length === 1) {
      return path;
    }

    const url = new URL(path, "https://cache.busting");
    url.searchParams.set(paramParts[0], paramParts.slice(1).join("="));
    return url.origin === "https://cache.busting"
      ? url.pathname + url.search
      : url.toString();
  }
}
