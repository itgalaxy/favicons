import { RawImage } from "./helpers";

const HEADER_SIZE = 6;
const DIRECTORY_SIZE = 16;
const COLOR_MODE = 0;
const BITMAP_SIZE = 40;

function createHeader(n: number) {
  const buf = Buffer.alloc(HEADER_SIZE);

  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(n, 4);
  return buf;
}

function createDirectory(image: RawImage, offset: number) {
  const buf = Buffer.alloc(DIRECTORY_SIZE);
  const { width, height } = image.info;
  const size = width * height * 4 + BITMAP_SIZE;
  const bpp = 32;

  buf.writeUInt8(width === 256 ? 0 : width, 0);
  buf.writeUInt8(height === 256 ? 0 : height, 1);
  buf.writeUInt8(0, 2);
  buf.writeUInt8(0, 3);
  buf.writeUInt16LE(1, 4);
  buf.writeUInt16LE(bpp, 6);
  buf.writeUInt32LE(size, 8);
  buf.writeUInt32LE(offset, 12);
  return buf;
}

function createBitmap(image: RawImage, compression: number) {
  const buf = Buffer.alloc(BITMAP_SIZE);
  const { width, height } = image.info;

  buf.writeUInt32LE(BITMAP_SIZE, 0);
  buf.writeInt32LE(width, 4);
  buf.writeInt32LE(height * 2, 8);
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(compression, 16);
  buf.writeUInt32LE(width * height, 20);
  buf.writeInt32LE(0, 24);
  buf.writeInt32LE(0, 28);
  buf.writeUInt32LE(0, 32);
  buf.writeUInt32LE(0, 36);
  return buf;
}

function createDib(image: RawImage) {
  const { width, height } = image.info;
  const imageData = image.data;
  const buf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < height; ++x) {
      const offset = (y * width + x) * 4;
      const r = imageData.readUInt8(offset);
      const g = imageData.readUInt8(offset + 1);
      const b = imageData.readUInt8(offset + 2);
      const a = imageData.readUInt8(offset + 3);
      const pos = (height - y - 1) * width + x;

      buf.writeUInt8(b, pos * 4);
      buf.writeUInt8(g, pos * 4 + 1);
      buf.writeUInt8(r, pos * 4 + 2);
      buf.writeUInt8(a, pos * 4 + 3);
    }
  }
  return buf;
}

export function toIco(images: RawImage[]) {
  const header = createHeader(images.length);
  let arr = [header];

  let offset = HEADER_SIZE + DIRECTORY_SIZE * images.length;

  const bitmaps = images.map((image) => {
    const bitmapHeader = createBitmap(image, COLOR_MODE);
    const dib = createDib(image);

    return Buffer.concat([bitmapHeader, dib]);
  });

  for (let i = 0; i < images.length; ++i) {
    const image = images[i];
    const bitmap = bitmaps[i];

    const dir = createDirectory(image, offset);

    arr.push(dir);
    offset += bitmap.length;
  }

  arr = [...arr, ...bitmaps];

  return Buffer.concat(arr);
}
