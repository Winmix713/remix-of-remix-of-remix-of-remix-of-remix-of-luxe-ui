import { memo } from "react";
import { useScene, selectSelectedLayer } from "@/store/scene";
import { Section } from "@/components/controls/Section";
import { ScrubInput } from "@/components/controls/ScrubInput";
import { Slider } from "@/components/controls/Slider";
import { SegmentedControl } from "@/components/controls/SegmentedControl";
import { SliderRow } from "@/components/controls/Row";
import { Move3D } from "lucide-react";

const ROTATION_PRESETS = [
  { value: "-90", label: "−90°" },
  { value: "0", label: "0°" },
  { value: "90", label: "90°" },
] as const;

function TransformSectionImpl() {
  const layer = useScene(selectSelectedLayer)!;
  const updateLayer = useScene((s) => s.updateLayer);
  const set = (p: Partial<typeof layer>) => updateLayer(layer.id, p);
  const rotKey = layer.rotation === -90 ? "-90" : layer.rotation === 90 ? "90" : layer.rotation === 0 ? "0" : "";

  return (
    <Section icon={Move3D} label="Transform">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <ScrubInput value={layer.x} label="X" onChange={(v) => set({ x: v })} />
          <ScrubInput value={layer.y} label="Y" onChange={(v) => set({ y: v })} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ScrubInput value={layer.w} label="W" min={1} onChange={(v) => set({ w: v })} />
          <ScrubInput value={layer.h} label="H" min={1} onChange={(v) => set({ h: v })} />
        </div>
        <SliderRow label="Radius" value={layer.radius} suffix="px">
          <Slider value={layer.radius} min={0} max={200} onChange={(v) => set({ radius: v })} />
        </SliderRow>
        <SliderRow label="Rotate" value={layer.rotation} suffix="°">
          <Slider value={layer.rotation} min={-180} max={180} onChange={(v) => set({ rotation: v })} />
        </SliderRow>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11.5px] text-label">Preset</span>
          <SegmentedControl
            size="sm"
            value={rotKey as "-90" | "0" | "90"}
            onChange={(v) => set({ rotation: Number(v) })}
            options={ROTATION_PRESETS as unknown as { value: "-90" | "0" | "90"; label: string }[]}
          />
        </div>
      </div>
    </Section>
  );
}

export const TransformSection = memo(TransformSectionImpl);
