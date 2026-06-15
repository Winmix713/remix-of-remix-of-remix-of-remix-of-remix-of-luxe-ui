import { cn } from "@/lib/utils";

export function HUDBadge({ x, y, label, className }: { x: number; y: number; label: string; className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-40 rounded-md border border-hairline-strong bg-[oklch(0.18_0.014_262/0.92)] px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-label-strong shadow-[0_4px_12px_oklch(0_0_0/0.5)] backdrop-blur",
        className,
      )}
      style={{ left: x, top: y }}
    >
      {label}
    </div>
  );
}
