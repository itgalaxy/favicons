const Fiber = require("fibers");
const Future = require("fibers/future");
const ICO = require("icojs");
const pixelmatch = require("pixelmatch");
const { compare } = require("resemblejs");

class Image {
  constructor(name, buffer) {
    this.name = name;
    this.buffer = buffer;
  }

  toString() {
    return `Image<${this.name}>`;
  }

  serialize() {
    return [this.name, this.buffer];
  }

  // '.ico' is not supported by node-canvas, and therefore also by resemble
  // https://github.com/Automattic/node-canvas/blob/2e9ea7377039f04290421bc751091a87ae8a0fa9/src/Image.cc#L339
  diffIco(other) {
    // eslint-disable-next-line no-sync
    const icos = ICO.parseSync(this.buffer);

    // eslint-disable-next-line no-sync
    return ICO.parseSync(other.buffer).reduce(
      (currDiff, otherIco, i) => {
        const threshold = 0.01;

        const ico = icos[i];
        const { width, height } = ico;
        const totalPixelCount = width * height;
        const mismatchPixelCount = pixelmatch(
          ico.data,
          otherIco.data,
          null,
          width,
          height,
          {
            threshold,
          }
        );
        const rawMisMatchPercentage =
          (mismatchPixelCount / totalPixelCount) * 100;

        return {
          isSameDimensions:
            currDiff.isSameDimensions &&
            width === otherIco.width &&
            height === otherIco.height,
          rawMisMatchPercentage: Math.max(
            rawMisMatchPercentage,
            currDiff.rawMisMatchPercentage
          ),
        };
      },
      {
        isSameDimensions: true,
        rawMisMatchPercentage: 0,
      }
    );
  }

  diff(other) {
    return Future.fromPromise(
      new Promise((resolve, reject) => {
        compare(this.buffer, other.buffer, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      })
    ).wait();
  }

  compare(other) {
    if (this.name !== other.name) {
      return false;
    }

    if (Buffer.compare(this.buffer, other.buffer) === 0) {
      return true;
    }

    const threshold = 5;
    const diff = ICO.isICO(this.buffer)
      ? this.diffIco(other)
      : this.diff(other);

    const r = diff.isSameDimensions && diff.rawMisMatchPercentage < threshold;

    if (!r) {
      console.log(this.name, diff);
    }

    return r;
  }
}

module.exports.Image = Image;

module.exports.snapshotResult = async function (test, result) {
  for (const image of result.images) {
    image.contents = new Image(image.name, image.contents);
  }

  await new Promise((resolve) =>
    Fiber(() => {
      test.snapshot(result);
      resolve();
    }).run()
  );
};
