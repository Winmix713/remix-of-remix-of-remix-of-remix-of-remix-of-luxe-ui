import { useLayoutEffect, useRef, useState } from "react";
import { useScene } from "@/store/scene";
import { EffectedBox } from "./EffectedBox";
import { SelectionFrame } from "./SelectionFrame";
import { HUDBadge } from "./HUDBadge";
import { Marquee, Guides } from "./Marquee";
import { snapMove } from "@/lib/snap";

type Rect = { x: number; y: number; w: number; h: number };

export function Canvas() {
  const { layers, selectedId, selectedIds, selectLayer, setSelection } = useScene();
  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const [hud, setHud] = useState<{ x: number; y: number; label: string } | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const marqueeStateRef = useRef<{ startX: number; startY: number } | null>(null);

  useLayoutEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(() => {
      const r = stageRef.current?.getBoundingClientRect();
      if (r) setStageSize({ w: r.width, h: r.height });
    });
    ro.observe(stageRef.current);
    const r = stageRef.current.getBoundingClientRect();
    setStageSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  const onGesture = (next: Rect, label: string, gs?: { v: number[]; h: number[] }) => {
    setHud({ x: next.x + next.w / 2, y: next.y - 24, label });
    if (gs) setGuides(gs);
  };

  const endGesture = () => {
    setHud(null);
    setGuides({ v: [], h: [] });
  };

  const beginMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const sx = e.clientX - stageRect.left;
    const sy = e.clientY - stageRect.top;
    marqueeStateRef.current = { startX: sx, startY: sy };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setMarquee({ x: sx, y: sy, w: 0, h: 0 });
  };

  const updateMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    const m = marqueeStateRef.current;
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!m || !stageRect) return;
    const cx = e.clientX - stageRect.left;
    const cy = e.clientY - stageRect.top;
    const x = Math.min(m.startX, cx);
    const y = Math.min(m.startY, cy);
    const w = Math.abs(cx - m.startX);
    const h = Math.abs(cy - m.startY);
    setMarquee({ x, y, w, h });
  };

  const endMarquee = (e: React.PointerEvent<HTMLDivElement>) => {
    const m = marqueeStateRef.current;
    marqueeStateRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (!m) {
      setMarquee(null);
      return;
    }
    const cur = marquee;
    setMarquee(null);
    if (!cur || cur.w < 3 || cur.h < 3) {
      // Treat as background click → deselect (unless shift held to keep)
      if (!e.shiftKey) selectLayer(null);
      return;
    }
    const ids: string[] = [];
    for (const l of layers) {
      if (!l.visible) continue;
      const lx2 = l.x + l.w;
      const ly2 = l.y + l.h;
      const mx2 = cur.x + cur.w;
      const my2 = cur.y + cur.h;
      const intersects = !(lx2 < cur.x || l.x > mx2 || ly2 < cur.y || l.y > my2);
      if (intersects) ids.push(l.id);
    }
    if (e.shiftKey) setSelection(Array.from(new Set([...selectedIds, ...ids])));
    else setSelection(ids);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden rounded-[20px] border border-white/[0.08] bg-linear-to-b from-[var(--canvas-from)] to-[var(--canvas-to)] shadow-[inset_0_1px_0_oklch(1_0_0/0.06),0_30px_80px_-30px_oklch(0_0_0/0.6)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.62_0.19_256/0.10),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(oklch(1_0_0/0.6)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(oklch(1_0_0/0.03)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.03)_1px,transparent_1px)] [background-size:88px_88px]" />
        <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_0_0_1px_oklch(1_0_0/0.04)]" />
      </div>

      <div
        ref={stageRef}
        data-bg="true"
        className="relative h-full w-full"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg === "true") {
            beginMarquee(e);
          }
        }}
        onPointerMove={updateMarquee}
        onPointerUp={endMarquee}
        onPointerCancel={endMarquee}
      >
        {layers.map((l) => (
          <EffectedBox
            key={l.id}
            layer={l}
            selected={selectedIds.includes(l.id)}
            isPrimary={l.id === selectedId}
            onSelect={(additive) => selectLayer(l.id, additive)}
            onGesture={onGesture}
            onGestureEnd={endGesture}
            snap={(b) =>
              snapMove(
                b,
                layers.filter((o) => o.id !== l.id && !selectedIds.includes(o.id)),
                { w: stageSize.w, h: stageSize.h },
              )
            }
          />
        ))}
        {(guides.v.length > 0 || guides.h.length > 0) && (
          <Guides v={guides.v} h={guides.h} w={stageSize.w} height={stageSize.h} />
        )}
        {selected && <SelectionFrame layer={selected} onGesture={onGesture} onGestureEnd={endGesture} />}
        <Marquee rect={marquee} />
        {hud && <HUDBadge x={hud.x - 32} y={hud.y} label={hud.label} />}
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/[0.06] bg-black/30 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-muted-text backdrop-blur">
        artboard
      </div>
    </div>
  );
}


