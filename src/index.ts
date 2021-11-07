// generate README sources:  jq ". | with_entries(.value |= keys)" < icons.json

// TO_DO: More comments to know what's going on, for future maintainers

import through2 from "through2";
import defaultsDeep from "lodash.defaultsdeep";
import File from "vinyl";
import { FaviconOptions, defaultOptions } from "./config/defaults";
import { RawImage, sourceImages } from "./helpers";
import { getPlatform } from "./platforms";
import { dummyLog, Logger, prettyLog } from "./logger";

export interface FaviconImage {
  readonly name: string;
  readonly contents: Buffer | RawImage;
}

export interface FaviconFile {
  readonly name: string;
  readonly contents: string;
}

export const config = {
  defaults: defaultOptions,
};

export type FaviconHtmlElement = string;

export interface FaviconResponse {
  readonly images: FaviconImage[];
  readonly files: FaviconFile[];
  readonly html: FaviconHtmlElement[];
}

async function createFavicons(
  source: string | string[] | Buffer | Buffer[],
  options: FaviconOptions
): Promise<FaviconResponse> {
  options = defaultsDeep(options, defaultOptions);

  const log: Logger = options.logging ? prettyLog : dummyLog;

  log("General:source", `Source type is ${typeof source}`);
  const sourceset = await sourceImages(source);

  const platforms = Object.keys(options.icons)
    .filter((platform) => options.icons[platform])
    .sort((a, b) => {
      if (a === "favicons") return -1;
      if (b === "favicons") return 1;
      return a.localeCompare(b);
    });

  const responses = [];

  for (const platformName of platforms) {
    const platform = getPlatform(platformName, options, log);

    responses.push(await platform.create(sourceset));
  }

  return {
    images: responses.flatMap((r) => r.images),
    files: responses.flatMap((r) => r.files),
    html: responses.flatMap((r) => r.html),
  };
}

/**
 * @typedef FaviconCallback
 * @type {(error: Error|null, response: FaviconResponse) => any}
 */

/**
 * Build favicons
 * @param {string|string[]|Buffer|Buffer[]} source - The path to the source image to generate icons from
 * @param {Partial<FaviconOptions>|undefined} options - The options used to build favicons
 * @param {FaviconCallback|undefined} next - The callback to execute after processing
 * @returns {Promise|Promise<FaviconResponse>}
 */
// eslint-disable-next-line no-undefined
export function favicons(
  source: string | string[] | Buffer | Buffer[],
  options: FaviconOptions = {},
  next = undefined
) {
  if (next) {
    return favicons(source, options)
      .then((response) => next(null, response))
      .catch(next);
  }
  return createFavicons(source, options);
}

export default favicons;

export function stream(params, handleHtml) {
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
