# PromotHero.AI — Copilot 使用指南 (精简)

简短定位：这是一个基于 React + Vite 的轻量浏览器扩展/工具，用于管理和编辑 AI 提示词（Prompts）。主要实现文件在 `src/`，核心交互在 `src/App.tsx`。

核心架构（快速理解）：
- 前端：React + TypeScript，入口为 `src/main.tsx`，页面主要在 `src/App.tsx`。
- 存储：IndexedDB（通过 Dexie），表名为 `prompts`，schema/实例在 `src/db.ts`（若为空则需实现）。
- UI：Tailwind CSS + `lucide-react` 图标（在 `src/App.tsx` 可见）。

关键项目约定与可复用模式：
- 变量语法：在提示词内容中使用 `{{name}}` 定义变量；识别正则见 `src/App.tsx`（示例：`editContent.match(/\{\{(.*?)\}\}/g)`）。
- 实时视图：通过 `useLiveQuery`（来自 `dexie-react-hooks`）观察 `db.prompts`，实现搜索与列表自动更新（位于 `src/App.tsx`）。
- CRUD：对 `db.prompts` 使用 `add`, `get`, `update`, `delete` 等方法。任何变更需同步修改 `src/db.ts` 的表结构。

必须安装的依赖（从源码 import 可以推断）：
- `dexie`, `dexie-react-hooks`, `lucide-react`。当前 `package.json` 仅含 React/Vite，运行前请确认并安装缺失依赖：

```bash
npm install dexie dexie-react-hooks lucide-react
```

运行命令（来自 `package.json`）：
- 开发：`npm run dev`  — 启动 Vite 开发服务器
- 打包：`npm run build` — 先运行 `tsc` 再 `vite build`
- 预览构建：`npm run preview`

可查文件示例（快速定位）：
- 主界面与逻辑： `src/App.tsx`（变量识别、搜索、保存/删除、复制）
- 数据层： `src/db.ts`（Dexie schema；如果为空，代理需实现 prompts 表）
- 扩展接入点： `src/content.ts`（目前空，未来放 content script）

注意事项与建议（只记录可被代码确认的事实）：
- UI 文案以中文为主（比如“未命名提示词”，“确定删除吗？”），新字符串请保持中文风格一致性。
- `manifest.json` 目前为空：若打包为浏览器扩展，需在 `manifest.json` 中添加 `permissions`（如 clipboard、storage 等）并配置 Content Scripts / background。
- 若 `src/db.ts` 为空：实现 Dexie schema 时确保 `prompts` 至少包含 `id`, `title`, `content`, `tags[]`, `updatedAt` 字段以兼容现有逻辑。

如何帮助你快速上手（给 AI 代理的可执行动作清单）：
1. 检查并安装缺失依赖（见上）。
2. 打开 `src/db.ts`，实现 Dexie 实例与 `prompts` 表（示例字段参照上文）。
3. 用 `npm run dev` 启动并在浏览器中打开 Vite 提供的页面，验证 `src/App.tsx` 的列表/保存/变量识别功能。

如果需要，我可以：
- 自动补全 `src/db.ts` 的 Dexie 实现示例。
- 根据目标浏览器（Chrome/Edge/Firefox）生成一个基础 `manifest.json`。

反馈请求：请确认是否要我继续（1）补全 `src/db.ts` 的 Dexie 实现，或（2）生成基础 `manifest.json` 模板以便做扩展打包。