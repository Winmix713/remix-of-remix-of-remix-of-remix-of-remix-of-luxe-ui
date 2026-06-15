import { useEffect } from "react";
import { useScene } from "@/store/scene";

const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
};

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    removeSelected,
    selectLayer,
    cycleSelection,
    selectAll,
    duplicateSelected,
    copySelection,
    paste,
    groupSelection,
    ungroupSelection,
    updateSelected,
    selectedIds,
    layers,
  } = useScene();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const meta = e.metaKey || e.ctrlKey;

      // Undo / Redo
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Select all
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Copy / Paste / Duplicate
      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelection();
        return;
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        paste();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Group / Ungroup
      if (meta && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) ungroupSelection();
        else groupSelection();
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selectedIds.length) return;
        e.preventDefault();
        removeSelected();
        return;
      }

      // Esc — deselect
      if (e.key === "Escape") {
        selectLayer(null);
        return;
      }

      // Tab cycle
      if (e.key === "Tab") {
        if (!layers.length) return;
        e.preventDefault();
        cycleSelection(e.shiftKey ? -1 : 1);
        return;
      }

      // Arrow nudge
      if (e.key.startsWith("Arrow") && selectedIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        // apply incremental translate
        const base: Record<string, { x: number; y: number }> = {};
        for (const id of selectedIds) {
          const l = layers.find((x) => x.id === id);
          if (l) base[id] = { x: l.x, y: l.y };
        }
        useScene.getState().commitHistory();
        useScene.getState().translateSelected(dx, dy, base);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    undo,
    redo,
    removeSelected,
    selectLayer,
    cycleSelection,
    selectAll,
    duplicateSelected,
    copySelection,
    paste,
    groupSelection,
    ungroupSelection,
    updateSelected,
    selectedIds,
    layers,
  ]);
}
