const {
  readdirSync,
  statSync,
  rmSync,
  rmdirSync
} = require('fs');

/**
 * 删除目录
 * @param {string} path 文件夹路径
 * @param {boolean} isRemoveSelf 是否删除自身，为否则只删除子目录及目录下文件
 */
function removeDir(path, isRemoveSelf = false) {
  readdirSync(path).forEach(p => {
    p = path + '/' + p;
    const stat = statSync(p);
    if (stat.isDirectory()) {
      removeDir(p, true);
    } else {
      rmSync(p);
    }
  });
  if (isRemoveSelf) rmdirSync(path);
}

/**
 * 插件，用于打包前清空编译目录
 */
class CleanPlugin {
  constructor(output) {
    this.output = output;
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tap('CleanPlugin', compilation => {
        removeDir(this.output);
      }
    );
  }
}

module.exports.CleanPlugin = CleanPlugin;
