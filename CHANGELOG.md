# Changelog

All notable changes to Folio are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Empty preview watermark: Folio wordmark + mini light strip + drop hint (the only in-app mention of drag & drop)
- Task list rendering via markdown-it-task-lists (disabled checkboxes, GitHub/Typora-style)

## [0.1.0] - 2026-08-18

Initial public release.

### Added

- Markdown reader & writer for Windows — single portable exe, no installer
- Three view modes: Edit / Split (live preview) / Read
- Multi-tab interface: dirty-close confirmation, middle-click close, overflow arrows + wheel scrolling
- Drag & drop of multiple files; multi-select open dialog
- Faithful rendering via markdown-it (`breaks: true`) + highlight.js
- CodeMirror 6 editor with One Dark theme
- Keyboard shortcuts: `Ctrl+O/S/T/W`, `Ctrl+1/2/3` mode switching
- Zero custom Tauri commands — file access only via official `dialog` + `fs` plugins
- Original procedurally-generated icon (`assets/gen-icon.mjs`)

[0.1.0]: https://github.com/cdnewl/folio/releases/tag/v0.1.0
