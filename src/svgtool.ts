import xml2js from "xml2js";
import { SourceImage } from "./helpers.js";

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
// target render size but this does not seem to work with favicons and may
// cause other errors with "unnecessarily high" image density values.
//
// For further information, see:
// https://github.com/itgalaxy/favicons/issues/264
export class SvgTool {
  async ensureSize(
    svgSource: SourceImage,
    width: number,
    height: number
  ): Promise<Buffer> {
    let svgWidth = svgSource.metadata.width;
    let svgHeight = svgSource.metadata.height;

    if (svgWidth >= width && svgHeight >= height) {
      // If the base SVG is large enough, it does not need to be modified.
      return svgSource.data;
    } else if (width > height) {
      svgHeight = Math.round(svgHeight * (width / svgWidth));
      svgWidth = width;
    } else {
      // width <= height
      svgWidth = Math.round(svgWidth * (height / svgHeight));
      svgHeight = height;
    }

    // Modify the source SVG's width and height attributes for sharp to render
    // it correctly.
    return await this.resize(svgSource.data, svgWidth, svgHeight);
  }

  async resize(
    svgFile: Buffer,
    width: number,
    height: number
  ): Promise<Buffer> {
    const xmlDoc = await xml2js.parseStringPromise(svgFile);

    xmlDoc.svg.$.width = width;
    xmlDoc.svg.$.height = height;

    const builder = new xml2js.Builder();
    const modifiedSvg = builder.buildObject(xmlDoc);

    return Buffer.from(modifiedSvg);
  }
}
