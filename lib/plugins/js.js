const through = require('through-gulp');
const Vinyl = require('vinyl');

module.exports = function(opts) {
  const stream = through(async function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { module: { item }, basename } = file;

      const { js = [] } = item;
      js.push('/js/' + basename);
      Object.assign(item, { js });
    }

    this.push(file);
    cb();
  });
  return stream;
}
