import { useEffect, useState } from "react";
import { useScene, type Scene } from "@/store/scene";
import { buildShareUrl } from "@/lib/share";
import { IconButton } from "@/components/controls/IconButton";
import { Save, Link2, Trash2, Check, Download } from "lucide-react";

const KEY = "pp:presets:v1";
type Preset = { name: string; scene: Scene; createdAt: number };

const readPresets = (): Preset[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};
const writePresets = (p: Preset[]) => localStorage.setItem(KEY, JSON.stringify(p));

const relTime = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function PresetsPanel() {
  const { layers, selectedId, loadScene } = useScene();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState("My preset");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPresets(readPresets());
  }, []);

  const save = () => {
    const next: Preset[] = [{ name: name.trim() || "Untitled", scene: { layers, selectedId }, createdAt: Date.now() }, ...presets].slice(0, 50);
    setPresets(next);
    writePresets(next);
  };
  const remove = (i: number) => {
    const next = presets.filter((_, idx) => idx !== i);
    setPresets(next);
    writePresets(next);
  };
  const load = (p: Preset) => loadScene(p.scene);
  const share = async () => {
    const url = buildShareUrl({ layers, selectedId });
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-[22px] p-4 backdrop-blur-2xl"
      style={{
        background: "var(--grad-panel)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: "var(--sheen-top)" }} />
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Preset name"
          className="h-9 min-w-0 flex-1 rounded-[8px] px-3 text-[12px] text-label-strong outline-none placeholder:text-muted-text"
          style={{ background: "var(--surface-input)", boxShadow: "var(--shadow-input-inset)" }}
        />
        <IconButton variant="primary" size="md" icon={<Save className="h-3.5 w-3.5" />} onClick={save}>
          Save
        </IconButton>
        <IconButton
          variant="chip"
          size="md"
          onClick={share}
          icon={copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Link2 className="h-3.5 w-3.5" />}
        >
          {copied ? "Copied" : "Share"}
        </IconButton>
      </div>
      <div
        className="flex-1 overflow-auto rounded-[14px]"
        style={{
          background: "var(--surface-section)",
          boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.04), inset 0 0 0 1px oklch(0 0 0 / 0.25)",
        }}
      >
        {presets.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-muted-text">
            No presets saved yet.
            <div className="mt-1 text-[10.5px]">Save the current scene to come back to it later.</div>
          </div>
        ) : (
          presets.map((p, i) => {
            const effectCount = p.scene.layers.reduce((n, l) => n + l.effects.length, 0);
            return (
              <div
                key={i}
                className="group flex h-11 items-center gap-2 border-b border-[oklch(1_0_0/0.05)] px-3 text-[12px] transition-colors hover:bg-white/[0.03] last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate text-label-strong">{p.name}</span>
                <span className="hidden font-mono text-[10px] text-muted-text sm:inline">{relTime(p.createdAt)}</span>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] text-muted-text"
                  style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid var(--hairline-soft)" }}
                >
                  {p.scene.layers.length}L · {effectCount}fx
                </span>
                <IconButton variant="chip" size="xs" onClick={() => load(p)} icon={<Download className="h-3 w-3" />}>
                  Load
                </IconButton>
                <IconButton variant="danger" size="xs" iconOnly onClick={() => remove(i)} icon={<Trash2 className="h-3.5 w-3.5" />} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
