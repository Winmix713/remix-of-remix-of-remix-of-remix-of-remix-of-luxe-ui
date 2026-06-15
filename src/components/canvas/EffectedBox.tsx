import type { Layer } from "@/store/scene";
import { fillStyle, glassStyle, layerInnerStyle, layerOuterStyle, noiseStyle, textureStyle } from "@/lib/effects";
import { useDragGesture, type Box } from "./useDragGesture";
import { useScene } from "@/store/scene";
import { useRef } from "react";

export function EffectedBox({
  layer,
  selected,
  isPrimary,
  onSelect,
  onGesture,
  onGestureEnd,
  snap,
}: {
  layer: Layer;
  selected: boolean;
  isPrimary: boolean;
  onSelect: (additive: boolean) => void;
  onGesture: (next: Box, hud: string, guides?: { v: number[]; h: number[] }) => void;
  onGestureEnd: () => void;
  snap?: (b: Box) => { x: number; y: number; guides: { v: number[]; h: number[] } };
}) {
  const { updateLayer, translateSelected, commitHistory, selectedIds, layers } = useScene();
  const basePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const gesture = useDragGesture({
    onStart: () => {
      commitHistory();
      basePositionsRef.current = {};
      for (const id of selectedIds.includes(layer.id) ? selectedIds : [layer.id]) {
        const l = layers.find((x) => x.id === id);
        if (l) basePositionsRef.current[id] = { x: l.x, y: l.y };
      }
    },
    onMove: (g) => {
      const ids = Object.keys(basePositionsRef.current);
      if (ids.length > 1) {
        const baseSelf = basePositionsRef.current[layer.id];
        const absDx = g.next.x - baseSelf.x;
        const absDy = g.next.y - baseSelf.y;
        translateSelected(absDx, absDy, basePositionsRef.current);
        onGesture(g.next, g.hud, g.guides);
      } else {
        updateLayer(layer.id, g.next);
        onGesture(g.next, g.hud, g.guides);
      }
    },
    onEnd: () => {
      onGestureEnd();
    },
    snap,
  });

  if (!layer.visible) return null;
  const outer = layerOuterStyle(layer);
  const inner = layerInnerStyle(layer);
  const glass = glassStyle(layer);
  const fill = fillStyle(layer);
  const noise = noiseStyle(layer);
  const texture = textureStyle(layer);
  const isText = layer.type === "text";
  const dark = layer.mode === "dark" || (layer.mode === "auto" && isText ? true : !isText);
  const textColor = dark ? "oklch(0.98 0.005 260)" : "oklch(0.18 0.014 262)";


  return (
    <div
      data-layer-id={layer.id}
      style={outer}
      onPointerDown={(e) => {
        if (layer.locked) {
          e.stopPropagation();
          onSelect(e.shiftKey);
          return;
        }
        onSelect(e.shiftKey);
        gesture.begin(e, "move", { x: layer.x, y: layer.y, w: layer.w, h: layer.h });
      }}
      onPointerMove={gesture.onPointerMove}
      onPointerUp={gesture.onPointerUp}
      onPointerCancel={gesture.onPointerUp}
      className="cursor-grab outline-none active:cursor-grabbing"
    >
      <div style={inner}>
        {!isText && <div style={fill} />}
        {glass && <div style={glass} />}
        {noise && <div style={noise} />}
        {texture && <div style={texture} />}
        <div
          className="relative flex h-full w-full items-center justify-center text-center"
          style={{
            padding: `${layer.padding[0]}px ${layer.padding[1]}px ${layer.padding[2]}px ${layer.padding[3]}px`,
            gap: layer.gap,
            color: textColor,
            fontWeight: isText ? 600 : 500,
            fontSize: isText ? 28 : 14,
            letterSpacing: isText ? "-0.02em" : "0",
            textShadow: isText ? "0 1px 2px oklch(0 0 0 / 0.4)" : undefined,
          }}
        >
          {layer.text}
        </div>
      </div>
      {selected && !isPrimary && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px"
          style={{ borderRadius: layer.radius, boxShadow: "0 0 0 1px var(--accent-blue)" }}
        />
      )}
    </div>
  );
}
