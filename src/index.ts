// generate README sources:  jq ". | with_entries(.value |= keys)" < icons.json

// TO_DO: More comments to know what's going on, for future maintainers

import through2 from "through2";
import clone from "clone";
import defaultsDeep from "lodash.defaultsdeep";
import * as path from "path";
import File from "vinyl";
import { FaviconOptions, defaultOptions, IconOptions } from "./config/defaults";
import { FILES_OPTIONS } from "./config/files";
import { HTML_TEMPLATES } from "./config/html";
import { ICONS_OPTIONS } from "./config/icons";
import {
  asString,
  createBlankImage,
  Dictionary,
  filterKeys,
  helpers,
  IconPlaneOptions,
  mapValues,
  RawImage,
  SourceImage,
  sourceImages,
} from "./helpers";
import { toIco } from "./ico";

export interface FaviconImage {
  readonly name: string;
  readonly contents: Buffer | RawImage;
}

export interface FaviconFile {
  readonly name: string;
  readonly contents: string;
}

const configDefaults = {
  defaults: defaultOptions,
  files: FILES_OPTIONS,
  html: HTML_TEMPLATES,
  icons: ICONS_OPTIONS,
};

export type FaviconHtmlElement = string;

export interface FaviconResponse {
  readonly images: FaviconImage[];
  readonly files: FaviconFile[];
  readonly html: FaviconHtmlElement[];
}

/**
 * @typedef FaviconResponse
 * @type {object}
 * @property {FaviconImage[]} images
 * @property {FaviconFile[]} files
 * @property {FaviconHtmlElement[]} html
 */

/**
 * @typedef FaviconCallback
 * @type {(error: Error|null, response: FaviconResponse) => any}
 */

/**
 * Build favicons
 * @param {string} source - The path to the source image to generate icons from
 * @param {Partial<FaviconOptions>|undefined} options - The options used to build favicons
 * @param {FaviconCallback|undefined} next - The callback to execute after processing
 * @returns {Promise|Promise<FaviconResponse>}
 */
