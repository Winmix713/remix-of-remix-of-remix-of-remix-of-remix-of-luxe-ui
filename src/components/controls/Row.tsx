import type { ReactNode } from "react";

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[60px_1fr] items-center gap-2 py-0.5">
      <span className="text-[11.5px] text-label">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SliderRow({
  label,
  children,
  value,
  suffix,
}: {
  label: string;
  children: ReactNode;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)_56px] items-center gap-2 py-0.5">
      <span className="text-[11.5px] text-label">{label}</span>
      <div className="min-w-0">{children}</div>
      <span
        className="rounded-[7px] px-2 py-1 text-center font-mono text-[11px] tabular-nums text-label-strong"
        style={{ background: "var(--surface-input)", boxShadow: "var(--shadow-input-inset)" }}
      >
        {typeof value === "number" ? value : value}
        {suffix}
      </span>
    </div>
  );
}
