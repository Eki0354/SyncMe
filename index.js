const process = require('child_process');
const cheeiro = require('cheerio');
const path = require('path');
const {
  statSync,
  rmSync,
  rmdirSync,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
  accessSync,
  constants
} = require('fs');

class SyncMe {
  /**
   * 执行命令
   * @param {string} cmd 命令行字符串
   * @returns {Promise} 返回值
   */
  static exec(cmd) {
    return new Promise((resolve, reject) => {
      process.exec(cmd, function(error, stdout, stderr) {
        if (error) return reject(error);
        resolve(stdout);
      });
    });
  }

  /**
   * 以utf-8编码读取文件内容
   * @param {string} path 文件路径
   */
  static readFile(path) {
    return readFileSync(path, { encoding: 'utf-8' });
  }

  /**
   * 删除目录
   * @param {string} path 文件夹路径
   * @param {boolean} isRemoveSelf 是否删除自身，为否则只删除子目录及目录下文件
   */
  static removeDir(path, isRemoveSelf = false) {
    readdirSync(path).forEach(p => {
      p = path + '/' + p;
      const stat = statSync(p);
      if (stat.isDirectory()) {
        SyncMe.removeDir(p, true);
      } else {
        rmSync(p);
      }
    });
    if (isRemoveSelf) rmdirSync(path);
  }

