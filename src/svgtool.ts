import sharp from "sharp";

// sharp renders the SVG in its source width and height with 72 DPI which can
// cause a blurry result in case the source SVG is defined in lower size than
// the target size. To avoid this, resize the source SVG to the needed size
// before passing it to sharp by increasing its width and/or height
// attributes.
//
// Currently it seems this won't be fixed in sharp, so we need a workaround:
// https://github.com/lovell/sharp/issues/729#issuecomment-284708688
//
// They suggest setting the image density to a "resized" density based on the
// target render size.
//
// Also, see:
// https://github.com/itgalaxy/favicons/issues/264
export function svgDensity(
  metadata: sharp.Metadata,
  width: number,
  height: number,
): number | undefined {
  if (!metadata.width || !metadata.height) {
    return undefined;
  }
  const currentDensity = metadata.density ?? 72;
  return Math.min(
    Math.max(
      1,
      currentDensity,
      (currentDensity * width) / metadata.width,
      (currentDensity * height) / metadata.height,
    ),
    100000,
  );
}
