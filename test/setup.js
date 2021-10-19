/* eslint-disable no-magic-numbers */

const { toMatchSnapshot } = require("jest-snapshot");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const path = require("path");
const ICO = require("icojs");

expect.extend({ toMatchImageSnapshot });

async function imagePlanes(image) {
  if (!ICO.isICO(image.contents)) {
    return [image];
  }

  const planes = await ICO.parse(image.contents, "image/png");
  const result = [];

  for (const plane of planes) {
    result.push({
      name: `${image.name}_${plane.width}x${plane.height}.png`,
      contents: Buffer.from(plane.buffer),
    });
  }
  return result;
}

expect.extend({
  async toMatchFaviconsSnapshot(received) {
    for (const image of received.images) {
      const planes = await imagePlanes(image);

      for (const plane of planes) {
        const imageResult = toMatchImageSnapshot.call(this, plane.contents, {
          failureThreshold: 5,
          failureThresholdType: "percent",
          customSnapshotIdentifier: (context) =>
            `${context.currentTestName}${path.sep}${context.counter}_${plane.name}`,
        });

        if (!imageResult.pass) {
          return imageResult;
        }
      }
    }
    const withoutImages = received.images.map((image) => ({
      ...image,
      contents: null,
    }));

    return toMatchSnapshot.call(this, withoutImages);
  },
});
