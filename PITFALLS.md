# PITFALLS

Folio 踩坑档案。按领域分类，类内独立编号。新坑追加到对应分类底部。

---

## React

**React-1: useEffect 空依赖 + 事件回调用 state = stale closure 定时炸弹**
拖放/全局监听挂 `useEffect(..., [])` 时，回调闭包捕获的是首次渲染的 state 快照。Folio 实例：拖放判断「当前 tab 是否空白」永远读到初始值，导致脏 tab 被拖入文件原地覆盖。而渲染主路径上的按钮（Open）每次渲染都是新闭包所以正常——同一份逻辑两种行为，极难复现定位。
纪律：依赖当次 state 的事件监听，要么每次渲染重挂（省依赖数组，开销可忽略），要么用 ref 穿透。Folio 选前者（与键盘监听同模式）。

## Markdown / CommonMark

**MD-1: 软换行折叠**——单个 `\n` 在 CommonMark 里渲染为空格，不是换行。要 Typora 体感需 markdown-it `breaks: true`（单 `\n` → `<br>`）。注意两大阵营：软换行派（Typora/Obsidian 默认/GitHub 评论）vs 严格派（GitHub README 文件/VS Code 预览/Pandoc）。

**MD-2: 连续空行不产生可见高度**——空行是段落分隔符，空 N 行渲染结果相同。「回车第二三次没效果」不是 bug，是所有主流软件的一致行为。渲染侧注入空段落的「修复」会破坏与其他软件的一致性，已否决（DECISIONS 2026-08-12 21:00）。

## Tauri

**T-1: 拖放走原生事件，不是 HTML5 drop**——`getCurrentWebview().onDragDropEvent`，payload.type = enter/over/leave/drop，drop 时 payload.paths 给绝对路径数组。窗口 `dragDropEnabled` 默认 true。

**T-2: exe 文件名跟 Cargo package name 走，不跟 productName**——`--no-bundle` 模式下改 tauri.conf.json 的 productName 不改 exe 名；要 `folio.exe` 需改 Cargo.toml `[package] name`（lib name 和 main.rs 引用跟着改）。

**T-3: release 产物零伴生文件**——Rust 静态链接 + 前端资源内嵌，单 exe 即可运行；唯一运行时依赖是系统 WebView2。实测：裸目录拷贝 exe 启动正常。

**T-4: 构建输出目录可用 `src-tauri/.cargo/config.toml` 的 `[build] target-dir` 上挪**（相对 src-tauri 解析）。

## 环境（本机）

**ENV-1: 用户 npm 有 allow-scripts 策略**——esbuild postinstall 被拦只产生警告，不影响构建（esbuild 0.28 平台二进制走 optionalDependencies）。若将来某包因 postinstall 缺失真坏掉，跑 `npm approve-scripts <pkg>`。

**ENV-2: WebView2 的 overflow 滚动条带箭头按钮**——老派 Windows 滚动条样式会出现在 overflow:auto 的窄条上（tab 条中招），隐藏双保险：scrollbar-width:none + ::-webkit-scrollbar{display:none}。
