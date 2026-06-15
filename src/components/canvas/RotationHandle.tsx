import { useRef, type PointerEvent as RPointerEvent } from "react";
import type { Layer } from "@/store/scene";
import { useScene } from "@/store/scene";

const norm = (deg: number) => {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};

export function RotationHandle({
  layer,
  onGesture,
  onGestureEnd,
}: {
  layer: Layer;
  onGesture: (next: { x: number; y: number; w: number; h: number }, hud: string) => void;
  onGestureEnd: () => void;
}) {
  const { updateLayer, commitHistory } = useScene();
  const stateRef = useRef<{ cx: number; cy: number; startAngle: number; baseRot: number } | null>(null);

  const onDown = (e: RPointerEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const frame = el.parentElement as HTMLElement | null;
    if (!frame) return;
    commitHistory();
    const r = frame.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    stateRef.current = { cx, cy, startAngle, baseRot: layer.rotation };
  };

  const onMove = (e: RPointerEvent<HTMLSpanElement>) => {
    const s = stateRef.current;
    if (!s) return;
    const ang = Math.atan2(e.clientY - s.cy, e.clientX - s.cx) * (180 / Math.PI);
    let delta = ang - s.startAngle;
    let next = s.baseRot + delta;
    if (e.shiftKey) next = Math.round(next / 15) * 15;
    next = Math.round(norm(next));
    updateLayer(layer.id, { rotation: next });
    onGesture({ x: layer.x, y: layer.y, w: layer.w, h: layer.h }, `${next}°`);
  };

  const onUp = (e: RPointerEvent<HTMLSpanElement>) => {
    if (stateRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    stateRef.current = null;
    onGestureEnd();
  };

  return (
    <span
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="pointer-events-auto absolute left-1/2 -top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_1px_2px_oklch(0_0_0/0.6),inset_0_1px_0_oklch(1_0_0/0.4)]"
      style={{ cursor: "grab" }}
      aria-label="Rotate"
    />
  );
}
