/*global jQuery*/
jQuery(function ($) {

    'use strict';

    var code = $('#code'),
        node = [
            'var favicons = require("favicons");',
            '\nfavicons({',
            '    appName: "My App",',
            '    appDescription: "This is my application",',
            '    developerName: "Hayden Bleasel",',
            '    developerURL: "http://haydenbleasel.com/",',
            '    background: "#020307",',
            '    path: "favicons/",',
            '    url: "http://haydenbleasel.com/",',
            '    display: "standalone",',
            '    orientation: "portrait",',
            '    version: 1.0,',
            '    logging: false,',
            '    online: false',
            '}, function (error, response) {',
            '    // Handle error and response',
            '});'
        ].join('\n'),
        gulp = [
            'var favicons = require("gulp-favicons");',
            '\ngulp.task("default", function () {',
            '    gulp.src("logo.png").pipe(favicons({',
            '        appName: "My App",',
            '        appDescription: "This is my application",',
            '        developerName: "Hayden Bleasel",',
            '        developerURL: "http://haydenbleasel.com/",',
            '        background: "#020307",',
            '        path: "favicons/",',
            '        url: "http://haydenbleasel.com/",',
            '        display: "standalone",',
            '        orientation: "portrait",',
            '        version: 1.0,',
            '        logging: false,',
            '        online: false,',
            '        html: "index.html"',
            '        replace: true',
            '    })).pipe(gulp.dest("./"));',
            '});'
        ].join('\n');

    $('#platform-switcher > div').click(function () {

        var id = $(this).attr('id');

        if (id === 'node') {
            code.text(node);
        } else if (id === 'gulp') {
            code.text(gulp);
        }

        $(this).addClass('active').siblings().removeClass('active');

    });
});
