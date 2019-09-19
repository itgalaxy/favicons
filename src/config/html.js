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
    ({ relative }) => `<link rel="apple-touch-icon" sizes="57x57" href="${relative("apple-touch-icon-57x57.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="60x60" href="${relative("apple-touch-icon-60x60.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="72x72" href="${relative("apple-touch-icon-72x72.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="76x76" href="${relative("apple-touch-icon-76x76.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="114x114" href="${relative("apple-touch-icon-114x114.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="120x120" href="${relative("apple-touch-icon-120x120.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="144x144" href="${relative("apple-touch-icon-144x144.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="152x152" href="${relative("apple-touch-icon-152x152.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="167x167" href="${relative("apple-touch-icon-167x167.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="180x180" href="${relative("apple-touch-icon-180x180.png")}">`,
    ({ relative }) => `<link rel="apple-touch-icon" sizes="1024x1024" href="${relative("apple-touch-icon-1024x1024.png")}">`,
    () => `<meta name="apple-mobile-web-app-capable" content="yes">`,
    ({ appleStatusBarStyle }) => `<meta name="apple-mobile-web-app-status-bar-style" content="${appleStatusBarStyle}">`,
    ({ appName }) => appName ? `<meta name="apple-mobile-web-app-title" content="${appName}">` : `<meta name="apple-mobile-web-app-title">`
  ],
  appleStartup: [
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

    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"    href="${relative("apple-touch-startup-image-640x1136.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"    href="${relative("apple-touch-startup-image-750x1334.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"    href="${relative("apple-touch-startup-image-828x1792.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"    href="${relative("apple-touch-startup-image-1125x2436.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"    href="${relative("apple-touch-startup-image-1242x2208.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"    href="${relative("apple-touch-startup-image-1242x2688.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"   href="${relative("apple-touch-startup-image-1536x2048.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"   href="${relative("apple-touch-startup-image-1668x2224.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"   href="${relative("apple-touch-startup-image-1668x2388.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"  href="${relative("apple-touch-startup-image-2048x2732.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"  href="${relative("apple-touch-startup-image-1620x2160.png")}">`,

    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"   href="${relative("apple-touch-startup-image-1136x640.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"   href="${relative("apple-touch-startup-image-1334x750.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"   href="${relative("apple-touch-startup-image-1792x828.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"   href="${relative("apple-touch-startup-image-2436x1125.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"   href="${relative("apple-touch-startup-image-2208x1242.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"   href="${relative("apple-touch-startup-image-2688x1242.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"  href="${relative("apple-touch-startup-image-2048x1536.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"  href="${relative("apple-touch-startup-image-2224x1668.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"  href="${relative("apple-touch-startup-image-2388x1668.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" href="${relative("apple-touch-startup-image-2732x2048.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"  href="${relative("apple-touch-startup-image-2160x1620.png")}">`
    //
  ],
  coast: [
    ({ relative }) => `<link rel="icon" type="image/png" sizes="228x228" href="${relative("coast-228x228.png")}">`
  ],
  favicons: [
    ({ relative }) => `<link rel="shortcut icon" href="${relative("favicon.ico")}">`,
    ({ relative }) => `<link rel="icon" type="image/png" sizes="16x16" href="${relative("favicon-16x16.png")}">`,
    ({ relative }) => `<link rel="icon" type="image/png" sizes="32x32" href="${relative("favicon-32x32.png")}">`,
    // 48x48
    ({ relative }) => `<link rel="icon" type="image/png" sizes="48x48" href="${relative("favicon-48x48.png")}">`,
    //
  ],
  windows: [
    ({ background }) => `<meta name="msapplication-TileColor" content="${background}">`,
    ({ relative }) => `<meta name="msapplication-TileImage" content="${relative("mstile-144x144.png")}">`,
    ({ relative }) => `<meta name="msapplication-config" content="${relative("browserconfig.xml")}">`
  ],
  yandex: [
    ({ relative }) => `<link rel="yandex-tableau-widget" href="${relative("yandex-browser-manifest.json")}">`
  ]
};
