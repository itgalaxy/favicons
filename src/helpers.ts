import * as path from "path";
import * as url from "url";
import * as fs from "fs";
import { promisify } from "util";
import { magenta, green, yellow } from "colors";
import jsonxml from "jsontoxml";
import sharp from "sharp";
import xml2js from "xml2js";

export type Dictionary<T> = { [key: string]: T };

export type SourceImage = { data: Buffer; metadata: sharp.Metadata };

export type RawImage = { data: Buffer; info: sharp.OutputInfo };

export interface IconPlaneOptions {
  readonly width: number;
  readonly height: number;
  readonly offset?: number;
  readonly background?: string;
  readonly transparent: boolean;
  readonly rotate: boolean;
  readonly mask: boolean;
  readonly overlayGlow: boolean;
  readonly overlayShadow: boolean;
}

const readFileAsync = promisify(fs.readFile);

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
    const buffer = await readFileAsync(src);

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

export interface BlankImageProps {
  readonly width: number;
  readonly height: number;
  readonly background?: string | boolean;
  readonly transparent?: boolean;
}

export async function createBlankImage(
  properties: BlankImageProps
): Promise<Buffer> {
  const transparent =
    properties.transparent ||
    !properties.background ||
    properties.background === "transparent";

  let image = sharp({
    create: {
      width: properties.width,
      height: properties.height,
      channels: transparent ? 4 : 3,
      background: transparent ? "#00000000" : (properties.background as string),
    },
  });

  if (transparent) {
    image = image.ensureAlpha();
  }
  return await image.png().toBuffer();
}

