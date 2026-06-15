import { type ReactNode } from "react";

export type HintItemConfig = {
  id: string;
  keys: ReactNode;
  label: string;
};

export function Sym({ children }: { children: ReactNode }) {
  return <span className="font-sans text-[13px] leading-none opacity-90">{children}</span>;
}

export function Keycap({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={
        "inline-flex min-w-[22px] items-center justify-center gap-[3px] rounded-[7px] px-1.5 py-[3px] text-[11.5px] font-semibold tracking-tight " +
        (active
          ? "text-white/95"
          : "border border-[oklch(1_0_0/0.08)] bg-[oklch(1_0_0/0.04)] text-white/85 shadow-[inset_0_1px_0_oklch(1_0_0/0.08),inset_0_-1px_0_oklch(0_0_0/0.35),0_1px_1px_oklch(0_0_0/0.4)]")
      }
    >
      {children}
    </span>
  );
}

export function buildDefaultHintItems(): HintItemConfig[] {
  return [
    { id: "drag", keys: "Drag", label: "move layer" },
    { id: "shift", keys: "Shift", label: "lock ratio" },
    { id: "alt", keys: "Alt", label: "from center" },
    { id: "undo", keys: (<><Sym>⌘</Sym><span>Z</span></>), label: "undo" },
    { id: "redo", keys: (<><Sym>⌘</Sym><Sym>⇧</Sym><span>Z</span></>), label: "redo" },
    { id: "duplicate", keys: (<><Sym>⌘</Sym><span>D</span></>), label: "duplicate" },
  ];
}

function HintItem({ item, active }: { item: HintItemConfig; active: boolean }) {
  if (active) {
    return (
      <div
        className="relative inline-flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{
          background: "linear-gradient(180deg, oklch(0.7 0.2 256) 0%, oklch(0.55 0.19 258) 100%)",
          border: "1px solid oklch(0.75 0.18 256 / 0.55)",
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.45), 0 6px 24px -4px oklch(0.62 0.19 256 / 0.55), 0 0 40px -4px oklch(0.62 0.19 256 / 0.45)",
        }}
      >
        <Keycap active>{item.keys}</Keycap>
        <span className="text-[12.5px] font-medium text-white/90">{item.label}</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 px-1.5">
      <Keycap>{item.keys}</Keycap>
      <span className="text-[12.5px] text-white/55">{item.label}</span>
    </div>
  );
}

export function ShortcutsHintBar({ items, activeId = null }: { items?: HintItemConfig[]; activeId?: string | null } = {}) {
  const resolved = items ?? buildDefaultHintItems();
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 -bottom-6 h-10 rounded-full blur-2xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.62 0.19 256 / 0.25), transparent 70%)" }}
      />
      <div
        role="toolbar"
        aria-label="Keyboard shortcuts"
        className="relative flex items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-xl"
        style={{
          background: "linear-gradient(180deg, oklch(0.235 0.014 262 / 0.85) 0%, oklch(0.18 0.012 262 / 0.85) 100%)",
          borderColor: "var(--panel-border)",
          boxShadow: "var(--shadow-panel)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.18), transparent)" }}
        />
        {resolved.map((item) => (
          <HintItem key={item.id} item={item} active={item.id === activeId} />
        ))}
      </div>
    </div>
  );
}
