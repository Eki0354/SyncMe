const through = require('through-gulp');
const Vinyl = require('vinyl');
const { rollup } = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const { terser } = require('rollup-plugin-terser');

module.exports = function(opts) {
  const stream = through(async function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { path } = file;
      const { isDev } = opts;

      const plugins = [
        nodeResolve({ jsnext: true }),
        commonjs(),
        babel(),
        terser()
      ];
      isDev && plugins.push(terser());

      const bundle = await rollup({
        input: path,
        plugins
      });

      const { output: [{ code }] } = await bundle.generate({ format: 'cjs' });

      file.contents = Buffer.from(code);
    }

    this.push(file);
    cb();
  });
  return stream;
}
