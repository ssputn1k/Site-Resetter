/**
 * Site Resetter - Popup 弹出层交互逻辑
 * 负责渲染当前站点信息、目标站点高亮提示、一键重置按钮交互，
 * 以及底部快捷键指引卡片的生命周期管理。
 *
 * @module popup
 */

// 发布前请务必将 DEBUG_MODE 改为 false
const DEBUG_MODE = false;

document.addEventListener('DOMContentLoaded', init);

/**
 * 当前活动标签页对象。
 * @type {chrome.tabs.Tab|null}
 */
let currentTab = null;

/**
 * Tooltip 延迟显示计时器 ID。
 * @type {number|null}
 */
let tooltipTimer = null;

/**
 * 当前指引卡片阶段：'stage1' | 'stage2'。
 * @type {string}
 */
let guideCardState = 'stage1';

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
// 初始化入口
// ========================================

/**
 * 插件启动初始化。
 * 绑定事件监听、初始化 Tooltip 与指引卡片、获取当前标签页信息。
 */
function init() {
  if (DEBUG_MODE) {
    chrome.storage.local.remove('hide_shortcut_guide');
  }

  const resetBtn = document.getElementById('reset-btn');

  resetBtn.addEventListener('click', handleReset);
  initTooltip(resetBtn);
  initGuideCard();
  getCurrentTab();
}

// ========================================
// 快捷键识别
// ========================================

/**
 * 根据操作系统类型返回正确的快捷键组合。
 * 调用 chrome.runtime.getPlatformInfo() 检测操作系统。
 *
 * @param {function(string): void} callback - 接收快捷键字符串的回调
 *    - Mac 系统：'⌘+⇧+E'
 *    - 其他系统：'Ctrl+Shift+E'
 */
function getShortcutKey(callback) {
  chrome.runtime.getPlatformInfo(function(info) {
    if (chrome.runtime.lastError) {
      callback('Ctrl+Shift+E');
      return;
    }
    if (info.os === 'mac') {
      callback('⌘+⇧+E');
    } else {
      callback('Ctrl+Shift+E');
    }
  });
}

// ========================================
// Tooltip 气泡悬浮提示
// ========================================

/**
 * 为重置按钮初始化 Tooltip 悬浮提示。
 * 鼠标悬停 0.5 秒后，在按钮上方显示操作系统对应的快捷键组合。
 * mouseleave 时清除计时器并隐藏气泡。
 *
 * @param {HTMLElement} btn - 重置按钮 DOM 元素
 */
function initTooltip(btn) {
  const tooltip = document.getElementById('reset-tooltip');

  btn.addEventListener('mouseenter', function() {
    if (btn.disabled) return;
    tooltipTimer = setTimeout(function() {
      getShortcutKey(function(key) {
        tooltip.textContent = '一键重置 ' + key;
        tooltip.style.opacity = '1';
      });
    }, 500);
  });

  btn.addEventListener('mouseleave', function() {
    clearTimeout(tooltipTimer);
    tooltip.style.opacity = '0';
  });
}

// ========================================
// 底部快捷键指引卡片
// ========================================

/**
 * 初始化底部快捷键指引卡片。
 * 检查 chrome.storage.local 中的 hide_shortcut_guide 标记，
 * 若用户已确认不再显示，则跳过渲染。
 */
function initGuideCard() {
  chrome.storage.local.get(['hide_shortcut_guide'], function(result) {
    if (chrome.runtime.lastError) {
      showReminderCard();
      return;
    }

    if (result.hide_shortcut_guide) {
      return;
    }

    showReminderCard();
  });

  document.getElementById('reminder-got-it').addEventListener('click', handleGotIt);
  document.getElementById('reminder-confirm').addEventListener('click', handleGuideConfirm);
}

/**
 * 显示指引卡片并设置初始内容。
 */
function showReminderCard() {
  const card = document.getElementById('reminder-card');
  const textEl = document.getElementById('reminder-text');
  card.style.display = 'block';
  textEl.textContent = '快捷键已上线！您可以随时通过悬停查看按钮。';
  guideCardState = 'stage1';
}

/**
 * 处理"我知道了"按钮点击。
 *
 * 执行渐隐渐现动画切换至第二阶段：
 *   1. 淡出 (200ms)：添加 .text-fading 类 + 禁用按钮
 *   2. 内容替换：更换文字、切换按钮
 *   3. 淡入 (200ms)：移除 .text-fading 类 + 恢复按钮
 */
function handleGotIt() {
  const textEl = document.getElementById('reminder-text');
  const gotItBtn = document.getElementById('reminder-got-it');
  const confirmBtn = document.getElementById('reminder-confirm');

  textEl.classList.add('text-fading');
  gotItBtn.disabled = true;
  confirmBtn.disabled = true;

  setTimeout(function() {
    textEl.textContent = '提醒卡片将不再显示。请确认您已了解如何查看快捷键。';
    textEl.classList.add('stage-two');
    gotItBtn.style.display = 'none';
    confirmBtn.style.display = '';

    textEl.classList.remove('text-fading');
    confirmBtn.classList.add('primary-highlight');
    confirmBtn.disabled = false;

    guideCardState = 'stage2';
  }, 200);
}

/**
 * 处理"确认"按钮点击（第二阶段）。
 *
 * 执行卡片收缩消失动画：
 *   1. 添加 .hidden-anim 类触发 CSS transition
 *   2. 通过 transitionend 事件 + 450ms 兜底定时器等待动画结束
 *   3. 存储永久隐藏标记到 chrome.storage.local
 *   4. 从 DOM 中移除卡片元素
 */
