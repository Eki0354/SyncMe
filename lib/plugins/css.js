const through = require('through-gulp');
const Vinyl = require('vinyl');

module.exports = function(opts) {
  const stream = through(function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { module: { item }, basename } = file;

      const { css = [] } = item;
      css.push('/css/' + basename);
      Object.assign(item, { css });
    }

    this.push(file);
    cb();
  });
  return stream;
}
