(() => {

    'use strict';

    const _ = require('underscore'),
        async = require('async'),
        path = require('path'),
        config = require('loadobjects').sync(path.join(__dirname, 'config'));

    module.exports = function (source, parameters, next) {

        const options = _.defaults(parameters || {}, config.defaults),
            µ = require('./helpers.js')(options),
            background = µ.General.background(options.background);

        function createFavicon(sourceset, properties, name, callback) {
            const minimum = Math.min(properties.width, properties.height),
                icon = _.min(sourceset, (image) => image.size >= minimum);
            async.waterfall([
                (callback) =>
                    µ.Images.read(icon.file, (error, image) =>
                        callback(error, image)),
                (image, callback) =>
                    µ.Images.resize(image, minimum, (error, image) =>
                        callback(error, image)),
                (image, callback) =>
                    µ.Images.create(properties.width, properties.height, background, (error, canvas) =>
                        callback(error, image, canvas)),
                (image, canvas, callback) =>
                    µ.Images.composite(canvas, image, properties.height, properties.width, minimum, (error, canvas) =>
                        callback(error, canvas)),
                (canvas, callback) =>
                    µ.Images.getBuffer(canvas, (error, buffer) =>
                        callback(error, buffer))
            ], (error, buffer) =>
                callback(error, { name: name, contents: buffer }));
        }

        function createHTML(platform, callback) {
            let html = [];
            async.each(config.html[platform], (code, callback) =>
                µ.HTML.parse(code, (error, metadata) =>
                    callback(html.push(metadata) && error)),
            (error) =>
                callback(error, html));
        }

        function createFiles(platform, callback) {
            let files = [];
            async.forEachOf(config.files[platform], (properties, name, callback) =>
                µ.Files.create(properties, name, (error, file) =>
                    callback(files.push(file) && error)),
            (error) =>
                callback(error, files));
        }

        function createFavicons(sourceset, platform, callback) {
            let images = [];
            async.forEachOf(config.icons[platform], (properties, name, callback) =>
                createFavicon(sourceset, properties, name, (error, image) =>
                    callback(images.push(image) && error)),
            (error) =>
                callback(error, images));
        }

        function createPlatform(sourceset, platform, callback) {
            async.parallel([
                (callback) =>
                    createFavicons(sourceset, platform, (error, images) =>
                        callback(error, images)),
                (callback) =>
                    createFiles(platform, (error, files) =>
                        callback(error, files)),
                (callback) =>
                    createHTML(platform, (error, code) =>
                        callback(error, code))
            ], (error, results) =>
                callback(error, results[0], results[1], results[2]));
        }

        function createOffline(sourceset, callback) {
            const response = { images: [], files: [], html: [] };
            async.forEachOf(options.icons, (enabled, platform, callback) => {
                if (enabled) {
                    createPlatform(sourceset, platform, (error, images, files, html) => {
                        response.images = response.images.concat(images);
                        response.files = response.files.concat(files);
                        response.html = response.html.concat(html);
                        return callback(error);
                    });
                } else {
                    return callback(null);
                }
            }, error =>
                callback(error, response));
        }

        function unpack(pack, callback) {
            const response = { images: [], files: [], html: pack.html.split(',') };
            async.each(pack.files, (url, callback) =>
                µ.RFG.fetch(url, (error, box) =>
                    callback(response.images.push(box.image) && response.files.push(box.file) && null)),
            (error) =>
                callback(error, response));
        }

        function createOnline(sourceset, callback) {
            async.waterfall([
                (callback) =>
                    µ.RFG.configure(sourceset, config.rfg, (error, request) =>
                        callback(error, request)),
                (request, callback) =>
                    µ.RFG.request(request, (error, pack) =>
                        callback(error, pack)),
                (pack, callback) =>
                    unpack(pack, (error, response) =>
                        callback(error, response))
            ], (error, results) =>
                callback(error, results));
        }

        function create(sourceset, callback) {
            options.online ?
                createOnline(sourceset, (error, response) =>
                    callback(error, response)) :
                createOffline(sourceset, (error, response) =>
                    callback(error, response));
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
                error = { status: null, error: error, message: null };
            }
            next((error ? {
                status: error.status,
                error: error.name || 'Error',
                message: error.message || 'An unknown error has occured'
            } : null), {
                images: _.compact(response.images),
                files: _.compact(response.files),
                html: _.compact(response.html)
            });
        });
    };
})();
