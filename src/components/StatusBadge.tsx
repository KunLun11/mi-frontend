import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "info" | "warning" | "success" | "neutral" | "danger";

const TONES: Record<BadgeTone, string> = {
  info: "bg-accent-tint text-accent-ink",
  warning: "bg-warn-tint text-warn-ink",
  success: "bg-[#e8f2e9] text-[#2f6b3a]",
  neutral: "bg-[#f0f0f0] text-[#5f5f5f]",
  danger: "bg-danger-tint text-danger",
};

interface StatusBadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
