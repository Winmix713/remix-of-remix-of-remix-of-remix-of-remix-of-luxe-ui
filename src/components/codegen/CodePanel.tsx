import { useEffect, useState } from "react";
import { codeToHtml } from "shiki/bundle/web";
import { useScene, selectSelectedLayer } from "@/store/scene";
import { layerToCss, layerToTailwind } from "@/lib/codegen";
import { SegmentedControl } from "@/components/controls/SegmentedControl";
import { IconButton } from "@/components/controls/IconButton";
import { Copy, Check } from "lucide-react";

const TABS = [
  { value: "css" as const, label: "CSS" },
  { value: "tw" as const, label: "Tailwind" },
];

export function CodePanel() {
  const layer = useScene(selectSelectedLayer);
  const [tab, setTab] = useState<"css" | "tw">("css");
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState<string>("");

  const code = layer ? (tab === "css" ? layerToCss(layer) : layerToTailwind(layer)) : "";

  useEffect(() => {
    let cancelled = false;
    if (!code) {
      setHtml("");
      return;
    }
    codeToHtml(code, { lang: tab === "css" ? "css" : "tsx", theme: "vesper" })
      .then((h) => {
        if (!cancelled) setHtml(h);
      })
      .catch(() => {
        if (!cancelled) setHtml(`<pre>${code.replace(/</g, "&lt;")}</pre>`);
      });
    return () => {
      cancelled = true;
    };
  }, [code, tab]);

  const panelStyle = {
    background: "var(--grad-panel)",
    boxShadow: "var(--shadow-panel)",
  } as const;

  if (!layer) {
    return (
      <div
        className="relative flex h-full items-center justify-center overflow-hidden rounded-[22px] text-[12px] text-muted-text backdrop-blur-2xl"
        style={panelStyle}
      >
        Select a layer to generate code.
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-[22px] backdrop-blur-2xl"
      style={panelStyle}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: "var(--sheen-top)" }} />
      <div className="relative flex items-center justify-between px-4 py-3">
        <SegmentedControl value={tab} onChange={setTab} options={TABS} size="sm" />
        <IconButton
          variant="chip"
          size="sm"
          icon={copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </IconButton>
      </div>
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-[oklch(1_0_0/0.08)] to-transparent" />
      <div
        className="flex-1 overflow-auto px-4 py-4 font-mono text-[11.5px] leading-relaxed [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
