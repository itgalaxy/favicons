import * as path from "path";

function fixture(uri) {
  return path.resolve(__dirname, "fixtures", uri);
}

export const logo_png = fixture("logo.png");
export const logo_svg = fixture("logo.svg");
export const logo_small_svg = fixture("logo_small.svg");
export const pixel_art = fixture("pixel_art.png");
