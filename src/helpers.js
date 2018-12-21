const path = require("path");
const url = require("url");
const fs = require("fs");
const promisify = require("util.promisify");
const color = require("tinycolor2");
const cheerio = require("cheerio");
const colors = require("colors");
const jsonxml = require("jsontoxml");
const sizeOf = require("image-size");
const Jimp = require("jimp");
const sharp = require("sharp");
const PLATFORM_OPTIONS = require("./config/platform-options.json");

module.exports = function(options) {
  function directory(path) {
    return path.substr(-1) === "/" ? path : `${path}/`;
  }

  function relative(path, relativeToPath = false) {
    return url.resolve(
      (!relativeToPath && options.path && directory(options.path)) || "",
      path
    );
  }

  function log(context, message) {
    if (options.logging) {
      const { magenta, green, yellow } = colors;

      message = message.replace(/ \d+(x\d+)?/g, item => magenta(item));
      message = message.replace(/#([0-9a-f]{3}){1,2}/g, item => magenta(item));
      console.log(`${green("[Favicons]")} ${yellow(context)}: ${message}...`);
    }
  }

  function parseColor(hex) {
    const { r, g, b, a } = color(hex).toRgb();

    return Jimp.rgbaToInt(r, g, b, a * 255);
  }

  return {
    General: {
      source(src) {
        log("General:source", `Source type is ${typeof src}`);

        if (Buffer.isBuffer(src)) {
          try {
            return Promise.resolve([{ size: sizeOf(src), file: src }]);
          } catch (error) {
            return Promise.reject(new Error("Invalid image buffer"));
          }
        } else if (typeof src === "string") {
          return promisify(fs.readFile)(src).then(this.source.bind(this));
        } else if (Array.isArray(src) && !src.some(Array.isArray)) {
          if (!src.length) {
            return Promise.reject(new Error("No source provided"));
          }

          return Promise.all(src.map(this.source.bind(this))).then(results =>
            [].concat(...results)
          );
        } else {
          return Promise.reject(new Error("Invalid source type provided"));
        }
      },

      preparePlatformOptions(platform) {
        const parameters =
          typeof options.icons[platform] === "object"
            ? options.icons[platform]
            : {};

        for (const key of Object.keys(parameters)) {
          if (
            !(key in PLATFORM_OPTIONS) ||
            !PLATFORM_OPTIONS[key].platforms.includes(platform)
          ) {
            throw new Error(
              `Unsupported option '${key}' on platform '${platform}'`
            );
          }
        }

        for (const key of Object.keys(PLATFORM_OPTIONS)) {
          const platformOption = PLATFORM_OPTIONS[key];
          const { platforms, defaultTo } = platformOption;

          if (!(key in parameters) && platforms.includes(platform)) {
            parameters[key] =
              platform in platformOption ? platformOption[platform] : defaultTo;
          }
        }

        if (parameters.background === true) {
          parameters.background = options.background;
        }

        return parameters;
      }
    },

    HTML: {
      parse(html) {
        return new Promise(resolve => {
          log("HTML:parse", "HTML found, parsing and modifying source");
          const $ = cheerio.load(html);
          const tag = $("*", "head").first();
          const isLink = tag.is("link");
          const attribute = isLink ? "href" : "content";
          const value = tag.attr(attribute);

          if (path.extname(value)) {
            tag.attr(attribute, relative(value));
          } else if (value.slice(0, 1) === "#") {
            tag.attr(attribute, options.background);
          } else if (
            html.includes("application-name") ||
            html.includes("apple-mobile-web-app-title")
          ) {
            tag.attr(attribute, options.appName);
          } else if (html.includes("apple-mobile-web-app-status-bar-style")) {
            tag.attr(attribute, options.appleStatusBarStyle);
          }

          if (
            isLink &&
            tag.attr("rel") === "manifest" &&
            options.loadManifestWithCredentials
          ) {
            tag.attr("crossOrigin", "use-credentials");
          }

          return resolve($.html(tag));
        });
      }
    },

    Files: {
      create(properties, name) {
        return new Promise(resolve => {
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
            properties.icons.map(
              icon =>
                (icon.src = relative(icon.src, options.manifestRelativePaths))
            );
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
                  )
                }),
              {}
            );
            properties = JSON.stringify(properties, null, 2);
          } else if (name === "browserconfig.xml") {
            properties[0].children[0].children[0].children.map(property => {
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
              indent: "  "
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
          } else if (/\.html$/.test(name)) {
            properties = properties.join("\n");
          }
          return resolve({ name, contents: properties });
        });
      }
    },

    Images: {
      create(properties) {
        return new Promise((resolve, reject) => {
          log(
            "Image:create",
            `Creating empty ${properties.width}x${
              properties.height
            } canvas with ${
              properties.transparent ? "transparent" : properties.background
            } background`
          );

          this.jimp = new Jimp(
            properties.width,
            properties.height,
            properties.transparent ? 0 : parseColor(properties.background),
            (error, canvas) => (error ? reject(error) : resolve(canvas))
          );
        });
      },

      render(sourceset, properties, offset) {
        log(
          "Image:render",
          `Find nearest icon to ${properties.width}x${
            properties.height
          } with offset ${offset}`
        );

        const width = properties.width - offset * 2;
        const height = properties.height - offset * 2;
        const svgSource = sourceset.find(source => source.size.type === "svg");

        let promise = null;

        if (svgSource) {
          const background = { r: 0, g: 0, b: 0, alpha: 0 };

          log("Image:render", `Rendering SVG to ${width}x${height}`);
          promise = sharp(svgSource.file)
            .resize({
              background,
              width,
              height,
              fit: sharp.fit.inside
            })
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) =>
              sharp(data)
                .extend({
                  background,
                  top: (height - info.height) >> 1,
                  bottom: (height - info.height + 1) >> 1,
                  left: (width - info.width) >> 1,
                  right: (width - info.width + 1) >> 1
                })
                .toBuffer()
                .then(Jimp.read)
            );
        } else {
          const sideSize = Math.max(width, height);

          let nearestIcon = sourceset[0];
          let nearestSideSize = Math.max(
            nearestIcon.size.width,
            nearestIcon.size.height
          );

          for (const icon of sourceset) {
            const max = Math.max(icon.size.width, icon.size.height);

            if (
              (nearestSideSize > max || nearestSideSize < sideSize) &&
              max >= sideSize
            ) {
              nearestIcon = icon;
              nearestSideSize = max;
            }
          }

          log("Images:render", `Resizing PNG to ${width}x${height}`);

          promise = Jimp.read(nearestIcon.file).then(image =>
            image.contain(
              width,
              height,
              Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE,
              options.pixel_art &&
                width >= image.bitmap.width &&
                height >= image.bitmap.height
                ? Jimp.RESIZE_NEAREST_NEIGHBOR
                : null
            )
          );
        }

        return promise.then(image => image);
      },

      mask: Jimp.read(path.join(__dirname, "mask.png")),
      overlayGlow: Jimp.read(path.join(__dirname, "overlay-glow.png")),
      // Gimp drop shadow filter: input: mask.png, config: X: 2, Y: 5, Offset: 5, Color: black, Opacity: 20
      overlayShadow: Jimp.read(path.join(__dirname, "overlay-shadow.png")),

      composite(canvas, image, properties, offset, max) {
        if (properties.mask) {
          log("Images:composite", "Masking composite image on circle");
          return Promise.all([
            this.mask,
            this.overlayGlow,
            this.overlayShadow
          ]).then(([mask, glow, shadow]) => {
            canvas.mask(mask.clone().resize(max, Jimp.AUTO), 0, 0);
            if (properties.overlayGlow) {
              canvas.composite(glow.clone().resize(max, Jimp.AUTO), 0, 0);
            }
            if (properties.overlayShadow) {
              canvas.composite(shadow.clone().resize(max, Jimp.AUTO), 0, 0);
            }
            properties = Object.assign({}, properties, {
              mask: false
            });

            return this.composite(canvas, image, properties, offset, max);
          });
        }

        log(
          "Images:composite",
          `Compositing favicon on ${properties.width}x${
            properties.height
          } canvas with offset ${offset}`
        );

        return new Promise((resolve, reject) => {
          canvas.composite(image, offset, offset);
          if (properties.rotate) {
            const degrees = 90;

            log("Images:render", `Rotating image by ${degrees}`);
            canvas.rotate(degrees, false);
          }
          return canvas.getBuffer(Jimp.MIME_PNG, (error, result) =>
            error ? reject(error) : resolve(result)
          );
        });
      }
    }
  };
};
