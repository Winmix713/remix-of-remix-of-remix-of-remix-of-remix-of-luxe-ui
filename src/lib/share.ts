import LZString from "lz-string";
import type { Scene } from "@/store/scene";

export const encodeScene = (scene: Scene): string =>
  LZString.compressToEncodedURIComponent(JSON.stringify({ layers: scene.layers, selectedId: scene.selectedId }));

export const decodeScene = (s: string): Scene | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(s);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed.layers)) return null;
    return parsed as Scene;
  } catch {
    return null;
  }
};

export const buildShareUrl = (scene: Scene) => {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.hash = "s=" + encodeScene(scene);
  return url.toString();
};
