import { pipeline, Readable, Writable } from "stream";
import { stream as favicons } from "../src";
import { logo_png } from "./util";

class Sink extends Writable {
  constructor() {
    super({ objectMode: true });
    this.result = [];
  }

  _write(chunk, _encoding, callback) {
    this.result.push(chunk);
    callback();
  }
}

function classify(name) {
  if (/\.(png|ico|jpg|jpeg|svg)$/i.test(name)) {
    return "image";
  } else if (/\.html$/i.test(name)) {
    return "html";
  } else {
    return "other";
  }
}

function stat(array) {
  return array.reduce(
    (acc, type) => ({ ...acc, [type]: (acc[type] ?? 0) + 1 }),
    {},
  );
}

test("should provide stream interface", async () => {
  expect.assertions(4);

  const sink = new Sink();

  await new Promise((resolve, reject) => {
    pipeline(
      Readable.from([logo_png]),
      favicons({ pipeHTML: true, html: "foo.html" }),
      sink,
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });

  expect(
    sink.result.every((chunk) => Buffer.isBuffer(chunk.contents)),
  ).toBeTruthy();

  const types = stat(sink.result.map((chunk) => classify(chunk.name)));
  expect(types.html).toBe(1);
  expect(types.image).toBeGreaterThan(1);
  expect(types.other).toBeGreaterThan(1);
});
