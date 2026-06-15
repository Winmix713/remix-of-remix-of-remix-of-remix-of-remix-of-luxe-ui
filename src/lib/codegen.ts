import type { DropShadow, Effect, InnerShadow, Layer } from "@/store/scene";
import { buildBoxShadow, noiseDataUrl, textureDataUrl } from "./effects";

const indent = (s: string, n = 2) =>
  s
    .split("\n")
    .map((l) => (l ? " ".repeat(n) + l : l))
    .join("\n");

export const layerToCss = (l: Layer): string => {
  const lines: string[] = [];
  lines.push(`width: ${l.w}px;`);
  lines.push(`height: ${l.h}px;`);
  lines.push(`border-radius: ${l.radius}px;`);
  lines.push(`padding: ${l.padding.map((p) => p + "px").join(" ")};`);
  if (l.fill && l.fill !== "transparent") lines.push(`background: ${l.fill};`);
  if (l.opacity !== 1) lines.push(`opacity: ${l.opacity};`);
  if (l.rotation) lines.push(`transform: rotate(${l.rotation}deg);`);
  const shadow = buildBoxShadow(l.effects);
  if (shadow) lines.push(`box-shadow: ${shadow};`);
  const layerBlur = l.effects.find((e) => e.kind === "layerBlur" && e.enabled) as { radius: number } | undefined;
  if (layerBlur && layerBlur.radius > 0) lines.push(`filter: blur(${layerBlur.radius}px);`);

  const glass = l.effects.find((e) => e.kind === "glass" && e.enabled) as { radius: number; saturate: number; tint: string } | undefined;
  const noise = l.effects.find((e) => e.kind === "noise" && e.enabled) as { frequency: number; opacity: number } | undefined;
  const texture = l.effects.find((e) => e.kind === "texture" && e.enabled) as { frequency: number; scale: number; opacity: number } | undefined;

  if (glass || noise || texture) lines.push(`position: relative;`);

  const cls = `.${slug(l.name)}`;
  let out = `${cls} {\n${indent(lines.join("\n"))}\n}`;

  if (glass) {
    out += `\n${cls}::before {\n${indent(
      [
        `content: "";`,
        `position: absolute;`,
        `inset: 0;`,
        `border-radius: inherit;`,
        `backdrop-filter: blur(${glass.radius}px) saturate(${glass.saturate}%);`,
        `background: ${glass.tint};`,
        `z-index: 0;`,
      ].join("\n"),
    )}\n}`;
  }
  if (noise || texture) {
    const bg = noise ? noiseDataUrl(noise.frequency, noise.opacity) : textureDataUrl(texture!.frequency, texture!.scale, texture!.opacity);
    const blend = noise ? "overlay" : "soft-light";
    out += `\n${cls}::after {\n${indent(
      [
        `content: "";`,
        `position: absolute;`,
        `inset: 0;`,
        `border-radius: inherit;`,
        `background-image: ${bg};`,
        `mix-blend-mode: ${blend};`,
        `pointer-events: none;`,
      ].join("\n"),
    )}\n}`;
  }
  return out;
};

export const layerToTailwind = (l: Layer): string => {
  const classes: string[] = [];
  classes.push(`relative`);
  classes.push(`w-[${l.w}px]`);
  classes.push(`h-[${l.h}px]`);
  classes.push(`rounded-[${l.radius}px]`);
  classes.push(`p-[${l.padding[0]}px_${l.padding[1]}px_${l.padding[2]}px_${l.padding[3]}px]`);
  if (l.rotation) classes.push(`rotate-[${l.rotation}deg]`);
  if (l.opacity !== 1) classes.push(`opacity-[${l.opacity}]`);

  const styleParts: string[] = [];
  if (l.fill && l.fill !== "transparent") styleParts.push(`background:${l.fill}`);
  const shadow = buildBoxShadow(l.effects);
  if (shadow) styleParts.push(`box-shadow:${shadow}`);
  const layerBlur = l.effects.find((e) => e.kind === "layerBlur" && e.enabled) as { radius: number } | undefined;
  if (layerBlur && layerBlur.radius > 0) styleParts.push(`filter:blur(${layerBlur.radius}px)`);

  const glass = l.effects.find((e) => e.kind === "glass" && e.enabled) as { radius: number; saturate: number } | undefined;
  if (glass) classes.push(`backdrop-blur-[${glass.radius}px]`);

  const inline = styleParts.length ? `\nstyle={{ ${styleParts.map((p) => `"${p.split(":")[0]}": "${p.split(":").slice(1).join(":")}"`).join(", ")} }}` : "";

  return `<div\n  className="${classes.join(" ")}"${inline}\n>\n  ${escapeText(l.text || "")}\n</div>`;
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "layer";

const escapeText = (s: string) => s.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
