import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover",
  secondary: "border-border bg-surface text-ink hover:border-border-strong hover:bg-[#f6f8fa]",
  ghost: "border-transparent bg-transparent text-ink hover:bg-surface-soft",
  danger: "border-danger bg-danger text-white hover:border-[#8f3124] hover:bg-[#8f3124]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-[13px] text-[13px]",
  md: "min-h-11 px-[18px] text-sm",
  lg: "min-h-12 px-[22px] text-[15px]",
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string | undefined;
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-[9px] rounded border font-body font-medium leading-[1.2] tracking-[-0.006em] whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
    "hover:-translate-y-px active:translate-y-0 active:scale-[0.985]",
    "disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
}
