import { Link2, Link2Off } from "lucide-react";
import { ScrubInput } from "./ScrubInput";
import { IconButton } from "./IconButton";

type Quad = [number, number, number, number];

export function LinkedQuad({
  value,
  linked,
  onChange,
  onLinkedChange,
  min = 0,
  suffix = "px",
}: {
  value: Quad;
  linked: boolean;
  onChange: (v: Quad) => void;
  onLinkedChange: (v: boolean) => void;
  min?: number;
  suffix?: string;
}) {
  if (linked) {
    return (
      <div className="grid grid-cols-[1fr_28px] items-center gap-1.5">
        <ScrubInput
          value={value[0]}
          min={min}
          label="ALL"
          suffix={suffix}
          onChange={(v) => onChange([v, v, v, v])}
        />
        <IconButton
          variant="chip"
          size="sm"
          iconOnly
          aria-label="Unlink padding"
          onClick={() => onLinkedChange(false)}
          icon={<Link2 className="h-3.5 w-3.5 text-accent-blue" />}
        />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_28px] items-center gap-1.5">
      {(["T", "R", "B", "L"] as const).map((s, i) => (
        <ScrubInput
          key={s}
          value={value[i]}
          min={min}
          label={s}
          onChange={(v) => {
            const next: Quad = [...value] as Quad;
            next[i] = v;
            onChange(next);
          }}
        />
      ))}
      <IconButton
        variant="chip"
        size="sm"
        iconOnly
        aria-label="Link padding"
        onClick={() => onLinkedChange(true)}
        icon={<Link2Off className="h-3.5 w-3.5" />}
      />
    </div>
  );
}
