import * as Popover from "@radix-ui/react-popover";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
const MAX_CHROMA = 0.37;

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

  const set = useCallback((p: Parsed) => onChange(fmtOklch(p)), [onChange]);
  const triggerLabel = value === "transparent"
    ? "Color: transparent"
    : isGradient ? "Color: gradient" : `Color: ${value}`;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label={triggerLabel}
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
          collisionPadding={12}
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
                background: "var(--grad-panel-popover)",
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
  const sat = clamp(parsed.c / MAX_CHROMA);
  const val = clamp(parsed.l);
  const hue = parsed.h;

  // Latest values for rAF coalesced drag updates (avoid stale closures)
  const parsedRef = useRef(parsed);
  parsedRef.current = parsed;

  const svRef = useRef<HTMLDivElement>(null);
  const svDrag = useRef(false);
  const svRaf = useRef<number | null>(null);
  const svPending = useRef<{ s: number; v: number } | null>(null);
  const flushSV = () => {
    svRaf.current = null;
    const p = svPending.current;
    if (!p) return;
    onParsedChange({ ...parsedRef.current, c: p.s * MAX_CHROMA, l: p.v });
    svPending.current = null;
  };
  const updateSV = (e: PointerEvent | React.PointerEvent) => {
    const el = svRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const s = clamp((e.clientX - r.left) / r.width);
    const v = clamp(1 - (e.clientY - r.top) / r.height);
    svPending.current = { s, v };
    if (svRaf.current == null) svRaf.current = requestAnimationFrame(flushSV);
  };

  const hueRef = useRef<HTMLDivElement>(null);
  const hueDrag = useRef(false);
  const hueRaf = useRef<number | null>(null);
  const huePending = useRef<number | null>(null);
  const flushHue = () => {
    hueRaf.current = null;
    if (huePending.current == null) return;
    onParsedChange({ ...parsedRef.current, h: huePending.current });
    huePending.current = null;
  };
  const updateHue = (e: PointerEvent | React.PointerEvent) => {
    const el = hueRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = clamp((e.clientX - r.left) / r.width);
    huePending.current = Math.round(t * 360);
    if (hueRaf.current == null) hueRaf.current = requestAnimationFrame(flushHue);
  };

  useEffect(() => () => {
    if (svRaf.current != null) cancelAnimationFrame(svRaf.current);
    if (hueRaf.current != null) cancelAnimationFrame(hueRaf.current);
  }, []);

  const randomize = () => {
    onParsedChange({
      l: clamp(Math.random() * 0.4 + 0.55),
      c: clamp(Math.random() * 0.5 + 0.5) * MAX_CHROMA,
      h: Math.floor(Math.random() * 361),
      a: parsed.a,
    });
  };

  const selectedPresetIndex = presetHues.findIndex((h) => Math.abs(h - hue) < 20);

  // Keyboard: SV pad (chroma + lightness)
  const onSVKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const big = e.shiftKey ? 0.1 : 0.01;
    let nc = parsed.c;
    let nl = parsed.l;
    switch (e.key) {
      case "ArrowLeft":  nc = clamp(parsed.c - big * MAX_CHROMA, 0, MAX_CHROMA); break;
      case "ArrowRight": nc = clamp(parsed.c + big * MAX_CHROMA, 0, MAX_CHROMA); break;
      case "ArrowUp":    nl = clamp(parsed.l + big); break;
      case "ArrowDown":  nl = clamp(parsed.l - big); break;
      case "Home":       nc = 0; nl = parsed.l; break;
      case "End":        nc = MAX_CHROMA; nl = parsed.l; break;
      default: return;
    }
    e.preventDefault();
    onParsedChange({ ...parsed, c: nc, l: nl });
  };

  // Keyboard: hue strip
  const onHueKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let nh = parsed.h;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown": nh = (parsed.h - step + 360) % 360; break;
      case "ArrowRight":
      case "ArrowUp":   nh = (parsed.h + step) % 360; break;
      case "Home":      nh = 0; break;
      case "End":       nh = 359; break;
      default: return;
    }
    e.preventDefault();
    onParsedChange({ ...parsed, h: Math.round(nh) });
  };

  return (
    <div
      className="relative w-[280px] max-w-[calc(100vw-24px)] rounded-2xl p-3 backdrop-blur-xl"
      style={{
        background: "var(--grad-panel-popover)",
        border: "1px solid var(--panel-border)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: "var(--sheen-section)" }} />

      {/* Preset hues */}
      <div className="mb-3 grid grid-cols-9 gap-1.5 px-0.5">
        {presetHues.map((h, i) => (
          <button
            key={h}
            type="button"
            aria-label={`Hue ${h}°`}
            aria-pressed={i === selectedPresetIndex}
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
        role="slider"
        tabIndex={0}
        aria-label="Saturation and lightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(val * 100)}
        aria-valuetext={`Chroma ${(sat * 100).toFixed(0)}%, lightness ${(val * 100).toFixed(0)}%`}
        onKeyDown={onSVKey}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); svDrag.current = true; updateSV(e); }}
        onPointerMove={(e) => { if (svDrag.current) updateSV(e); }}
        onPointerUp={(e) => { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} svDrag.current = false; if (svRaf.current != null) { cancelAnimationFrame(svRaf.current); svRaf.current = null; flushSV(); } }}
        className="relative h-[180px] w-full cursor-crosshair touch-none overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          backgroundColor: hueToOklch(hue),
          backgroundImage:
            "linear-gradient(180deg, transparent 0%, oklch(0 0 0) 100%), linear-gradient(90deg, oklch(1 0 0) 0%, transparent 100%)",
          boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.45), inset 0 1px 0 oklch(1 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.5)",
          touchAction: "none",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute h-4 w-4 rounded-full"
          style={{
            left: `calc(${sat} * (100% - 16px))`,
            top: `calc(${1 - val} * (100% - 16px))`,
            border: "2px solid oklch(1 0 0)",
            boxShadow: "var(--shadow-picker-thumb)",
          }}
        />
      </div>

      {/* Hue strip — full width matches SV pad */}
      <div
        ref={hueRef}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hue)}
        aria-valuetext={`${Math.round(hue)} degrees`}
        onKeyDown={onHueKey}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); hueDrag.current = true; updateHue(e); }}
        onPointerMove={(e) => { if (hueDrag.current) updateHue(e); }}
        onPointerUp={(e) => { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} hueDrag.current = false; if (hueRaf.current != null) { cancelAnimationFrame(hueRaf.current); hueRaf.current = null; flushHue(); } }}
        className="relative mt-3 h-[22px] w-full cursor-ew-resize touch-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.7 0.22 25), oklch(0.7 0.25 330), oklch(0.62 0.24 295), oklch(0.7 0.16 250), oklch(0.7 0.16 215), oklch(0.7 0.18 175), oklch(0.78 0.2 130), oklch(0.78 0.17 75), oklch(0.7 0.2 45), oklch(0.7 0.22 25))",
          boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.12), 0 1px 2px oklch(0 0 0 / 0.5)",
          touchAction: "none",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full"
          style={{
            left: `calc(${hue / 360} * (100% - 18px))`,
            background: hueToOklch(hue),
            border: "2px solid oklch(1 0 0)",
            boxShadow: "var(--shadow-picker-thumb)",
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
            aria-label="Color value"
            className="w-full min-w-0 bg-transparent font-mono text-[12px] tracking-tight text-white/85 outline-none"
          />
        </div>
        <button
          type="button"
          aria-label="Randomize color"
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
                aria-label={`Use recent color ${r}`}
                className="aspect-square w-full rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
