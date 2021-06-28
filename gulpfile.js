const { src, dest, task, series, watch, parallel } = require('gulp');
const clean = require('gulp-clean');
const less = require('gulp-less');
const cssnano = require('gulp-cssnano');
const flatten = require('gulp-flatten');
const { existsSync } = require('fs');
const sorting = require('./lib/plugins/sorting');
const hash = require('./lib/plugins/hash');
const js = require('./lib/plugins/js');
const json = require('./lib/plugins/json');
const css = require('./lib/plugins/css');
const html = require('./lib/plugins/html');
const mf = require('./lib/plugins/mf');
const rollup = require('./lib/plugins/rollup');

const args = process.argv;
const isDev = args.includes('--watch');

const manifest = {};

const paths = {
  src: 'src',
  dist: 'dist',
  modules: 'src/pages'
}

const getSrc = suffix => `${paths.modules}/*/*.${suffix}`;

const getDist = suffix => `${paths.dist}/${suffix}`;

task('clean', done => {
  if (!existsSync(paths.dist)) return done();
  return src(paths.dist, { read: false }).pipe(clean());
});

task('less', _ => {
  const stream = src(getSrc('less')).pipe(less());
  isDev && stream.pipe(cssnano());
  return stream
    .pipe(sorting(manifest))
    .pipe(hash())
    .pipe(css())
    .pipe(flatten())
    .pipe(dest(getDist('css')));
});

task('js', _ => {
  return src(getSrc('js'))
    .pipe(rollup({ isDev }))
    .pipe(sorting(manifest))
    .pipe(hash())
    .pipe(js())
    .pipe(flatten())
    .pipe(dest(getDist('js')));
});

task('json', _ => {
  return src(getSrc('json'))
    .pipe(sorting(manifest))
    .pipe(hash())
    .pipe(json());
});

task('html', _ => {
  return src(getSrc('html'))
    .pipe(sorting(manifest))
    .pipe(hash())
    .pipe(html())
    .pipe(flatten())
    .pipe(dest(getDist('html')));
});

task('windUp', _ => {
  return src(paths.src + '/manifest.json')
    .pipe(mf(manifest, isDev))
    .pipe(dest(paths.dist));
});

const defaultSeries = series('clean', parallel('json', 'less', 'js'), 'html', 'windUp');

task('default', defaultSeries);

isDev && watch(['src'], { delay: 500 }, defaultSeries);
