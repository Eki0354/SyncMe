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
const path = require('path');

const args = process.argv;
const isDev = args.includes('--watch');

const manifest = {};

// 脚手架命令调用时，会将此脚本的工作目录更改至脚本文件所在目录，需要手动剪掉多余部分。
const fixRoot = rootPath => {
  const index = rootPath.indexOf('node_modules');
  if (index > -1) rootPath = rootPath.substring(0, index - 1);
  return rootPath;
}

const root = fixRoot(process.cwd());

const paths = {
  src: path.resolve(root, 'src'),
  dist: path.resolve(root, 'dist'),
  modules: path.resolve(root, 'src/pages')
}

const getSrc = suffix => `${paths.modules}/*/*.${suffix}`;

const getDist = suffix => `${paths.dist}/${suffix}`;

task('clean', done => {
  if (!existsSync(paths.dist)) return done();
  return src(paths.dist, { read: false }).pipe(clean({ force: true }));
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
  const mfPath = path.resolve(paths.src, 'manifest.json');
  return src(mfPath)
    .pipe(mf(manifest, isDev))
    .pipe(dest(paths.dist));
});

task('finished', done => {
  console.log('已完成构建！');
  done();
});

const defaultSeries = series('clean', parallel('json', 'less', 'js'), 'html', 'windUp', 'finished');

task('default', defaultSeries);

isDev && watch(paths.src, { delay: 500 }, defaultSeries);
