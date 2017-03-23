/*Конфигурация и настройка сборки true-разработка*/
const isDevelopment = true;

// 
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const minifycss = require('gulp-csso');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const gulpIf = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const del = require('del');
const runSequence = require('run-sequence');
/* ------ deploy -------*/
const gutil = require( 'gulp-util' );
const ftp = require( 'vinyl-ftp' );
// SVG sprite
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');


const moduleJS = [
  'app/js/main.js'
];

const vendorJS = [
  'app/bower/jquery/dist/jquery.min.js'
];

const vendorCss = [
  'app/bower/normalize-css/normalize.css'
];


// запускаем сервер
gulp.task('browser-sync', ['html',
  'html',
  'styles',
  'img',
  'build:js',
  'vendor:js',
  'vendor:css',
  'fonts'
], function () {
  browserSync.init({
    server: {
      baseDir: "./dist"
    }
  });
  // наблюдаем и обновляем
  browserSync.watch(['./dist/**/*.*', '!**/*.css'], browserSync.reload);
});


// перенос страничек html
gulp.task('html', function () {
  return gulp.src('app/pages/**/*.*')
    .pipe(gulp.dest('dist'));
});

// перенос шрифтов
gulp.task('fonts', function () {
  return gulp.src('app/fonts/**/*.*')
    .pipe(gulp.dest('dist/fonts'));
});

// перенос php 
gulp.task('php', function () {
  return gulp.src('app/php/**/*.*')
    .pipe(gulp.dest('dist/php'));
});

// перенос и оптимизация картинок
gulp.task('img', function () {
  return gulp.src('app/img/**/*.{png,svg,jpg}')
    .pipe(cache(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/img'));
});

// styles
gulp.task('styles', function () {
  return gulp.src(['app/scss/main.scss'])
    .pipe(plumber({
      errorHandler: notify.onError(function (err) {
        return {
          title: 'Style',
          message: err.message
        }
      })
    }))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(sass())
    .pipe(autoprefixer('last 2 versions'))
    .pipe(minifycss())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulpIf(isDevelopment, sourcemaps.write('maps')))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

// scripts JS
gulp.task('build:js', function () {
  return gulp.src(moduleJS)
    .pipe(plumber({
      errorHandler: notify.onError(function (err) {
        return {
          title: 'javaScript',
          message: err.message
        }
      })
    }))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(gulpIf(isDevelopment, sourcemaps.write('maps')))
    .pipe(gulp.dest('dist/js'))
});

/* -------- Объединение всех подключаемых плагинов в один файл -------- */
gulp.task('vendor:js', function () {
  return gulp
    .src(vendorJS)
    .pipe(concat('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
});
/* -------- Объединение всех стилей подключаемых плагинов в один файл -------- */
gulp.task('vendor:css', function () {
  return gulp
    .src(vendorCss)
    .pipe(concat('vendor.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/css/'));
});


// watcher
gulp.task('watch', function () {
  gulp.watch('app/pages/**/*.*', ['html']);
  gulp.watch('app/scss/**/*.scss', ['styles']);
  gulp.watch('app/img/**/*.*', ['img']);
  gulp.watch('app/js/**/*.js', ['build:js']);
});

// default
gulp.task('default', ['browser-sync', 'watch']);

// Очистка папки dist
gulp.task('clean', function () {
  return del(['dist'], {
    force: true
  }).then(paths => {
    console.log('Deleted files and folders: in dist');
  });
});

// Выполнить билд проекта
gulp.task('build', function (callback) {
  runSequence(['clean'], [
    'html',
    'styles',
    'img',
    'build:js',
    'vendor:js',
    'vendor:css',
    'fonts'
  ], callback);
});

// deploy
gulp.task( 'deploy', function() {

  var conn = ftp.create( {
      host:     'rucheyek-ru.1gb.ru',
      user:     'w_rucheyek-ru_a0d18bbc',
      password: 'aa95ba9c9hjk',
      parallel: 10,
      log: gutil.log
  } );

  var globs = [
      'dist/**/*'
  ];

  return gulp.src(globs, { base: 'dist/', buffer: false })
    .pipe(conn.dest( 'http/'));

});


// svg
gulp.task('build:svg', function () {
  return gulp.src('app/temp/icons/*.svg')
  // минифицируем svg
    .pipe(svgmin({
    js2svg: {
      pretty: true
    }
  }))
  // удалить все атрибуты fill, style and stroke в фигурах
    .pipe(cheerio({
    run: function ($) {
      $('[fill]').removeAttr('fill');
      $('[stroke]').removeAttr('stroke');
      $('[style]').removeAttr('style');
    },
    parserOptions: {
      xmlMode: true
    }
  }))
  // cheerio плагин заменит, если появилась, скобка '&gt;', на нормальную.
    .pipe(replace('&gt;', '>'))
  // build svg sprite
    .pipe(svgSprite({
    mode: {
      symbol: {
        sprite: "../sprite.svg",
        example: {
          dest: '../tmp/spriteSvgDemo.html' // демо html
        }
      }
    }
  }))
    .pipe(gulp.dest('app/img'));
});