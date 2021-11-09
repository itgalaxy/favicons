import * as path from "path";
import * as fs from "fs";
import sharp from "sharp";
import { toIco } from "./ico";
import { FaviconImage } from ".";
import { IconOptions } from "./config/defaults";
import { SvgTool } from "./svgtool";
import { logContext, Logger } from "./logger";

export type Dictionary<T> = { [key: string]: T };

export type SourceImage = { data: Buffer; metadata: sharp.Metadata };

export type RawImage = { data: Buffer; info: sharp.OutputInfo };

export interface IconPlaneOptions {
  readonly width: number;
  readonly height: number;
  readonly offset?: number;
  readonly pixelArt: boolean;
  readonly background?: string;
  readonly transparent: boolean;
  readonly rotate: boolean;
}

function arrayComparator(a: unknown, b: unknown): number {
  const aArr = [a].flat(Infinity);
  const bArr = [b].flat(Infinity);

  for (let i = 0; i < Math.max(aArr.length, bArr.length); ++i) {
    if (i >= aArr.length) return -1;
    if (i >= bArr.length) return 1;
    if (aArr[i] !== bArr[i]) {
      return aArr[i] < bArr[i] ? -1 : 1;
    }
  }
  return 0;
}

function minBy<T>(array: T[], comparator: (a: T, b: T) => number): T {
  return array.reduce((acc, cur) => (comparator(acc, cur) < 0 ? acc : cur));
}

function minByKey<T>(array: T[], keyFn: (e: T) => unknown) {
  return minBy(array, (a, b) => arrayComparator(keyFn(a), keyFn(b)));
}

export function mapValues<T, U>(
  dict: Dictionary<T>,
  mapper: (value: T, key: string) => U
): Dictionary<U> {
  return Object.fromEntries(
    Object.entries(dict).map(([key, value]) => [key, mapper(value, key)])
  );
}

export function filterKeys<T>(
  dict: Dictionary<T>,
  predicate: (key: string) => boolean
): Dictionary<T> {
  return Object.fromEntries(
    Object.entries(dict).filter((pair) => predicate(pair[0]))
  );
}

export function asString(arg: unknown): string | undefined {
  return typeof arg === "string" || arg instanceof String
    ? arg.toString()
    : undefined;
}

export async function sourceImages(
  src: string | string[] | Buffer | Buffer[]
): Promise<SourceImage[]> {
  if (Buffer.isBuffer(src)) {
    try {
      return [
        {
          data: src,
          metadata: await sharp(src).metadata(),
        },
      ];
    } catch (error) {
      return Promise.reject(new Error("Invalid image buffer"));
    }
  } else if (typeof src === "string") {
    const buffer = await fs.promises.readFile(src);

    return await sourceImages(buffer);
  } else if (Array.isArray(src) && !src.some(Array.isArray)) {
    if (!src.length) {
      throw new Error("No source provided");
    }
    const images = await Promise.all(src.map(sourceImages));

    return images.flat();
  } else {
    throw new Error("Invalid source type provided");
  }
}

function flattenIconOptions(iconOptions: IconOptions): IconPlaneOptions[] {
  return iconOptions.sizes.map((size) => ({
    ...size,
    offset: iconOptions.offset ?? 0,
    pixelArt: iconOptions.pixelArt ?? false,
    background: asString(iconOptions.background),
    transparent: iconOptions.transparent,
    rotate: iconOptions.rotate,
  }));
}

export function relativeTo(
  base: string | undefined | null,
  path: string
): string {
  if (!base) {
    return path;
  }

  const directory = base.substr(-1) === "/" ? base : `${base}/`;
  const url = new URL(path, new URL(directory, "resolve://"));

  return url.protocol === "resolve:" ? url.pathname : url.toString();
}

export class Images {
  #log: Logger;
  #svgtool: SvgTool;

