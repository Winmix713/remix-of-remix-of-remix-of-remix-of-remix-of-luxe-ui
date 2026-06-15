import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "chip" | "primary" | "danger";
type Size = "xs" | "sm" | "md";

const variants: Record<Variant, string> = {
  ghost:
    "text-label hover:text-label-strong hover:bg-white/[0.06] active:bg-white/[0.10]",
  chip:
    "text-label shadow-[inset_0_0.5px_0_oklch(1_0_0/0.08),inset_0_0_0_0.5px_oklch(0_0_0/0.5),0_1px_1px_oklch(0_0_0/0.4)] bg-[linear-gradient(180deg,oklch(0.3_0.014_262),oklch(0.24_0.014_262))] hover:brightness-110 hover:text-label-strong active:brightness-95",
  primary:
    "text-white shadow-[inset_0_0.5px_0_oklch(1_0_0/0.3),0_0_0_0.5px_oklch(0.4_0.18_260)_inset,0_2px_6px_oklch(0.62_0.19_256/0.45),0_0_16px_oklch(0.62_0.19_256/0.35)] bg-[radial-gradient(120%_200%_at_50%_0%,oklch(0.78_0.16_250)_0%,oklch(0.6_0.2_258)_50%,oklch(0.45_0.18_260)_100%)] hover:brightness-110 active:brightness-95",
  danger:
    "text-muted-text hover:text-[var(--danger)] hover:bg-[oklch(0.66_0.21_24/0.12)]",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-[10.5px] rounded-[6px] gap-1",
  sm: "h-7 px-2.5 text-[11px] rounded-[7px] gap-1.5",
  md: "h-8 px-3 text-[12px] rounded-[8px] gap-1.5",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconOnly?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { variant = "ghost", size = "sm", icon, iconOnly, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium tracking-tight outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--dur-120)]",
        variants[variant],
        sizes[size],
        iconOnly && "aspect-square px-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
});
