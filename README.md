# PromptManager 浏览器扩展

PromptManager 是一个提示词管理扩展，支持分类、检索、编辑和复制，核心数据保存在本地 IndexedDB。已正式上架 **Edge 扩展商店**，也支持手动加载至 Chrome / Edge。

[![Edge Addons](https://img.shields.io/badge/Edge%20Addons-获取扩展-0078d7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/promptmanager/ehehpclbknnngaadilnpghdagmbgoadb)

## 快速安装（推荐）

如果你使用 **Edge 浏览器**，直接点击上方徽章或下方链接一键安装，后续无需任何操作：

[PromptManager - Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/promptmanager/ehehpclbknnngaadilnpghdagmbgoadb)

安装后点击浏览器工具栏的扩展图标即可打开侧边栏使用。

## 功能特性

- 提示词的新增、编辑、删除、复制
- `{{变量}}` 自动识别
- 分类创建、删除、筛选、计数
- 扩展弹窗风格 UI（暗色、高密度、可快速操作）
- 支持浏览器侧边栏打开（点击扩展图标）

## 技术栈

- React 18
- Vite 5
- TypeScript 5
- Dexie + IndexedDB
- lucide-react

## 项目结构

```text
public/
  manifest.json          # 打包到 dist 的扩展清单（MV3）
src/
  App.tsx                # 弹窗主界面
  db.ts                  # Dexie 数据层
  main.tsx               # React 入口
  index.css              # 扩展 UI 样式
```

## 自行构建（Chrome 使用 / 开发调试）

### 1) 安装依赖

```bash
npm install
```

### 2) 生成扩展产物

```bash
npm run build
```

或直接生成商店提交包：

```bash
npm run package:edge
```

构建后会生成：

- `dist/index.html`
- `dist/manifest.json`
- `dist/assets/*`

### 3) 在 Chrome/Edge 加载

1. 打开扩展页：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. 打开右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择项目的 `dist` 文件夹
5. 把 PromptManager 固定到工具栏，后续点图标即可打开侧边栏

提示：也可以用快捷键 `Ctrl+Shift+K` 打开扩展动作。

## 开发模式（仅调试时使用）

```bash
npm run dev
```

用于本地调 UI 和逻辑，不是日常使用入口。

## 数据模型

`src/db.ts` 中 `prompts` 表字段：

- `id?: number`
- `title: string`
- `content: string`
- `tags: string[]`
- `updatedAt: Date`

## 常见问题

### 删除时为什么没有系统确认框

这是有意设计：删除改为非阻断交互，使用右上角 Toast 反馈并支持“撤销”，避免视线被系统弹窗打断。

### 扩展加载后样式丢失

请确认加载的是 `dist` 目录，而不是项目根目录。

### 扩展图标点击后打不开

最常见原因是加载了项目根目录而不是 `dist`。请在扩展页删除旧版本后，重新“加载已解压扩展程序”并选择 `dist`。

### 无法设置侧边栏

请先重新构建并重载扩展，确保 `dist/manifest.json` 中包含 `side_panel` 与 `background.js`。

### 改完代码后扩展没变化

需要重新构建并在扩展页点击刷新：

```bash
npm run build
```

### 无法复制到剪贴板

请确认浏览器允许扩展写入剪贴板（`manifest` 中已声明 `clipboardWrite`）。

## 后续增强建议

- 分类重命名与拖拽排序
- 提示词 JSON 导入/导出
- 常用模板与一键变量填充
- 云同步（可选）

## 上架与开源准备（已提供）

- `LICENSE`（MIT）
- `PRIVACY.md`（隐私政策）
- `CHANGELOG.md`（版本变更）
- `CONTRIBUTING.md`（贡献指南）
- `SECURITY.md`（安全报告）
- `EDGE_STORE_CHECKLIST.md`（Edge 上架清单）
- `scripts/package-edge.ps1`（一键打包）
