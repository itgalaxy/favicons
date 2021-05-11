/* eslint-disable */

const appleIconSizes = [57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 1024];

const appleStartupItems = [
  //
  // Device              Portrait size      Landscape size     Screen size        Pixel ratio
  // iPhone SE            640px × 1136px    1136px ×  640px     320px ×  568px    2
  // iPhone 8             750px × 1334px    1334px ×  750px     375px ×  667px    2
  // iPhone 7             750px × 1334px    1334px ×  750px     375px ×  667px    2
  // iPhone 6s            750px × 1334px    1334px ×  750px     375px ×  667px    2
  // iPhone XR            828px × 1792px    1792px ×  828px     414px ×  896px    2
  // iPhone XS           1125px × 2436px    2436px × 1125px     375px ×  812px    3
  // iPhone X            1125px × 2436px    2436px × 1125px     375px ×  812px    3
  // iPhone 8 Plus       1242px × 2208px    2208px × 1242px     414px ×  736px    3
  // iPhone 7 Plus       1242px × 2208px    2208px × 1242px     414px ×  736px    3
  // iPhone 6s Plus      1242px × 2208px    2208px × 1242px     414px ×  736px    3
  // iPhone XS Max       1242px × 2688px    2688px × 1242px     414px ×  896px    3
  // 9.7" iPad           1536px × 2048px    2048px × 1536px     768px × 1024px    2
  // 10.2" iPad          1620px × 2160px    2160px x 1620px     810px × 1080px    2
  // 7.9" iPad mini 4    1536px × 2048px    2048px × 1536px     768px × 1024px    2
  // 10.5" iPad Pro      1668px × 2224px    2224px × 1668px     834px × 1112px    2
  // 11" iPad Pro        1668px × 2388px    2388px × 1668px     834px × 1194px    2
  // 12.9" iPad Pro      2048px × 2732px    2732px × 2048px    1024px × 1366px    2
  {
    dwidth: 320,
    dheight: 568,
    pixelRatio: 2,
    orientation: "portrait",
    width: 640,
    height: 1136,
  },
  {
    dwidth: 375,
    dheight: 667,
    pixelRatio: 2,
    orientation: "portrait",
    width: 750,
    height: 1334,
  },
  {
    dwidth: 414,
    dheight: 896,
    pixelRatio: 2,
    orientation: "portrait",
    width: 828,
    height: 1792,
  },
  {
    dwidth: 375,
    dheight: 812,
    pixelRatio: 3,
    orientation: "portrait",
    width: 1125,
    height: 2436,
  },
  {
    dwidth: 414,
    dheight: 736,
    pixelRatio: 3,
    orientation: "portrait",
    width: 1242,
    height: 2208,
  },
  {
    dwidth: 414,
    dheight: 896,
    pixelRatio: 3,
    orientation: "portrait",
    width: 1242,
    height: 2688,
  },
  {
    dwidth: 768,
    dheight: 1024,
    pixelRatio: 2,
    orientation: "portrait",
    width: 1536,
    height: 2048,
  },
  {
    dwidth: 834,
    dheight: 1112,
    pixelRatio: 2,
    orientation: "portrait",
    width: 1668,
    height: 2224,
  },
  {
    dwidth: 834,
    dheight: 1194,
    pixelRatio: 2,
    orientation: "portrait",
    width: 1668,
    height: 2388,
  },
  {
    dwidth: 1024,
    dheight: 1366,
    pixelRatio: 2,
    orientation: "portrait",
    width: 2048,
    height: 2732,
  },
  {
    dwidth: 810,
    dheight: 1080,
    pixelRatio: 2,
    orientation: "portrait",
    width: 1620,
    height: 2160,
  },

  {
    dwidth: 320,
    dheight: 568,
    pixelRatio: 2,
    orientation: "landscape",
    width: 1136,
    height: 640,
  },
  {
    dwidth: 375,
    dheight: 667,
    pixelRatio: 2,
    orientation: "landscape",
    width: 1334,
    height: 750,
  },
  {
    dwidth: 414,
    dheight: 896,
    pixelRatio: 2,
    orientation: "landscape",
    width: 1792,
    height: 828,
  },
  {
    dwidth: 375,
    dheight: 812,
    pixelRatio: 3,
    orientation: "landscape",
    width: 2436,
    height: 1125,
  },
  {
    dwidth: 414,
    dheight: 736,
    pixelRatio: 3,
    orientation: "landscape",
    width: 2208,
    height: 1242,
  },
  {
    dwidth: 414,
    dheight: 896,
    pixelRatio: 3,
    orientation: "landscape",
    width: 2688,
    height: 1242,
  },
  {
    dwidth: 768,
    dheight: 1024,
    pixelRatio: 2,
    orientation: "landscape",
    width: 2048,
    height: 1536,
  },
  {
    dwidth: 834,
    dheight: 1112,
    pixelRatio: 2,
    orientation: "landscape",
    width: 2224,
    height: 1668,
  },
  {
    dwidth: 834,
    dheight: 1194,
    pixelRatio: 2,
    orientation: "landscape",
    width: 2388,
    height: 1668,
  },
  {
    dwidth: 1024,
    dheight: 1366,
    pixelRatio: 2,
    orientation: "landscape",
    width: 2732,
    height: 2048,
  },
  {
    dwidth: 810,
    dheight: 1080,
    pixelRatio: 2,
    orientation: "landscape",
    width: 2160,
    height: 1620,
  },
];

