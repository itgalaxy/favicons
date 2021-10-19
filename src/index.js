// generate README sources:  jq ". | with_entries(.value |= keys)" < icons.json

// TO_DO: More comments to know what's going on, for future maintainers

const through2 = require("through2");
const clone = require("clone");
const mergeDefaults = require("lodash.defaultsdeep");
const configDefaults = require("require-directory")(module, "config");
const helpers = require("./helpers.js");
const path = require("path");
const File = require("vinyl");
const toIco = require("png-to-ico");

/**
 * @typedef FaviconOptions
 * @type {typeof import("./config/defaults.json")}
 */

/**
 * @typedef FaviconImage
 * @type {object}
 * @property {string} name
 * @property {Buffer} contents
 */

/**
 * @typedef FaviconFile
 * @type {object}
 * @property {string} name
 * @property {string} contents
 */

/**
 * @typedef FaviconHtmlElement
 * @type {string}
 */

/**
 * @typedef FaviconResponse
 * @type {object}
 * @property {FaviconImage[]} images
 * @property {FaviconFile[]} files
 * @property {FaviconHtmlElement[]} html
 */

/**
 * @typedef FaviconCallback
 * @type {(error: Error|null, response: FaviconResponse) => any}
 */

/**
 * Build favicons
 * @param {string} source - The path to the source image to generate icons from
 * @param {Partial<FaviconOptions>|undefined} options - The options used to build favicons
 * @param {FaviconCallback|undefined} next - The callback to execute after processing
 * @returns {Promise|Promise<FaviconResponse>}
 */
// eslint-disable-next-line no-undefined
function favicons(source, options = {}, next = undefined) {
  if (next) {
    return favicons(source, options)
      .then((response) => next(null, response))
      .catch(next);
  }

  options = mergeDefaults(options, configDefaults.defaults);

  const config = clone(configDefaults);
  const µ = helpers(options);

  function createFavicon(sourceset, properties, name, platformOptions) {
    if (path.extname(name) === ".ico") {
      return Promise.all(
        properties.sizes.map(({ width, height }) =>
          createFavicon(
            sourceset,
            Object.assign({}, properties, { width, height }),
            `${width}x${height}.png`,
            platformOptions
          )
        )
      ).then((results) =>
        toIco(results.map(({ contents }) => contents)).then((buffer) => ({
          name,
          contents: buffer,
        }))
      );
    }

    const maximum = Math.max(properties.width, properties.height);
    const offset = Math.round((maximum / 100) * platformOptions.offset) || 0;

    const mergedProperties = Object.assign({}, properties, platformOptions);

    mergedProperties.transparent =
      !mergedProperties.background ||
      mergedProperties.background === "transparent";

    return Promise.all([
      µ.Images.create(mergedProperties),
      µ.Images.render(sourceset, mergedProperties, offset),
    ])
      .then(([canvas, buffer]) =>
        µ.Images.composite(canvas, buffer, mergedProperties, offset)
      )
      .then((contents) => ({ name, contents }));
  }

  function createHTML(platform) {
    return Promise.all((config.html[platform] || []).map(µ.HTML.render));
  }

  function createFiles(platform) {
    return Promise.all(
      Object.keys(config.files[platform] || {}).map((name) =>
        µ.Files.create(config.files[platform][name], name)
      )
    );
  }

  function createFavicons(sourceset, platform) {
    const platformOptions = µ.General.preparePlatformOptions(platform);
    const icons = Array.isArray(options.icons[platform])
      ? options.icons[platform].reduce((opts, icon) => {
          // map the selected names to their original configs
          if (platform in config.icons && icon in config.icons[platform])
            opts[icon] = config.icons[platform][icon];
          return opts;
        }, {})
      : config.icons[platform];

    return Promise.all(
      Object.keys(icons || {}).map((name) =>
        createFavicon(
          sourceset,
          config.icons[platform][name],
          name,
          platformOptions
        )
      )
    );
  }

  function createPlatform(sourceset, platform) {
    return Promise.all([
      createFavicons(sourceset, platform),
      createFiles(platform),
      createHTML(platform),
    ]);
  }

  async function create(sourceset) {
    const responses = [];

    const platforms = Object.keys(options.icons)
      .filter((platform) => options.icons[platform])
      .sort((a, b) => {
        if (a === "favicons") return -1;
        if (b === "favicons") return 1;
        return a.localeCompare(b);
      });

    for (const platform of platforms) {
      responses.push(await createPlatform(sourceset, platform));
    }

    // Generate android maskable images from a different source set
    if (
      options.icons.android &&
      options.manifestMaskable &&
      typeof options.manifestMaskable !== "boolean"
    ) {
      const maskableSourceset = await µ.General.source(
        options.manifestMaskable
      );

      responses.push(
        await createPlatform(maskableSourceset, "android_maskable")
      );
    }

    return {
      images: [].concat(...responses.map((r) => r[0])),
      files: [].concat(...responses.map((r) => r[1])),
      html: [].concat(...responses.map((r) => r[2])),
    };
  }

  return µ.General.source(source).then(create);
}

function stream(params, handleHtml) {
  /* eslint no-invalid-this: 0 */
  return through2.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new Error("Streaming not supported"));
    }

    const { html: path, pipeHTML, ...options } = params;

    favicons(file.contents, options)
      .then(({ images, files, html }) => {
        for (const asset of [...images, ...files]) {
          this.push(
            new File({
              path: asset.name,
              contents: Buffer.isBuffer(asset.contents)
                ? asset.contents
                : Buffer.from(asset.contents),
            })
          );
        }

        if (handleHtml) {
          handleHtml(html);
        }

        if (pipeHTML) {
          this.push(
            new File({
              path,
              contents: Buffer.from(html.join("\n")),
            })
          );
        }

        callback(null);
      })
      .catch(callback);
  });
}

module.exports = favicons;
module.exports.config = configDefaults;
module.exports.stream = stream;
