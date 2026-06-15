export function Marquee({ rect }: { rect: { x: number; y: number; w: number; h: number } | null }) {
  if (!rect) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-40 rounded-[3px] border border-accent-blue/80 bg-[oklch(0.62_0.19_256/0.10)]"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  );
}

export function Guides({ v, h, w, height }: { v: number[]; h: number[]; w: number; height: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
      {v.map((x, i) => (
        <div
          key={`v-${i}-${x}`}
          className="absolute top-0 h-full"
          style={{ left: x, width: 1, background: "var(--accent-blue)" }}
        />
      ))}
      {h.map((y, i) => (
        <div
          key={`h-${i}-${y}`}
          className="absolute left-0 w-full"
          style={{ top: y, height: 1, background: "var(--accent-blue)" }}
        />
      ))}
      {/* avoid unused warnings */}
      <span hidden>{w}{height}</span>
    </div>
  );
}
