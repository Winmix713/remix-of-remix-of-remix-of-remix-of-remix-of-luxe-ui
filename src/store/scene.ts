import { create } from "zustand";

export type DropShadow = { id: string; kind: "dropShadow"; enabled: boolean; x: number; y: number; blur: number; spread: number; color: string };
export type InnerShadow = { id: string; kind: "innerShadow"; enabled: boolean; x: number; y: number; blur: number; spread: number; color: string };
export type LayerBlur = { id: string; kind: "layerBlur"; enabled: boolean; radius: number };
export type Glass = { id: string; kind: "glass"; enabled: boolean; radius: number; saturate: number; tint: string };
export type Noise = { id: string; kind: "noise"; enabled: boolean; frequency: number; opacity: number };
export type Texture = { id: string; kind: "texture"; enabled: boolean; frequency: number; scale: number; opacity: number };
export type Effect = DropShadow | InnerShadow | LayerBlur | Glass | Noise | Texture;
export type EffectKind = Effect["kind"];

export type LayerType = "card" | "button" | "text";
export type LayerMode = "light" | "dark" | "auto";

export type Layer = {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  radius: number;
  padding: [number, number, number, number];
  paddingLinked: boolean;
  gap: number;
  fill: string;
  opacity: number;
  mode: LayerMode;
  text: string;
  effects: Effect[];
  groupId?: string | null;
};

export type Scene = { layers: Layer[]; selectedId: string | null; selectedIds?: string[] };

const uid = () => Math.random().toString(36).slice(2, 10);

export const sampleEffectFor = (kind: EffectKind): Effect => {
  switch (kind) {
    case "dropShadow":
      return { id: uid(), kind, enabled: true, x: 0, y: 16, blur: 32, spread: -8, color: "oklch(0 0 0 / 0.55)" };
    case "innerShadow":
      return { id: uid(), kind, enabled: true, x: 0, y: 1, blur: 0, spread: 0, color: "oklch(1 0 0 / 0.14)" };
    case "layerBlur":
      return { id: uid(), kind, enabled: true, radius: 0 };
    case "glass":
      return { id: uid(), kind, enabled: true, radius: 24, saturate: 160, tint: "oklch(1 0 0 / 0.06)" };
    case "noise":
      return { id: uid(), kind, enabled: true, frequency: 0.65, opacity: 0.22 };
    case "texture":
      return { id: uid(), kind, enabled: true, frequency: 0.04, scale: 8, opacity: 0.35 };
  }
};

const defaultCard = (over: Partial<Layer> = {}): Layer => ({
  id: uid(),
  name: "Glass card",
  type: "card",
  visible: true,
  locked: false,
  x: 96,
  y: 96,
  w: 360,
  h: 220,
  rotation: 0,
  radius: 22,
  padding: [24, 24, 24, 24],
  paddingLinked: true,
  gap: 12,
  fill: "oklch(0.24 0.014 262 / 0.85)",
  opacity: 1,
  mode: "auto",
  text: "Liquid Glass",
  groupId: null,
  effects: [
    sampleEffectFor("glass"),
    { ...(sampleEffectFor("dropShadow") as DropShadow), y: 24, blur: 48, spread: -12, color: "oklch(0 0 0 / 0.6)" },
    { ...(sampleEffectFor("innerShadow") as InnerShadow), color: "oklch(1 0 0 / 0.08)" },
  ],
  ...over,
});

const defaultButton = (over: Partial<Layer> = {}): Layer => ({
  id: uid(),
  name: "Primary button",
  type: "button",
  visible: true,
  locked: false,
  x: 160,
  y: 380,
  w: 200,
  h: 52,
  rotation: 0,
  radius: 999,
  padding: [14, 24, 14, 24],
  paddingLinked: false,
  gap: 8,
  fill: "linear-gradient(180deg, oklch(0.66 0.18 256), oklch(0.52 0.18 258))",
  opacity: 1,
  mode: "dark",
  text: "Continue",
  groupId: null,
  effects: [
    { ...(sampleEffectFor("dropShadow") as DropShadow), y: 8, blur: 24, spread: -4, color: "oklch(0.62 0.19 256 / 0.55)" },
    { ...(sampleEffectFor("innerShadow") as InnerShadow), color: "oklch(1 0 0 / 0.25)" },
  ],
  ...over,
});

