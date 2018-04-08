const through2 = require("through2"),
  clone = require("clone"),
  mergeDefaults = require("merge-defaults"),
  configDefaults = require("require-directory")(module, "config"),
  helpers = require("./helpers.js"),
  path = require("path"),
  File = require("vinyl"),
  toIco = require("to-ico");

(() => {
  "use strict";

  function favicons(source, parameters = {}, next) {
    if (next) {
      return favicons(source, parameters)
        .then(response => next(null, response))
        .catch(next);
    }

    const config = clone(configDefaults),
      options = mergeDefaults(parameters, config.defaults),
      µ = helpers(options);

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

      const maximum = Math.max(properties.width, properties.height),
        offset = Math.round(maximum / 100 * platformOptions.offset) || 0,
        background = µ.General.background(platformOptions.background);

      if (platformOptions.disableTransparency) {
        properties.transparent = false;
      }

      return Promise.all([
        µ.Images.create(properties, background),
        µ.Images.render(sourceset, properties, offset)
      ])
        .then(([canvas, buffer]) =>
          µ.Images.composite(canvas, buffer, properties, offset, maximum)
        )
        .then(contents => ({ name, contents }));
    }

    function createHTML(platform) {
      return Promise.all(
        Object.values(config.html[platform] || {}).map(µ.HTML.parse)
      );
    }

    function createFiles(platform, platformOptions) {
      return Promise.all(
        Object.keys(config.files[platform] || {}).map(name =>
          µ.Files.create(config.files[platform][name], name, platformOptions)
        )
      );
    }

    function createFavicons(sourceset, platform, platformOptions) {
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

    function createPlatform(sourceset, platform, platformOptions) {
      return Promise.all([
        createFavicons(sourceset, platform, platformOptions),
        createFiles(platform, platformOptions),
        createHTML(platform)
      ]);
    }

    async function create(sourceset) {
      const responses = [];

      const platforms = Object.keys(options.icons).filter(
        platform => options.icons[platform]
      );

      for (const platform of platforms) {
        responses.push(
          await createPlatform(
            sourceset,
            platform,
            µ.General.preparePlatformOptions(
              platform,
              options.icons[platform],
              options
            )
          )
        );
      }

      return {
        images: [].concat(...responses.map(r => r[0])),
        files: [].concat(...responses.map(r => r[1])),
        html: [].concat(...responses.map(r => r[2])).sort()
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
    /* eslint func-names: 0, no-invalid-this: 0 */
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
})();
