const path = require("path");
const url = require("url");
const fs = require("fs");
const { promisify } = require("util");
const colors = require("colors");
const jsonxml = require("jsontoxml");
const sizeOf = require("image-size");
const sharp = require("sharp");
const xml2js = require("xml2js");
const PLATFORM_OPTIONS = require("./config/platform-options.json");

function arrayComparator(a, b) {
  a = [a].flat(Infinity);
  b = [b].flat(Infinity);
  for (let i = 0; i < Math.max(a.length, b.length); ++i) {
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    if (a[i] !== b[i]) {
      return a[i] < b[i] ? -1 : 1;
    }
  }
  return 0;
}

function minBy(array, comparator) {
  return array.reduce((acc, cur) => (comparator(acc, cur) < 0 ? acc : cur));
}

function minByKey(array, keyFn) {
  return minBy(array, (a, b) => arrayComparator(keyFn(a), keyFn(b)));
}

module.exports = function (options) {
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

      message = message.replace(/ \d+(x\d+)?/g, (item) => magenta(item));
      message = message.replace(/#([0-9a-f]{3}){1,2}/g, (item) =>
        magenta(item)
      );
      console.log(`${green("[Favicons]")} ${yellow(context)}: ${message}...`);
    }
  }

  // sharp renders the SVG in its source width and height with 72 DPI which can
  // cause a blurry result in case the source SVG is defined in lower size than
  // the target size. To avoid this, resize the source SVG to the needed size
  // before passing it to sharp by increasing its width and/or height
  // attributes.
  //
  // Currently it seems this won't be fixed in sharp, so we need a workaround:
  // https://github.com/lovell/sharp/issues/729#issuecomment-284708688
  //
  // They suggest setting the image density to a "resized" density based on the
  // target render size but this does not seem to work with favicons and may
  // cause other errors with "unnecessarily high" image density values.
  //
  // For further information, see:
  // https://github.com/itgalaxy/favicons/issues/264
  const svgtool = {
    ensureSize(svgSource, width, height) {
      let svgWidth = svgSource.size.width;
      let svgHeight = svgSource.size.height;

      if (svgWidth >= width && svgHeight >= height) {
        // If the base SVG is large enough, it does not need to be modified.
        return Promise.resolve(svgSource.file);
      } else if (width > height) {
        svgHeight = Math.round(svgHeight * (width / svgWidth));
        svgWidth = width;
      } else {
        // width <= height
        svgWidth = Math.round(svgWidth * (height / svgHeight));
        svgHeight = height;
      }

      // Modify the source SVG's width and height attributes for sharp to render
      // it correctly.
      log("svgtool:ensureSize", `Resizing SVG to ${svgWidth}x${svgHeight}`);
      return this.resize(svgSource.file, svgWidth, svgHeight);
    },

    resize(svgFile, width, height) {
      return new Promise((resolve, reject) => {
        xml2js.parseString(svgFile, (err, xmlDoc) => {
          if (err) {
            return reject(err);
          }

          xmlDoc.svg.$.width = width;
          xmlDoc.svg.$.height = height;

          const builder = new xml2js.Builder();
          const modifiedSvg = builder.buildObject(xmlDoc);

          resolve(Buffer.from(modifiedSvg));
        });
      });
    },
  };

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

          return Promise.all(src.map(this.source.bind(this))).then((results) =>
            [].concat(...results)
          );
        } else {
          return Promise.reject(new Error("Invalid source type provided"));
        }
      },

      preparePlatformOptions(platform) {
        const icons = options.icons[platform];
        const parameters =
          typeof icons === "object" && !Array.isArray(icons) ? icons : {};

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
      },
    },

    HTML: {
      render(htmlTemplate) {
        return htmlTemplate(Object.assign({}, options, { relative }));
      },
    },

    Files: {
      create(properties, name) {
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
          properties.icons.forEach((icon) => {
            icon.src = relative(icon.src, options.manifestRelativePaths);
            icon.purpose =
              options.manifestMaskable === true ? "any maskable" : "any";
          });
          // If manifestMaskable is set but is not a boolean
          // assume a file (or an array) is passed, and we should link
          // the generated files with maskable as purpose.
          if (
            options.manifestMaskable &&
            typeof options.manifestMaskable !== "boolean"
          ) {
            const maskableIcons = properties.icons.map((icon) => ({
              ...icon,
              src: icon.src.replace(
                /android-chrome-(.+)\.png$/,
                "android-chrome-maskable-$1.png"
              ),
              purpose: "maskable",
            }));

            properties.icons = [...properties.icons, ...maskableIcons];
          }
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
                ),
              }),
            {}
          );
          properties = JSON.stringify(properties, null, 2);
        } else if (name === "browserconfig.xml") {
          properties[0].children[0].children[0].children.map((property) => {
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
            indent: "  ",
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
        } else {
          return Promise.reject(`Unknown format of file ${name}.`);
        }
        return Promise.resolve({ name, contents: properties });
      },
    },

    Images: {
      create(properties) {
        log(
          "Image:create",
          `Creating empty ${properties.width}x${
            properties.height
          } canvas with ${
            properties.transparent ? "transparent" : properties.background
          } background`
        );

        let image = sharp({
          create: {
            width: properties.width,
            height: properties.height,
            channels: properties.transparent ? 4 : 3,
            background: properties.transparent
              ? "#00000000"
              : properties.background,
          },
        });

        if (properties.transparent) {
          image = image.ensureAlpha();
        }
        return image.png().toBuffer();
      },

      async render(sourceset, properties, offset) {
        log(
          "Image:render",
          `Find nearest icon to ${properties.width}x${properties.height} with offset ${offset}`
        );

        const width = properties.width - offset * 2;
        const height = properties.height - offset * 2;
        const svgSource = sourceset.find(
          (source) => source.size.type === "svg"
        );

        if (svgSource) {
          log("Image:render", `Rendering SVG to ${width}x${height}`);
          const svgBuffer = await svgtool.ensureSize(svgSource, width, height);

          return await sharp(svgBuffer).resize({
            background: "#00000000",
            width,
            height,
            fit: sharp.fit.contain,
          });
        }

        const sideSize = Math.max(width, height);
        const nearestIcon = minByKey(sourceset, (icon) => {
          const iconSideSize = Math.max(icon.size.width, icon.size.height);

          return [
            iconSideSize >= sideSize ? 0 : 1,
            Math.abs(iconSideSize - sideSize),
          ];
        });

        log("Images:render", `Resizing PNG to ${width}x${height}`);

        const image = await sharp(nearestIcon.file).ensureAlpha();
        const metadata = await image.metadata();

        return image.resize({
          width,
          height,
          fit: sharp.fit.contain,
          background: "#00000000",
          kernel:
            options.pixel_art &&
            width >= metadata.width &&
            height >= metadata.height
              ? "nearest"
              : "lanczos3",
        });
      },

      mask: path.join(__dirname, "mask.png"),
      overlayGlow: path.join(__dirname, "overlay-glow.png"),
      // Gimp drop shadow filter: input: mask.png, config: X: 2, Y: 5, Offset: 5, Color: black, Opacity: 20
      overlayShadow: path.join(__dirname, "overlay-shadow.png"),

      async maskImage(image, mask) {
        const pipeline = sharp(image);
        const meta = await pipeline.metadata();

        const maskBuffer = await sharp(mask)
          .resize({
            width: meta.width,
            height: meta.height,
            fit: sharp.fit.contain,
            background: "#00000000",
          })
          .toColourspace("b-w")
          .toBuffer();

        return await pipeline.joinChannel(maskBuffer).png().toBuffer();
      },

      async overlay(image, coverPath) {
        const pipeline = sharp(image);
        const meta = await pipeline.metadata();

        const cover = await sharp(coverPath)
          .resize({
            width: meta.width,
            height: meta.height,
            fit: sharp.fit.contain,
          })
          .png()
          .toBuffer();

        return await pipeline
          .composite([{ input: cover, left: 0, top: 0 }])
          .png()
          .toBuffer();
      },

      async composite(canvas, image, properties, offset) {
        if (properties.mask) {
          log("Images:composite", "Masking composite image on circle");

          canvas = await this.maskImage(canvas, this.mask);

          if (properties.overlayGlow) {
            canvas = await this.overlay(canvas, this.overlayGlow);
          }
          if (properties.overlayShadow) {
            canvas = await this.overlay(canvas, this.overlayShadow);
          }
        }

        log(
          "Images:composite",
          `Compositing favicon on ${properties.width}x${properties.height} canvas with offset ${offset}`
        );

        const input = await image.toBuffer();

        let pipeline = sharp(canvas).composite([
          { input, left: offset, top: offset },
        ]);

        if (properties.rotate) {
          const degrees = 90;

          log("Images:render", `Rotating image by ${degrees}`);
          pipeline = pipeline.rotate(degrees, false);
        }

        if (properties.raw) {
          return await pipeline
            .toColorspace("srgb")
            .raw({ depth: "uchar" })
            .toBuffer({ resolveWithObject: true });
        }
        return await pipeline.png().toBuffer();
      },
    },
  };
};
