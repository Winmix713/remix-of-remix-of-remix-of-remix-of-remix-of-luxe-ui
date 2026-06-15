import * as RSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <RSlider.Root
      className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
    >
      <RSlider.Track
        className="relative h-[3px] grow overflow-hidden rounded-full"
        style={{
          background: "oklch(0 0 0 / 0.55)",
          boxShadow:
            "inset 0 1px 1px oklch(0 0 0 / 0.7), inset 0 0 0 0.5px oklch(0 0 0 / 0.6), 0 1px 0 oklch(1 0 0 / 0.04)",
        }}
      >
        <RSlider.Range
          className="absolute h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, oklch(0.58 0.19 258), oklch(0.72 0.18 246))",
            boxShadow: "0 0 10px oklch(0.62 0.19 256 / 0.55), inset 0 0.5px 0 oklch(1 0 0 / 0.5)",
          }}
        />
      </RSlider.Track>
      <RSlider.Thumb
        aria-label="value"
        className="block h-[13px] w-[13px] rounded-full outline-none transition-transform duration-[var(--dur-120)] hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, oklch(1 0 0) 0%, oklch(0.95 0.005 260) 30%, oklch(0.78 0.01 260) 80%, oklch(0.65 0.012 260) 100%)",
          boxShadow: "var(--shadow-slider-thumb)",
        }}
      />
    </RSlider.Root>
  );
}
