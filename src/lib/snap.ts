import type { Layer } from "@/store/scene";

export type SnapGuides = { v: number[]; h: number[] };
export type SnapResult = { x: number; y: number; guides: SnapGuides };

const THRESHOLD = 4;

/**
 * Snap a moving box (x,y,w,h) to other layers' edges/centers and canvas center.
 * Returns adjusted x,y plus guide lines (canvas-space coordinates).
 */
export function snapMove(
  next: { x: number; y: number; w: number; h: number },
  others: Layer[],
  canvas: { w: number; h: number } | null,
): SnapResult {
  const guides: SnapGuides = { v: [], h: [] };
  let { x, y } = next;
  const left = x;
  const right = x + next.w;
  const cx = x + next.w / 2;
  const top = y;
  const bottom = y + next.h;
  const cy = y + next.h / 2;

  const vCandidates: number[] = [];
  const hCandidates: number[] = [];
  for (const o of others) {
    vCandidates.push(o.x, o.x + o.w, o.x + o.w / 2);
    hCandidates.push(o.y, o.y + o.h, o.y + o.h / 2);
  }
  if (canvas) {
    vCandidates.push(canvas.w / 2);
    hCandidates.push(canvas.h / 2);
  }

  // For each candidate edge of moving box (left/center/right), find closest target line
  const checkAxis = (val: number, targets: number[]) => {
    let best: { delta: number; line: number } | null = null;
    for (const t of targets) {
      const d = t - val;
      if (Math.abs(d) <= THRESHOLD && (!best || Math.abs(d) < Math.abs(best.delta))) {
        best = { delta: d, line: t };
      }
    }
    return best;
  };

  const xPicks: { delta: number; line: number }[] = [];
  for (const v of [
    { val: left, anchor: 0 },
    { val: cx, anchor: next.w / 2 },
    { val: right, anchor: next.w },
  ]) {
    const r = checkAxis(v.val, vCandidates);
    if (r) xPicks.push({ delta: r.delta, line: r.line });
  }
  if (xPicks.length) {
    const winner = xPicks.reduce((a, b) => (Math.abs(a.delta) <= Math.abs(b.delta) ? a : b));
    x = Math.round(x + winner.delta);
    // record all guides within threshold after snap
    const newLeft = x;
    const newCx = x + next.w / 2;
    const newRight = x + next.w;
    for (const t of vCandidates) {
      if (Math.abs(t - newLeft) < 0.5 || Math.abs(t - newCx) < 0.5 || Math.abs(t - newRight) < 0.5) {
        if (!guides.v.includes(t)) guides.v.push(t);
      }
    }
  }

  const yPicks: { delta: number; line: number }[] = [];
  for (const v of [
    { val: top, anchor: 0 },
    { val: cy, anchor: next.h / 2 },
    { val: bottom, anchor: next.h },
  ]) {
    const r = checkAxis(v.val, hCandidates);
    if (r) yPicks.push({ delta: r.delta, line: r.line });
  }
  if (yPicks.length) {
    const winner = yPicks.reduce((a, b) => (Math.abs(a.delta) <= Math.abs(b.delta) ? a : b));
    y = Math.round(y + winner.delta);
    const newTop = y;
    const newCy = y + next.h / 2;
    const newBottom = y + next.h;
    for (const t of hCandidates) {
      if (Math.abs(t - newTop) < 0.5 || Math.abs(t - newCy) < 0.5 || Math.abs(t - newBottom) < 0.5) {
        if (!guides.h.includes(t)) guides.h.push(t);
      }
    }
  }

  return { x, y, guides };
}
