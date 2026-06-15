import { useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Eye, EyeOff, Copy, Trash2, Plus, Square, MousePointerClick, Type, Lock, LockOpen, GripVertical } from "lucide-react";
import { useScene, type Layer, type LayerType } from "@/store/scene";
import { IconButton } from "@/components/controls/IconButton";

const ICONS: Record<LayerType, React.ComponentType<{ className?: string }>> = {
  card: Square,
  button: MousePointerClick,
  text: Type,
};

export function LayerPanel() {
  const { layers, selectedId, addLayer, reorderLayers } = useScene();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  // Top of canvas = last in array. Display reversed.
  const displayed = [...layers].reverse();

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = displayed.map((l) => l.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    reorderLayers([...next].reverse());
  };

  return (
    <aside
      className="relative flex h-full flex-col overflow-hidden rounded-[22px] backdrop-blur-2xl"
      style={{
        background: "linear-gradient(180deg, oklch(0.22 0.014 262 / 0.92) 0%, oklch(0.17 0.012 262 / 0.92) 100%)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.35), transparent)" }} />
      <div className="relative flex items-center justify-between px-4 pb-3 pt-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-label">Layers</span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton variant="chip" size="xs" iconOnly icon={<Plus className="h-3 w-3" />} aria-label="Add layer" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              align="end"
              className="popover-material z-50 min-w-[160px] rounded-xl p-1 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            >
              {(["card", "button", "text"] as LayerType[]).map((t) => {
                const Icon = ICONS[t];
                return (
                  <DropdownMenu.Item
                    key={t}
                    onSelect={() => addLayer(t)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-label outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-label-strong"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-text" />
                    <span className="capitalize">{t}</span>
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-[oklch(1_0_0/0.08)] to-transparent" />
      <div className="relative flex-1 overflow-auto px-2 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={displayed.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {displayed.map((l) => (
              <SortableRow key={l.id} layer={l} active={l.id === selectedId} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  );
}

function SortableRow({ layer, active }: { layer: Layer; active: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
  const { selectLayer, removeLayer, duplicateLayer, toggleVisible, toggleLocked, renameLayer } = useScene();
  const [editing, setEditing] = useState(false);
  const Icon = ICONS[layer.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectLayer(layer.id)}
      className={`group mb-0.5 flex h-8 items-center gap-1.5 rounded-md pl-1.5 pr-1 text-[12px] transition-[background-color,box-shadow,color] duration-[var(--dur-120)] ${
        active
          ? "bg-[oklch(0.62_0.19_256/0.16)] text-white shadow-[inset_0_0_0_1px_oklch(0.62_0.19_256/0.45)]"
          : "text-label hover:bg-white/[0.04]"
      } ${isDragging ? "shadow-[0_12px_32px_oklch(0_0_0/0.5)]" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab text-muted-text opacity-0 transition-opacity duration-[var(--dur-120)] group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-text" />
      {editing ? (
        <input
          autoFocus
          value={layer.name}
          onChange={(e) => renameLayer(layer.id, e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded-sm bg-white/[0.08] px-1 text-label-strong outline-none"
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="flex-1 truncate"
        >
          {layer.name}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleLocked(layer.id);
        }}
        title={layer.locked ? "Unlock" : "Lock"}
        className={`text-muted-text transition-opacity duration-[var(--dur-120)] hover:text-label-strong ${
          layer.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleVisible(layer.id);
        }}
        title={layer.visible ? "Hide" : "Show"}
        className={`text-muted-text transition-opacity duration-[var(--dur-120)] hover:text-label-strong ${
          !layer.visible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          duplicateLayer(layer.id);
        }}
        title="Duplicate"
        className="text-muted-text opacity-0 transition-opacity duration-[var(--dur-120)] hover:text-label-strong group-hover:opacity-100"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeLayer(layer.id);
        }}
        title="Delete"
        className="text-muted-text opacity-0 transition-opacity duration-[var(--dur-120)] hover:text-[var(--danger)] group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
