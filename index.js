const _ = require('underscore'),
    async = require('async'),
    mergeDefaults = require('merge-defaults'),
    config = require('require-directory')(module, 'config'),
    helpers = require('./helpers.js');

(() => {

    'use strict';

    _.mergeDefaults = mergeDefaults;

    function favicons (source, parameters, next) {

        const options = _.mergeDefaults(parameters || {}, config.defaults),
            µ = helpers(options),
            background = µ.General.background(options.background);

        function createFavicon (sourceset, properties, name, callback) {
            const minimum = Math.min(properties.width, properties.height),
                icon = _.min(sourceset, (ico) => ico.size >= minimum);

            async.waterfall([
                (cb) =>
                    µ.Images.read(icon.file, (error, buffer) =>
                        cb(error, buffer)),
                (buffer, cb) =>
                    µ.Images.resize(buffer, minimum, (error, resizedBuffer) =>
                        cb(error, resizedBuffer)),
                (resizedBuffer, cb) =>
                    µ.Images.create(properties, background, (error, canvas) =>
                        cb(error, resizedBuffer, canvas)),
                (resizedBuffer, canvas, cb) =>
                    µ.Images.composite(canvas, resizedBuffer, properties, minimum, (error, composite) =>
                        cb(error, composite)),
                (composite, cb) =>
                    µ.Images.getBuffer(composite, (error, buffer) =>
                        cb(error, buffer))
            ], (error, buffer) =>
                callback(error, { name, contents: buffer }));
        }

        function createHTML (platform, callback) {
            const html = [];

            async.each(config.html[platform], (code, cb) =>
                µ.HTML.parse(code, (error, metadata) =>
                    cb(html.push(metadata) && error)),
            (error) =>
                callback(error, html));
        }

        function createFiles (platform, callback) {
            const files = [];

            async.forEachOf(config.files[platform], (properties, name, cb) =>
                µ.Files.create(properties, name, (error, file) =>
                    cb(files.push(file) && error)),
            (error) =>
                callback(error, files));
        }

        function createFavicons (sourceset, platform, callback) {
            const images = [];

            async.forEachOf(config.icons[platform], (properties, name, cb) =>
                createFavicon(sourceset, properties, name, (error, image) =>
                    cb(images.push(image) && error)),
            (error) =>
                callback(error, images));
        }

        function createPlatform (sourceset, platform, callback) {
            async.parallel([
                (cb) =>
                    createFavicons(sourceset, platform, (error, images) =>
                        cb(error, images)),
                (cb) =>
                    createFiles(platform, (error, files) =>
                        cb(error, files)),
                (cb) =>
                    createHTML(platform, (error, code) =>
                        cb(error, code))
            ], (error, results) =>
                callback(error, results[0], results[1], results[2]));
        }

        function createOffline (sourceset, callback) {
            const response = { images: [], files: [], html: [] };

            async.forEachOf(options.icons, (enabled, platform, cb) => {
                if (enabled) {
                    createPlatform(sourceset, platform, (error, images, files, html) => {
                        response.images = response.images.concat(images);
                        response.files = response.files.concat(files);
                        response.html = response.html.concat(html);
                        return cb(error);
                    });
                } else {
                    return cb(null);
                }
            }, (error) =>
                callback(error, response));
        }

        function unpack (pack, callback) {
            const response = { images: [], files: [], html: pack.html.split(',') };

            async.each(pack.files, (url, cb) =>
                µ.RFG.fetch(url, (error, box) =>
                    cb(response.images.push(box.image) && response.files.push(box.file) && error)),
            () =>
                callback(null, response));
        }

        function createOnline (sourceset, callback) {
            async.waterfall([
                (cb) =>
                    µ.RFG.configure(sourceset, config.rfg, (error, request) =>
                        cb(error, request)),
                (request, cb) =>
                    µ.RFG.request(request, (error, pack) =>
                        cb(error, pack)),
                (pack, cb) =>
                    unpack(pack, (error, response) =>
                        cb(error, response))
            ], (error, results) =>
                callback(error, results));
        }

        function create (sourceset, callback) {
            options.online ? createOnline(sourceset, (error, response) => callback(error, response)) : createOffline(sourceset, (error, response) => callback(error, response));
        }

        async.waterfall([
            (callback) =>
                µ.General.source(source, (error, sourceset) =>
                    callback(error, sourceset)),
            (sourceset, callback) =>
                create(sourceset, (error, response) =>
                    callback(error, response))
        ], (error, response) => {
            if (error && typeof error === 'string') {
                error = { status: null, error, message: null };
            }
            next(error ? {
                status: error.status,
                error: error.name || 'Error',
                message: error.message || 'An unknown error has occured'
            } : null, {
                images: _.compact(response.images),
                files: _.compact(response.files),
                html: _.compact(response.html)
            });
        });
    }

    module.exports = favicons;

})();
