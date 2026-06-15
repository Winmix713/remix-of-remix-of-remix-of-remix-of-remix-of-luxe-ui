import * as Popover from "@radix-ui/react-popover";
import { useEffect, useMemo, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  allowGradient?: boolean;
};

type Parsed = { l: number; c: number; h: number; a: number };

const parseOklch = (v: string): Parsed | null => {
  const m = v.trim().match(/^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)$/i);
  if (!m) return null;
  return { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]), a: m[4] ? parseFloat(m[4]) : 1 };
};
const fmtOklch = (p: Parsed) => {
  const a = p.a >= 1 ? "" : ` / ${p.a.toFixed(2)}`;
  return `oklch(${p.l.toFixed(3)} ${p.c.toFixed(3)} ${p.h.toFixed(0)}${a})`;
};
const hueToOklch = (h: number) => `oklch(0.72 0.2 ${h})`;
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const presetHues = [25, 330, 295, 175, 215, 165, 130, 75, 45];

const RECENT_KEY = "pp:recent-colors:v1";
const readRecent = (): string[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
};
const writeRecent = (c: string) => {
  if (typeof window === "undefined") return;
  const cur = readRecent().filter((x) => x !== c);
  localStorage.setItem(RECENT_KEY, JSON.stringify([c, ...cur].slice(0, 12)));
};

