import { describe, it, expect } from "vitest";
import {
  Tab,
  baseName,
  tabName,
  isDirty,
  isDroppable,
  mergeOpenedFiles,
  removeTab,
} from "../src/tabs";

let seq = 0;
const tab = (over: Partial<Tab> = {}): Tab => ({
  id: ++seq,
  filePath: null,
  content: "",
  savedContent: "",
  ...over,
});

describe("baseName", () => {
  it("extracts the name from a Windows path", () => {
    expect(baseName("C:\\Users\\xun\\docs\\note.md")).toBe("note.md");
  });
  it("extracts the name from a POSIX path", () => {
    expect(baseName("/home/xun/note.md")).toBe("note.md");
  });
  it("returns a bare filename unchanged", () => {
    expect(baseName("note.md")).toBe("note.md");
  });
  it("handles mixed separators", () => {
    expect(baseName("C:\\Users/xun\\note.md")).toBe("note.md");
  });
});

describe("tabName / isDirty", () => {
  it("names an unsaved tab 'untitled'", () => {
    expect(tabName(tab())).toBe("untitled");
  });
  it("names a file-backed tab by its basename", () => {
    expect(tabName(tab({ filePath: "C:\\a\\b.md" }))).toBe("b.md");
  });
  it("is clean when content matches savedContent", () => {
    expect(isDirty(tab({ content: "x", savedContent: "x" }))).toBe(false);
  });
  it("is dirty after an edit", () => {
    expect(isDirty(tab({ content: "xy", savedContent: "x" }))).toBe(true);
  });
});

describe("isDroppable", () => {
  it.each(["a.md", "a.MD", "a.markdown", "a.mdown", "a.mkd", "a.txt"])(
    "accepts %s",
    (p) => expect(isDroppable(p)).toBe(true)
  );
  it.each(["a.png", "a.pdf", "a.mdx", "a", "md"])("rejects %s", (p) =>
    expect(isDroppable(p)).toBe(false)
  );
});

describe("mergeOpenedFiles", () => {
  it("reuses the pristine untitled tab for the first file", () => {
    const t0 = tab();
    const r = mergeOpenedFiles([t0], [{ path: "C:\\a.md", text: "hello" }]);
    expect(r.tabs).toHaveLength(1);
    expect(r.tabs[0].id).toBe(t0.id);
    expect(r.tabs[0].filePath).toBe("C:\\a.md");
    expect(r.tabs[0].content).toBe("hello");
    expect(r.tabs[0].savedContent).toBe("hello");
    expect(r.activateId).toBe(t0.id);
  });

  it("appends a new tab when no pristine tab exists", () => {
    const t0 = tab({ filePath: "C:\\a.md", content: "a", savedContent: "a" });
    const r = mergeOpenedFiles([t0], [{ path: "C:\\b.md", text: "b" }]);
    expect(r.tabs).toHaveLength(2);
    expect(r.tabs[1].filePath).toBe("C:\\b.md");
    expect(r.activateId).toBe(r.tabs[1].id);
  });

  it("never overwrites a dirty untitled tab", () => {
    const t0 = tab({ content: "my precious draft" });
    const r = mergeOpenedFiles([t0], [{ path: "C:\\a.md", text: "a" }]);
    expect(r.tabs).toHaveLength(2);
    expect(r.tabs[0].content).toBe("my precious draft");
  });

  it("refreshes an already-open file in place instead of duplicating", () => {
    const t0 = tab({
      filePath: "C:\\a.md",
      content: "old",
      savedContent: "old",
    });
    const r = mergeOpenedFiles([t0], [{ path: "C:\\a.md", text: "new" }]);
    expect(r.tabs).toHaveLength(1);
    expect(r.tabs[0].content).toBe("new");
    expect(isDirty(r.tabs[0])).toBe(false);
    expect(r.activateId).toBe(t0.id);
  });

  it("batch: first file reuses pristine, rest append, first gets activated", () => {
    const t0 = tab();
    const r = mergeOpenedFiles(
      [t0],
      [
        { path: "C:\\a.md", text: "a" },
        { path: "C:\\b.md", text: "b" },
        { path: "C:\\c.md", text: "c" },
      ]
    );
    expect(r.tabs.map((t) => t.filePath)).toEqual([
      "C:\\a.md",
      "C:\\b.md",
      "C:\\c.md",
    ]);
    expect(r.activateId).toBe(t0.id);
  });

  it("batch: duplicate within the same batch opens only once", () => {
    const t0 = tab();
    const r = mergeOpenedFiles(
      [t0],
      [
        { path: "C:\\a.md", text: "1" },
        { path: "C:\\a.md", text: "2" },
      ]
    );
    expect(r.tabs).toHaveLength(1);
    expect(r.tabs[0].content).toBe("2");
  });
});

describe("removeTab", () => {
  it("closing a middle active tab activates the same-index neighbour", () => {
    const a = tab(), b = tab(), c = tab();
    const r = removeTab([a, b, c], b.id, b.id);
    expect(r.tabs.map((t) => t.id)).toEqual([a.id, c.id]);
    expect(r.activateId).toBe(c.id);
  });

  it("closing the last active tab activates the new last tab", () => {
    const a = tab(), b = tab(), c = tab();
    const r = removeTab([a, b, c], c.id, c.id);
    expect(r.activateId).toBe(b.id);
  });

  it("closing a non-active tab keeps the active id", () => {
    const a = tab(), b = tab(), c = tab();
    const r = removeTab([a, b, c], b.id, a.id);
    expect(r.tabs.map((t) => t.id)).toEqual([b.id, c.id]);
    expect(r.activateId).toBe(b.id);
  });

  it("closing the only tab spawns a fresh untitled tab (never zero tabs)", () => {
    const a = tab({ filePath: "C:\\a.md", content: "x", savedContent: "x" });
    const r = removeTab([a], a.id, a.id);
    expect(r.tabs).toHaveLength(1);
    expect(r.tabs[0].filePath).toBeNull();
    expect(r.tabs[0].id).not.toBe(a.id);
    expect(r.activateId).toBe(r.tabs[0].id);
  });

  it("removes dirty tabs without complaint (confirm is the caller's job)", () => {
    const a = tab({ content: "dirty", savedContent: "" });
    const r = removeTab([a], a.id, a.id);
    expect(r.tabs).toHaveLength(1);
    expect(r.tabs[0].id).not.toBe(a.id);
  });
});