export function helpers(options) {
  function directory(path: string): string {
    return path.substr(-1) === "/" ? path : `${path}/`;
  }

  function relative(path: string, relativeToPath = false): string {
    return url.resolve(
      (!relativeToPath && options.path && directory(options.path)) || "",
      path
    );
  }

  function log(context: string, message: string) {
    if (options.logging) {
      message = message.replace(/ \d+(x\d+)?/g, (item) => magenta(item));
      message = message.replace(/#([0-9a-f]{3}){1,2}/g, (item) =>
        magenta(item)
      );
      console.log(`${green("[Favicons]")} ${yellow(context)}: ${message}...`);
    }
  }

  // sharp renders the SVG in its source width and height with 72 DPI which can
  // cause a blurry result in case the source SVG is defined in lower size than
  // the target size. To avoid this, resize the source SVG to the needed size
  // before passing it to sharp by increasing its width and/or height
  // attributes.
  //
  // Currently it seems this won't be fixed in sharp, so we need a workaround:
  // https://github.com/lovell/sharp/issues/729#issuecomment-284708688
  //
  // They suggest setting the image density to a "resized" density based on the
  // target render size but this does not seem to work with favicons and may
  // cause other errors with "unnecessarily high" image density values.
  //
  // For further information, see:
  // https://github.com/itgalaxy/favicons/issues/264
  const svgtool = {
    async ensureSize(
      svgSource: SourceImage,
      width: number,
      height: number
    ): Promise<Buffer> {
      let svgWidth = svgSource.metadata.width;
      let svgHeight = svgSource.metadata.height;

      if (svgWidth >= width && svgHeight >= height) {
        // If the base SVG is large enough, it does not need to be modified.
        return svgSource.data;
      } else if (width > height) {
        svgHeight = Math.round(svgHeight * (width / svgWidth));
        svgWidth = width;
      } else {
        // width <= height
        svgWidth = Math.round(svgWidth * (height / svgHeight));
        svgHeight = height;
      }

      // Modify the source SVG's width and height attributes for sharp to render
      // it correctly.
      log("svgtool:ensureSize", `Resizing SVG to ${svgWidth}x${svgHeight}`);
      return await this.resize(svgSource.data, svgWidth, svgHeight);
    },

    async resize(
      svgFile: Buffer,
      width: number,
      height: number
    ): Promise<Buffer> {
      const xmlDoc = await xml2js.parseStringPromise(svgFile);

      xmlDoc.svg.$.width = width;
      xmlDoc.svg.$.height = height;

      const builder = new xml2js.Builder();
      const modifiedSvg = builder.buildObject(xmlDoc);

      return Buffer.from(modifiedSvg);
    },
  };

  return {
    log,

    HTML: {
      render(htmlTemplate) {
        return htmlTemplate(Object.assign({}, options, { relative }));
      },
    },

    Files: {
      create(properties, name) {
        log("Files:create", `Creating file: ${name}`);
        if (name === "manifest.json") {
          properties.name = options.appName;
          properties.short_name = options.appShortName || options.appName;
          properties.description = options.appDescription;
          properties.dir = options.dir;
          properties.lang = options.lang;
          properties.display = options.display;
          properties.orientation = options.orientation;
          properties.scope = options.scope;
          properties.start_url = options.start_url;
          properties.background_color = options.background;
          properties.theme_color = options.theme_color;

          // Defaults to false, so omit the value https://developer.mozilla.org/en-US/docs/Web/Manifest/prefer_related_applications
          if (options.preferRelatedApplications) {
            properties.prefer_related_applications =
              options.preferRelatedApplications;
          }
          // Only include related_applications if a lengthy array is provided.
          if (
            Array.isArray(options.relatedApplications) &&
            options.relatedApplications.length > 0
          ) {
            properties.related_applications = options.relatedApplications;
          }

          properties.icons.forEach((icon) => {
            icon.src = relative(icon.src, options.manifestRelativePaths);
            icon.purpose =
              options.manifestMaskable === true ? "any maskable" : "any";
          });
          // If manifestMaskable is set but is not a boolean
          // assume a file (or an array) is passed, and we should link
          // the generated files with maskable as purpose.
          if (
            options.manifestMaskable &&
            typeof options.manifestMaskable !== "boolean"
          ) {
            const maskableIcons = properties.icons.map((icon) => ({
              ...icon,
              src: icon.src.replace(
                /android-chrome-(.+)\.png$/,
                "android-chrome-maskable-$1.png"
              ),
              purpose: "maskable",
            }));

            properties.icons = [...properties.icons, ...maskableIcons];
          }
          properties = JSON.stringify(properties, null, 2);
        } else if (name === "manifest.webapp") {
          properties.version = options.version;
          properties.name = options.appName;
          properties.description = options.appDescription;
          properties.developer.name = options.developerName;
          properties.developer.url = options.developerURL;
          properties.icons = Object.keys(properties.icons).reduce(
            (obj, key) =>
              Object.assign(obj, {
                [key]: relative(
                  properties.icons[key],
                  options.manifestRelativePaths
                ),
              }),
            {}
          );
          properties = JSON.stringify(properties, null, 2);
        } else if (name === "browserconfig.xml") {
          properties[0].children[0].children[0].children.map((property) => {
            if (property.name === "TileColor") {
              property.text = options.background;
            } else {
              property.attrs.src = relative(
                property.attrs.src,
                options.manifestRelativePaths
              );
            }
          });
          properties = jsonxml(properties, {
            prettyPrint: true,
            xmlHeader: true,
            indent: "  ",
          });
        } else if (name === "yandex-browser-manifest.json") {
          properties.version = options.version;
          properties.api_version = 1;
          properties.layout.logo = relative(
            properties.layout.logo,
            options.manifestRelativePaths
          );
          properties.layout.color = options.background;
          properties = JSON.stringify(properties, null, 2);
        } else {
          return Promise.reject(`Unknown format of file ${name}.`);
        }
        return Promise.resolve({ name, contents: properties });
      },
    },

    Images: {
      async render(
        sourceset: SourceImage[],
        properties: IconPlaneOptions
      ): Promise<Buffer> {
        const maximum = Math.max(properties.width, properties.height);
        const offset = Math.round((maximum / 100) * properties.offset) || 0;
        const width = properties.width - offset * 2;
        const height = properties.height - offset * 2;

        const svgSource = sourceset.find(
          (source) => source.metadata.format === "svg"
        );

        if (svgSource) {
          log("Image:render", `Rendering SVG to ${width}x${height}`);
          const svgBuffer = await svgtool.ensureSize(svgSource, width, height);

          return await sharp(svgBuffer)
            .resize({
              width,
              height,
              fit: sharp.fit.contain,
              background: "#00000000",
            })
            .toBuffer();
        }

        log(
          "Image:render",
          `Find nearest icon to ${width}x${height} with offset ${offset}`
        );
        const sideSize = Math.max(width, height);
        const nearest = minByKey(sourceset, (icon) => {
          const iconSideSize = Math.max(
            icon.metadata.width,
            icon.metadata.height
          );

          return [
            iconSideSize >= sideSize ? 0 : 1,
            Math.abs(iconSideSize - sideSize),
          ];
        });

        log("Images:render", `Resizing PNG to ${width}x${height}`);

        const image = await sharp(nearest.data).ensureAlpha();
        const metadata = await image.metadata();

        return await image
          .resize({
            width,
            height,
            fit: sharp.fit.contain,
            background: "#00000000",
            kernel:
              options.pixel_art &&
              width >= metadata.width &&
              height >= metadata.height
                ? "nearest"
                : "lanczos3",
          })
          .toBuffer();
      },

      mask: path.join(__dirname, "mask.png"),
      overlayGlow: path.join(__dirname, "overlay-glow.png"),
      // Gimp drop shadow filter: input: mask.png, config: X: 2, Y: 5, Offset: 5, Color: black, Opacity: 20
      overlayShadow: path.join(__dirname, "overlay-shadow.png"),

      async maskImage(image: Buffer, mask: string): Promise<Buffer> {
        const pipeline = sharp(image);
        const meta = await pipeline.metadata();

        const maskBuffer = await sharp(mask)
          .resize({
            width: meta.width,
            height: meta.height,
            fit: sharp.fit.contain,
            background: "#00000000",
          })
          .toColourspace("b-w")
          .toBuffer();

        return await pipeline.joinChannel(maskBuffer).png().toBuffer();
      },

      async overlay(image: Buffer, coverPath: string): Promise<Buffer> {
        const pipeline = sharp(image);
        const meta = await pipeline.metadata();

        const cover = await sharp(coverPath)
          .resize({
            width: meta.width,
            height: meta.height,
            fit: sharp.fit.contain,
          })
          .png()
          .toBuffer();

        return await pipeline
          .composite([{ input: cover, left: 0, top: 0 }])
          .png()
          .toBuffer();
      },

      async composite(
        canvas: Buffer,
        image: Buffer,
        properties: IconPlaneOptions,
        raw = false
      ): Promise<RawImage | Buffer> {
        log(
          "Images:composite",
          `Compositing favicon on ${properties.width}x${properties.height} canvas with offset ${properties.offset}`
        );

        let pipeline = sharp(canvas).composite([
          { input: image, left: properties.offset, top: properties.offset },
        ]);

        if (properties.rotate) {
          const degrees = 90;

          log("Images:render", `Rotating image by ${degrees}`);
          pipeline = pipeline.rotate(degrees);
        }

        if (raw) {
          return await pipeline
            .toColorspace("srgb")
            .raw({ depth: "uchar" })
            .toBuffer({ resolveWithObject: true });
        }
        return await pipeline.png().toBuffer();
      },
    },
  };
}
