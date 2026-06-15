import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Eye, EyeOff, Trash2, GripVertical, Plus, ChevronDown, Sparkles, Square, MoveDownRight, Droplets, Waves, Image as ImageIcon, CircleDashed } from "lucide-react";
import { useState } from "react";
import { useScene, selectSelectedLayer, type Effect, type EffectKind } from "@/store/scene";
import { effectLabel, effectShortLabel } from "@/lib/effects";
import { Section } from "@/components/controls/Section";
import { ScrubInput } from "@/components/controls/ScrubInput";
import { ColorField } from "@/components/controls/ColorField";
import { Slider } from "@/components/controls/Slider";
import { SliderRow } from "@/components/controls/Row";
import { IconButton } from "@/components/controls/IconButton";

const EFFECT_ICONS: Record<EffectKind, React.ComponentType<{ className?: string }>> = {
  dropShadow: MoveDownRight,
  innerShadow: CircleDashed,
  layerBlur: Droplets,
  glass: Square,
  noise: Waves,
  texture: ImageIcon,
};

const EFFECT_DESCRIPTIONS: Record<EffectKind, string> = {
  dropShadow: "Cast a shadow behind the layer",
  innerShadow: "Recess the inside edge",
  layerBlur: "Soften the entire layer",
  glass: "Backdrop blur with tint",
  noise: "Subtle grain overlay",
  texture: "Displaced organic texture",
};

const EFFECT_KINDS: EffectKind[] = ["dropShadow", "innerShadow", "layerBlur", "glass", "noise", "texture"];

