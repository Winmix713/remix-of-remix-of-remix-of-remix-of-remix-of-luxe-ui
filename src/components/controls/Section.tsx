import type { ComponentType, ReactNode } from "react";

export function Section({
  icon: Icon,
  label,
  children,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="px-3 pb-3">
      <div
        className="relative rounded-[14px] border"
        style={{
          background: "var(--surface-section)",
          borderColor: "var(--surface-section-border)",
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.04), inset 0 0 0 1px oklch(0 0 0 / 0.25), 0 1px 0 oklch(1 0 0 / 0.02)",
        }}
      >
        {/* Top edge highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.12), transparent)",
          }}
        />
        <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
          <div className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-muted-text" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-label">
              {label}
            </span>
          </div>
          {action}
        </div>
        <div className="px-3 pb-3">{children}</div>
      </div>
    </section>
  );
}
