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

export type FaviconHtmlElement = {
  readonly tag: string;
  readonly attrs: Record<string, string | boolean>;
};
export class FaviconElement implements FaviconHtmlElement {
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

    return `<${this.tag} ${attrs || ""} />`;
  }
}

export interface FaviconResponse<T> {
  readonly images: FaviconImage[];
  readonly files: FaviconFile[];
  readonly html: T[];
}

export type FaviconsSource = string | Buffer | (string | Buffer)[];
export async function favicons(
  source: FaviconsSource,
  options: FaviconOptions & { readonly htmlUnStringified: true },
): Promise<FaviconResponse<FaviconElement>>;
export async function favicons(
  source: FaviconsSource,
  options: FaviconOptions & { readonly htmlUnStringified: false },
): Promise<FaviconResponse<string>>;
export async function favicons(
  source: FaviconsSource,
  options: FaviconOptions & { readonly htmlUnStringified?: boolean } = {},
): Promise<FaviconResponse<FaviconElement | string>> {
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

  const responses: FaviconResponse<FaviconElement | string>[] = [];

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

export type HandleHTML<K> = (html: K[]) => void;

class FaviconStream<T> extends Transform {
  #options: FaviconStreamOptions & { readonly htmlUnStringified?: boolean };
  #handleHTML: HandleHTML<T extends true ? FaviconElement : string>;

  constructor(
    options: FaviconStreamOptions & { readonly htmlUnStringified: T & false },
    handleHTML: HandleHTML<T extends true ? FaviconElement : string>,
  );
  constructor(
    options: FaviconStreamOptions & { readonly htmlUnStringified: T & true },
    handleHTML: HandleHTML<T extends true ? FaviconElement : string>,
  );
  constructor(
    options: FaviconStreamOptions & { readonly htmlUnStringified?: boolean },
    handleHTML: HandleHTML<T extends true ? FaviconElement : string>,
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
      .then(({ images, files, html }) => {
        for (const { name, contents } of [...images, ...files]) {
          this.push({
            name,
            contents: this.#convertContent(contents),
          });
        }

        if (this.#handleHTML) {
          this.#handleHTML(
            <(T extends true ? FaviconElement : string)[]>(<unknown>html),
          );
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

export function stream<T>(
  options: FaviconStreamOptions & { readonly htmlUnStringified: T & false },
  handleHTML: HandleHTML<T extends true ? FaviconElement : string>,
): FaviconStream<false>;
export function stream<T>(
  options: FaviconStreamOptions & { readonly htmlUnStringified: T & true },
  handleHTML: HandleHTML<T extends true ? FaviconElement : string>,
): FaviconStream<true>;
export function stream<T>(
  options: FaviconStreamOptions & { readonly htmlUnStringified: T },
  handleHTML: HandleHTML<T extends true ? FaviconElement : string>,
) {
  return new FaviconStream(
    options as typeof options & { readonly htmlUnStringified: T & true },
    handleHTML,
  ) as T extends true ? FaviconStream<true> : FaviconStream<false>;
}
