import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  className?: string;
  label?: string;
  scrubbable?: boolean;
};

const round = (v: number, p: number) => {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
};

export function ScrubInput({
  value,
  onChange,
  suffix,
  prefix,
  step = 1,
  min,
  max,
  precision = 2,
  className,
  label,
  scrubbable = true,
}: Props) {
  const [text, setText] = useState<string>(() => String(Number.isFinite(value) ? value : 0));
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startVal: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setText(String(round(Number.isFinite(value) ? value : 0, precision)));
    }
  }, [value, precision]);

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    let next = n;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    next = round(next, precision);
    onChange(next);
    setText(String(next));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(text);
      inputRef.current?.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const delta = (e.key === "ArrowUp" ? 1 : -1) * step * mult;
      let next = value + delta;
      if (typeof min === "number") next = Math.max(min, next);
      if (typeof max === "number") next = Math.min(max, next);
      next = round(next, precision);
      onChange(next);
      setText(String(next));
    } else if (e.key === "Escape") {
      setText(String(value));
      inputRef.current?.blur();
    }
  };

  const onPointerDown = (e: RPointerEvent<HTMLSpanElement>) => {
    if (!scrubbable) return;
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startVal: value, moved: false };
  };
  const onPointerMove = (e: RPointerEvent<HTMLSpanElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) < 2 && !dragRef.current.moved) return;
    dragRef.current.moved = true;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    let next = dragRef.current.startVal + dx * step * mult;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    next = round(next, precision);
    onChange(next);
    setText(String(next));
  };
  const onPointerUp = (e: RPointerEvent<HTMLSpanElement>) => {
    if (dragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    dragRef.current = null;
  };

  return (
    <label
      className={cn(
        "group relative flex h-8 min-w-0 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] transition-colors duration-[var(--dur-120)]",
        "hover:bg-[oklch(0_0_0/0.55)] focus-within:bg-[oklch(0_0_0/0.6)]",
        className,
      )}
      style={{
        background: "var(--surface-input)",
        boxShadow: "var(--shadow-input-inset)",
      }}
    >
      {(label || prefix) && (
        <span
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "shrink-0 select-none font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-text",
            scrubbable && "cursor-ew-resize hover:text-label-strong",
          )}
        >
          {label ?? prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={onKeyDown}
        className="w-full min-w-0 bg-transparent text-right font-mono text-[12px] tabular-nums text-label-strong outline-none"
      />
      {suffix && (
        <span className="shrink-0 select-none font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-text">
          {suffix}
        </span>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[8px] opacity-0 transition-opacity duration-150 group-focus-within:opacity-100"
        style={{
          boxShadow:
            "0 0 0 1px oklch(0.62 0.19 256 / 0.55), 0 0 0 3px oklch(0.62 0.19 256 / 0.12)",
        }}
      />
    </label>
  );
}
