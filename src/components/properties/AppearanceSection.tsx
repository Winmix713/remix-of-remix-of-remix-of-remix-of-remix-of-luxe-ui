import { memo } from "react";
import { useScene, selectSelectedLayer, type LayerMode } from "@/store/scene";
import { Section } from "@/components/controls/Section";
import { ColorField } from "@/components/controls/ColorField";
import { Slider } from "@/components/controls/Slider";
import { SegmentedControl } from "@/components/controls/SegmentedControl";
import { SliderRow } from "@/components/controls/Row";
import { Palette, Sun, Moon, Wand2 } from "lucide-react";

const MODES = [
  { value: "light" as LayerMode, label: "Light", icon: Sun },
  { value: "dark" as LayerMode, label: "Dark", icon: Moon },
  { value: "auto" as LayerMode, label: "Auto", icon: Wand2 },
];

function AppearanceSectionImpl() {
  const layer = useScene(selectSelectedLayer)!;
  const updateLayer = useScene((s) => s.updateLayer);
  const set = (p: Partial<typeof layer>) => updateLayer(layer.id, p);
  return (
    <Section icon={Palette} label="Appearance">
      <div className="space-y-2">
        <input
          value={layer.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder="Text"
          aria-label="Layer text"
          className="h-9 w-full rounded-[8px] px-2.5 text-[12px] text-label-strong outline-none transition-colors duration-[var(--dur-120)] placeholder:text-muted-text hover:bg-[oklch(0_0_0/0.55)] focus:bg-[oklch(0_0_0/0.6)]"
          style={{ background: "var(--surface-input)", boxShadow: "var(--shadow-input-inset)" }}
        />
        <ColorField value={layer.fill} onChange={(v) => set({ fill: v })} />
        <SliderRow label="Opacity" value={Math.round(layer.opacity * 100)} suffix="%">
          <Slider value={Math.round(layer.opacity * 100)} min={0} max={100} onChange={(v) => set({ opacity: v / 100 })} />
        </SliderRow>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11.5px] text-label">Mode</span>
          <SegmentedControl size="sm" value={layer.mode} onChange={(v) => set({ mode: v })} options={MODES} />
        </div>
      </div>
    </Section>
  );
}

export const AppearanceSection = memo(AppearanceSectionImpl);
