const favicons = require("../src").stream;
const gulp = require("gulp");
const { logo_png } = require("./util");

test("should provide stream interface", async () => {
  expect.assertions(1);

  const result = {
    images: [],
    files: [],
  };

  function isImage(file) {
    return /\.(png|ico|jpg|jpeg|svg)$/i.test(file.path);
  }

  await new Promise((resolve) => {
    gulp
      .src(logo_png)
      .pipe(favicons({}, (html) => (result["index.html"] = html)))
      .on("data", (chunk) => {
        if (isImage(chunk)) {
          result.images.push({
            name: chunk.path,
            contents: chunk.contents,
          });
        } else {
          result.files.push({
            name: chunk.path,
            contents: chunk.contents,
          });
        }
      })
      .on("end", () => {
        resolve();
      });
  });

  await expect(result).toMatchFaviconsSnapshot();
});

test("should stream html file", async () => {
  let found = false;

  await new Promise((resolve) => {
    gulp
      .src(logo_png)
      .pipe(favicons({ pipeHTML: true, html: "foo.html" }))
      .on("data", (chunk) => {
        if (chunk.basename === "foo.html") {
          found = true;
        }
      })
      .on("end", () => resolve());
  });

  expect(found).toBe(true);
});
