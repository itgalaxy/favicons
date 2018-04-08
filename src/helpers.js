const path = require("path"),
  url = require("url"),
  fs = require("fs"),
  promisify = require("util.promisify"),
  color = require("tinycolor2"),
  cheerio = require("cheerio"),
  colors = require("colors"),
  jsonxml = require("jsontoxml"),
  sizeOf = require("image-size"),
  Jimp = require("jimp"),
  svg2png = require("svg2png"),
  File = require("vinyl"),
  Reflect = require("harmony-reflect"),
  PLATFORM_OPTIONS = require("./config/platform-options.json");

(() => {
  "use strict";

  const xmlconfig = { prettyPrint: true, xmlHeader: true, indent: "  " },
    HEX_MAX = 255,
    ROTATE_DEGREES = 90;

  function helpers(options) {
    function directory(path) {
      return path.substr(-1) === "/" ? path : `${path}/`;
    }

    function relative(path) {
      return url.resolve(options.path && directory(options.path), path);
    }

    function print(context, message) {
      if (options.logging && message) {
        const { magenta, green, yellow } = colors;

        message = message.replace(/ \d+(x\d+)?/g, item => magenta(item));
        console.log(`${green("[Favicons]")} ${yellow(context)}: ${message}...`);
      }
    }

    return {
      General: {
        source(src) {
          print("General:source", `Source type is ${typeof src}`);

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

        preparePlatformOptions(platform, options, baseOptions) {
          if (typeof options !== "object") {
            options = {};
          }

          for (const key of Object.keys(options)) {
            const platformOptionsRef = PLATFORM_OPTIONS[key];

            if (
              typeof platformOptionsRef === "undefined" ||
              !platformOptionsRef.platforms.includes(platform)
            ) {
              return Reflect.deleteProperty(options, key);
            }
          }

          for (const key of Object.keys(PLATFORM_OPTIONS)) {
            const { platforms, defaultTo } = PLATFORM_OPTIONS[key];

            if (
              typeof options[key] === "undefined" &&
              platforms.includes(platform)
            ) {
              options[key] = defaultTo;
            }
          }

          if (typeof options.background === "boolean") {
            if (platform === "android" && !options.background) {
              options.background = "transparent";
            } else {
              options.background = baseOptions.background;
            }
          }

          if (platform === "android" && options.background !== "transparent") {
            options.disableTransparency = true;
          }

          return options;
        },

        background(hex) {
          print("General:background", `Parsing colour ${hex}`);
          const rgba = color(hex).toRgb();

          return Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a * HEX_MAX);
        },

        /* eslint no-underscore-dangle: 0 */
        vinyl(object, input) {
          const output = new File({
            path: object.name,
            contents: Buffer.isBuffer(object.contents)
              ? object.contents
              : new Buffer(object.contents)
          });

          // gulp-cache support
          if (typeof input._cachedKey !== "undefined") {
            output._cachedKey = input._cachedKey;
          }

          return output;
        }
      },

      HTML: {
        parse(html) {
          return new Promise(resolve => {
            print("HTML:parse", "HTML found, parsing and modifying source");
            const $ = cheerio.load(html),
              link = $("*").is("link"),
              attribute = link ? "href" : "content",
              value = $("*")
                .first()
                .attr(attribute);

            if (path.extname(value)) {
              $("*")
                .first()
                .attr(attribute, relative(value));
            } else if (value.slice(0, 1) === "#") {
              $("*")
                .first()
                .attr(attribute, options.background);
            } else if (
              html.includes("application-name") ||
              html.includes("apple-mobile-web-app-title")
            ) {
              $("*")
                .first()
                .attr(attribute, options.appName);
            }
            return resolve($.html());
          });
        }
      },

      Files: {
        create(properties, name, platformOptions) {
          return new Promise(resolve => {
            print("Files:create", `Creating file: ${name}`);
            if (name === "manifest.json") {
              properties.name = options.appName;
              properties.short_name = options.appName;
              properties.description = options.appDescription;
              properties.dir = options.dir;
              properties.lang = options.lang;
              properties.display = options.display;
              properties.orientation = options.orientation;
              properties.start_url = options.start_url;
              properties.background_color = options.background;
              properties.theme_color = options.theme_color;
              properties.icons.map(icon => (icon.src = relative(icon.src)));
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
                    [key]: relative(properties.icons[key])
                  }),
                {}
              );
              properties = JSON.stringify(properties, null, 2);
            } else if (name === "browserconfig.xml") {
              properties[0].children[0].children[0].children.map(property => {
                if (property.name === "TileColor") {
                  property.text = platformOptions.background;
                } else {
                  property.attrs.src = relative(property.attrs.src);
                }
              });
              properties = jsonxml(properties, xmlconfig);
            } else if (name === "yandex-browser-manifest.json") {
              properties.version = options.version;
              properties.api_version = 1;
              properties.layout.logo = relative(properties.layout.logo);
              properties.layout.color = platformOptions.background;
              properties = JSON.stringify(properties, null, 2);
            } else if (/\.html$/.test(name)) {
              properties = properties.join("\n");
            }
            return resolve({ name, contents: properties });
          });
        }
      },

      Images: {
        create(properties, background) {
          return new Promise((resolve, reject) => {
            print(
              "Image:create",
              `Creating empty ${properties.width}x${
                properties.height
              } canvas with ${
                properties.transparent ? "transparent" : background
              } background`
            );

            this.jimp = new Jimp(
              properties.width,
              properties.height,
              properties.transparent ? 0x00000000 : background,
              (error, canvas) => (error ? reject(error) : resolve(canvas))
            );
          });
        },

        render(sourceset, properties, offset) {
          print(
            "Image:render",
            `Find nearest icon to ${properties.width}x${
              properties.height
            } with offset ${offset}`
          );

          const offsetSize = offset * 2,
            width = properties.width - offsetSize,
            height = properties.height - offsetSize,
            sideSize = Math.max(width, height),
            svgSource = sourceset.find(source => source.size.type === "svg");

          let promise = null;

          if (svgSource) {
            print("Image:render", `Rendering SVG to ${width}x${height}`);
            promise = svg2png(svgSource.file, { height, width }).then(
              Jimp.read
            );
          } else {
            let nearestIcon = sourceset[0],
              nearestSideSize = Math.max(
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

            print("Images:render", `Resizing PNG to ${width}x${height}`);

            promise = Jimp.read(nearestIcon.file).then(image =>
              image.contain(
                width,
                height,
                Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
              )
            );
          }

          return promise.then(image => {
            if (properties.rotate) {
              print("Images:render", `Rotating image by ${ROTATE_DEGREES}`);
              image.rotate(ROTATE_DEGREES, false);
            }

            return image;
          });
        },

        mask: Jimp.read(path.join(__dirname, "mask.png")),
        overlay: Jimp.read(path.join(__dirname, "overlay.png")),

        composite(canvas, image, properties, offset, max) {
          if (properties.mask) {
            print("Images:composite", "Masking composite image on circle");
            return Promise.all([this.mask, this.overlay]).then(
              ([mask, overlay]) => {
                canvas.mask(mask.clone().resize(max, Jimp.AUTO), 0, 0);
                canvas.composite(overlay.clone().resize(max, Jimp.AUTO), 0, 0);
                properties = Object.assign({}, properties, {
                  mask: false
                });

                return this.composite(canvas, image, properties, offset, max);
              }
            );
          }

          print(
            "Images:composite",
            `Compositing favicon on ${properties.width}x${
              properties.height
            } canvas with offset ${offset}`
          );

          return new Promise((resolve, reject) =>
            canvas
              .composite(image, offset, offset)
              .getBuffer(
                Jimp.MIME_PNG,
                (error, result) => (error ? reject(error) : resolve(result))
              )
          );
        }
      }
    };
  }

  module.exports = helpers;
})();
