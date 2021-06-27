const through = require('through-gulp');
const Vinyl = require('vinyl');

module.exports = function(opts) {
  const stream = through(function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { module: { item } } = file;

      const extInfo = JSON.parse(file.contents.toString(encoding));
      Object.assign(item, extInfo);
    }

    this.push(file);
    cb();
  });
  return stream;
}
