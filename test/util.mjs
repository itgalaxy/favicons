import { fileURLToPath } from "node:url";

function fixture(name) {
  const url = new URL(`fixtures/${name}`, import.meta.url);
  return fileURLToPath(url);
}

export const logo_png = fixture("logo.png");
export const logo_svg = fixture("logo.svg");
export const logo_small_svg = fixture("logo_small.svg");
export const pixel_art = fixture("pixel_art.png");
