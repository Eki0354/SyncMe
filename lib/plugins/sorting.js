const through = require('through-gulp');
const Vinyl = require('vinyl');

module.exports = function(opts) {
  const stream = through(function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { stem, dirname } = file;

      // 模块名称
      const name = dirname.match(/.*\\([^\\]+)$/)[1];

      // 仅编译模块同名的入口文件，js和css文件均通过相应的import语法导入
      if (name !== stem) return cb();

      const isBG = name === 'background';
      const key = isBG ? 'background' : 'content_scripts';
      let item;
      if (isBG) {
        // background模块配置为对象
        item = opts[key] || { name };
        opts[key] = item;
      } else {
        // 非background模块可为对象或数组，统一编译为数组，其标识name属性会在编译manifest.json前删除
        let list = opts[key];

        if (list) {
          item = list.find(i => i.name === name);
          if (!item) {
            item = { name };
            list.push(item);
          }
        } else {
          item = { name };
          list = [item];
        }

        opts[key] = list;
      }

      // 添加模块标识
      file.module = {
        name,
        key,
        isBG,
        item
      }

      this.push(file);
    }

    cb();
  });
  return stream;
}
