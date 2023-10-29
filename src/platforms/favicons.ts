import { FaviconElement } from "../index";
import { FaviconOptions, NamedIconOptions } from "../config/defaults";
import { transparentIcon, transparentIcons } from "../config/icons";
import { OptionalMixin, Platform, uniformIconOptions } from "./base";

const ICONS_OPTIONS: (NamedIconOptions & OptionalMixin)[] = [
  { name: "favicon.ico", ...transparentIcons(16, 24, 32, 48, 64) },
  { name: "favicon-16x16.png", ...transparentIcon(16) },
  { name: "favicon-32x32.png", ...transparentIcon(32) },
  { name: "favicon-48x48.png", ...transparentIcon(48) },
  { name: "favicon.svg", ...transparentIcon(1024), optional: true }, // arbitrary size. if more than one svg source is given, the closest to this size will be picked.
];

export class FaviconsPlatform extends Platform {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.favicons, ICONS_OPTIONS),
    );
  }

  override async createHtml(): Promise<FaviconElement[]> {
    return this.iconOptions.map(({ name, ...options }) => {
      const baseAttrs: Record<string, string> = {
        rel: "icon",
        type: "image/png",
      };
      if (name.endsWith(".ico")) {
        baseAttrs.type = "image/x-icon";
      } else if (name.endsWith(".svg")) {
        baseAttrs.type = "image/svg+xml";
      } else {
        const { width, height } = options.sizes[0];
        baseAttrs.sizes = `${width}x${height}`;
      }
      return new FaviconElement("link", {
        ...baseAttrs,
        href: this.cacheBusting(this.relative(name)),
      });
    });
  }
}