const defaultText = (over: Partial<Layer> = {}): Layer => ({
  id: uid(),
  name: "Heading",
  type: "text",
  visible: true,
  locked: false,
  x: 96,
  y: 480,
  w: 360,
  h: 48,
  rotation: 0,
  radius: 0,
  padding: [0, 0, 0, 0],
  paddingLinked: true,
  gap: 0,
  fill: "transparent",
  opacity: 1,
  mode: "auto",
  text: "Cinematic dark UI",
  groupId: null,
  effects: [],
  ...over,
});

const initialLayers = (): Layer[] => [defaultCard(), defaultButton(), defaultText()];
const init = initialLayers();

type Snapshot = { layers: Layer[]; selectedIds: string[] };
const HISTORY_LIMIT = 100;

type SceneStore = {
  layers: Layer[];
  selectedId: string | null;
  selectedIds: string[];
  clipboard: Layer[];
  past: Snapshot[];
  future: Snapshot[];

  // Selection
  selectLayer: (id: string | null, additive?: boolean) => void;
  setSelection: (ids: string[]) => void;
  selectAll: () => void;
  cycleSelection: (dir: 1 | -1) => void;

  // Mutations (history-tracked)
  addLayer: (type: LayerType) => void;
  removeLayer: (id: string) => void;
  removeSelected: () => void;
  duplicateLayer: (id: string) => void;
  duplicateSelected: () => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  updateSelected: (patch: Partial<Layer>) => void;
  translateSelected: (dx: number, dy: number, base: Record<string, { x: number; y: number }>) => void;
  reorderLayers: (ids: string[]) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  addEffect: (layerId: string, kind: EffectKind) => void;
  updateEffect: (layerId: string, effectId: string, patch: Partial<Effect>) => void;
  removeEffect: (layerId: string, effectId: string) => void;
  reorderEffects: (layerId: string, ids: string[]) => void;

  // Clipboard
  copySelection: () => void;
  paste: () => void;

  // Groups
  groupSelection: () => void;
  ungroupSelection: () => void;

  // History
  undo: () => void;
  redo: () => void;
  commitHistory: () => void; // mark a checkpoint (e.g. after drag end)

  // Scene-level
  loadScene: (scene: Scene) => void;
  resetScene: () => void;
};

const presetByType = (type: LayerType, n: number): Layer =>
  type === "card" ? defaultCard({ name: "Card " + n }) : type === "button" ? defaultButton({ name: "Button " + n }) : defaultText({ name: "Text " + n });

const snap = (s: { layers: Layer[]; selectedIds: string[] }): Snapshot => ({
  layers: s.layers.map((l) => ({ ...l, padding: [...l.padding] as [number, number, number, number], effects: l.effects.map((e) => ({ ...e })) })),
  selectedIds: [...s.selectedIds],
});

const withHistory = <S extends { layers: Layer[]; selectedIds: string[]; past: Snapshot[]; future: Snapshot[] }>(
  s: S,
  patch: Partial<S>,
): Partial<S> => ({
  ...patch,
  past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
  future: [],
} as Partial<S>);

const primary = (ids: string[]) => (ids.length ? ids[ids.length - 1] : null);

const expandSelectionWithGroups = (layers: Layer[], ids: string[]): string[] => {
  const groups = new Set<string>();
  for (const id of ids) {
    const l = layers.find((x) => x.id === id);
    if (l?.groupId) groups.add(l.groupId);
  }
  if (!groups.size) return ids;
  const out = new Set(ids);
  for (const l of layers) {
    if (l.groupId && groups.has(l.groupId)) out.add(l.id);
  }
  return Array.from(out);
};

