import { Transform, TransformCallback } from "stream";
import { FaviconOptions, defaultOptions } from "./config/defaults";
import { sourceImages } from "./helpers";
import { getPlatform } from "./platforms/index";

export interface FaviconImage {
  readonly name: string;
  readonly contents: Buffer;
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

export async function favicons(
  source: string | string[] | Buffer | Buffer[],
  options: FaviconOptions = {}
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

  const responses: FaviconResponse[] = [];

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

  override _transform(
    file: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- superclass uses any
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
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