// eslint-disable-next-line no-undefined
function favicons(source, options: FaviconOptions = {}, next = undefined) {
  if (next) {
    return favicons(source, options)
      .then((response) => next(null, response))
      .catch(next);
  }

  options = defaultsDeep(options, defaultOptions);

  const config = clone(configDefaults);
  const µ = helpers(options);

  async function createFavicon(
    sourceset: SourceImage[],
    properties: IconPlaneOptions[],
    name: string,
    raw = false
  ): Promise<FaviconImage> {
    if (path.extname(name) === ".ico" || properties.length !== 1) {
      const images = await Promise.all(
        properties.map((props) =>
          createPlaneFavicon(
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

    return await createPlaneFavicon(sourceset, properties[0], name, raw);
  }

  async function createPlaneFavicon(
    sourceset: SourceImage[],
    properties: IconPlaneOptions,
    name: string,
    raw = false
  ): Promise<FaviconImage> {
    µ.log(
      "Image:create",
      `Creating empty ${properties.width}x${properties.height} canvas with ${properties.background} background`
    );

    let canvas = await createBlankImage(properties);

    if (properties.mask) {
      µ.log("Images:composite", "Masking composite image on circle");

      canvas = await µ.Images.maskImage(canvas, µ.Images.mask);

      if (properties.overlayGlow) {
        canvas = await µ.Images.overlay(canvas, µ.Images.overlayGlow);
      }
      if (properties.overlayShadow) {
        canvas = await µ.Images.overlay(canvas, µ.Images.overlayShadow);
      }
    }

    const image = await µ.Images.render(sourceset, properties);
    const contents = await µ.Images.composite(canvas, image, properties, raw);

    return { name, contents };
  }

  async function createHTML(platform): Promise<string[]> {
    if (!options.output.html) return [];
    return await Promise.all((config.html[platform] || []).map(µ.HTML.render));
  }

  function createFiles(platform) {
    if (!options.output.files) return [];
    return Promise.all(
      Object.keys(config.files[platform] || {}).map((name) =>
        µ.Files.create(config.files[platform][name], name)
      )
    );
  }

  function uniformIconOptions(platform: string): Dictionary<IconOptions> {
    const platformConfig: Dictionary<IconOptions> =
      config.icons[platform] ?? {};

    const iconsChoice = options.icons[platform];

    if (Array.isArray(iconsChoice)) {
      return filterKeys(platformConfig, (name) => iconsChoice.includes(name));
    } else if (typeof iconsChoice === "object") {
      return mapValues(platformConfig, (iconOptions: IconOptions) => ({
        ...iconOptions,
        ...iconsChoice,
      }));
    }
    return platformConfig;
  }

  function flattenIconOptions(iconOptions: IconOptions): IconPlaneOptions[] {
    return iconOptions.sizes.map((size) => ({
      ...size,
      background:
        iconOptions.background === true
          ? options.background
          : asString(iconOptions.background),
      transparent: iconOptions.transparent,
      mask: iconOptions.mask ?? false,
      overlayGlow: iconOptions.overlayGlow ?? false,
      overlayShadow: iconOptions.overlayShadow ?? false,
      rotate: iconOptions.rotate,
    }));
  }

  async function createFavicons(
    sourceset: SourceImage[],
    platform: string
  ): Promise<FaviconImage[]> {
    if (!options.output.images) return [];

    const iconOptions = uniformIconOptions(platform);

    return await Promise.all(
      Object.entries(iconOptions).map(([iconName, iconOptions]) => {
        const iconPlaneOptions = flattenIconOptions(iconOptions);

        return createFavicon(sourceset, iconPlaneOptions, iconName);
      })
    );
  }

  async function createPlatform(
    sourceset: SourceImage[],
    platform
  ): Promise<FaviconResponse> {
    const imagesPromise = createFavicons(sourceset, platform);
    const filesPromise = createFiles(platform);
    const htmlPromise = createHTML(platform);

    return {
      images: await imagesPromise,
      files: await filesPromise,
      html: await htmlPromise,
    };
  }

  async function create(sourceset: SourceImage[]): Promise<FaviconResponse> {
    const responses = [];

    const platforms = Object.keys(options.icons)
      .filter((platform) => options.icons[platform])
      .sort((a, b) => {
        if (a === "favicons") return -1;
        if (b === "favicons") return 1;
        return a.localeCompare(b);
      });

    for (const platform of platforms) {
      responses.push(await createPlatform(sourceset, platform));
    }

    // Generate android maskable images from a different source set
    if (
      options.icons.android &&
      options.manifestMaskable &&
      typeof options.manifestMaskable !== "boolean"
    ) {
      µ.log(
        "General:source",
        `Maskable source type is ${typeof options.manifestMaskable}`
      );
      const maskableSourceset = await sourceImages(options.manifestMaskable);

      responses.push(
        await createPlatform(maskableSourceset, "android_maskable")
      );
    }

    return {
      images: responses.flatMap((r) => r.images),
      files: responses.flatMap((r) => r.files),
      html: responses.flatMap((r) => r.html),
    };
  }

  µ.log("General:source", `Source type is ${typeof source}`);
  return sourceImages(source).then(create);
}

function stream(params, handleHtml) {
  /* eslint no-invalid-this: 0 */
  return through2.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new Error("Streaming not supported"));
    }

    const { html: path, pipeHTML, ...options } = params;

    favicons(file.contents, options)
      .then(({ images, files, html }) => {
        for (const asset of [...images, ...files]) {
          this.push(
            new File({
              path: asset.name,
              contents: Buffer.isBuffer(asset.contents)
                ? asset.contents
                : Buffer.from(asset.contents),
            })
          );
        }

        if (handleHtml) {
          handleHtml(html);
        }

        if (pipeHTML) {
          this.push(
            new File({
              path,
              contents: Buffer.from(html.join("\n")),
            })
          );
        }

        callback(null);
      })
      .catch(callback);
  });
}

module.exports = favicons;
module.exports.config = configDefaults;
module.exports.stream = stream;
