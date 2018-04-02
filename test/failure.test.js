const favicons = require('../src');
const test = require('ava');

const {normalize} = require('./util');

test('should fail gracefully if no source is provided', async t => {
    t.plan(1);

    try {
      await favicons([], {});
    } catch (err) {
      t.is(err.message, "No source provided");
    }
});

test('should fail gracefully if source is neither a buffer or a string', async t => {
  t.plan(2);

  try {
    await favicons(42, {});
  } catch (err) {
    t.is(err.message, "Invalid source type provided");
  }

  try {
    await favicons([42], {});
  } catch (err) {
    t.is(err.message, "Invalid source type provided");
  }
});

test('should fail gracefully if buffer is empty', async t => {
  t.plan(2);

  try {
    await favicons(new Buffer(""), {});
  } catch (err) {
    t.is(err.message, "Invalid image buffer");
  }

  try {
    await favicons([new Buffer("")], {});
  } catch (err) {
    t.is(err.message, "Invalid image buffer");
  }
});

test('should fail gracefully if path to source image is invalid', async t => {
    t.plan(2);

    try {
      await favicons("missing.png", {});
    } catch (err) {
      t.is(err.message, "ENOENT: no such file or directory, open 'missing.png'");
    }

    try {
      await favicons(["missing.png"], {});
    } catch (err) {
      t.is(err.message, "ENOENT: no such file or directory, open 'missing.png'");
    }
});