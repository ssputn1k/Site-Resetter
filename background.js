/**
 * Site Resetter - 后台服务工作线程 (Service Worker)
 * 负责监听全局快捷键命令并执行一键重置操作。
 *
 * 核心流程：
 *   快捷键触发 → 获取活动标签页 → 提取 origin → 清理数据 → 刷新标签页 → 通知反馈
 *
 * @module background
 */

/**
 * 目标站点配置数组。
 * 当用户访问这些站点时，Popup 界面会显示高亮提示。
 * 可根据需要添加新站点域名。
 * @constant {string[]}
 */
const TARGET_SITES = [
  'fanyi.youdao.com',
  'fanyi.baidu.com'
];

// ========================================
// 快捷键命令监听
// ========================================

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'reset-site') {
    handleShortcutReset();
  }
});

// ========================================
// 快捷键触发的入口函数
// ========================================

/**
 * 处理快捷键触发的一键重置操作。
 * 获取当前活动标签页后调用 resetSite 执行清理。
 *
 * @async
 * @returns {Promise<void>}
 */
async function handleShortcutReset() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      console.error('[Site Resetter] 获取标签页失败: 未找到活动标签页');
      return;
    }

    await resetSite(tabs[0]);

  } catch (error) {
    console.error('[Site Resetter] 快捷键处理异常:', error);
  }
}

// ========================================
// 统一清理函数 - resetSite(tab)
// ========================================

/**
 * 对指定标签页执行"单网站精准清理"操作。
 *
 * ## 核心原理
 *
 * 通过 `new URL(tab.url).origin` 提取当前站点的源（origin），
 * 然后将该 origin 传入 `chrome.browsingData.remove` 的 `origins` 参数。
 * `origins` 参数是一个字符串数组，Chrome 会根据传入的源列表
 * **仅清理这些指定源的数据**，绝不会影响其他网站的数据。
 *
 * ## 清理的数据类型
 *
 * - `cache`：HTTP 缓存
 * - `cookies`：Cookie（包括 SameSite / Secure 属性的 cookie）
 * - `localStorage`：本地存储
 * - `serviceWorkers`：Service Worker 注册信息
 * - `indexedDB`：IndexedDB 数据库
 *
 * ## 执行流程
 *
 * 1. 验证标签页 URL 有效性（仅处理 http/https）
 * 2. 提取 origin 并调用 browsingData.remove
 * 3. 清理成功后自动刷新标签页
 * 4. 通过 Chrome 通知告知用户操作结果
 *
 * @async
 * @param {chrome.tabs.Tab} tab - 当前活动标签页对象
 * @returns {Promise<void>}
 */
async function resetSite(tab) {
  if (!tab || !tab.url) {
    console.error('[Site Resetter] 无效的标签页或 URL');
    return;
  }

  if (!tab.url.startsWith('http')) {
    return;
  }

  try {
    const url = new URL(tab.url);
    const origin = url.origin;

    const removalOptions = { origins: [origin] };

    const dataTypes = {
      cache: true,
      cookies: true,
      localStorage: true,
      serviceWorkers: true,
      indexedDB: true
    };

    await new Promise(function(resolve, reject) {
      chrome.browsingData.remove(removalOptions, dataTypes, function() {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });

    await chrome.tabs.reload(tab.id);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Site Resetter',
      message: '已成功清理并刷新: ' + origin
    });

  } catch (error) {
    console.error('[Site Resetter] 重置操作失败:', error.message);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Site Resetter - 清理失败',
      message: '清理过程中发生错误: ' + error.message
    });
  }
}
