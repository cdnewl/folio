import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";

describe("rendering contract: mainstream-camp parity", () => {
  it("single newline breaks the line (breaks: true)", () => {
    const html = renderMarkdown("line one\nline two");
    expect(html).toContain("line one<br>");
    expect(html).toContain("line two");
  });

  it("a blank line separates paragraphs", () => {
    const html = renderMarkdown("first\n\nsecond");
    expect(html).toBe("<p>first</p>\n<p>second</p>\n");
  });

  it("consecutive blank lines collapse — no visible empty blocks", () => {
    const html = renderMarkdown("a\n\n\n\n\nb");
    expect(html).toBe("<p>a</p>\n<p>b</p>\n");
    expect(html).not.toContain("&nbsp;");
  });

  it("renders headings, emphasis and links", () => {
    const html = renderMarkdown("# Title\n\n**bold** [x](https://a.b)");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://a.b"');
  });

  it("fenced code gets highlight.js markup for known languages", () => {
    const html = renderMarkdown("```js\nconst a = 1;\n```");
    expect(html).toContain("hljs");
  });

  it("unknown-language fences degrade gracefully", () => {
    const html = renderMarkdown("```nonsenselang\nfoo bar\n```");
    expect(html).toContain("foo bar");
  });

  it("blank lines inside a code fence are preserved verbatim", () => {
    const html = renderMarkdown("```\nfirst\n\n\nsecond\n```");
    expect(html).toContain("first\n\n\nsecond");
  });
});
