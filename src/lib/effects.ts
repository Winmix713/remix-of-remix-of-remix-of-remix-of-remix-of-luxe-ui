import type { CSSProperties } from "react";
import type { DropShadow, Effect, InnerShadow, Layer } from "@/store/scene";

export const noiseDataUrl = (frequency: number, opacity: number) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='${opacity}'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

export const textureDataUrl = (frequency: number, scale: number, opacity: number) => {
  // Correct filter chain: turbulence -> displace SourceGraphic by it.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>
    <defs>
      <filter id='t' x='0%' y='0%' width='100%' height='100%'>
        <feTurbulence type='turbulence' baseFrequency='${frequency}' numOctaves='3' seed='4' result='turb'/>
        <feDisplacementMap in='SourceGraphic' in2='turb' scale='${scale}'/>
      </filter>
      <pattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'>
        <rect width='40' height='40' fill='white'/>
        <circle cx='20' cy='20' r='1.2' fill='oklch(0 0 0 / 0.35)'/>
      </pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#p)' filter='url(#t)' opacity='${opacity}'/>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

export const buildBoxShadow = (effects: Effect[]) => {
  const parts: string[] = [];
  for (const e of effects) {
    if (!e.enabled) continue;
    if (e.kind === "dropShadow") {
      const d = e as DropShadow;
      parts.push(`${d.x}px ${d.y}px ${d.blur}px ${d.spread}px ${d.color}`);
    } else if (e.kind === "innerShadow") {
      const i = e as InnerShadow;
      parts.push(`inset ${i.x}px ${i.y}px ${i.blur}px ${i.spread}px ${i.color}`);
    }
  }
  return parts.length ? parts.join(", ") : undefined;
};

export const buildDropShadowOnly = (effects: Effect[]) => {
  const parts: string[] = [];
  for (const e of effects) {
    if (!e.enabled || e.kind !== "dropShadow") continue;
    const d = e as DropShadow;
    parts.push(`${d.x}px ${d.y}px ${d.blur}px ${d.spread}px ${d.color}`);
  }
  return parts.length ? parts.join(", ") : undefined;
};

export const buildInnerShadowOnly = (effects: Effect[]) => {
  const parts: string[] = [];
  for (const e of effects) {
    if (!e.enabled || e.kind !== "innerShadow") continue;
    const i = e as InnerShadow;
    parts.push(`inset ${i.x}px ${i.y}px ${i.blur}px ${i.spread}px ${i.color}`);
  }
  return parts.length ? parts.join(", ") : undefined;
};

/**
 * Outer wrapper: positions, rotation, opacity, drop-shadow only.
 * Drop shadows are placed here so they survive a layer-blur applied to the
 * inner content host (filter:blur on the same node would clip box-shadow).
 */
export const layerOuterStyle = (l: Layer): CSSProperties => {
  return {
    position: "absolute",
    left: l.x,
    top: l.y,
    width: l.w,
    height: l.h,
    transform: `rotate(${l.rotation}deg)`,
    opacity: l.opacity,
    borderRadius: l.radius,
    boxShadow: buildDropShadowOnly(l.effects),
  };
};

/** Inner content host: holds layer-blur + inner-shadow + clipping for ::after stacks. */
export const layerInnerStyle = (l: Layer): CSSProperties => {
  const layerBlur = l.effects.find((e) => e.kind === "layerBlur" && e.enabled) as { radius: number } | undefined;
  return {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    overflow: "hidden",
    filter: layerBlur && layerBlur.radius > 0 ? `blur(${layerBlur.radius}px)` : undefined,
    boxShadow: buildInnerShadowOnly(l.effects),
  };
};

export const glassStyle = (l: Layer): CSSProperties | null => {
  const g = l.effects.find((e) => e.kind === "glass" && e.enabled) as { radius: number; saturate: number; tint: string } | undefined;
  if (!g) return null;
  return {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    backdropFilter: `blur(${g.radius}px) saturate(${g.saturate}%)`,
    background: g.tint,
    // Subtle visionOS-style top inner highlight on every glass surface.
    boxShadow: "inset 0 1px 0 var(--edge-highlight)",
  };
};

export const fillStyle = (l: Layer): CSSProperties => ({
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  background: l.fill,
});

export const noiseStyle = (l: Layer): CSSProperties | null => {
  const n = l.effects.find((e) => e.kind === "noise" && e.enabled) as { frequency: number; opacity: number } | undefined;
  if (!n) return null;
  return {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    backgroundImage: noiseDataUrl(n.frequency, n.opacity),
    backgroundSize: "240px 240px",
    mixBlendMode: "overlay",
    pointerEvents: "none",
  };
};

export const textureStyle = (l: Layer): CSSProperties | null => {
  const t = l.effects.find((e) => e.kind === "texture" && e.enabled) as { frequency: number; scale: number; opacity: number } | undefined;
  if (!t) return null;
  return {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    backgroundImage: textureDataUrl(t.frequency, t.scale, t.opacity),
    backgroundSize: "320px 320px",
    mixBlendMode: "soft-light",
    pointerEvents: "none",
  };
};

export const effectLabel: Record<Effect["kind"], string> = {
  dropShadow: "Drop shadow",
  innerShadow: "Inner shadow",
  layerBlur: "Layer blur",
  glass: "Glass / backdrop blur",
  noise: "Noise",
  texture: "Texture",
};

export const effectShortLabel: Record<Effect["kind"], string> = {
  dropShadow: "Drop",
  innerShadow: "Inner",
  layerBlur: "Blur",
  glass: "Glass",
  noise: "Noise",
  texture: "Texture",
};
