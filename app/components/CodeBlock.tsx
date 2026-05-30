"use client";

import { Highlight, themes } from "prism-react-renderer";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langMap: Record<string, string> = {
    py: "python", js: "javascript", ts: "typescript",
    jsx: "jsx", tsx: "tsx", html: "html", css: "css",
    java: "java", cpp: "cpp", c: "c", cs: "csharp",
    rb: "ruby", go: "go", rs: "rust", sh: "bash",
    bash: "bash", sql: "sql", json: "json", "": "python",
  };
  const lang = langMap[language.toLowerCase()] ?? language.toLowerCase() ?? "python";

  return (
    <div style={{ margin: "10px 0", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      <div style={{ background: "#1a1a2e", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(124,58,237,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
          </div>
          <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" as const }}>
            {lang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? "rgba(6,214,160,0.15)" : "rgba(124,58,237,0.15)",
            border: `1px solid ${copied ? "rgba(6,214,160,0.4)" : "rgba(124,58,237,0.3)"}`,
            color: copied ? "#06d6a0" : "#a78bfa",
            fontSize: 11, cursor: "pointer", fontFamily: "monospace",
            padding: "3px 10px", borderRadius: 6, letterSpacing: 1,
            transition: "all 0.2s",
          }}
        >
          {copied ? "✓ COPIED" : "⧉ COPY"}
        </button>
      </div>

      <Highlight theme={themes.nightOwl} code={code.trim()} language={lang as Parameters<typeof Highlight>[0]["language"]}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              margin: 0,
              padding: "16px",
              overflowX: "auto",
              fontSize: 13,
              lineHeight: 1.7,
              background: "#011627",
              fontFamily: "Consolas, monospace",
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} style={{ display: "flex" }}>
                <span style={{ userSelect: "none" as const, minWidth: 28, color: "rgba(255,255,255,0.2)", fontSize: 11, paddingRight: 16, textAlign: "right" as const, flexShrink: 0 }}>
                  {i + 1}
                </span>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}