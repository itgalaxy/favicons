const through2 = require("through2");
const clone = require("clone");
const mergeDefaults = require("lodash.defaultsdeep");
const configDefaults = require("require-directory")(module, "config");
const helpers = require("./helpers.js");
const path = require("path");
const File = require("vinyl");
const toIco = require("to-ico");

function favicons(source, options = {}, next) {
  if (next) {
    return favicons(source, options)
      .then(response => next(null, response))
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
      ).then(results =>
        toIco(results.map(({ contents }) => contents)).then(buffer => ({
          name,
          contents: buffer
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
      µ.Images.render(sourceset, mergedProperties, offset)
    ])
      .then(([canvas, buffer]) =>
        µ.Images.composite(canvas, buffer, mergedProperties, offset, maximum)
      )
      .then(contents => ({ name, contents }));
  }

  function createHTML(platform) {
    return Promise.all(
      Object.values(config.html[platform] || {}).map(µ.HTML.parse)
    );
  }

  function createFiles(platform) {
    return Promise.all(
      Object.keys(config.files[platform] || {}).map(name =>
        µ.Files.create(config.files[platform][name], name)
      )
    );
  }

  function createFavicons(sourceset, platform) {
    const platformOptions = µ.General.preparePlatformOptions(platform);

    return Promise.all(
      Object.keys(config.icons[platform] || {}).map(name =>
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
      createHTML(platform)
    ]);
  }

  async function create(sourceset) {
    const responses = [];

    const platforms = Object.keys(options.icons)
      .filter(platform => options.icons[platform])
      .sort((a, b) => {
        if (a === "favicons") return -1;
        if (b === "favicons") return 1;
        return a.localeCompare(b);
      });

    for (const platform of platforms) {
      responses.push(await createPlatform(sourceset, platform));
    }

    return {
      images: [].concat(...responses.map(r => r[0])),
      files: [].concat(...responses.map(r => r[1])),
      html: [].concat(...responses.map(r => r[2]))
    };
  }

  const result = µ.General.source(source).then(create);

  return options.pipeHTML
    ? result.then(response =>
        µ.Files.create(response.html, options.html, false).then(file =>
          Object.assign(response, { files: [...response.files, file] })
        )
      )
    : result;
}

function stream(params, handleHtml) {
  /* eslint no-invalid-this: 0 */
  return through2.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new Error("Streaming not supported"));
    }

    favicons(file.contents, params)
      .then(({ images, files, html }) => {
        for (const asset of [...images, ...files]) {
          this.push(
            new File({
              path: asset.name,
              contents: Buffer.isBuffer(asset.contents)
                ? asset.contents
                : new Buffer(asset.contents)
            })
          );
        }

        if (handleHtml) {
          handleHtml(html);
        }

        callback(null);
      })
      .catch(callback);
  });
}

module.exports = favicons;
module.exports.config = configDefaults;
module.exports.stream = stream;