function handleGuideConfirm() {
  const card = document.getElementById('reminder-card');
  let resolved = false;

  card.classList.add('hidden-anim');

  function onAnimEnd() {
    if (resolved) return;
    resolved = true;
    chrome.storage.local.set({ hide_shortcut_guide: true }, function() {
      if (chrome.runtime.lastError) {
        console.error('[Site Resetter] storage 写入失败:', chrome.runtime.lastError.message);
      }
      card.remove();
    });
  }

  card.addEventListener('transitionend', function handler(e) {
    if (e.propertyName === 'max-height') {
      card.removeEventListener('transitionend', handler);
      onAnimEnd();
    }
  });

  setTimeout(function() {
    onAnimEnd();
  }, 450);
}

// ========================================
// 获取当前活动标签页 & 目标站点检测
// ========================================

/**
 * 获取当前活动标签页信息并更新 UI。
 *
 * - 显示站点 origin
 * - 若域名匹配 TARGET_SITES，显示高亮提示并添加 .youdao-detected 样式类
 */
function getCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || tabs.length === 0) {
      document.getElementById('site-url').textContent = '无活动标签页';
      return;
    }

    currentTab = tabs[0];

    const siteUrl = document.getElementById('site-url');
    const youdaoTip = document.getElementById('youdao-tip');

    if (currentTab && currentTab.url) {
      try {
        const url = new URL(currentTab.url);
        siteUrl.textContent = url.origin;

        const isTargetSite = TARGET_SITES.some(function(site) {
          return currentTab.url.includes(site);
        });

        if (isTargetSite) {
          youdaoTip.style.display = 'flex';
          document.body.classList.add('youdao-detected');
        }
      } catch (e) {
        siteUrl.textContent = '无法解析URL';
      }
    } else {
      siteUrl.textContent = '无活动标签页';
    }
  });
}

// ========================================
// 一键重置按钮核心逻辑
// ========================================

/**
 * 处理"一键重置"按钮点击事件。
 *
 * 执行流程：
 *   1. 提取当前站点 origin
 *   2. 按钮进入 loading 状态
 *   3. 调用 clearSiteData 清理数据
 *   4. 成功后显示 success 状态 1 秒
 *   5. 刷新标签页并关闭 Popup
 */
function handleReset() {
  if (!currentTab || !currentTab.url) {
    showError('无法获取当前标签页');
    return;
  }

  try {
    const url = new URL(currentTab.url);
    const origin = url.origin;

    setButtonState('loading');

    clearSiteData(origin, function(err) {
      if (err) {
        showError('清理失败: ' + err.message);
        setButtonState('default');
        return;
      }

      setButtonState('success');

      setTimeout(function() {
        chrome.tabs.reload(currentTab.id, function() {
          window.close();
        });
      }, 1000);
    });

  } catch (error) {
    if (chrome.runtime.lastError) {
      showError('清理失败: ' + chrome.runtime.lastError.message);
    } else {
      showError('清理失败: ' + error.message);
    }
    setButtonState('default');
  }
}

/**
 * 清理指定 origin 的网站数据。
 *
 * ## 核心原理
 *
 * 通过 `origins` 参数限定只清理指定源的数据。
 * Chrome 的 `browsingData` API 会根据 `origins` 数组进行过滤，
 * 只有匹配的源才会被清除，**其他网站数据完全不受影响**。
 *
 * @param {string} origin - 要清理的站点源（如 'https://fanyi.youdao.com'）
 * @param {function(Error|null): void} callback - 完成回调，err 为 null 表示成功
 */
function clearSiteData(origin, callback) {
  const removalOptions = {
    origins: [origin]
  };

  const dataTypes = {
    cache: true,
    cookies: true,
    localStorage: true,
    serviceWorkers: true,
    indexedDB: true
  };

  chrome.browsingData.remove(removalOptions, dataTypes, function() {
    if (chrome.runtime.lastError) {
      callback(new Error(chrome.runtime.lastError.message));
    } else {
      callback(null);
    }
  });
}

// ========================================
// UI 状态管理
// ========================================

/**
 * 设置重置按钮的显示状态。
 *
 * @param {'loading'|'success'|'default'} state - 按钮状态
 *   - 'loading'：显示转圈动画，按钮禁用
 *   - 'success'：显示"清理成功 ✅"，绿色背景
 *   - 'default'：恢复默认"一键重置"
 */
function setButtonState(state) {
  const btn = document.getElementById('reset-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');

  btn.classList.remove('loading', 'success');

  switch (state) {
    case 'loading':
      btn.disabled = true;
      btn.classList.add('loading');
      btnText.textContent = '清理中...';
      btnLoader.style.display = 'inline-block';
      break;
    case 'success':
      btn.classList.add('success');
      btnText.textContent = '清理成功 ✅';
      btnLoader.style.display = 'none';
      break;
    default:
      btn.disabled = false;
      btnText.textContent = '一键重置';
      btnLoader.style.display = 'none';
  }
}

/**
 * 在 Popup 底部显示错误提示信息，3 秒后自动消失。
 *
 * @param {string} message - 错误提示文案
 */
function showError(message) {
  const errorMsg = document.getElementById('error-msg');
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';

  setTimeout(function() {
    errorMsg.style.display = 'none';
  }, 3000);
}
