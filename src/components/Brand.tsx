import { Link } from "react-router-dom";

import { LogoMark } from "@/components/icons";
import { cn } from "@/lib/cn";

interface BrandProps {
  className?: string;
  inverse?: boolean;
}

export function Brand({ className, inverse = false }: BrandProps) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-[9px] font-display text-xl font-semibold leading-none tracking-[-0.035em]",
        inverse ? "text-white" : "text-ink",
        className,
      )}
      aria-label="Контекст — на главную"
    >
      <span className={cn("grid h-[26px] w-[26px] place-items-center", inverse ? "text-[#d3e4f2]" : "text-accent")}>
        <LogoMark />
      </span>
      <span>контекст</span>
    </Link>
  );
}
