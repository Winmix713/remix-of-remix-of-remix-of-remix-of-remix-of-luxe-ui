import { useScene, type Layer } from "@/store/scene";
import { useDragGesture, type ResizeHandle } from "./useDragGesture";
import { RotationHandle } from "./RotationHandle";

const HANDLES: { h: ResizeHandle; cls: string; cursor: string }[] = [
  { h: "nw", cls: "-left-1 -top-1", cursor: "nwse-resize" },
  { h: "n", cls: "left-1/2 -top-1 -translate-x-1/2", cursor: "ns-resize" },
  { h: "ne", cls: "-right-1 -top-1", cursor: "nesw-resize" },
  { h: "e", cls: "-right-1 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { h: "se", cls: "-right-1 -bottom-1", cursor: "nwse-resize" },
  { h: "s", cls: "left-1/2 -bottom-1 -translate-x-1/2", cursor: "ns-resize" },
  { h: "sw", cls: "-left-1 -bottom-1", cursor: "nesw-resize" },
  { h: "w", cls: "-left-1 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

export function SelectionFrame({
  layer,
  onGesture,
  onGestureEnd,
}: {
  layer: Layer;
  onGesture: (next: { x: number; y: number; w: number; h: number }, hud: string) => void;
  onGestureEnd: () => void;
}) {
  const { updateLayer, commitHistory } = useScene();
  const gesture = useDragGesture({
    onStart: () => commitHistory(),
    onMove: (g) => {
      updateLayer(layer.id, g.next);
      onGesture(g.next, g.hud);
    },
    onEnd: () => {
      onGestureEnd();
    },
  });

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.w,
        height: layer.h,
        transform: `rotate(${layer.rotation}deg)`,
      }}
    >
      <div
        className="absolute -inset-px rounded-[inherit] border border-accent-blue shadow-[0_0_0_1px_oklch(1_0_0/0.05)_inset]"
        style={{ borderRadius: layer.radius }}
      />
      {layer.locked ? null : (
        <>
          <RotationHandle layer={layer} onGesture={onGesture} onGestureEnd={onGestureEnd} />
          {HANDLES.map((h) => (
            <span
              key={h.h}
              onPointerDown={(e) =>
                gesture.begin(e, "resize", { x: layer.x, y: layer.y, w: layer.w, h: layer.h }, h.h)
              }
              onPointerMove={gesture.onPointerMove}
              onPointerUp={gesture.onPointerUp}
              onPointerCancel={gesture.onPointerUp}
              className={`pointer-events-auto absolute h-2 w-2 rounded-[2px] bg-white shadow-[0_1px_2px_oklch(0_0_0/0.6),inset_0_1px_0_oklch(1_0_0/0.4)] ${h.cls}`}
              style={{ cursor: h.cursor }}
            />
          ))}
        </>
      )}
    </div>
  );
}
