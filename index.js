const process = require('child_process');
const path = require('path');
const {
  statSync,
  rmSync,
  rmdirSync,
  mkdirSync,
  existsSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  appendFileSync,
  readdirSync,
  accessSync,
  constants
} = require('fs');

function exec(cmd) {
  return new Promise((resolve, reject) => {
    process.exec(cmd, function(error, stdout, stderr) {
      const err = error || stderr;
      if (err) return reject(err);
      resolve(stdout);
  });
  })
}

// 主程序函数
function syncMe() {
  let manifest = {};
  let pages = [];
  let commons = [];
  
  checkProjectDir();
  manifest = readManifest();
  removeDir('dist');
  syncIcons(manifest);
  syncModules(manifest);
  writeFileSync('dist/manifest.json', JSON.stringify(manifest));
}

function syncModules(manifest) {
  const modules = readdirSync('src/pages');
  modules.forEach(m => {
    const suffixes = ['json', 'js', 'less', 'css'];
    let module = {};
    let hasLess = false;
    const isBG = m === 'background';
    suffixes.forEach(async sfx => {
      const filePath = `src/pages/${m}/${m}.${sfx}`;
      if (!isFileExist(filePath)) {
        if (sfx !== 'js') return;
        throw new Error('未找到模块主代码文件：' + m);
      }
      const content = readFileSync(filePath, { encoding: 'utf-8' });
      if (sfx === 'json') {
        module = {...module, ...JSON.parse(content)};
      } else if (sfx === 'js') {
        const jsPath = `js/${m}.${getUUID()}.js`;
        if (!existsSync('dist/js')) mkdirSync('dist/js');
        const lines = content.split('\n');
        const fd = openSync('dist/' + jsPath, 'a');
        lines.forEach(async line => {
          if (!line || !line.startsWith('import')) return appendFileSync(fd, line + '\n');
          let childPath = line.match(/^import \'([^\']+)\'/)[1];
          if (!childPath.endsWith('.js')) childPath += '.js';
          childPath = path.resolve(__dirname, 'src/pages', m, childPath);
          const childContent = readFileSync(childPath, { encoding: 'utf-8' });
          appendFileSync(fd, childContent);
        });
        closeSync(fd);
        module[isBG ? 'scripts' : 'js'] = ['./' + jsPath];
      } else if (sfx === 'less') {
        hasLess = true;
        const lessPath = `src/pages/${m}/${m}.less`;
        const cssPath = `css/${m}.${getUUID()}.css`;
        const cmd = `lessc ${lessPath} dist/${cssPath}`;
        await exec(cmd);
        module.css = ['./' + cssPath];
      } else if (!hasLess && sfx === 'css') {
        const cssPath = `css/${m}.${getUUID()}.css`;
        if (!existsSync('dist/css')) mkdirSync('dist/css');
        writeFileSync('dist/' + cssPath, content);
        module.css = ['./' + cssPath];
      }
    });
    if (isBG) {
      manifest.background = module;
    } else {
      if (!manifest.content_scripts) manifest.content_scripts = [];
      manifest.content_scripts.push(module);
    }
  });
}

function syncIcons(manifest) {
  const sizes = [16, 48, 128];
  sizes.forEach(size => {
    const src = `src/icons/${size}.ico`;
    if (!isFileExist(src)) return;
    if (!manifest.icons) {
      manifest.icons = {};
      mkdirSync('dist/icons');
    }
    const iconPath = `icons/${size}.${getUUID()}.ico`;
    copyFileSync(src, 'dist/' + iconPath);
    manifest.icons[size] = './' + iconPath;
  })
}

// 检测项目入口文件夹
function checkProjectDir() {
  if (!existsSync('src')) throw new Error('未找到项目入口文件夹：src');
}

// 读取主配置文件
function readManifest() {
  const manifest = readFileSync('src/manifest.json', { encoding: 'utf-8' });
  return JSON.parse(manifest);
}

// 生成一个hash字符串
function getUUID() {
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
function isFileExist(path) {
  try {
    accessSync(path, constants.F_OK);
    return true;
  } catch (error) {
  }
}

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

syncMe();
