/*global jQuery*/
jQuery(function ($) {

    'use strict';

    var code = $('#code'),
        node = [
            'var favicons = require("favicons");',
            '\nfavicons({',
            '    appName: "My App",',
            '    appDescription: "This is my application",',
            '    developer: "Hayden Bleasel",',
            '    developerURL: "haydenbleasel.com",',
            '    background: "#020307",',
            '    path: "favicons/",',
            '    online: false,',
            '    version: 1.0,',
            '}, function (error, images, files, html) {',
            '    // Handle favicons',
            '});'
        ].join('\n'),
        gulp = [
            'var favicons = require("gulp-favicons");',
            '\ngulp.task("default", function () {',
            '    gulp.src("logo.png").pipe(favicons({',
            '        appName: "My App",',
            '        appDescription: "This is my application",',
            '        developer: "Hayden Bleasel",',
            '        developerURL: "haydenbleasel.com",',
            '        background: "#020307",',
            '        path: "favicons/",',
            '        online: false,',
            '        version: 1.0,',
            '        html: "index.html"',
            '    })).pipe(gulp.dest("./"));',
            '});'
        ].join('\n');
        /*shell = [
            'favicons \\',
            '  --files.src="images/image.png" \\',
            '  --files.dest="favicons/" \\',
            '  --settings.logging'
        ].join('\n');*/

    $('#platform-switcher > div').click(function () {

        var id = $(this).attr('id');

        if (id === 'node') {
            code.text(node);
        } else if (id === 'gulp') {
            code.text(gulp);
        } /*else if (id === 'shell') {
            code.text(shell);
        }*/

        $(this).addClass('active').siblings().removeClass('active');

    });
});
