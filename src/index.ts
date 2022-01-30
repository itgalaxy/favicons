// generate README sources:  jq ". | with_entries(.value |= keys)" < icons.json

// TO_DO: More comments to know what's going on, for future maintainers

import { Transform } from "stream";
import { FaviconOptions, defaultOptions } from "./config/defaults.js";
import { RawImage, sourceImages } from "./helpers.js";
import { getPlatform } from "./platforms/index.js";

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
  options = {
    ...defaultOptions,
    ...options,
    icons: { ...defaultOptions.icons, ...options.icons },
    output: { ...defaultOptions.output, ...options.output },
  };

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
    const platform = getPlatform(platformName, options);

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

export interface FaviconStreamOptions extends FaviconOptions {
  readonly html?: string;
  readonly pipeHTML?: boolean;
  readonly emitBuffers?: boolean;
}

export type HandleHTML = (html: FaviconHtmlElement[]) => void;

class FaviconStream extends Transform {
  #options: FaviconStreamOptions;
  #handleHTML: HandleHTML;

  constructor(options: FaviconStreamOptions, handleHTML: HandleHTML) {
    super({ objectMode: true });
    this.#options = options;
    this.#handleHTML = handleHTML;
  }

  _transform(file, _encoding, callback) {
    const { html: htmlPath, pipeHTML, ...options } = this.#options;

    favicons(file, options)
      .then(({ images, files, html }) => {
        for (const { name, contents } of [...images, ...files]) {
          this.push({
            name,
            contents: this.#convertContent(contents),
          });
        }

        if (this.#handleHTML) {
          this.#handleHTML(html);
        }

        if (pipeHTML) {
          this.push({
            name: htmlPath,
            contents: this.#convertContent(html.join("\n")),
          });
        }

        callback(null);
      })
      .catch(callback);
  }

  #convertContent(contents: string | Buffer): string | Buffer {
    return (this.#options.emitBuffers ?? true) && !Buffer.isBuffer(contents)
      ? Buffer.from(contents)
      : contents;
  }
}

export function stream(options: FaviconStreamOptions, handleHTML: HandleHTML) {
  return new FaviconStream(options, handleHTML);
}
