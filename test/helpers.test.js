const helpers = require("../src/helpers");
const test = require("ava");

test("should create HTML file", async t => {
  t.plan(1);

  const options = {
    html: "index.html"
  };
  const µ = helpers(options);
  const file = await µ.Files.create(["<link/>", "<link/>"], options.html, true);

  t.deepEqual(file, {
    name: options.html,
    contents: "<link/>\n<link/>"
  });
});

test("should create HTML file with any name", async t => {
  t.plan(1);

  const options = {
    html: "index.php"
  };
  const µ = helpers(options);
  const file = await µ.Files.create(["<link/>", "<link/>"], options.html, true);

  t.deepEqual(file, {
    name: options.html,
    contents: "<link/>\n<link/>"
  });
});
