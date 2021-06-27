const through = require('through-gulp');
const Vinyl = require('vinyl');

module.exports = function(opts) {
  const stream = through(function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const text = file.contents.toString(encoding);
      const content = JSON.parse(text);

      const { background, content_scripts } = opts;

      if (background) delete background.name;

      if (content_scripts) content_scripts.forEach(item => delete item.name);

      Object.assign(opts, content);
      file.contents = Buffer.from(JSON.stringify(opts));
    }

    this.push(file);
    cb();
  });
  return stream;
}
