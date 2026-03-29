import { extname } from "path";
import { readFile } from "fs/promises";
import sharp from "sharp";
import { toIco } from "./ico";
import { FaviconImage } from "./index";
import { IconOptions } from "./config/defaults";
import { svgDensity } from "./svgtool";

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
  readonly source?:
    | string
    | Buffer
    | (string | Buffer)[]
    | ((options: IconPlaneOptions) => string | Buffer | (string | Buffer)[]);
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

function minByKey<T>(array: T[], keyFn: (e: T) => unknown): T {
  return minBy(array, (a, b) => arrayComparator(keyFn(a), keyFn(b)));
}

export function mapValues<T, U>(
  dict: Record<string, T>,
  mapper: (value: T, key: string) => U,
): Record<string, U> {
  return Object.fromEntries(
    Object.entries(dict).map(([key, value]) => [key, mapper(value, key)]),
  );
}

export function filterKeys<T>(
  dict: Record<string, T>,
  predicate: (key: string) => boolean,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(dict).filter((pair) => predicate(pair[0])),
  );
}

export function asString(arg: unknown): string | undefined {
  return typeof arg === "string" || arg instanceof String
    ? arg.toString()
    : undefined;
}

export async function sourceImages(
  src: string | Buffer | (string | Buffer)[],
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
      return Promise.reject(
        new Error("Invalid image buffer", { cause: error }),
      );
    }
  } else if (typeof src === "string") {
    const buffer = await readFile(src);

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
    source: iconOptions.source,
  }));
}

export function relativeTo(
  base: string | undefined | null,
  path: string,
): string {
  if (!base) {
    return path;
  }

  const directory = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(path, new URL(directory, "resolve://"));

  return url.protocol === "resolve:" ? url.pathname : url.toString();
}

function bestSource(
  sourceset: SourceImage[],
  width: number,
  height: number,
): SourceImage {
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

async function resize(
  source: SourceImage,
  width: number,
  height: number,
  pixelArt: boolean,
): Promise<Buffer> {
  if (source.metadata.format === "svg") {
    const options = {
      density: svgDensity(source.metadata, width, height),
    };
    return await sharp(source.data, options)
      .resize({
        width,
        height,
        fit: sharp.fit.contain,
        background: "#00000000",
      })
      .toBuffer();
  } else {
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
}

function createBlankImage(
  width: number,
  height: number,
  background?: string,
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

async function createPlane(
  sourceset: SourceImage[],
  options: IconPlaneOptions,
): Promise<sharp.Sharp> {
  if (options.source) {
    sourceset = await sourceImages(
      typeof options.source === "function"
        ? options.source(options)
        : options.source
    );
  }

  const offset =
    Math.round(
      (Math.max(options.width, options.height) * options.offset) / 100,
    ) || 0;
  const width = options.width - offset * 2;
  const height = options.height - offset * 2;

  const source = bestSource(sourceset, width, height);
  const image = await resize(source, width, height, options.pixelArt);

  let pipeline = createBlankImage(
    options.width,
    options.height,
    options.background,
  ).composite([{ input: image, left: offset, top: offset }]);

  if (options.rotate) {
    const degrees = 90;
    pipeline = pipeline.rotate(degrees);
  }

  return pipeline;
}

function toRawImage(pipeline: sharp.Sharp): Promise<RawImage> {
  return pipeline
    .toColorspace("srgb")
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });
}

function toPng(pipeline: sharp.Sharp): Promise<Buffer> {
  return pipeline.png().toBuffer();
}

async function createSvg(
  sourceset: SourceImage[],
  options: IconPlaneOptions,
): Promise<Buffer> {
  if (options.source) {
    sourceset = await sourceImages(
      typeof options.source === "function"
        ? options.source(options)
        : options.source
    );
  }
  const { width, height } = options;
  const source = bestSource(sourceset, width, height);
  if (source.metadata.format === "svg") {
    return source.data;
  } else {
    const pipeline = await createPlane(sourceset, options);
    const png = await toPng(pipeline);
    const encodedPng = png.toString("base64");
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${encodedPng}"/>
</svg>`,
    );
  }
}

export async function createFavicon(
  sourceset: SourceImage[],
  name: string,
  iconOptions: IconOptions,
): Promise<FaviconImage> {
  const properties = flattenIconOptions(iconOptions);
  const ext = extname(name);

  if (ext === ".ico" || properties.length !== 1) {
    const images = await Promise.all(
      properties.map((props) => createPlane(sourceset, props).then(toRawImage)),
    );
    const contents = toIco(images);
    return { name, contents };
  } else if (ext === ".svg") {
    const contents = await createSvg(sourceset, properties[0]);
    return { name, contents };
  } else {
    const contents = await createPlane(sourceset, properties[0]).then(toPng);
    return { name, contents };
  }
}
