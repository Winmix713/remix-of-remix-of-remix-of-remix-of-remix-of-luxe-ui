import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = { value: T; label: string; icon?: React.ComponentType<{ className?: string }> };

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<SegmentOption<T>>;
  size?: "sm" | "md";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const active = c.querySelector<HTMLElement>(`[data-active="true"]`);
    if (!active) return;
    const cr = c.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    setIndicator({ left: ar.left - cr.left, width: ar.width });
  }, [value, options.length]);

  const heights = size === "sm" ? "h-7 text-[11px] px-3" : "h-8 text-[12px] px-3";

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center rounded-full p-[3px]", className)}
      style={{
        background: "oklch(0 0 0 / 0.5)",
        boxShadow:
          "inset 0 1px 1.5px oklch(0 0 0 / 0.7), inset 0 0 0 0.5px oklch(0 0 0 / 0.6), 0 1px 0 oklch(1 0 0 / 0.05)",
      }}
    >
      {indicator && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-[3px] bottom-[3px] rounded-full transition-[left,width] duration-[var(--dur-220)]"
          style={{
            left: indicator.left,
            width: indicator.width,
            background: "var(--grad-accent-pill)",
            boxShadow:
              "inset 0 0.5px 0 oklch(1 0 0 / 0.35), inset 0 -1px 0 oklch(0 0 0 / 0.25), 0 0 0 0.5px oklch(0.4 0.18 260) inset, 0 2px 8px oklch(0.62 0.19 256 / 0.55), 0 0 22px oklch(0.62 0.19 256 / 0.4)",
            transitionTimingFunction: "var(--ease-out-soft)",
          }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            data-active={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight transition-colors duration-[var(--dur-120)]",
              heights,
              active ? "text-white" : "text-label hover:text-label-strong",
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            <span className="capitalize">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