  // 生成一个hash字符串
  static getUUID() {
    return 'xxyyxxyyxxyyxxyyxxyy'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;

      return v.toString(16);
    })
  }

  /**
   * 判断文件是否存在
   * @param {string} path 文件路径
   */
  static isFileExist(path) {
    try {
      accessSync(path, constants.F_OK);
      return true;
    } catch (error) {
    }
  }

  constructor(options = {}) {
    this.options = {
      input: path.resolve(__dirname, 'src'),
      output: path.resolve(__dirname, 'dist'),
      ...options
    }
    this.manifest = {};
  }

  /**
   * 主编译函数
   */
  async run() {
    if (!existsSync('src')) throw new Error('项目根目录不存在入口文件夹：src');

    this.manifest = {
      ...this.manifest,
      ...this.readManifest()
    }

    SyncMe.removeDir(this.options.output);

    const icons = this.syncIcons();
    if (icons) this.manifest.icons = icons;

    await this.syncModules();

    this.syncManifest();
  }

  /**
   * 读取主配置文件
   */
  readManifest() {
    const manifest = SyncMe.readFile('src/manifest.json');
    return JSON.parse(manifest);
  }

  async syncModules() {
    const dirs = readdirSync('src/pages');
    const promises = dirs.map((dir, index) => this.syncModule(dir, index));
    await Promise.all(promises);
  }

  /**
   * 编译单个模块
   * @param {string} name 模块名称
   */
  async syncModule(name, index = 0) {
    // 是否是后台模块
    const isBG = name === 'background';
    const htmlSrc = this.getFileSrc(name, 'html');
    const jsSrc = this.getFileSrc(name, 'js');
    const hasHTML = SyncMe.isFileExist(htmlSrc);
    const hasJS = SyncMe.isFileExist(jsSrc);

    if (!hasHTML && !hasJS) throw new Error('未找到模块主代码文件：' + name);

    let module = {};
    const json = this.syncJSON(name, index);
    json && Object.assign(module, json);

    let cssDist = await this.syncLess(name, index);
    if (!cssDist) cssDist = this.syncCss(name, index);

    const jsDist = await this.syncJS(name, index);

    if (hasHTML) {
      module.page = this.syncHTML(name, index, [jsDist], [cssDist]);
    } else {
      module[isBG ? 'scripts' : 'js'] = [jsDist];
    }

    if (isBG) {
      this.manifest.background = module;
    } else {
      if (!this.manifest.content_scripts) this.manifest.content_scripts = [];
      this.manifest.content_scripts.push(module);
    }
  }

  /**
   * 解析json文件数据
   * @param {string} name 模块名称
   * @returns {Object} 返回JSON对象
   */
  syncJSON(name) {
    const src = this.getFileSrc(name, 'json');
    if (!SyncMe.isFileExist(src)) return;
    const content = SyncMe.readFile(src);
    return content && JSON.parse(content);
  }

  /**
   * 编译模块主js文件
   * @param {string} name 模块名称
   */
  async syncJS(name, index) {
    const src = this.getFileSrc(name, 'js');
    if (!SyncMe.isFileExist(src)) return;
    const dist = this.getFileDist(index, 'js');
    this.checkDir('js');
    const cmd = `rollup ${src} -f cjs -o ${dist}`;
    await SyncMe.exec(cmd);
    return this.fixRltDist(dist);
  }

  /**
   * 编译模块less文件
   * @param {string} name 模块名称
   */
  async syncLess(name, index) {
    const src = this.getFileSrc(name, 'less');
    if (!SyncMe.isFileExist(src)) return;
    this.checkDir('css');
    const dist = this.getFileDist(index, 'css');
    const cmd = `lessc ${src} ${dist}`;
    await SyncMe.exec(cmd);
    return this.fixRltDist(dist);
  }

  /**
   * 编译模块css文件
   * @param {string} name 模块名称
   */
  syncCss(name, index) {
    const src = this.getFileSrc(name, 'css');
    if (!SyncMe.isFileExist(src)) return;
    const dist = this.getFileDist(index, 'css');
    this.checkDir('css');
    writeFileSync(dist, src);
    return this.fixRltDist(dist);
  }

  /**
   * 编译模块html文件
   * @param {string} name 模块名称
   * @param {Array} jsList 模块js编译路径列表
   * @param {Array} cssList 模块css编译路径列表
   */
  syncHTML(name, index, jsList = [], cssList = []) {
    const src = this.getFileSrc(name, 'html');
    if (!SyncMe.isFileExist(src)) return;
    this.checkDir('html');
    const dist = this.getFileDist(index, 'html');
    const content = SyncMe.readFile(src);
    const $ = cheeiro.load(content);

    jsList.forEach(js => {
      if (!js) return;
      const child = $('<script></script>');
      child.attr('src', this.fixRltDist(js));
      child.attr('type', 'text/javascript');
      $('head').append(child);
    });

    cssList.forEach(css => {
      if (!css) return;
      const child = $('<link />');
      child.attr('type', 'text/css');
      child.attr('rel', 'stylesheet');
      child.attr('href', this.fixRltDist(css));
      $('head').append(child);
    });

    writeFileSync(dist, $.html());
    return this.fixRltDist(dist);
  }

  /**
   * 编译图标
   */
  syncIcons() {
    const { input, output } = this.options;
    const sizes = [16, 48, 128];
    let icons = null;
    sizes.forEach(size => {
      const src = input + `/icons/${size}.ico`;
      if (!SyncMe.isFileExist(src)) return;
      if (!icons) {
        icons = {};
        mkdirSync(output + '/icons');
      }
      const iconPath = `/icons/${size}.${SyncMe.getUUID()}.ico`;
      copyFileSync(src, output + iconPath);
      icons[size] = '.' + iconPath;
    });
    return icons;
  }

  /**
   * 编译主配置文件
   */
  syncManifest() {
    const { output } = this.options;
    writeFileSync(output + '/manifest.json', JSON.stringify(this.manifest));
  }

  /**
   * 获取模块文件源路径
   * @param {string} name 模块名称
   * @param {string} suffix 文件名后缀
   */
  getFileSrc = (name, suffix) => path.resolve(this.options.input, `pages/${name}/${name}.${suffix}`);

  /**
   * 获取模块文件编译目标路径
   * @param {string} name 模块名称
   * @param {string} suffix 文件名后缀
   */
  getFileDist = (name, suffix) => path.resolve(this.options.output, `${suffix}/${name}.${SyncMe.getUUID()}.${suffix}`);

  /**
   * 检查编译目录，不存在则创建
   * @param {string} suffix 目录名称
   */
  checkDir = suffix => {
    const dir = this.options.output + '/' + suffix;
    existsSync(dir) || mkdirSync(dir);
  }

  /**
   * 根据编译文件的绝对路径来获取其相对路径
   * @param {string} path 绝对路径
   */
  fixRltDist(path) {
    return path.replace(this.options.output, '').replace(/\\/g, '/');
  }
}

const syncMe = new SyncMe();
syncMe.run();