  constructor(logger: Logger) {
    this.#log = logContext(logger, "Image");
    this.#svgtool = new SvgTool(logger);
  }

  bestSource(
    sourceset: SourceImage[],
    width: number,
    height: number
  ): SourceImage {
    this.#log("bestSource", `Find nearest icon to ${width}x${height}`);
    const sideSize = Math.max(width, height);
    return minByKey(sourceset, (icon) => {
      const iconSideSize = Math.max(icon.metadata.width, icon.metadata.height);
      return [
        icon.metadata.format === "svg" ? 0 : 1, // prefer SVG
        iconSideSize >= sideSize ? 0 : 1, // prefer downscale
        Math.abs(iconSideSize - sideSize), // prefer closest size
      ];
    });
  }

  async resize(
    source: SourceImage,
    width: number,
    height: number,
    pixelArt: boolean
  ): Promise<Buffer> {
    this.#log("render", `Resizing to ${width}x${height}`);

    if (source.metadata.format === "svg") {
      this.#log("render", `Rendering SVG to ${width}x${height}`);
      const svgBuffer = await this.#svgtool.ensureSize(source, width, height);
      return await sharp(svgBuffer)
        .resize({
          width,
          height,
          fit: sharp.fit.contain,
          background: "#00000000",
        })
        .toBuffer();
    }

    return await sharp(source.data)
      .ensureAlpha()
      .resize({
        width,
        height,
        fit: sharp.fit.contain,
        background: "#00000000",
        kernel:
          pixelArt &&
          width >= source.metadata.width &&
          height >= source.metadata.height
            ? "nearest"
            : "lanczos3",
      })
      .toBuffer();
  }

  createBlankImage(
    width: number,
    height: number,
    background?: string
  ): sharp.Sharp {
    const transparent = !background || background === "transparent";

    let image = sharp({
      create: {
        width,
        height,
        channels: transparent ? 4 : 3,
        background: transparent ? "#00000000" : background,
      },
    });

    if (transparent) {
      image = image.ensureAlpha();
    }
    return image;
  }

  async createPlaneFavicon(
    sourceset: SourceImage[],
    options: IconPlaneOptions,
    name: string,
    raw = false
  ): Promise<FaviconImage> {
    this.#log(
      "createPlaneFavicon",
      `Creating empty ${options.width}x${options.height} canvas with ${options.background} background`
    );

    const offset =
      Math.round(
        (Math.max(options.width, options.height) * options.offset) / 100
      ) || 0;
    const width = options.width - offset * 2;
    const height = options.height - offset * 2;

    const source = this.bestSource(sourceset, width, height);
    const image = await this.resize(source, width, height, options.pixelArt);

    let pipeline = this.createBlankImage(
      options.width,
      options.height,
      options.background
    ).composite([{ input: image, left: offset, top: offset }]);

    if (options.rotate) {
      const degrees = 90;
      this.#log("createPlaneFavicon", `Rotating image by ${degrees}`);
      pipeline = pipeline.rotate(degrees);
    }

    const contents = raw
      ? await pipeline
          .toColorspace("srgb")
          .raw({ depth: "uchar" })
          .toBuffer({ resolveWithObject: true })
      : await pipeline.png().toBuffer();

    return { name, contents };
  }

  async createFavicon(
    sourceset: SourceImage[],
    name: string,
    iconOptions: IconOptions
  ): Promise<FaviconImage> {
    const properties = flattenIconOptions(iconOptions);

    if (path.extname(name) === ".ico" || properties.length !== 1) {
      const images = await Promise.all(
        properties.map((props) =>
          this.createPlaneFavicon(
            sourceset,
            props,
            `${props.width}x${props.height}.rawdata`,
            true
          )
        )
      );
      const contents = toIco(images.map((image) => image.contents as RawImage));

      return {
        name,
        contents,
      };
    }

    return await this.createPlaneFavicon(sourceset, properties[0], name, false);
  }
}
