import { Transform, TransformCallback } from "stream";
import { type FaviconOptions, defaultOptions } from "./config/defaults";
import { sourceImages } from "./helpers";
import { getPlatform } from "./platforms/index";

export { FaviconOptions };

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
export class FaviconHtmlTag {
  readonly tag: string;
  readonly attrs: Record<string, string | boolean>;

  constructor(tag: string, attrs: Record<string, string | boolean> = {}) {
    this.tag = tag;
    this.attrs = attrs;
  }

  stringify() {
    const attrs = Object.entries(this.attrs)
      .map(([key, value]) => {
        if (value === true) return key;
        if (value === false) return "";
        return `${key}="${value}"`;
      })
      .filter(Boolean)
      .join(" ");

    return `<${this.tag} ${attrs || ""}>`;
  }
}

export interface FaviconResponse {
  readonly images: FaviconImage[];
  readonly files: FaviconFile[];
  readonly html: FaviconHtmlElement[];
  readonly htmlTags: FaviconHtmlTag[];
}

export type FaviconsSource = string | Buffer | (string | Buffer)[];
export async function favicons(
  source: FaviconsSource,
  options: FaviconOptions & { readonly htmlUnStringified?: boolean } = {},
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
    htmlTags: responses.flatMap((r) => r.htmlTags),
  };
}

export default favicons;

export interface FaviconStreamOptions extends FaviconOptions {
  readonly html?: string;
  readonly pipeHTML?: boolean;
  readonly emitBuffers?: boolean;
}

export type HandleHTML = (
  html: FaviconHtmlElement[],
  htmlTags: FaviconHtmlTag[],
) => void;

class FaviconStream extends Transform {
  #options: FaviconStreamOptions & { readonly htmlUnStringified?: boolean };
  #handleHTML: HandleHTML;

  constructor(
    options: FaviconStreamOptions & { readonly htmlUnStringified?: boolean },
    handleHTML: HandleHTML,
  ) {
    super({ objectMode: true });
    this.#options = options;
    this.#handleHTML = handleHTML;
  }

  override _transform(
    file: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- superclass uses any
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    const { html: htmlPath, pipeHTML, ...options } = this.#options;

    favicons(file, { ...options, htmlUnStringified: true })
      .then(({ images, files, html, htmlTags }) => {
        for (const { name, contents } of [...images, ...files]) {
          this.push({
            name,
            contents: this.#convertContent(contents),
          });
        }

        if (this.#handleHTML) {
          this.#handleHTML(html, htmlTags);
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
