const favicons = require('../src');
const test = require('ava');

const {logo_png, normalize} = require('./util');

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
      t.is(err.message.split(',')[0], "ENOENT: no such file or directory");
    }

    try {
      await favicons(["missing.png"], {});
    } catch (err) {
      t.is(err.message.split(',')[0], "ENOENT: no such file or directory");
    }
});

test('should fail gracefully if option is not supported on platform', async t => {
  t.plan(2);

  try {
    await favicons(logo_png, {
      icons: {
        favicons: {offset: 10},
      }
    });
  } catch (err) {
    t.is(err.message, "Unsupported option 'offset' on platform 'favicons'");
  }

  try {
    await favicons(logo_png, {
      icons: {
        favicons: {background: true},
      }
    });
  } catch (err) {
    t.is(err.message, "Unsupported option 'background' on platform 'favicons'");
  }
});
