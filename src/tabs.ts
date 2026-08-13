export type Tab = {
  id: number;
  filePath: string | null;
  content: string;
  savedContent: string;
};

export type OpenedFile = { path: string; text: string };

let tabSeq = 0;

export const freshTab = (): Tab => ({
  id: ++tabSeq,
  filePath: null,
  content: "",
  savedContent: "",
});

export function baseName(p: string): string {
  const norm = p.replace(/\\/g, "/");
  return norm.slice(norm.lastIndexOf("/") + 1);
}

export const tabName = (t: Tab): string =>
  t.filePath ? baseName(t.filePath) : "untitled";

export const isDirty = (t: Tab): boolean => t.content !== t.savedContent;

const DROPPABLE = /\.(md|markdown|mdown|mkd|txt)$/i;
export const isDroppable = (p: string): boolean => DROPPABLE.test(p);

const isPristine = (t: Tab): boolean => t.filePath === null && t.content === "";

/**
 * Merge freshly-read files into the tab list.
 * - already-open path -> refresh content in place, no duplicate tab
 * - first non-existing file may reuse a pristine untitled tab (at most one)
 * - everything else -> appended as a new tab
 * - activateId points at the first file of the batch
 */
export function mergeOpenedFiles(
  tabs: Tab[],
  loaded: OpenedFile[]
): { tabs: Tab[]; activateId: number | null } {
  const next = [...tabs];
  let firstId: number | null = null;
  for (const { path, text } of loaded) {
    const existingIdx = next.findIndex((t) => t.filePath === path);
    if (existingIdx >= 0) {
      next[existingIdx] = {
        ...next[existingIdx],
        content: text,
        savedContent: text,
      };
      firstId ??= next[existingIdx].id;
      continue;
    }
    const pristineIdx = next.findIndex(isPristine);
    if (pristineIdx >= 0) {
      next[pristineIdx] = {
        ...next[pristineIdx],
        filePath: path,
        content: text,
        savedContent: text,
      };
      firstId ??= next[pristineIdx].id;
    } else {
      const nt: Tab = { id: ++tabSeq, filePath: path, content: text, savedContent: text };
      next.push(nt);
      firstId ??= nt.id;
    }
  }
  return { tabs: next, activateId: firstId };
}

/**
 * Remove a tab. Closing the last tab spawns a fresh untitled one (never zero
 * tabs). Closing the active tab activates the neighbour at the same index
 * (or the new last tab). Dirty-confirm is UI policy and lives in the caller.
 */
export function removeTab(
  tabs: Tab[],
  activeId: number,
  id: number
): { tabs: Tab[]; activateId: number } {
  const next = tabs.filter((t) => t.id !== id);
  if (next.length === 0) {
    const nt = freshTab();
    return { tabs: [nt], activateId: nt.id };
  }
  if (id !== activeId) return { tabs: next, activateId: activeId };
  const idx = tabs.findIndex((t) => t.id === id);
  return {
    tabs: next,
    activateId: next[Math.min(idx, next.length - 1)].id,
  };
}
