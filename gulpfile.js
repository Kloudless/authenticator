var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var jshint = require('gulp-jshint');
var gulpif = require('gulp-if');
var del = require('del');
var argv = require('yargs').argv;

var debug = !!argv.debug

var uglifyOpts = {
  compress: {
    global_defs: {
      DEBUG: debug,
      BASE_URL: argv.url || 'https://api.kloudless.com'
    }
  }
}

if (debug) {
  uglifyOpts.mangle = false
}

gulp.task('clean', function() {
  return del(['build']);
});

gulp.task('build', ['clean'], function() {
  return gulp.src('src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(gulpif(debug, sourcemaps.init()))
    .pipe(uglify(uglifyOpts))
    .pipe(concat('kloudless-authenticator.min.js'))
    .pipe(gulpif(debug, sourcemaps.write()))
    .pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
  gulp.watch('src/*.js', ['build']);
});

gulp.task('default', ['build']);
