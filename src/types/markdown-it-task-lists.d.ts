// No bundled types, no @types package exists (npm 404) — minimal ambient declaration.
declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  interface TaskListsOptions {
    enabled?: boolean;
    label?: boolean;
    lineNumber?: boolean;
  }
  export default function taskLists(md: MarkdownIt, options?: TaskListsOptions): void;
}
