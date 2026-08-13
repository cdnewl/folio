# AGENTS

Folio — Windows Markdown 阅读/编辑器。Tauri 2 (Rust 壳) + React 19 + TS + Vite。
产物：`target\release\folio.exe`（单文件 portable，~11MB）。

## 新 session 先读这三个文件（本文件 + 下面两本账本）

| 文件 | 作用 | 维护规则 |
|---|---|---|
| `DECISIONS.md` | 裁决账本：时间线流水 | `yyyy-mm-dd hh:mm [issue\|decision\|defer]`，append-only 压底部 |
| `PITFALLS.md` | 踩坑档案：按领域分类 | 类内独立编号，新坑追加到对应分类底部 |

## 项目速览

- `src/App.tsx` — 整个 UI（多 tab 状态、CodeMirror 编辑器、markdown-it 预览、拖放、快捷键）
- `src/App.css` — One Dark 配色 + 霓虹灯带，全部样式
- `src-tauri/tauri.conf.json` — 窗口/打包配置（productName=Folio）
- `src-tauri/Cargo.toml` — package name = folio（决定 exe 名，见 PITFALLS T-2）
- `src-tauri/capabilities/default.json` — 权限：dialog + fs（scope `**`）
- Rust 侧零自定义命令，全走官方插件

## 常用命令

- 开发：`npm run tauri dev`（热更新）
- 出包：`npx tauri build --no-bundle`（portable exe，增量 ~50s）
- 前端检查：`npm run build`（tsc + vite）

## 行为基线（改动别破坏）

- 渲染对齐主流阵营：单回车换行（breaks:true），连续空行折叠——与其他 md 软件打开一致是硬约束
- 打开/拖入文件开新 tab，绝不原地覆盖非空白 tab
- 关脏 tab 必须弹确认
- 账本三件套随改动同步（裁决进 DECISIONS，坑进 PITFALLS）
