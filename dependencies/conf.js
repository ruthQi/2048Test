
'use strict';
module.exports = {
    dist: './public/dist/',
    del: ['./build', './public/dist/**', './public/scss/includes/sprites/**', './views/release/', './rev-manifest.json'],
    sprite: {
        src: './public/images/sprites/',
        imgName: './public/dist/images/sprites/',
        cssName: './public/scss/includes/sprites/',
        cssTemplate: './dependencies/sprite.scss.template.handlebars',
        dist: './'
    },
    watch: {
        sprite: ['./public/images/sprites/**/*'],
        scss2css: ['./public/scss/**/*.scss'],
        webpackjs: ['./public/scripts/**/*'],
        restart: ['./app.js', './routes/**/*.js'],
        notify: ['./views/**/*.ejs','./public/images/**/*','./public/dist/styles/**/*.css','./public/dist/**/*.js']
    },
    copyImg: {
        src: ['./public/images/**/*', '!./public/images/sprites/**/*', '!./public/images/animations/frames/**/*', '!./public/images/animations/dist/**/*'],
        dist: './public/dist/images'
    },
    copyAssets: {
        src: ['./public/scripts/assets/**/*'],
        dist: './public/dist/scripts/assets'
    },
    webpackjs: {
        src: './public/scripts/pages/',
        regexp: /\/public\/scripts\/pages\/(.*)\.js$/
    },
    scss2css: {
        src: ['./public/scss/**/*.scss', '!./public/scss/**/includes/**/*.scss'],
        includePaths: ['./public/scss/', './public/scss/includes/'],
        dist: './public/dist/styles'
    }
};
