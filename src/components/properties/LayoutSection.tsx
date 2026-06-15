import { useScene, selectSelectedLayer } from "@/store/scene";
import { Section } from "@/components/controls/Section";
import { Slider } from "@/components/controls/Slider";
import { SliderRow } from "@/components/controls/Row";
import { LinkedQuad } from "@/components/controls/LinkedQuad";
import { Box } from "lucide-react";

export function LayoutSection() {
  const layer = useScene(selectSelectedLayer)!;
  const { updateLayer } = useScene();
  const set = (p: Partial<typeof layer>) => updateLayer(layer.id, p);

  return (
    <Section icon={Box} label="Layout">
      <div className="space-y-2.5">
        <div>
          <div className="mb-1 text-[10.5px] uppercase tracking-wider text-muted-text">Padding</div>
          <LinkedQuad
            value={layer.padding}
            linked={layer.paddingLinked}
            onChange={(v) => set({ padding: v })}
            onLinkedChange={(linked) => {
              if (linked) {
                const v = layer.padding[0];
                set({ paddingLinked: true, padding: [v, v, v, v] });
              } else {
                set({ paddingLinked: false });
              }
            }}
          />
        </div>
        <SliderRow label="Gap" value={layer.gap} suffix="px">
          <Slider value={layer.gap} min={0} max={64} onChange={(v) => set({ gap: v })} />
        </SliderRow>
      </div>
    </Section>
  );
}
