import { useScene, selectSelectedLayer } from "@/store/scene";
import { AppearanceSection } from "./AppearanceSection";
import { TransformSection } from "./TransformSection";
import { LayoutSection } from "./LayoutSection";
import { EffectsSection } from "./EffectsSection";
import { Layers } from "lucide-react";

export function PropertiesPanel() {
  const layer = useScene(selectSelectedLayer);
  const { renameLayer } = useScene();

  if (!layer) {
    return (
      <aside
        className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[22px] p-6 text-center backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.22 0.014 262 / 0.92) 0%, oklch(0.17 0.012 262 / 0.92) 100%)",
          boxShadow: "var(--shadow-panel)",
        }}
      >
        <div className="text-[12px] font-medium text-label-strong">No selection</div>
        <div className="mt-1 text-[11px] text-muted-text">Click a layer on the canvas to edit its properties.</div>
      </aside>
    );
  }

  return (
    <aside
      className="relative flex h-full flex-col overflow-hidden rounded-[22px] backdrop-blur-2xl"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.22 0.014 262 / 0.92) 0%, oklch(0.17 0.012 262 / 0.92) 100%)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      {/* Top edge specular */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.35), transparent)",
        }}
      />
      {/* Top ambient sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 50% at 50% -10%, oklch(1 0 0 / 0.08), transparent 60%)",
        }}
      />

      <div className="relative flex items-center justify-between px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2">
          <Layers className="h-3 w-3 text-muted-text" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-label">
            Properties
          </span>
        </div>
        <input
          value={layer.name}
          onChange={(e) => renameLayer(layer.id, e.target.value)}
          className="w-40 rounded-full bg-transparent px-2 py-[3px] text-right text-[11px] font-medium text-label-strong outline-none transition-colors hover:bg-white/[0.04] focus:bg-white/[0.06]"
          style={{
            boxShadow:
              "inset 0 0.5px 0 oklch(1 0 0 / 0.06), inset 0 0 0 0.5px oklch(0 0 0 / 0.3)",
          }}
        />
      </div>
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-[oklch(1_0_0/0.08)] to-transparent" />
      <div className="relative flex-1 overflow-auto pt-2">
        <AppearanceSection />
        <TransformSection />
        <LayoutSection />
        <EffectsSection />
      </div>
    </aside>
  );
}
