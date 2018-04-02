const path = require("path"),
  url = require("url"),
  fs = require("fs"),
  promisify = require("util.promisify"),
  _ = require("underscore"),
  color = require("tinycolor2"),
  cheerio = require("cheerio"),
  colors = require("colors"),
  jsonxml = require("jsontoxml"),
  sizeOf = require("image-size"),
  async = require("async"),
  mkdirp = require("mkdirp"),
  Jimp = require("jimp"),
  svg2png = require("svg2png"),
  File = require("vinyl"),
  Reflect = require("harmony-reflect"),
  PLATFORM_OPTIONS = require("./config/platform-options.json");

(() => {
  "use strict";

  const xmlconfig = { prettyPrint: true, xmlHeader: true, indent: "  " },
    HEX_MAX = 255,
    NON_EXISTANT = -1,
    ROTATE_DEGREES = 90;

  function helpers(options) {
    function directory(path) {
      return path.substr(-1) === "/" ? path : `${path}/`;
    }

    function relative(path) {
      return url.resolve(options.path && directory(options.path), path);
    }

    function print(context, message) {
      let newMessage = "";

      if (options.logging && message) {
        _.each(message.split(" "), item => {
          newMessage += ` ${
            /^\d+x\d+$/gm.test(item) ? colors.magenta(item) : item
          }`;
        });
        console.log(
          `${colors.green("[Favicons]")} ${context.yellow}:${newMessage}...`
        );
      }
    }

    function updateDocument(document, code, tags, next) {
      const $ = cheerio.load(document, { decodeEntities: false }),
        target = $("head").length > 0 ? $("head") : $.root(),
        newCode = cheerio.load(code.join("\n"), { decodeEntities: false });

      async.each(
        tags,
        (platform, callback) => {
          async.forEachOf(
            platform,
            (tag, selector, cb) => {
              if (options.replace) {
                $(selector).remove();
              } else if ($(selector).length) {
                newCode(selector).remove();
              }
              return cb(null);
            },
            callback
          );
        },
        error => {
          target.append(newCode.html());
          return next(error, $.html().replace(/^\s*$[\n\r]{1,}/gm, ""));
        }
      );
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

          _.each(options, (value, key) => {
            const platformOptionsRef = PLATFORM_OPTIONS[key];

            if (
              typeof platformOptionsRef === "undefined" ||
              platformOptionsRef.platforms.indexOf(platform) === -1
            ) {
              return Reflect.deleteProperty(options, key);
            }
          });

          _.each(PLATFORM_OPTIONS, ({ platforms, defaultTo }, key) => {
            if (
              typeof options[key] === "undefined" &&
              platforms.indexOf(platform) !== -1
            ) {
              options[key] = defaultTo;
            }
          });

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
        parse(html, callback) {
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
            html.indexOf("application-name") !== NON_EXISTANT ||
            html.indexOf("apple-mobile-web-app-title") !== NON_EXISTANT
          ) {
            $("*")
              .first()
              .attr(attribute, options.appName);
          }
          return callback(null, $.html());
        },

        update(document, code, tags, callback) {
          const encoding = { encoding: "utf8" };

          async.waterfall(
            [
              cb => mkdirp(path.dirname(document), cb),
              (made, cb) =>
                fs.readFile(document, encoding, (error, data) =>
                  cb(null, error ? null : data)
                ),
              (data, cb) =>
                data
                  ? updateDocument(data, code, tags, cb)
                  : cb(null, code.join("\n")),
              (html, cb) => fs.writeFile(document, html, options, cb)
            ],
            callback
          );
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
              _.map(properties.icons, icon => (icon.src = relative(icon.src)));
              properties = JSON.stringify(properties, null, 2);
            } else if (name === "manifest.webapp") {
              properties.version = options.version;
              properties.name = options.appName;
              properties.description = options.appDescription;
              properties.developer.name = options.developerName;
              properties.developer.url = options.developerURL;
              properties.icons = _.mapObject(properties.icons, property =>
                relative(property)
              );
              properties = JSON.stringify(properties, null, 2);
            } else if (name === "browserconfig.xml") {
              _.map(
                properties[0].children[0].children[0].children,
                property => {
                  if (property.name === "TileColor") {
                    property.text = platformOptions.background;
                  } else {
                    property.attrs.src = relative(property.attrs.src);
                  }
                }
              );
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

        read(file) {
          print("Image:read", `Reading file: ${file.buffer}`);
          return Jimp.read(file);
        },

        nearest(sourceset, properties, offset) {
          print(
            "Image:nearest",
            `Find nearest icon to ${properties.width}x${
              properties.height
            } with offset ${offset}`
          );

          const offsetSize = offset * 2,
            width = properties.width - offsetSize,
            height = properties.height - offsetSize,
            svgSource = _.find(sourceset, source => source.size.type === "svg");

          if (svgSource) {
            print(
              "Image:nearest",
              `SVG source will be saved as ${width}x${height}`
            );
            return svg2png(svgSource.file, { height, width }).then(
              resizedBuffer => ({
                size: sizeOf(resizedBuffer),
                file: resizedBuffer
              })
            );
          }
          return new Promise(resolve => {
            const sideSize = Math.max(width, height);
            let nearestIcon = sourceset[0],
              nearestSideSize = Math.max(
                nearestIcon.size.width,
                nearestIcon.size.height
              );

            _.each(sourceset, icon => {
              const max = Math.max(icon.size.width, icon.size.height);

              if (
                (nearestSideSize > max || nearestSideSize < sideSize) &&
                max >= sideSize
              ) {
                nearestIcon = icon;
                nearestSideSize = max;
              }
            });

            resolve(nearestIcon);
          });
        },

        resize(image, properties, offset) {
          return new Promise(resolve => {
            print(
              "Images:resize",
              `Resizing image to contain in ${properties.width}x${
                properties.height
              } with offset ${offset}`
            );
            const offsetSize = offset * 2;

            if (properties.rotate) {
              print("Images:resize", `Rotating image by ${ROTATE_DEGREES}`);
              image.rotate(ROTATE_DEGREES, false);
            }

            image.contain(
              properties.width - offsetSize,
              properties.height - offsetSize,
              Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
            );

            return resolve(image);
          });
        },

        composite(canvas, image, properties, offset, maximum) {
          const circle = path.join(__dirname, "mask.png"),
            overlay = path.join(__dirname, "overlay.png");

          function compositeIcon() {
            print(
              "Images:composite",
              `Compositing favicon on ${properties.width}x${
                properties.height
              } canvas with offset ${offset}`
            );

            return canvas.composite(image, offset, offset);
          }

          if (properties.mask) {
            print("Images:composite", "Masking composite image on circle");
            return Promise.all([Jimp.read(circle), Jimp.read(overlay)]).then(
              images => {
                images[0].resize(maximum, Jimp.AUTO);
                images[1].resize(maximum, Jimp.AUTO);
                canvas.mask(images[0], 0, 0);
                canvas.composite(images[1], 0, 0);
                return compositeIcon();
              }
            );
          }

          return Promise.resolve(compositeIcon());
        },

        getBuffer(canvas) {
          print("Images:getBuffer", "Collecting image buffer from canvas");
          return promisify(canvas.getBuffer).bind(canvas)(Jimp.MIME_PNG);
        }
      }
    };
  }

  module.exports = helpers;
})();