export function ColorField({ value, onChange, className, allowGradient = true }: Props) {
  const isGradient = value.includes("gradient(");
  const parsed = useMemo(() => parseOklch(value), [value]);
  const [text, setText] = useState(value);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setText(value), [value]);
  useEffect(() => setRecent(readRecent()), []);

  const set = (p: Parsed) => onChange(fmtOklch(p));

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "group relative flex h-9 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left outline-none transition-colors duration-[var(--dur-120)] hover:bg-[oklch(0_0_0/0.55)] focus-visible:bg-[oklch(0_0_0/0.6)]",
            className,
          )}
          style={{
            background: "var(--surface-input)",
            boxShadow: "var(--shadow-input-inset)",
          }}
        >
          <span
            aria-hidden
            className="relative h-5 w-5 shrink-0 overflow-hidden rounded-[6px]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, oklch(1 0 0 / 0.15) 25%, transparent 25%), linear-gradient(-45deg, oklch(1 0 0 / 0.15) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, oklch(1 0 0 / 0.15) 75%), linear-gradient(-45deg, transparent 75%, oklch(1 0 0 / 0.15) 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
              boxShadow: "var(--shadow-swatch)",
            }}
          >
            <span className="absolute inset-0" style={{ background: value === "transparent" ? "transparent" : value }} />
          </span>
          <span className="flex-1 truncate font-mono text-[11.5px] tabular-nums text-label-strong">
            {value === "transparent" ? "transparent" : isGradient ? "gradient" : parsed ? fmtOklch(parsed) : value}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          align="end"
          className="z-50 w-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {parsed ? (
            <ColorPickerCard
              parsed={parsed}
              onParsedChange={set}
              text={text}
              setText={setText}
              commitText={() => {
                onChange(text);
                writeRecent(text);
                setRecent(readRecent());
              }}
              recent={recent}
              onRecent={(r) => { onChange(r); setText(r); }}
            />
          ) : (
            <div
              className="w-[280px] rounded-2xl p-3 backdrop-blur-xl"
              style={{
                background: "linear-gradient(180deg, oklch(0.235 0.014 262 / 0.88) 0%, oklch(0.17 0.012 262 / 0.88) 100%)",
                border: "1px solid var(--panel-border)",
                boxShadow: "var(--shadow-panel)",
              }}
            >
              <div className="mb-2 text-[11px] text-muted-text">
                {isGradient && allowGradient ? "Gradient — edit raw value below." : "Custom — edit raw below."}
              </div>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => { onChange(text); writeRecent(text); setRecent(readRecent()); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                className="h-9 w-full rounded-[8px] px-2.5 font-mono text-[12px] text-label-strong outline-none"
                style={{ background: "var(--surface-input)", boxShadow: "var(--shadow-input-inset)" }}
              />
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* -------------------- ColorPickerCard -------------------- */

function ColorPickerCard({
  parsed,
  onParsedChange,
  text,
  setText,
  commitText,
  recent,
  onRecent,
}: {
  parsed: Parsed;
  onParsedChange: (p: Parsed) => void;
  text: string;
  setText: (s: string) => void;
  commitText: () => void;
  recent: string[];
  onRecent: (r: string) => void;
}) {
  // Map oklch L/C → 2D pad; H → hue strip
  const sat = clamp(parsed.c / 0.37);
  const val = clamp(parsed.l);
  const hue = parsed.h;

  const svRef = useRef<HTMLDivElement>(null);
  const svDrag = useRef(false);
  const updateSV = (e: PointerEvent | React.PointerEvent) => {
    const el = svRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const s = clamp((e.clientX - r.left) / r.width);
    const v = clamp(1 - (e.clientY - r.top) / r.height);
    onParsedChange({ ...parsed, c: s * 0.37, l: v });
  };

  const hueRef = useRef<HTMLDivElement>(null);
  const hueDrag = useRef(false);
  const updateHue = (e: PointerEvent | React.PointerEvent) => {
    const el = hueRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = clamp((e.clientX - r.left) / r.width);
    onParsedChange({ ...parsed, h: Math.round(t * 360) });
  };

  const randomize = () => {
    onParsedChange({
      l: clamp(Math.random() * 0.4 + 0.55),
      c: clamp(Math.random() * 0.5 + 0.5) * 0.37,
      h: Math.floor(Math.random() * 361),
      a: parsed.a,
    });
  };

  const selectedPresetIndex = presetHues.findIndex((h) => Math.abs(h - hue) < 20);

  return (
    <div
      className="relative w-[280px] rounded-2xl p-3 backdrop-blur-xl"
      style={{
        background: "linear-gradient(180deg, oklch(0.235 0.014 262 / 0.88) 0%, oklch(0.17 0.012 262 / 0.88) 100%)",
        border: "1px solid var(--panel-border)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.18), transparent)" }} />

      {/* Preset hues */}
      <div className="mb-3 grid grid-cols-9 gap-1.5 px-0.5">
        {presetHues.map((h, i) => (
          <button
            key={h}
            type="button"
            aria-label={`Hue ${h}°`}
            onClick={() => onParsedChange({ ...parsed, h })}
            className="relative inline-block aspect-square w-full rounded-full transition-transform duration-100 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{
              background: hueToOklch(h),
              boxShadow:
                i === selectedPresetIndex
                  ? "0 0 0 1.5px oklch(1 0 0 / 0.95), 0 0 0 3px oklch(0 0 0 / 0.4), 0 0 10px oklch(0.78 0.17 75 / 0.5)"
                  : "inset 0 1px 0 oklch(1 0 0 / 0.3), inset 0 -1px 0 oklch(0 0 0 / 0.3), 0 1px 1.5px oklch(0 0 0 / 0.5)",
            }}
          />
        ))}
      </div>

      {/* SV pad */}
      <div
        ref={svRef}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); svDrag.current = true; updateSV(e); }}
        onPointerMove={(e) => { if (svDrag.current) updateSV(e); }}
        onPointerUp={(e) => { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} svDrag.current = false; }}
        className="relative h-[180px] w-full cursor-crosshair overflow-hidden rounded-xl"
        style={{
          backgroundColor: hueToOklch(hue),
          backgroundImage:
            "linear-gradient(180deg, transparent 0%, oklch(0 0 0) 100%), linear-gradient(90deg, oklch(1 0 0) 0%, transparent 100%)",
          boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.45), inset 0 1px 0 oklch(1 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.5)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${sat * 100}%`,
            top: `${(1 - val) * 100}%`,
            border: "2px solid oklch(1 0 0)",
            boxShadow: "0 0 0 1px oklch(0 0 0 / 0.55), 0 2px 6px oklch(0 0 0 / 0.6)",
          }}
        />
      </div>

      {/* Hue strip — full width matches SV pad */}
      <div
        ref={hueRef}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); hueDrag.current = true; updateHue(e); }}
        onPointerMove={(e) => { if (hueDrag.current) updateHue(e); }}
        onPointerUp={(e) => { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} hueDrag.current = false; }}
        className="relative mt-3 h-[22px] w-full cursor-ew-resize rounded-full"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.7 0.22 25), oklch(0.7 0.25 330), oklch(0.62 0.24 295), oklch(0.7 0.16 250), oklch(0.7 0.16 215), oklch(0.7 0.18 175), oklch(0.78 0.2 130), oklch(0.78 0.17 75), oklch(0.7 0.2 45), oklch(0.7 0.22 25))",
          boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.12), 0 1px 2px oklch(0 0 0 / 0.5)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${(hue / 360) * 100}%`,
            background: hueToOklch(hue),
            border: "2px solid oklch(1 0 0)",
            boxShadow: "0 0 0 1px oklch(0 0 0 / 0.55), 0 2px 6px oklch(0 0 0 / 0.55)",
          }}
        />
      </div>

      {/* Raw / hex input + randomize */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{ background: "var(--surface-input)", boxShadow: "var(--shadow-input-inset)" }}
        >
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full"
            style={{
              background: fmtOklch(parsed),
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.35), inset 0 -1px 0 oklch(0 0 0 / 0.35), 0 0 0 1px oklch(0 0 0 / 0.5)",
            }}
          />
          <input
            type="text"
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-full min-w-0 bg-transparent font-mono text-[12px] tracking-tight text-white/85 outline-none"
          />
        </div>
        <button
          type="button"
          aria-label="Randomize"
          onClick={randomize}
          className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            background: "var(--surface-chip)",
            border: "1px solid var(--panel-border)",
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.5)",
          }}
        >
          <Shuffle className="h-3.5 w-3.5 text-white/70" strokeWidth={2.25} />
        </button>
      </div>

      {recent.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-text">Recent</div>
          <div className="grid grid-cols-9 gap-1.5">
            {recent.map((r, i) => (
              <button
                key={i}
                onClick={() => onRecent(r)}
                className="aspect-square w-full rounded-[6px]"
                style={{ background: r, boxShadow: "var(--shadow-swatch)" }}
                title={r}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
