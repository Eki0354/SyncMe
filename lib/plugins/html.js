const through = require('through-gulp');
const Vinyl = require('vinyl');
const cheerio = require('cheerio');

module.exports = function(opts) {
  const stream = through(function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { stem, module: { isBG, item } } = file;

      // 非background模块不支持html页面
      if (!isBG) return cb();

      const { css, js } = item;

      // 避免无额外模块时进行额外的编码译码
      if (css || js) {
        const html = file.contents.toString(encoding);
        const $ = cheerio.load(html);

        if (css) {
          css.forEach(path => {
            if (!path) return;
            const child = $('<link />');
            child.attr('type', 'text/css');
            child.attr('rel', 'stylesheet');
            child.attr('href', path);
            $('head').append(child);
          });
          delete item.css;
        }

        if (js) {
          js.forEach(path => {
            if (!path) return;
            const child = $('<script></script>');
            child.attr('src', path);
            child.attr('type', 'text/javascript');
            $('head').append(child);
          });
          delete item.js;
        }

        file.contents = Buffer.from($.html());
      }

      Object.assign(item, { page: `/html/${stem}.html` });
    }

    this.push(file);
    cb();
  });
  return stream;
}
