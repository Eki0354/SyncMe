/**
 * 异步dom加载执行模块
 * @param {string | Node} parentNode 父节点或其选择器
 * @param {string} childSelector 子节点选择器
 * @param {function} callback 异步加载回调
 * @param {object} config 监听配置项
 */
function syncLoad(parentNode = document, childSelector, callback, config = {}) {
  if (typeof parentNode === 'string') parentNode = document.querySelector(parentNode);

  if (!parentNode) throw new Error('无效的模块依赖节点！');
  if (!childSelector) throw new Error('无效的模块目标节点！');

  // 子节点选择器限域
  childSelector = ':scope ' + childSelector;

  const observeConfig = {
    attributes: false,
    childList: true,
    subtree: false,
    ...config
  };

  const observeCallback = function(mutations, observer) {
    const childNode = parentNode.querySelector(childSelector);

    if (!mutations.some(m => m === childNode)) return;

    callback(parentNode, childNode);
  }

  const observer = new MutationObserver(observeCallback);

  observer.observe(parentNode, observeConfig);
}

exports.syncLoad = syncLoad;

// 导出chrome extension API配置，方便代码自动完成
exports.chrome = {
  notification: {
    create
  }
}