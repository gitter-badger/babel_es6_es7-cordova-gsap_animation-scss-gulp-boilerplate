var gulp = require('gulp')
var rename = require('gulp-rename')()

var browserify = require('browserify')
var babelify = require('babelify')

var browserSync = require("browser-sync")
var reload = browserSync.reload

var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')

var notify = require('gulp-notify')

var source = require('vinyl-source-stream')

var stringify = require('stringify')

var plumber = require('gulp-plumber')
var gutil = require('gulp-util')

var when = require('gulp-if')

var cordova_lib = require('cordova-lib')
var cdv = cordova_lib.cordova.raw

var tap = require('gulp-tap')
var filter = require('gulp-filter')

module.exports = {
    plumber: function() {
        return plumber(function(error) {
            gutil.log(gutil.colors.red(error.message))
            this.emit('end')
        })
    }
}

var onError = function(error) {
    console.log(error.stack)
    this.emit('end')
}

var prepare = function () {
    console.log('cordova prepare')
    return cdv.prepare().then(function() {
        reload()
    })
}

gulp.task('build', function() {
    var babel = babelify.configure({
        optional: ["es7.asyncFunctions", "es7.classProperties", "runtime"]
    })
    var string = stringify({
        extensions: ['.html'], minify: true
    })

    browserify({
            entries: './src/js/index.js',
            debug: true
            //debug: process.env.NODE_ENV === 'development'
        })
        .transform(babel)
        .transform(string)
        .bundle()
        .on('error', onError)
        .pipe(plumber())
        .pipe(source('app.js'))
        .pipe(gulp.dest('./www'))
        .pipe(reload({stream: true}))
        .pipe(tap(prepare))
        .pipe(notify('Js is updated!'))

})

gulp.task('sass', function () {
    gulp.src('./src/sass/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./www/css'))
        .pipe(gulp.dest('./platforms/android/assets/www/css'))
        .pipe(gulp.dest('./platforms/ios/www/css'))
        .pipe(filter('**/*.css'))
        .pipe(reload({stream: true}))
        .pipe(notify('Sass is updated!'))
})

gulp.task('html', function() {
    gulp.src('./src/**/*.html')
        .pipe(plumber())
        .pipe(gulp.dest('./www'))
        .pipe(reload({stream: true}))
        .pipe(notify('Html is updated!'))
})


gulp.task('browser-sync', [], function() {
    var config = {
        server: {
            baseDir: 'www'
        },
        //proxy: 'http://localhost:5000',
        files: ['www/css/style.css'],
        logLevel: 'debug'
        //browser: "google chrome"
    }
    browserSync(config)
})

gulp.task('serve', ['sass', 'html', 'build', 'browser-sync'], function() {
    gulp.watch('./src/sass/*.scss', ['sass'])
    gulp.watch('./src/**/*.html', ['html', 'build'])
    gulp.watch('./src/**/*.js', ['build'])
})

gulp.task('default', ['serve'])