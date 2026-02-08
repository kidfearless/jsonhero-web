import { useState, useCallback, useRef, useEffect } from "react";
import { CodeViewer } from "~/components/CodeViewer";
import { PreviewBox } from "../PreviewBox";
import { Title } from "~/components/Primitives/Title";

export type PreviewHtmlDocumentProps = {
  value: string;
};

export function PreviewHtmlDocument({ value }: PreviewHtmlDocumentProps) {
  const [view, setView] = useState<"rendered" | "source">("rendered");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleView = useCallback(() => {
    setView((v) => (v === "rendered" ? "source" : "rendered"));
  }, []);

  // Auto-resize iframe to fit its content
  const resizeIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (doc?.body) {
        const height = doc.documentElement.scrollHeight;
        iframe.style.height = `${Math.max(200, Math.min(height, 600))}px`;
      }
    } catch {
      // sandbox may block access in some cases
    }
  }, []);

  useEffect(() => {
    resizeIframe();
  }, [value, view]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Title className="text-slate-700 transition dark:text-slate-400">
          HTML Preview
        </Title>
        <button
          onClick={toggleView}
          className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
        >
          {view === "rendered" ? "View Source" : "View Rendered"}
        </button>
      </div>

      {view === "rendered" ? (
        <div className="block rounded-sm overflow-hidden bg-white">
          <iframe
            ref={iframeRef}
            srcDoc={value}
            sandbox="allow-same-origin"
            title="HTML Preview"
            onLoad={resizeIframe}
            className="w-full border-0 rounded-sm"
            style={{ height: "500px", background: "white" }}
          />
        </div>
      ) : (
        <CodeViewer code={formatHtml(value)} />
      )}
    </div>
  );
}

/**
 * Simple HTML formatter that adds basic indentation.
 * If the HTML is already formatted, returns it as-is.
 */
function formatHtml(html: string): string {
  // If the HTML already has newlines and indentation, return as-is
  if (/\n\s+</.test(html)) {
    return html.trim();
  }

  // Basic formatting: add newlines before and after tags
  let formatted = html
    .replace(/>\s*</g, ">\n<")
    .replace(/\n/g, "\n");

  // Simple indentation
  const lines = formatted.split("\n");
  let indent = 0;
  const result: string[] = [];
  const selfClosingOrVoid =
    /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|!doctype)/i;
  const closingTag = /^<\//;
  const openingTag = /^<[a-zA-Z]/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (closingTag.test(trimmedLine)) {
      indent = Math.max(0, indent - 1);
    }

    result.push("  ".repeat(indent) + trimmedLine);

    if (
      openingTag.test(trimmedLine) &&
      !selfClosingOrVoid.test(trimmedLine) &&
      !trimmedLine.includes("</")
    ) {
      indent += 1;
    }
  }

  return result.join("\n");
}
