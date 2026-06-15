import { useRef, type PointerEvent as RPointerEvent } from "react";
import type { SnapGuides } from "@/lib/snap";

export type GestureKind = "move" | "resize";
export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type Box = { x: number; y: number; w: number; h: number };

export type GestureStart = {
  kind: GestureKind;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  base: Box;
  shift: boolean;
  alt: boolean;
};

export type GestureUpdate = GestureStart & {
  next: Box;
  hud: string;
  guides?: SnapGuides;
};

type Opts = {
  onStart?: (g: GestureStart) => void;
  onMove: (g: GestureUpdate) => void;
  onEnd?: () => void;
  /** Optional snapping. Called only for `move`. Returns adjusted x,y + guides. */
  snap?: (next: Box) => { x: number; y: number; guides: SnapGuides };
};

const applyResize = (
  h: ResizeHandle,
  base: Box,
  dx: number,
  dy: number,
  shift: boolean,
  alt: boolean,
): Box => {
  let { x, y, w, h: hh } = base;
  const aspect = base.w / Math.max(1, base.h);
  let nw = w;
  let nh = hh;
  let nx = x;
  let ny = y;

  if (h.includes("e")) nw = Math.max(8, w + dx);
  if (h.includes("w")) {
    nw = Math.max(8, w - dx);
    nx = x + (w - nw);
  }
  if (h.includes("s")) nh = Math.max(8, hh + dy);
  if (h.includes("n")) {
    nh = Math.max(8, hh - dy);
    ny = y + (hh - nh);
  }

  if (shift) {
    if (Math.abs(nw / Math.max(1, w) - 1) > Math.abs(nh / Math.max(1, hh) - 1)) {
      const targetH = nw / aspect;
      if (h.includes("n")) ny = y + (hh - targetH);
      nh = targetH;
    } else {
      const targetW = nh * aspect;
      if (h.includes("w")) nx = x + (w - targetW);
      nw = targetW;
    }
  }

  if (alt) {
    nx = x + (w - nw) / 2;
    ny = y + (hh - nh) / 2;
  }

  return { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) };
};

export function useDragGesture(opts: Opts) {
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<GestureStart | null>(null);
  const lastRef = useRef<{ dx: number; dy: number; shift: boolean; alt: boolean } | null>(null);

  const flush = () => {
    rafRef.current = null;
    const s = stateRef.current;
    const last = lastRef.current;
    if (!s || !last) return;
    if (s.kind === "move") {
      let nx = Math.round(s.base.x + last.dx);
      let ny = Math.round(s.base.y + last.dy);
      let guides: SnapGuides | undefined;
      if (opts.snap) {
        const r = opts.snap({ x: nx, y: ny, w: s.base.w, h: s.base.h });
        nx = r.x;
        ny = r.y;
        guides = r.guides;
      }
      opts.onMove({
        ...s,
        shift: last.shift,
        alt: last.alt,
        next: { x: nx, y: ny, w: s.base.w, h: s.base.h },
        hud: `${nx}, ${ny}`,
        guides,
      });
    } else if (s.kind === "resize" && s.handle) {
      const next = applyResize(s.handle, s.base, last.dx, last.dy, last.shift, last.alt);
      opts.onMove({ ...s, shift: last.shift, alt: last.alt, next, hud: `${next.w} × ${next.h}` });
    }
  };

  const begin = (
    e: RPointerEvent,
    kind: GestureKind,
    base: Box,
    handle?: ResizeHandle,
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const start: GestureStart = {
      kind,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      base,
      shift: e.shiftKey,
      alt: e.altKey,
    };
    stateRef.current = start;
    lastRef.current = { dx: 0, dy: 0, shift: e.shiftKey, alt: e.altKey };
    opts.onStart?.(start);
  };

  const onPointerMove = (e: RPointerEvent) => {
    const s = stateRef.current;
    if (!s) return;
    lastRef.current = {
      dx: e.clientX - s.startX,
      dy: e.clientY - s.startY,
      shift: e.shiftKey,
      alt: e.altKey,
    };
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(flush);
  };

  const onPointerUp = (e: RPointerEvent) => {
    const wasActive = !!stateRef.current;
    if (stateRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    stateRef.current = null;
    lastRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (wasActive) opts.onEnd?.();
  };

  return { begin, onPointerMove, onPointerUp, active: () => stateRef.current != null };
}
