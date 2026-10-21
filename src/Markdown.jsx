import React, { useMemo, useState } from "react";
import { marked } from "marked";
import katex from "katex";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";

const math = (text, displayMode) =>
  katex.renderToString(text, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    trust: false,
  });
marked.use({
  extensions: [
    {
      name: "blockMath",
      level: "block",
      start: (s) => s.indexOf("$$"),
      tokenizer(s) {
        const m = /^\$\$\s*\n?([\s\S]+?)\n?\$\$(?:\n|$)/.exec(s);
        if (m) return { type: "blockMath", raw: m[0], text: m[1] };
      },
      renderer(t) {
        return math(t.text, true);
      },
    },
    {
      name: "inlineMath",
      level: "inline",
      start: (s) => s.indexOf("$"),
      tokenizer(s) {
        const m = /^\$(?!\$)((?:\\.|[^$\n])+?)\$/.exec(s);
        if (m) return { type: "inlineMath", raw: m[0], text: m[1] };
      },
      renderer(t) {
        return math(t.text, false);
      },
    },
  ],
});
export function Markdown({ text = "", className = "" }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(text)), [text]);
  return (
    <div
      className={`prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
export function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="command">
      <code>{code}</code>
      <button
        aria-label="Copy command"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