export function EffectsSection() {
  const layer = useScene(selectSelectedLayer)!;
  const { addEffect, reorderEffects } = useScene();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = layer.effects.map((x) => x.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    reorderEffects(layer.id, next);
  };

  return (
    <Section
      icon={Sparkles}
      label="Effects"
      action={
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton variant="chip" size="xs" icon={<Plus className="h-3 w-3" />}>
              Add
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              align="end"
              className="popover-material z-50 min-w-[220px] rounded-xl p-1 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            >
              {EFFECT_KINDS.map((k) => {
                const Icon = EFFECT_ICONS[k];
                return (
                  <DropdownMenu.Item
                    key={k}
                    onSelect={() => addEffect(layer.id, k)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-label outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-label-strong"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-text" />
                    <div className="flex-1">
                      <div className="font-medium">{effectLabel[k]}</div>
                      <div className="text-[10.5px] text-muted-text">{EFFECT_DESCRIPTIONS[k]}</div>
                    </div>
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      }
    >
      {layer.effects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline-soft p-4 text-center text-[11px] text-muted-text">
          No effects yet. Click <span className="text-label-strong">Add</span> to layer one in.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={layer.effects.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {layer.effects.map((e) => (
                <SortableEffectCard key={e.id} effect={e} layerId={layer.id} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </Section>
  );
}

function SortableEffectCard({ effect, layerId }: { effect: Effect; layerId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: effect.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging
          ? "linear-gradient(180deg, oklch(0.27 0.014 262) 0%, oklch(0.22 0.014 262) 100%)"
          : "linear-gradient(180deg, oklch(0.235 0.014 262) 0%, oklch(0.2 0.014 262) 100%)",
        boxShadow: isDragging ? "var(--shadow-card-lifted)" : "var(--shadow-card-float)",
      }}
      className="relative rounded-[11px]"
    >
      {/* Top hairline highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.12), transparent)",
        }}
      />
      <EffectCard effect={effect} layerId={layerId} dragAttributes={attributes} dragListeners={listeners} />
    </div>
  );
}

type Listeners = ReturnType<typeof useSortable>["listeners"];
type Attributes = ReturnType<typeof useSortable>["attributes"];

function EffectCard({
  effect,
  layerId,
  dragAttributes,
  dragListeners,
}: {
  effect: Effect;
  layerId: string;
  dragAttributes: Attributes;
  dragListeners: Listeners;
}) {
  const { updateEffect, removeEffect } = useScene();
  const [open, setOpen] = useState(true);
  const upd = (patch: Partial<Effect>) => updateEffect(layerId, effect.id, patch);
  const Icon = EFFECT_ICONS[effect.kind];

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          {...dragAttributes}
          {...(dragListeners ?? {})}
          aria-label="Drag to reorder"
          className="cursor-grab text-muted-text hover:text-label-strong active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <Collapsible.Trigger asChild>
          <button className="group flex flex-1 items-center gap-1.5 text-left">
            <ChevronDown
              className={`h-3 w-3 text-muted-text transition-transform duration-[var(--dur-180)] ${open ? "" : "-rotate-90"}`}
            />
            <Icon className="h-3.5 w-3.5 text-muted-text" />
            <span className="text-[11.5px] font-medium tracking-tight text-label-strong">
              {effectShortLabel[effect.kind]}
            </span>
            <span className="text-[10.5px] text-muted-text">
              {effect.kind === "dropShadow" || effect.kind === "innerShadow"
                ? `${effect.x},${effect.y} • ${effect.blur}`
                : effect.kind === "layerBlur" || effect.kind === "glass"
                ? `${effect.radius}px`
                : `${Math.round(effect.opacity * 100)}%`}
            </span>
          </button>
        </Collapsible.Trigger>
        <button
          onClick={() => upd({ enabled: !effect.enabled } as Partial<Effect>)}
          className="text-muted-text transition-colors hover:text-label-strong"
        >
          {effect.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => removeEffect(layerId, effect.id)}
          className="text-muted-text transition-colors hover:text-[var(--danger)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="space-y-2 px-2.5 pb-2.5 pt-1">
          {(effect.kind === "dropShadow" || effect.kind === "innerShadow") && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <ScrubInput value={effect.x} label="X" onChange={(v) => upd({ x: v } as Partial<Effect>)} />
                <ScrubInput value={effect.y} label="Y" onChange={(v) => upd({ y: v } as Partial<Effect>)} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <ScrubInput value={effect.blur} label="B" min={0} onChange={(v) => upd({ blur: v } as Partial<Effect>)} />
                <ScrubInput value={effect.spread} label="S" onChange={(v) => upd({ spread: v } as Partial<Effect>)} />
              </div>
              <ColorField value={effect.color} onChange={(v) => upd({ color: v } as Partial<Effect>)} />
            </>
          )}
          {effect.kind === "layerBlur" && (
            <SliderRow label="Radius" value={effect.radius} suffix="px">
              <Slider value={effect.radius} min={0} max={60} onChange={(v) => upd({ radius: v } as Partial<Effect>)} />
            </SliderRow>
          )}
          {effect.kind === "glass" && (
            <>
              <SliderRow label="Blur" value={effect.radius} suffix="px">
                <Slider value={effect.radius} min={0} max={80} onChange={(v) => upd({ radius: v } as Partial<Effect>)} />
              </SliderRow>
              <SliderRow label="Saturate" value={effect.saturate} suffix="%">
                <Slider value={effect.saturate} min={50} max={250} onChange={(v) => upd({ saturate: v } as Partial<Effect>)} />
              </SliderRow>
              <ColorField value={effect.tint} onChange={(v) => upd({ tint: v } as Partial<Effect>)} />
            </>
          )}
          {effect.kind === "noise" && (
            <>
              <SliderRow label="Freq" value={Math.round(effect.frequency * 100)}>
                <Slider value={Math.round(effect.frequency * 100)} min={5} max={200} onChange={(v) => upd({ frequency: v / 100 } as Partial<Effect>)} />
              </SliderRow>
              <SliderRow label="Amount" value={Math.round(effect.opacity * 100)} suffix="%">
                <Slider value={Math.round(effect.opacity * 100)} min={0} max={100} onChange={(v) => upd({ opacity: v / 100 } as Partial<Effect>)} />
              </SliderRow>
            </>
          )}
          {effect.kind === "texture" && (
            <>
              <SliderRow label="Freq" value={Math.round(effect.frequency * 1000)}>
                <Slider value={Math.round(effect.frequency * 1000)} min={5} max={200} onChange={(v) => upd({ frequency: v / 1000 } as Partial<Effect>)} />
              </SliderRow>
              <SliderRow label="Scale" value={effect.scale}>
                <Slider value={effect.scale} min={0} max={40} onChange={(v) => upd({ scale: v } as Partial<Effect>)} />
              </SliderRow>
              <SliderRow label="Amount" value={Math.round(effect.opacity * 100)} suffix="%">
                <Slider value={Math.round(effect.opacity * 100)} min={0} max={100} onChange={(v) => upd({ opacity: v / 100 } as Partial<Effect>)} />
              </SliderRow>
            </>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