export const useScene = create<SceneStore>((set, get) => ({
  layers: init,
  selectedId: init[0].id,
  selectedIds: [init[0].id],
  clipboard: [],
  past: [],
  future: [],

  selectLayer: (id, additive = false) =>
    set((s) => {
      if (id == null) return { selectedIds: [], selectedId: null };
      let ids: string[];
      if (additive) {
        ids = s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id];
      } else {
        ids = [id];
      }
      ids = expandSelectionWithGroups(s.layers, ids);
      return { selectedIds: ids, selectedId: primary(ids) };
    }),
  setSelection: (ids) =>
    set((s) => {
      const expanded = expandSelectionWithGroups(s.layers, ids);
      return { selectedIds: expanded, selectedId: primary(expanded) };
    }),
  selectAll: () =>
    set((s) => {
      const ids = s.layers.map((l) => l.id);
      return { selectedIds: ids, selectedId: primary(ids) };
    }),
  cycleSelection: (dir) =>
    set((s) => {
      if (!s.layers.length) return s;
      const cur = s.selectedId;
      const idx = cur ? s.layers.findIndex((l) => l.id === cur) : -1;
      const next = ((idx + dir) % s.layers.length + s.layers.length) % s.layers.length;
      const id = s.layers[next].id;
      return { selectedIds: [id], selectedId: id };
    }),

  addLayer: (type) =>
    set((s) => {
      const layer = presetByType(type, s.layers.length + 1);
      return withHistory(s, { layers: [...s.layers, layer], selectedIds: [layer.id], selectedId: layer.id });
    }),
  removeLayer: (id) =>
    set((s) => {
      const layers = s.layers.filter((l) => l.id !== id);
      const remainingSel = s.selectedIds.filter((x) => x !== id);
      const ids = remainingSel.length ? remainingSel : layers.length ? [layers[layers.length - 1].id] : [];
      return withHistory(s, { layers, selectedIds: ids, selectedId: primary(ids) });
    }),
  removeSelected: () =>
    set((s) => {
      if (!s.selectedIds.length) return s;
      const layers = s.layers.filter((l) => !s.selectedIds.includes(l.id));
      const ids = layers.length ? [layers[layers.length - 1].id] : [];
      return withHistory(s, { layers, selectedIds: ids, selectedId: primary(ids) });
    }),
  duplicateLayer: (id) =>
    set((s) => {
      const src = s.layers.find((l) => l.id === id);
      if (!src) return s;
      const copy: Layer = { ...src, id: uid(), name: src.name + " copy", x: src.x + 24, y: src.y + 24, effects: src.effects.map((e) => ({ ...e, id: uid() })) };
      return withHistory(s, { layers: [...s.layers, copy], selectedIds: [copy.id], selectedId: copy.id });
    }),
  duplicateSelected: () =>
    set((s) => {
      if (!s.selectedIds.length) return s;
      const groupRemap = new Map<string, string>();
      const copies = s.selectedIds
        .map((id) => s.layers.find((l) => l.id === id))
        .filter((l): l is Layer => !!l)
        .map((src) => {
          let groupId = src.groupId ?? null;
          if (groupId) {
            if (!groupRemap.has(groupId)) groupRemap.set(groupId, uid());
            groupId = groupRemap.get(groupId)!;
          }
          return {
            ...src,
            id: uid(),
            name: src.name + " copy",
            x: src.x + 24,
            y: src.y + 24,
            groupId,
            effects: src.effects.map((e) => ({ ...e, id: uid() })),
          } as Layer;
        });
      const ids = copies.map((c) => c.id);
      return withHistory(s, { layers: [...s.layers, ...copies], selectedIds: ids, selectedId: primary(ids) });
    }),
  updateLayer: (id, patch) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  updateSelected: (patch) =>
    set((s) => ({
      layers: s.layers.map((l) => (s.selectedIds.includes(l.id) ? { ...l, ...patch } : l)),
    })),
  translateSelected: (dx, dy, base) =>
    set((s) => ({
      layers: s.layers.map((l) => (base[l.id] ? { ...l, x: Math.round(base[l.id].x + dx), y: Math.round(base[l.id].y + dy) } : l)),
    })),
  reorderLayers: (ids) =>
    set((s) => withHistory(s, { layers: ids.map((id) => s.layers.find((l) => l.id === id)!).filter(Boolean) })),
  toggleVisible: (id) =>
    set((s) => withHistory(s, { layers: s.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)) })),
  toggleLocked: (id) =>
    set((s) => withHistory(s, { layers: s.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)) })),
  renameLayer: (id, name) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, name } : l)) })),
  addEffect: (layerId, kind) =>
    set((s) => withHistory(s, { layers: s.layers.map((l) => (l.id === layerId ? { ...l, effects: [...l.effects, sampleEffectFor(kind)] } : l)) })),
  updateEffect: (layerId, effectId, patch) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, effects: l.effects.map((e) => (e.id === effectId ? ({ ...e, ...patch } as Effect) : e)) } : l,
      ),
    })),
  removeEffect: (layerId, effectId) =>
    set((s) => withHistory(s, { layers: s.layers.map((l) => (l.id === layerId ? { ...l, effects: l.effects.filter((e) => e.id !== effectId) } : l)) })),
  reorderEffects: (layerId, ids) =>
    set((s) => withHistory(s, {
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, effects: ids.map((eid) => l.effects.find((e) => e.id === eid)!).filter(Boolean) } : l,
      ),
    })),

  copySelection: () => {
    const s = get();
    if (!s.selectedIds.length) return;
    const items = s.layers.filter((l) => s.selectedIds.includes(l.id));
    set({ clipboard: items.map((l) => ({ ...l, effects: l.effects.map((e) => ({ ...e })) })) });
  },
  paste: () =>
    set((s) => {
      if (!s.clipboard.length) return s;
      const groupRemap = new Map<string, string>();
      const copies = s.clipboard.map((src) => {
        let groupId = src.groupId ?? null;
        if (groupId) {
          if (!groupRemap.has(groupId)) groupRemap.set(groupId, uid());
          groupId = groupRemap.get(groupId)!;
        }
        return {
          ...src,
          id: uid(),
          name: src.name,
          x: src.x + 24,
          y: src.y + 24,
          groupId,
          effects: src.effects.map((e) => ({ ...e, id: uid() })),
        } as Layer;
      });
      const ids = copies.map((c) => c.id);
      return withHistory(s, { layers: [...s.layers, ...copies], selectedIds: ids, selectedId: primary(ids) });
    }),

  groupSelection: () =>
    set((s) => {
      if (s.selectedIds.length < 2) return s;
      const gid = uid();
      return withHistory(s, {
        layers: s.layers.map((l) => (s.selectedIds.includes(l.id) ? { ...l, groupId: gid } : l)),
      });
    }),
  ungroupSelection: () =>
    set((s) => {
      const groups = new Set<string>();
      for (const id of s.selectedIds) {
        const l = s.layers.find((x) => x.id === id);
        if (l?.groupId) groups.add(l.groupId);
      }
      if (!groups.size) return s;
      return withHistory(s, {
        layers: s.layers.map((l) => (l.groupId && groups.has(l.groupId) ? { ...l, groupId: null } : l)),
      });
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        future: [...s.future, snap(s)].slice(-HISTORY_LIMIT),
        layers: prev.layers,
        selectedIds: prev.selectedIds,
        selectedId: primary(prev.selectedIds),
      };
    }),
  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const next = s.future[s.future.length - 1];
      return {
        future: s.future.slice(0, -1),
        past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
        layers: next.layers,
        selectedIds: next.selectedIds,
        selectedId: primary(next.selectedIds),
      };
    }),
  commitHistory: () =>
    set((s) => ({ past: [...s.past, snap(s)].slice(-HISTORY_LIMIT), future: [] })),

  loadScene: (scene) =>
    set((s) => {
      const layers = scene.layers.map((l) => {
        const base: Partial<Layer> = { paddingLinked: true, mode: "auto", groupId: null };
        return { ...base, ...l } as Layer;
      });
      const ids = scene.selectedIds && scene.selectedIds.length
        ? scene.selectedIds
        : scene.selectedId
          ? [scene.selectedId]
          : layers[0]
            ? [layers[0].id]
            : [];
      return withHistory(s, { layers, selectedIds: ids, selectedId: primary(ids) });
    }),
  resetScene: () => {
    const next = initialLayers();
    set((s) => withHistory(s, { layers: next, selectedIds: [next[0].id], selectedId: next[0].id }));
  },
}));

export const selectSelectedLayer = (s: SceneStore) => s.layers.find((l) => l.id === s.selectedId) ?? null;
export const selectSelectedLayers = (s: SceneStore) => s.layers.filter((l) => s.selectedIds.includes(l.id));
