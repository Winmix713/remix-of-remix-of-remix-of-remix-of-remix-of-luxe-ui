import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { Canvas } from "@/components/canvas/Canvas";
import { LayerPanel } from "@/components/layers/LayerPanel";
import { PropertiesPanel } from "@/components/properties/PropertiesPanel";
import { CodePanel } from "@/components/codegen/CodePanel";
import { PresetsPanel } from "@/components/presets/PresetsPanel";
import { SegmentedControl } from "@/components/controls/SegmentedControl";
import { IconButton } from "@/components/controls/IconButton";
import { ShortcutsHintBar } from "@/components/controls/ShortcutsHintBar";
import { useScene } from "@/store/scene";
import { buildShareUrl, decodeScene } from "@/lib/share";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Link2, MoreHorizontal, RotateCcw, Download, Check, Undo2, Redo2 } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Properties Studio — Cinematic Dark UI Editor" },
      { name: "description", content: "A live design inspector with layers, Figma-style effects, presets, and code export." },
      { property: "og:title", content: "Properties Studio — Cinematic Dark UI Editor" },
      { property: "og:description", content: "A live design inspector with layers, Figma-style effects, presets, and code export." },
    ],
  }),
  component: Index,
});

type Tab = "design" | "code" | "presets";
const TABS = [
  { value: "design" as const, label: "Design" },
  { value: "code" as const, label: "Code" },
  { value: "presets" as const, label: "Presets" },
];

function Index() {
  const [tab, setTab] = useState<Tab>("design");
  const { layers, selectedId, loadScene, resetScene, undo, redo, past, future } = useScene();
  const [shared, setShared] = useState(false);
  useKeyboardShortcuts();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h.startsWith("#s=")) {
      const scene = decodeScene(h.slice(3));
      if (scene) loadScene(scene);
    }
  }, [loadScene]);

  const onShare = async () => {
    const url = buildShareUrl({ layers, selectedId });
    await navigator.clipboard.writeText(url);
    setShared(true);
    toast.success("Share link copied", { description: "Anyone with the link sees your current scene." });
    setTimeout(() => setShared(false), 1400);
  };


  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ layers, selectedId }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "properties-studio-scene.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-[var(--canvas-from)] to-[var(--canvas-to)] text-label-strong">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[720px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.62_0.19_256/0.14),transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[-200px] left-[8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,oklch(0.55_0.14_280/0.14),transparent_70%)] blur-3xl" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-edge-highlight to-transparent" />

      <div className="relative z-10 flex h-screen flex-col p-3">
        <header className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-1">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-[8px] bg-linear-to-br from-accent-blue to-[oklch(0.5_0.18_258)] shadow-[0_4px_14px_oklch(0.62_0.19_256/0.5),inset_0_1px_0_oklch(1_0_0/0.25)]">
              <div className="absolute inset-1 rounded-[5px] border border-white/20" />
            </div>
            <div>
              <h1 className="text-[13px] font-semibold tracking-tight leading-none">Properties Studio</h1>
              <div className="mt-0.5 text-[10px] text-muted-text">Cinematic dark UI editor</div>
            </div>
          </div>
          <SegmentedControl value={tab} onChange={setTab} options={TABS} />
          <div className="flex items-center justify-end gap-1.5">
            <IconButton
              variant="chip"
              size="sm"
              iconOnly
              onClick={undo}
              disabled={!past.length}
              icon={<Undo2 className="h-3.5 w-3.5" />}
              aria-label="Undo"
            />
            <IconButton
              variant="chip"
              size="sm"
              iconOnly
              onClick={redo}
              disabled={!future.length}
              icon={<Redo2 className="h-3.5 w-3.5" />}
              aria-label="Redo"
            />
            <IconButton
              variant="chip"
              size="sm"
              onClick={onShare}
              icon={shared ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Link2 className="h-3.5 w-3.5" />}
            >
              {shared ? "Link copied" : "Share"}
            </IconButton>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <IconButton variant="chip" size="sm" iconOnly icon={<MoreHorizontal className="h-3.5 w-3.5" />} aria-label="More" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={6}
                  align="end"
                  className="popover-material z-50 min-w-[180px] rounded-xl p-1 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                >
                  <DropdownMenu.Item
                    onSelect={exportJson}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-label outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-label-strong"
                  >
                    <Download className="h-3.5 w-3.5 text-muted-text" /> Export scene JSON
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px hairline" />
                  <DropdownMenu.Item
                    onSelect={resetScene}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-label outline-none data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-label-strong"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-muted-text" /> Reset scene
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <div className="mb-3 flex items-center justify-center px-1">
          <ShortcutsHintBar />
        </div>


        <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_340px] 2xl:grid-cols-[220px_minmax(0,1fr)_360px]">
          <div className="min-h-0 max-h-[40vh] md:max-h-none">
            <LayerPanel />
          </div>
          <div className="min-h-0 min-w-0">
            {tab === "design" && <Canvas />}
            {tab === "code" && <CodePanel />}
            {tab === "presets" && <PresetsPanel />}
          </div>
          <div className="min-h-0 max-h-[60vh] xl:max-h-none">
            <PropertiesPanel />
          </div>
        </div>

      </div>
    </main>
  );
}
