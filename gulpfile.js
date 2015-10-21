var gulp = require('gulp-help')(require('gulp'));
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');

var source     = require('vinyl-source-stream');
var streamify  = require('gulp-streamify');
var watchify   = require('watchify');
var babelify   = require('babelify');
var bulkify    = require('bulkify');
var browserify = require('browserify');
var _          = require('lodash');
var console    = require('better-console');
var prompt     = require('gulp-prompt');
var mkdirp     = require('mkdirp');
var del        = require('del');
var fs         = require('fs');
var concat     = require('concat-stream');

var gulpLoadPlugins = require('gulp-load-plugins');
var browserSync = require('browser-sync').create();

gulp.task('semantic_relocate_javascripts', false, ['build-javascript'], function () {
  return gulp.src("./app/web/semantic/dist/*.min.js")
    .pipe(gulp.dest("./public/js/lib"));
});

var onError = function (err) {
  gutil.beep();
  console.log(err);
};

function write (name) {
    return concat(function (body) {
        console.log('// ----- ' + name + ' -----');
        console.log(body.toString('utf8'));
    });
}


gulp.task('browserify', function () {
  var startTime = Date.now();
  gutil.log("Starting bundle...");

  // Single entry point to browserify
  var files = ['./app/web/src/app.jsx', './app/web/src/vendor.js'];
  var bundleStream = browserify(files, {
      debug: true,
      noParse: ['jquery'],
      insertGlobals: true,
      paths: ['./node_modules','./app/web/src/']
    })
    .transform(babelify)
    .transform(bulkify)
    .plugin('factor-bundle', { outputs: [ './public/js/app.js', './public/js/vendor.js'] })
    .on('error', function(err){
      gutil.beep();
      console.log(err.message);
      this.emit('end');
    })
    .on('end', function () {
      gutil.log(_.template("Finished bundling in <%= time %> seconds.")({time: (Date.now() - startTime) / 1000}));
    })
    .bundle()
    .pipe(fs.createWriteStream('./public/js/core.js'));
});

gulp.task('watch', [], function () {
  var files = ['./app/web/src/app.jsx', './app/web/src/vendor.js'];
  var bundler = watchify(browserify(files, {
        cache: {},
        packageCache: {},
        fullPaths: true,
        transform: [babelify, bulkify],
        paths: ['./node_modules','./app/web/src/'],
        debug: true
    }))
      .plugin('factor-bundle', { outputs: [ './public/js/app.js', './public/js/vendor.js' ] });

    function rebundle() {
      var startTime = Date.now();
      gutil.log("Starting bundle...");
      return bundler.bundle()
        .on('error', function(err){
          gutil.beep();
          console.log(err.message);
          this.emit('end');
        })
        .on('end', function () {
          gutil.log(_.template("Finished bundling in <%= time %> seconds.")({time: (Date.now() - startTime) / 1000}));
        })
        // .pipe(source('application.js'))
        .pipe(plumber({errorHandler: onError}))
        .pipe(fs.createWriteStream('./public/js/core.js'))
        // .pipe(gulp.dest('./dist'))
        // .pipe(streamify(uglify('bundle.min.js', {
        //   outSourceMap: false
        // })))
        // .pipe(rename('bundle.min.js'))
        // .pipe(gulp.dest('./dist'));
    }
    bundler.on('update', rebundle);
    // run any other gulp.watch tasks

    return rebundle();
});
