import escapeHtml from "escape-html";
import { FaviconFile, FaviconHtmlElement, FaviconImage } from "../index";
import { FaviconOptions, IconOptions } from "../config/defaults";
import { maskable, transparentIcon } from "../config/icons";
import {
  createFavicon,
  relativeTo,
  SourceImage,
  sourceImages,
} from "../helpers";
import { Platform, uniformIconOptions } from "./base";

interface Icon {
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
}

interface Shortcut {
  readonly name: string;
  readonly short_name: string;
  readonly description?: string;
  readonly url: string;
  readonly icons?: Icon[];
}

const ICONS_OPTIONS: Record<string, IconOptions> = {
  "android-chrome-36x36.png": transparentIcon(36),
  "android-chrome-48x48.png": transparentIcon(48),
  "android-chrome-72x72.png": transparentIcon(72),
  "android-chrome-96x96.png": transparentIcon(96),
  "android-chrome-144x144.png": transparentIcon(144),
  "android-chrome-192x192.png": transparentIcon(192),
  "android-chrome-256x256.png": transparentIcon(256),
  "android-chrome-384x384.png": transparentIcon(384),
  "android-chrome-512x512.png": transparentIcon(512),
};

const ICONS_OPTIONS_MASKABLE: Record<string, IconOptions> = {
  "android-chrome-maskable-36x36.png": maskable(transparentIcon(36)),
  "android-chrome-maskable-48x48.png": maskable(transparentIcon(48)),
  "android-chrome-maskable-72x72.png": maskable(transparentIcon(72)),
  "android-chrome-maskable-96x96.png": maskable(transparentIcon(96)),
  "android-chrome-maskable-144x144.png": maskable(transparentIcon(144)),
  "android-chrome-maskable-192x192.png": maskable(transparentIcon(192)),
  "android-chrome-maskable-256x256.png": maskable(transparentIcon(256)),
  "android-chrome-maskable-384x384.png": maskable(transparentIcon(384)),
  "android-chrome-maskable-512x512.png": maskable(transparentIcon(512)),
};

const SHORTCUT_ICONS_OPTIONS: Record<string, IconOptions> = {
  "36x36.png": transparentIcon(36),
  "48x48.png": transparentIcon(48),
  "72x72.png": transparentIcon(72),
  "96x96.png": transparentIcon(96),
  "144x144.png": transparentIcon(144),
  "192x192.png": transparentIcon(192),
};

export class AndroidPlatform extends Platform {
  constructor(options: FaviconOptions) {
    super(
      options,
      uniformIconOptions(options, options.icons.android, ICONS_OPTIONS)
    );
  }

  override async createImages(
    sourceset: SourceImage[]
  ): Promise<FaviconImage[]> {
    let icons = await Promise.all(
      Object.entries(this.iconOptions).map(([iconName, iconOption]) =>
        createFavicon(sourceset, iconName, iconOption)
      )
    );

    // Generate android maskable images from a different source set
    if (
      this.options.manifestMaskable &&
      typeof this.options.manifestMaskable !== "boolean"
    ) {
      const maskableSourceset = await sourceImages(
        this.options.manifestMaskable
      );

      const maskable = await Promise.all(
        Object.entries(ICONS_OPTIONS_MASKABLE).map(([iconName, iconOption]) =>
          createFavicon(maskableSourceset, iconName, iconOption)
        )
      );

      icons = [...icons, ...maskable];
    }
    if (
      Array.isArray(this.options.shortcuts) &&
      this.options.shortcuts.length > 0
    ) {
      icons = [...icons, ...(await this.shortcutIcons())];
    }

    return icons;
  }

  override async createFiles(): Promise<FaviconFile[]> {
    return [this.manifest()];
  }

  override async createHtml(): Promise<FaviconHtmlElement[]> {
    // prettier-ignore
    return [
      this.options.loadManifestWithCredentials
        ? `<link rel="manifest" href="${this.relative(this.manifestFileName())}" crossOrigin="use-credentials">`
        : `<link rel="manifest" href="${this.relative(this.manifestFileName())}">`,
      `<meta name="mobile-web-app-capable" content="yes">`,
      `<meta name="theme-color" content="${this.options.theme_color || this.options.background}">`,
      this.options.appName
        ? `<meta name="application-name" content="${escapeHtml(this.options.appName)}">`
        : `<meta name="application-name">`,
    ];
  }

  private async shortcutIcons(): Promise<FaviconImage[]> {
    const icons = await Promise.all(
      this.options.shortcuts.map(async (shortcut, index) => {
        if (!shortcut.name || !shortcut.url || !shortcut.icon) return null;
        const shortcutSourceset = await sourceImages(shortcut.icon);
        return Promise.all(
          Object.entries(SHORTCUT_ICONS_OPTIONS).map(([shortcutName, option]) =>
            createFavicon(
              shortcutSourceset,
              `shortcut${index + 1}-${shortcutName}`,
              option
            )
          )
        );
      })
    );
    return icons.flat();
  }

  private manifestFileName(): string {
    return (
      this.options.files?.android?.manifestFileName ?? "manifest.webmanifest"
    );
  }

  private manifest(): FaviconFile {
    const { options } = this;
    const basePath = options.manifestRelativePaths ? null : options.path;

    const properties: Record<string, unknown> = {
      name: options.appName,
      short_name: options.appShortName || options.appName,
      description: options.appDescription,
      dir: options.dir,
      lang: options.lang,
      display: options.display,
      orientation: options.orientation,
      scope: options.scope,
      start_url: options.start_url,
      background_color: options.background,
      theme_color: options.theme_color,
    };

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

    let icons = this.iconOptions;

    // If manifestMaskable is set but is not a boolean
    // assume a file (or an array) is passed, and we should link
    // the generated files with maskable as purpose.
    if (
      options.manifestMaskable &&
      typeof options.manifestMaskable !== "boolean"
    ) {
      icons = {
        ...icons,
        ...ICONS_OPTIONS_MASKABLE,
      };
    }

    const defaultPurpose =
      options.manifestMaskable === true ? "any maskable" : "any";

    properties.icons = Object.entries(icons).map(([name, iconOptions]) => {
      const { width, height } = iconOptions.sizes[0];

      return {
        src: relativeTo(basePath, name),
        sizes: `${width}x${height}`,
        type: "image/png",
        purpose: iconOptions.purpose ?? defaultPurpose,
      };
    });

    if (Array.isArray(options.shortcuts) && options.shortcuts.length > 0) {
      properties.shortcuts = this.manifestShortcuts(basePath);
    }

    return {
      name: this.manifestFileName(),
      contents: JSON.stringify(properties, null, 2),
    };
  }

  private manifestShortcuts(basePath: string): Shortcut[] {
    return this.options.shortcuts
      .map((shortcut, index) => {
        if (!shortcut.name || !shortcut.url) return null; // skip if required name or url missing
        return {
          name: shortcut.name,
          short_name: shortcut.short_name || shortcut.name, // fallback to name
          description: shortcut.description, // optional
          url: shortcut.url,
          icons: shortcut.icon
            ? Object.entries(SHORTCUT_ICONS_OPTIONS).map(
                ([shortcutName, option]) => {
                  const { width, height } = option.sizes[0];
                  return {
                    src: relativeTo(
                      basePath,
                      `shortcut${index + 1}-${shortcutName}`
                    ),
                    sizes: `${width}x${height}`,
                    type: "image/png",
                  };
                }
              )
            : undefined,
        };
      })
      .filter((x) => x !== null);
  }
}
