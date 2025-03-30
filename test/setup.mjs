import * as path from "path";
import { toMatchSnapshot } from "jest-snapshot";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import ICO from "icojs";

expect.extend({ toMatchImageSnapshot });

async function imagePlanes(image) {
  if (!ICO.isICO(image.contents)) {
    return [image];
  }

  const planes = await ICO.parseICO(image.contents, "image/png");
  const result = [];

  for (const plane of planes) {
    result.push({
      name: `${image.name}_${plane.width}x${plane.height}.png`,
      contents: Buffer.from(plane.buffer),
    });
  }
  return result;
}

function isSvg(image) {
  return path.extname(image.name) === ".svg";
}

expect.extend({
  async toMatchFaviconsSnapshot(received) {
    for (const image of received.images) {
      if (isSvg(image)) {
        continue;
      }

      const planes = await imagePlanes(image);

      for (const plane of planes) {
        const imageResult = toMatchImageSnapshot.call(this, plane.contents, {
          failureThreshold: 5,
          failureThresholdType: "percent",
          customSnapshotIdentifier: (context) =>
            `${context.currentTestName}${path.sep}${plane.name}-snap`,
        });

        if (!imageResult.pass) {
          return imageResult;
        }
      }
    }
    const withoutImages = {
      ...received,
      images: received.images.map((image) => ({
        ...image,
        contents: isSvg(image) ? image.contents.toString("utf-8") : null,
      })),
    };

    return toMatchSnapshot.call(this, withoutImages);
  },
});
