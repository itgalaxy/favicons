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
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)" href="${relative("apple-touch-startup-image-320x460.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)" href="${relative("apple-touch-startup-image-640x920.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="${relative("apple-touch-startup-image-640x1096.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="${relative("apple-touch-startup-image-750x1294.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 3)" href="${relative("apple-touch-startup-image-1182x2208.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 3)" href="${relative("apple-touch-startup-image-1242x2148.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)" href="${relative("apple-touch-startup-image-748x1024.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)" href="${relative("apple-touch-startup-image-768x1004.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)" href="${relative("apple-touch-startup-image-1496x2048.png")}">`,
    ({ relative }) => `<link rel="apple-touch-startup-image" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)" href="${relative("apple-touch-startup-image-1536x2008.png")}">`
  ],
  coast: [
    ({ relative }) => `<link rel="icon" type="image/png" sizes="228x228" href="${relative("coast-228x228.png")}">`
  ],
  favicons: [
    ({ relative }) => `<link rel="shortcut icon" href="${relative("favicon.ico")}">`,
    ({ relative }) => `<link rel="icon" type="image/png" sizes="16x16" href="${relative("favicon-16x16.png")}">`,
    ({ relative }) => `<link rel="icon" type="image/png" sizes="32x32" href="${relative("favicon-32x32.png")}">`
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
