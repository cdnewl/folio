# DECISIONS

Folio 裁决账本。时间线流水，append-only，新条目压底部。
格式：`yyyy-mm-dd hh:mm [issue|decision|defer] 内容`

---

2026-08-12 20:00 [decision] 技术栈定案：Tauri 2 + React 19 + TS + Vite。否决 Electron（Hearth 栈）——portable exe 10.86MB vs 100MB+，符合绿色软件审美；否决 WinUI3/WPF/Flutter/Qt——无对应积累且 Markdown 生态不如 Web 侧。WebView2 运行时 Win11 自带。

2026-08-12 20:00 [decision] Rust 侧零自定义命令：文件读写/对话框全走官方 tauri-plugin-dialog + tauri-plugin-fs，fs scope 放开 `**`（个人工具，需打开任意路径 md）。前端：CodeMirror 6（one-dark）编辑 + markdown-it + highlight.js 预览。

2026-08-12 20:10 [decision] 构建输出目录上挪：src-tauri/.cargo/config.toml 设 `target-dir = "../target"`，exe 落 `target\release\folio.exe`。`target/` 是 Cargo 硬性约定，不能再浅。

2026-08-12 20:30 [issue] 单回车预览不提行。根因：CommonMark 软换行折叠为空格（breaks:false）。修法：markdown-it `breaks: true`，对齐 Typora/Obsidian 阵营体感。

2026-08-12 21:00 [decision] 否决「多空行展开」方案（渲染前注入空段落让连续空行可见）。理由：用户裁决「Folio 必须和其他 md 软件打开后看着一致」——主流软件（Typora/Obsidian/GitHub）遇连续空行全折叠，展开了 Folio 反而成异类。结论：breaks:true + 多空行折叠 = 现状即一致态，渲染侧不再动。跨软件可见留白的唯一硬通货是显式 `<br>`，属书写习惯不归 Folio 管。

2026-08-12 21:00 [decision] 多 tab 落地（替代脏文件拦截确认方案）：tab 数组状态（每 tab 独立 filePath/content/脏状态）+ tab 条 UI + Ctrl+T/Ctrl+W；打开/拖入新文件优先开新 tab（原地加载仅限空白未命名 tab）；开重复文件切已有 tab；关脏 tab 弹系统确认框；最后一个 tab 关闭自动补空白 tab。原始丢内容路径彻底消除。

2026-08-12 21:20 [issue] 脏 tab 拖入文件被原地覆盖无警告（Open 按钮正常）。根因：拖放监听挂在空依赖 useEffect，闭包捕获首次渲染的 tabs 快照（stale closure），永远误判当前 tab 为空白。修法：监听改每次渲染重挂，与键盘监听同模式。详见 PITFALLS.md React-1。

2026-08-12 21:20 [issue] tab 条右侧出现上下箭头滚动 UI（WebView2 给 overflow-x:auto 画的滚动条）。修法：scrollbar-width:none + ::-webkit-scrollbar{display:none} 双保险。

2026-08-12 21:26 [defer] 关窗口不拦截脏 tab。触发条件：用户被咬过一次（关了窗口丢未保存内容）。修法方向：Rust 侧 on_close_requested 或前端 getCurrentWindow().onCloseRequested + 额外 window 权限。

2026-08-12 21:39 [decision] 多文件批量打开：Open 对话框 multiple:true + 拖放从「取第一个匹配」改「过滤全部匹配」。loadFile 升级 loadFiles：批量读取（单文件失败不阻塞其余，状态栏点名失败文件）→ 一次性计算 tab 数组（已开文件刷新内容并切 tab / 复用空白未命名 tab 仅限首个 / 其余开新 tab）→ 激活批量中的第一个文件。

2026-08-12 21:57 [decision] tab 溢出方案裁决：单排 + 溢出时才出现的左右箭头（‹ ›，scrollBy 240 平滑滚动）+ 悬停滚轮平移（VS Code/Chrome 流派肌肉记忆）+ 激活 tab 永远 scrollIntoView 自动进视野。否决换行方案：多行 tab 吃编辑区纵向空间，且换行瞬间整排重排毁位置记忆。tabbar 拆为 .tab-strip 容器（overflow 归它），箭头显隐由 scrollLeft/scrollWidth 状态驱动，ResizeObserver 跟窗宽变化。

2026-08-12 22:03 [issue] 点滚动箭头来回跳划不动。根因：scrollIntoView 挂无依赖 effect 每渲染都跑，与 scrollBy 对冲（详见 PITFALLS React-2）。修法：effect 挂 [active.id]，顺带修正声明顺序（active 需先于引用它的 effect）。另注意：当日 22:05 的 defer 条目时间戳早于本条修复完成时间，账本 append-only 不回头改，以本条为准。

2026-08-12 22:14 [decision] 测试策略定案：抽纯逻辑单测（Vitest，node 环境），React 渲染层与 Tauri API 交互不测（jsdom + mock 整个 Tauri 性价比低）。为此把 App.tsx 内联逻辑重构出两个纯模块：src/tabs.ts（mergeOpenedFiles/removeTab/baseName/isDirty/isDroppable，行为契约写进 docstring——脏确认是调用方职责）与 src/markdown.ts（markdown-it 实例单例 + 渲染契约注释）。37 测试全绿：tabs 30（路径解析/脏判定/拖放扩展名/合并六案/关闭五案）+ markdown 7（主流阵营渲染契约，含围栏内空行原样保留）。

2026-08-12 22:24 [decision] 滚动箭头芯片化：透明小灰字看不清 → 实底描边小按钮（mode-switch 同族）+ 字形加大加粗（17px/700）+ 常时淡蓝辉光、hover accent 点亮——与顶部霓虹灯带同一视觉语言。否决单纯加大（灰字再大也融背景）和换重字形 ❮❯（字体兼容性风险，加粗 ‹› 已够）。

2026-08-12 22:35 [decision] 光晕语言统一裁决：光是装饰元素的专利（顶部灯带），交互控件一律「hover 描边+文字点亮、零光晕」——按钮常亮在语义上是激活/警告，本不该有。撤掉滚动箭头的常时辉光与 hover 辉光（22:24 条目的加戏部分作废，芯片化保留）。同时修箭头垂直对齐：align-self:center 改 flex-end + margin-bottom:4px，与贴底的 tab 同基线。验证手段：临时 seed 14 tab 出一次性构建截图确认后还原（正经 exe 无此 seed）。

2026-08-12 22:40 [decision] 鼠标中键关 tab：onMouseDown 捕获 button===1 + preventDefault（挡浏览器自动滚动模式），走与 × 完全相同的 closeTab 路径——脏确认、相邻激活、末 tab 补空白全部自动继承，零新逻辑。

2026-08-12 22:05 [defer] 不可信 md 防护两件套：CSP 收束 + 渲染 HTML 消毒。现状：tauri.conf.json `csp: null`（无内容安全策略）+ markdown-it `html: true` + dangerouslySetInnerHTML——恶意 md 可用 `<img onerror=>` 类内联事件在窗口上下文执行 JS，叠加 fs scope `**` 形成口子。用户裁决：fs `**` 是编辑器天职不动，自用场景威胁模型不存在，维持现状。触发条件：打开「别人给的/网上下的」md 成为常态。修法方向：① csp 配 `script-src 'self'` 禁内联事件（需逐个源测 CodeMirror 内联样式兼容性，~半小时）；② DOMPurify 消毒或 `html: false` 直接禁原始 HTML。两条一起上，不分先后。
