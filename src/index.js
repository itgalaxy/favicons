const _ = require("underscore"),
  async = require("async"),
  through2 = require("through2"),
  clone = require("clone"),
  promisify = require("util.promisify"),
  mergeDefaults = require("merge-defaults"),
  configDefaults = require("require-directory")(module, "config"),
  helpers = require("./helpers.js"),
  path = require("path"),
  toIco = require("to-ico");

(() => {
  "use strict";

  _.mergeDefaults = mergeDefaults;

  function favicons(source, parameters, next) {
    const config = clone(configDefaults),
      options = _.mergeDefaults(parameters || {}, config.defaults),
      µ = helpers(options);

    function createFavicon(
      sourceset,
      properties,
      name,
      platformOptions,
      callback
    ) {
      if (path.extname(name) === ".ico") {
        async.map(
          properties.sizes,
          (sizeProperties, cb) => {
            const newProperties = clone(properties);

            newProperties.width = sizeProperties.width;
            newProperties.height = sizeProperties.height;

            const tempName = `favicon-temp-${newProperties.width}x${
              newProperties.height
            }.png`;

            createFavicon(
              sourceset,
              newProperties,
              tempName,
              platformOptions,
              cb
            );
          },
          (error, results) => {
            if (error) {
              return callback(error);
            }

            const files = results.map(icoImage => icoImage.contents);

            toIco(files)
              .then(buffer => callback(null, { name, contents: buffer }))
              .catch(callback);
          }
        );
      } else {
        const maximum = Math.max(properties.width, properties.height),
          offset = Math.round(maximum / 100 * platformOptions.offset) || 0,
          background = µ.General.background(platformOptions.background);

        if (platformOptions.disableTransparency) {
          properties.transparent = false;
        }

        async.waterfall(
          [
            cb => µ.Images.nearest(sourceset, properties, offset, cb),
            (nearest, cb) =>
              µ.Images.read(nearest.file)
                .then(result => cb(null, result))
                .catch(cb),
            (buffer, cb) =>
              µ.Images.resize(buffer, properties, offset)
                .then(result => cb(null, result))
                .catch(cb),
            (resizedBuffer, cb) =>
              µ.Images.create(properties, background)
                .then(canvas => cb(null, resizedBuffer, canvas))
                .catch(cb),
            (resizedBuffer, canvas, cb) =>
              µ.Images.composite(
                canvas,
                resizedBuffer,
                properties,
                offset,
                maximum
              )
                .then(result => cb(null, result))
                .catch(cb),
            (composite, cb) => {
              µ.Images.getBuffer(composite, cb);
            }
          ],
          (error, buffer) => callback(error, { name, contents: buffer })
        );
      }
    }

    function createHTML(platform, callback) {
      const html = [];

      async.forEachOf(
        config.html[platform],
        (tag, selector, cb) =>
          µ.HTML.parse(tag, (error, metadata) =>
            cb(html.push(metadata) && error)
          ),
        error => callback(error, html)
      );
    }

    function createFiles(platform, platformOptions, callback) {
      const files = [];

      async.forEachOf(
        config.files[platform],
        (properties, name, cb) =>
          µ.Files.create(properties, name, platformOptions)
            .then(file => cb(files.push(file) && null))
            .catch(cb),
        error => callback(error, files)
      );
    }

    function createFavicons(sourceset, platform, platformOptions, callback) {
      const images = [];

      async.forEachOf(
        config.icons[platform],
        (properties, name, cb) =>
          createFavicon(
            sourceset,
            properties,
            name,
            platformOptions,
            (error, image) => cb(images.push(image) && error)
          ),
        error => callback(error, images)
      );
    }

    function createPlatform(sourceset, platform, platformOptions) {
      return Promise.all([
        promisify(createFavicons)(sourceset, platform, platformOptions),
        promisify(createFiles)(platform, platformOptions),
        promisify(createHTML)(platform)
      ]);
    }

    function create(sourceset) {
      return Promise.all(
        Object.keys(options.icons)
          .filter(platform => options.icons[platform])
          .map(platform =>
            createPlatform(
              sourceset,
              platform,
              µ.General.preparePlatformOptions(
                platform,
                options.icons[platform],
                options
              )
            )
          )
      ).then(responses => ({
        images: [].concat(...responses.map(r => r[0])),
        files: [].concat(...responses.map(r => r[1])),
        html: [].concat(...responses.map(r => r[2])).sort()
      }));
    }

    async.waterfall(
      [
        callback =>
          µ.General.source(source)
            .then(result => callback(null, result))
            .catch(callback),
        (sourceset, callback) =>
          create(sourceset)
            .then(result => callback(null, result))
            .catch(callback),
        (response, callback) => {
          if (options.pipeHTML) {
            µ.Files.create(response.html, options.html, false)
              .then(file => {
                response.files = [...response.files, file];
                return response;
              })
              .then(result => callback(null, result))
              .catch(callback);
          } else {
            return callback(null, response);
          }
        }
      ],
      (error, response) =>
        error
          ? next(error)
          : next(null, {
              images: _.compact(response.images),
              files: _.compact(response.files),
              html: _.compact(response.html)
            })
    );
  }

  function stream(params, handleHtml) {
    const config = clone(configDefaults),
      µ = helpers(params);

    function processDocuments(documents, html, callback) {
      async.each(
        documents,
        (document, cb) => µ.HTML.update(document, html, config.html, cb),
        error => callback(error)
      );
    }

    /* eslint func-names: 0, no-invalid-this: 0 */
    return through2.obj(function(file, encoding, callback) {
      const that = this;

      if (file.isNull()) {
        return callback(null, file);
      }

      if (file.isStream()) {
        return callback(new Error("[gulp-favicons] Streaming not supported"));
      }

      async.waterfall(
        [
          cb => favicons(file.contents, params, cb),
          (response, cb) =>
            async.each(
              response.images.concat(response.files),
              (image, c) => {
                that.push(µ.General.vinyl(image, file));
                c();
              },
              error => cb(error, response)
            ),
          (response, cb) => {
            if (handleHtml) {
              handleHtml(response.html);
              return cb(null);
            }
            if (params.html && !params.pipeHTML) {
              const documents =
                typeof params.html === "object" ? params.html : [params.html];

              processDocuments(documents, response.html, cb);
            } else {
              return cb(null);
            }
          }
        ],
        error => callback(error)
      );
    });
  }

  module.exports = promisify(favicons);
  module.exports.config = configDefaults;
  module.exports.stream = stream;
})();
