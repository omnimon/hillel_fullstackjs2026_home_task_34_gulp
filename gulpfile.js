import { rm } from 'node:fs/promises';
import { src, dest, watch, series, parallel } from 'gulp';
import browserSyncPackage from 'browser-sync';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';

const browserSync = browserSyncPackage.create();
const sass = gulpSass(dartSass);

const paths = {
  src: {
    html: 'src/*.html',
    scssEntry: 'src/scss/style.scss',
    scssAll: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    images: 'src/img/**/*',
  },
  dist: {
    root: 'dist',
    css: 'dist/css',
    js: 'dist/js',
    images: 'dist/img',
  },
};

export function clean() {
  return rm(paths.dist.root, { recursive: true, force: true });
}

export function html() {
  return src(paths.src.html).pipe(dest(paths.dist.root));
}

export function styles() {
  return src(paths.src.scssEntry)
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(dest(paths.dist.css))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(paths.dist.css))
    .pipe(browserSync.stream());
}

export function scripts() {
  return src(paths.src.js).pipe(dest(paths.dist.js));
}

export function images() {
  return src(paths.src.images, { encoding: false }).pipe(dest(paths.dist.images));
}

export const build = series(clean, parallel(html, styles, scripts, images));

export function serve(done) {
  browserSync.init({
    server: {
      baseDir: paths.dist.root,
    },
    notify: false,
    open: false,
    port: 3000,
  });

  done();
}

export function watchFiles() {
  watch(paths.src.html, series(html, reload));
  watch(paths.src.scssAll, styles);
  watch(paths.src.js, series(scripts, reload));
  watch(paths.src.images, series(images, reload));
}

function reload(done) {
  browserSync.reload();
  done();
}

export default series(build, parallel(serve, watchFiles));
