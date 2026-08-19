import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";

/**
 * Rendering contract (DECISIONS 2026-08-12): match the mainstream camp —
 * single newline breaks (breaks: true), consecutive blank lines collapse.
 * Raw HTML is passed through (html: true) — sanitization is deferred until
 * opening untrusted files becomes routine.
 */
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

md.use(taskLists); // read-only preview: checkboxes stay disabled, matching GitHub/Typora

export const renderMarkdown = (src: string): string => md.render(src);
