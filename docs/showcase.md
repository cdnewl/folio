# Folio Showcase

A **small**, *fast* Markdown reader & writer — ~~bloated~~ portable.

## Formatting

Text with **bold**, *italic*, ~~strikethrough~~, `inline code`, and a [link](https://github.com/cdnewl/folio).

- Unordered list item
- Another item
  - Nested item

1. Ordered one
2. Ordered two

- [x] Task done
- [ ] Task pending

> A blockquote — good things come in small, single-exe packages.

## Code

```ts
type Mode = "edit" | "split" | "read";

function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Table

| Shortcut | Action     |
| -------- | ---------- |
| `Ctrl+O` | Open file  |
| `Ctrl+S` | Save       |
| `Ctrl+2` | Split view |

---

*Rendered by markdown-it + highlight.js, exactly like your other Markdown apps.*
