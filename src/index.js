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
        µ.Images.nearest(sourceset, properties, offset)
          .then(nearest => µ.Images.read(nearest.file))
          .then(buffer => µ.Images.resize(buffer, properties, offset))
      ])
        .then(([canvas, buffer]) =>
          µ.Images.composite(canvas, buffer, properties, offset, maximum)
        )
        .then(µ.Images.getBuffer)
        .then(contents => ({ name, contents }));
    }

    function createHTML(platform, callback) {
      const html = [];

      async.forEachOf(
        config.html[platform],
        (tag, selector, cb) =>
          µ.HTML.parse(tag)
            .then(metadata => cb(html.push(metadata) && null))
            .catch(cb),
        error => callback(error, html)
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
