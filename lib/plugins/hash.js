const through = require('through-gulp');
const Vinyl = require('vinyl');

// 保存文件类型下标
const indexObj = {};

// 生成一个20位的hash字符串
function getUUID() {
  return 'xxyyxxyyxxyyxxyyxxyy'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  })
}

module.exports = function(opts) {
  const stream = through(function(file, encoding, cb) {
    if (Vinyl.isVinyl(file)) {
      const { extname } = file;

      const index = indexObj[extname] || 0; // 获取当前文件类型的下标
      file.basename = `${index}.${getUUID()}${extname}`; // 用hash散列重命名文件

      indexObj[extname] = index + 1;
    }

    this.push(file);
    cb();
  });
  return stream;
}
