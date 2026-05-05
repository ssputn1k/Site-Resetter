# 🔄 Site Resetter

精准清除当前活动标签页的网站数据，一键重置网页访问状态。适用于重置各类网站的免费额度限制、功能试用等场景。

## ✨ 功能亮点

- **精准清理** — 通过 `origin` 参数限定作用域，仅清除当前站点数据，不影响其他网站
- **一键操作** — 点击按钮或按下快捷键 `Ctrl+Shift+E`（Mac: `⌘+⇧+E`）即刻执行
- **智能识别** — 自动检测有道翻译、百度翻译等目标站点，提供高亮提示
- **完整清理** — 同时清除 Cache、Cookie、LocalStorage、ServiceWorker、IndexedDB
- **自动刷新** — 清理完成后自动刷新标签页，即清即用
- **暗色模式** — 基于 `prefers-color-scheme` 媒体查询自动适配系统主题
- **轻量无依赖** — 纯原生 JavaScript + CSS，无第三方库

## 📦 安装步骤

### 本地开发环境

```bash
git clone https://github.com/yourusername/site-resetter.git
```

### Chrome 浏览器加载

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `site-resetter` 项目目录
5. 扩展图标出现在工具栏即可使用

## 🧭 使用指南

### 界面说明

| 区域 | 功能 |
|------|------|
| 当前站点 | 显示活动标签页的 origin 信息 |
| 高亮提示 | 访问目标站点时出现金色提示卡片 |
| 清理清单 | 展示将被清除的数据类型 |
| 一键重置按钮 | 悬停 0.5 秒显示快捷键提示 |
| 快捷键指引卡片 | 首次使用引导，确认后不再显示 |

### 操作流程

1. 访问需要重置的网站（如有道翻译、百度翻译等）
2. 点击工具栏的 Site Resetter 图标
3. 确认「当前站点」显示正确
4. 点击「一键重置」按钮，或直接按 `Ctrl+Shift+E`
5. 按钮短暂显示「清理中...」后变为「清理成功 ✅」
6. 标签页自动刷新，网站恢复到初始状态

### 清理的数据类型

| 类型 | 说明 |
|------|------|
| Cache | HTTP 缓存文件 |
| Cookies | 站点 Cookie（含 SameSite/Secure 属性） |
| LocalStorage | 本地存储数据 |
| Service Worker | Service Worker 注册信息 |
| IndexedDB | 客户端数据库 |

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| Manifest V3 | Chrome 扩展标准 |
| Service Worker | 后台快捷键监听与清理逻辑 |
| CSS Custom Properties | 主题系统（亮色/暗色模式） |
| Chrome Extensions API | browsingData、tabs、storage、commands、notifications |

## 🧱 项目结构

```
site-resetter/
├── manifest.json          # 扩展配置文件
├── background.js           # 后台 Service Worker（快捷键处理）
├── popup.html              # 弹出层界面
├── popup.css               # 样式表（含暗色模式支持）
├── popup.js                # 弹出层交互逻辑
├── icons/                  # 扩展图标（16x16 / 48x48 / 128x128）
├── .gitignore
└── README.md
```

## 🔧 自定义目标站点

编辑 `popup.js`（UI 检测）和 `background.js`（日志记录）中的 `TARGET_SITES` 数组：

```javascript
const TARGET_SITES = [
  'fanyi.youdao.com',
  'fanyi.baidu.com',
  'translate.google.com'  // 添加新站点
];
```

## 🤝 贡献指南

欢迎通过 Issue 和 Pull Request 参与贡献：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交代码：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

## ⚠️ 注意事项

- 请勿在浏览重要网页（如网银、后台管理系统）时使用，避免因清除 Cookie 导致重新登录
- 发布前请将 `popup.js` 中的 `DEBUG_MODE` 设置为 `false`
- 本扩展不会收集或上传任何用户数据，所有操作均在本地浏览器内完成

## 📄 许可证

MIT License
