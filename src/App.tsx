import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import {
  open as openDialog,
  save as saveDialog,
  ask,
} from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import "highlight.js/styles/github-dark.css";
import "./App.css";

type Mode = "split" | "edit" | "read";

type Tab = {
  id: number;
  filePath: string | null;
  content: string;
  savedContent: string;
};

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch {
        /* fall through */
      }
    }
    return "";
  },
});

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd"] },
  { name: "All Files", extensions: ["*"] },
];

const DROPPABLE = /\.(md|markdown|mdown|mkd|txt)$/i;

function baseName(p: string): string {
  const norm = p.replace(/\\/g, "/");
  return norm.slice(norm.lastIndexOf("/") + 1);
}

const tabName = (t: Tab): string => (t.filePath ? baseName(t.filePath) : "untitled");
const isDirty = (t: Tab): boolean => t.content !== t.savedContent;

let tabSeq = 0;
const freshTab = (): Tab => ({
  id: ++tabSeq,
  filePath: null,
  content: "",
  savedContent: "",
});

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => [freshTab()]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("split");
  const [status, setStatus] = useState<string>("");
  const [dragging, setDragging] = useState<boolean>(false);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const dirty = isDirty(active);

  const previewHtml = useMemo(() => md.render(active.content), [active.content]);

  const flash = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(""), 2500);
  };

  const patchTab = (id: number, patch: Partial<Tab>) =>
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const newTab = () => {
    const t = freshTab();
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
  };

  const closeTab = async (id: number) => {
    const target = tabs.find((t) => t.id === id);
    if (!target) return;
    if (isDirty(target)) {
      const ok = await ask(
        `"${tabName(target)}" has unsaved changes. Close anyway?`,
        { title: "Folio", kind: "warning" }
      );
      if (!ok) return;
    }
    const next = tabs.filter((t) => t.id !== id);
    if (next.length === 0) {
      const nt = freshTab();
      setTabs([nt]);
      setActiveId(nt.id);
      return;
    }
    setTabs(next);
    if (id === active.id) {
      const idx = tabs.findIndex((t) => t.id === id);
      setActiveId(next[Math.min(idx, next.length - 1)].id);
    }
  };

  const loadFile = async (path: string) => {
    try {
      const text = await readTextFile(path);
      const existing = tabs.find((t) => t.filePath === path);
      if (existing) {
        patchTab(existing.id, { content: text, savedContent: text });
        setActiveId(existing.id);
      } else if (active.filePath === null && active.content === "") {
        patchTab(active.id, { filePath: path, content: text, savedContent: text });
      } else {
        const nt: Tab = {
          id: ++tabSeq,
          filePath: path,
          content: text,
          savedContent: text,
        };
        setTabs((ts) => [...ts, nt]);
        setActiveId(nt.id);
      }
      flash(`Opened ${baseName(path)}`);
    } catch (e) {
      flash(`Open failed: ${String(e)}`);
    }
  };

  const openFile = async () => {
    const selected = await openDialog({ multiple: false, filters: MD_FILTERS });
    if (!selected || typeof selected !== "string") return;
    await loadFile(selected);
  };

  const saveFile = async () => {
    let path = active.filePath;
    if (!path) {
      const picked = await saveDialog({
        defaultPath: "untitled.md",
        filters: MD_FILTERS,
      });
      if (!picked) return;
      path = picked;
    }
    try {
      await writeTextFile(path, active.content);
      patchTab(active.id, { filePath: path, savedContent: active.content });
      flash(`Saved ${baseName(path)}`);
    } catch (e) {
      flash(`Save failed: ${String(e)}`);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    getCurrentWebview()
      .onDragDropEvent((event) => {
        const p = event.payload;
        if (p.type === "enter" || p.type === "over") {
          setDragging(true);
        } else if (p.type === "leave") {
          setDragging(false);
        } else if (p.type === "drop") {
          setDragging(false);
          const path = p.paths.find((x) => DROPPABLE.test(x));
          if (path) void loadFile(path);
          else flash("Drop a .md / .txt file");
        }
      })
      .then((u) => {
        if (cancelled) u();
        else unlisten = u;
      });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        void saveFile();
      } else if (k === "o") {
        e.preventDefault();
        void openFile();
      } else if (k === "t") {
        e.preventDefault();
        newTab();
      } else if (k === "w") {
        e.preventDefault();
        void closeTab(active.id);
      } else if (k === "1") setMode("edit");
      else if (k === "2") setMode("split");
      else if (k === "3") setMode("read");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const extensions = useMemo(
    () => [markdown({ base: markdownLanguage }), EditorView.lineWrapping],
    []
  );

  return (
    <div className={`app${dragging ? " dragging" : ""}`}>
      <div className="light-strip" />
      {dragging && <div className="drop-overlay">Drop to open</div>}
      <header className="toolbar">
        <span className="brand">Folio</span>
        <button onClick={() => void openFile()} title="Ctrl+O">
          Open
        </button>
        <button onClick={() => void saveFile()} title="Ctrl+S" disabled={!dirty}>
          Save
        </button>
        <span className="spacer" />
        <div className="mode-switch">
          <button
            className={mode === "edit" ? "active" : ""}
            onClick={() => setMode("edit")}
            title="Ctrl+1"
          >
            Edit
          </button>
          <button
            className={mode === "split" ? "active" : ""}
            onClick={() => setMode("split")}
            title="Ctrl+2"
          >
            Split
          </button>
          <button
            className={mode === "read" ? "active" : ""}
            onClick={() => setMode("read")}
            title="Ctrl+3"
          >
            Read
          </button>
        </div>
      </header>
      <nav className="tabbar">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`tab${t.id === active.id ? " active" : ""}`}
            onClick={() => setActiveId(t.id)}
            title={t.filePath ?? "unsaved"}
          >
            <span className="tab-name">{tabName(t)}</span>
            {isDirty(t) && <span className="dirty-dot" />}
            <button
              className="tab-close"
              title="Ctrl+W"
              onClick={(e) => {
                e.stopPropagation();
                void closeTab(t.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button className="tab-new" onClick={newTab} title="Ctrl+T">
          +
        </button>
      </nav>
      <main className={`panes mode-${mode}`}>
        {mode !== "read" && (
          <div className="pane editor-pane">
            <CodeMirror
              key={active.id}
              value={active.content}
              onChange={(v) => patchTab(active.id, { content: v })}
              extensions={extensions}
              theme={oneDark}
              placeholder="Start typing Markdown, or Ctrl+O to open a file…"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        )}
        {mode !== "edit" && (
          <div className="pane preview-pane">
            <article
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </main>
      <footer className="statusbar">
        <span>{status}</span>
        <span className="spacer" />
        <span>{active.content.length} chars</span>
      </footer>
    </div>
  );
}