const coastSizes = [228];

const faviconSizes = [16, 32, 48];

function hasAll(arr) {
  return function (icons) {
    if (Array.isArray(icons)) return arr.every((item) => icons.includes(item));
    return icons;
  };
}

function hasAny(arr) {
  return function (icons) {
    if (Array.isArray(icons)) return arr.some((item) => icons.include(item));

    return icons;
  };
}

function ctxHasIcons(icons, icon) {
  if (Array.isArray(icons)) return icons.includes(icon);
  return icons;
}

const allAppleIcons = hasAll(
  appleIconSizes.map((size) => `apple-touch-icon-${size}x${size}.png`)
);
const anyAppleIcon = hasAny(
  appleIconSizes.map((size) => `apple-touch-icon-${size}x${size}.png`)
);

function appleIconGen(size, { relative, icons }) {
  const iconName = `apple-touch-icon-${size}x${size}.png`;

  return !ctxHasIcons(icons.appleIcon, iconName)
    ? ""
    : `<link rel="apple-touch-icon" sizes="${size}x${size}" href="${relative(
        iconName
      )}">`;
}

function appleStartupGen(
  { width, height, dwidth, dheight, pixelRatio, orientation },
  { relative, icons }
) {
  const iconName = `apple-touch-startup-image-${width}x${height}.png`;

  return !ctxHasIcons(icons.appleStartup, iconName)
    ? ""
    : `<link rel="apple-touch-startup-image" media="(device-width: ${dwidth}px) and (device-height: ${dheight}px) and (-webkit-device-pixel-ratio: ${pixelRatio}) and (orientation: ${orientation})" href="${relative(
        iconName
      )}">`;
}

function coastGen(size, { relative, icons }) {
  const iconName = `coast-${size}x${size}.png`;

  return !ctxHasIcons(icons.coast, iconName)
    ? ""
    : `<link rel="icon" type="image/png" sizes="${size}x${size}" href="${relative(
        iconName
      )}">`;
}

function faviconGen(size, { relative, icons }) {
  const iconName = `favicon-${size}x${size}.png`;
  return !ctxHasIcons(icons.favicons, iconName)
    ? ""
    : `<link rel="icon" type="image/png" sizes="${size}x${size}" href="${relative(
        iconName
      )}">`;
}

// prettier-ignore
module.exports = {
  android: [
    ({ relative, loadManifestWithCredentials }) =>
      loadManifestWithCredentials
        ? `<link rel="manifest" href="${relative("manifest.json")}" crossOrigin="use-credentials">`
        : `<link rel="manifest" href="${relative("manifest.json")}">`,
    () => `<meta name="mobile-web-app-capable" content="yes">`,
    ({ theme_color, background }) => `<meta name="theme-color" content="${theme_color || background}">`,
    ({ appName }) => appName ? `<meta name="application-name" content="${appName}">` : `<meta name="application-name">`
  ],
  appleIcon: [
    ...appleIconSizes.map(size => ctx => appleIconGen(size, ctx)),
    () => `<meta name="apple-mobile-web-app-capable" content="yes">`,
    ({ appleStatusBarStyle }) => `<meta name="apple-mobile-web-app-status-bar-style" content="${appleStatusBarStyle}">`,
    ({ appShortName, appName }) => (appShortName || appName) ? `<meta name="apple-mobile-web-app-title" content="${appShortName || appName}">` : `<meta name="apple-mobile-web-app-title">`
  ],
  appleStartup: appleStartupItems.map(item => ctx => appleStartupGen(item, ctx)),
  coast: coastSizes.map(size => ctx => coastGen(size, ctx)),
  favicons: [
    ({ relative, icons }) => !ctxHasIcons(icons.favicons, "favicon.ico") ? "" : `<link rel="shortcut icon" href="${relative("favicon.ico")}">`,
    ...faviconSizes.map(size => ctx => faviconGen(size, ctx)),
  ],
  windows: [
    ({ background }) => `<meta name="msapplication-TileColor" content="${background}">`,
    ({ relative, icons }) => !ctxHasIcons(icons.windows, "mstile-144x144.png") ? "" : `<meta name="msapplication-TileImage" content="${relative("mstile-144x144.png")}">`,
    ({ relative }) => `<meta name="msapplication-config" content="${relative("browserconfig.xml")}">`
  ],
  yandex: [
    ({ relative }) => `<link rel="yandex-tableau-widget" href="${relative("yandex-browser-manifest.json")}">`
  ]
};
