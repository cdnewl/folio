# Folio

**English** | [简体中文](README.zh-CN.md)

A small, fast Markdown reader & writer for Windows, built with Tauri 2.
Single portable `.exe` (~11 MB) — no installer, no runtime dependencies, no telemetry.

<p align="center">
  <img src="screenshots/home.png" width="49%" alt="Empty state: Folio wordmark with drop hint">
  <img src="screenshots/withContent.png" width="49%" alt="Split mode: editing docs/showcase.md with live preview">
</p>

## Features

- **Three view modes** — Edit, Split (live preview side by side), Read
- **Multi-tab** — dirty-close confirmation, middle-click to close, overflow arrows + wheel scrolling
- **Drag & drop** — drop multiple files in, or multi-select via the open dialog
- **Faithful rendering** — markdown-it (`breaks: true`) + highlight.js + task lists, renders like other mainstream Markdown apps
- **Comfortable editing** — CodeMirror 6 with the One Dark theme
- **Thin Rust core** — zero custom Tauri commands; file access goes through the official `dialog` + `fs` plugins only

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file(s) |
| `Ctrl+S` | Save |
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+1` / `Ctrl+2` / `Ctrl+3` | Edit / Split / Read mode |

## Tech stack

Tauri 2 · React 19 · TypeScript · Vite · CodeMirror 6 · markdown-it · highlight.js

## Development

Prerequisites: Node.js, Rust (MSVC toolchain on Windows), WebView2 runtime.

```bash
npm install
npm run tauri dev      # dev mode
npm test               # Vitest unit tests
npm run tauri build    # release build → target/release/folio.exe
```

The icon is generated procedurally — see `assets/gen-icon.mjs` (zero dependencies,
renders `assets/icon-source.png`; regenerate the full icon set with `npx tauri icon assets/icon-source.png`).

## License

[Apache-2.0](LICENSE) © 2026 Xun
