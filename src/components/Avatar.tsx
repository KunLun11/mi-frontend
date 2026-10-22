import { cn } from "@/lib/cn";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-[11.5px]",
  md: "h-[42px] w-[42px] text-sm",
  lg: "h-14 w-14 text-lg",
};

const TONES = [
  "bg-[#e3ecf5] text-[#2c5375]",
  "bg-[#e5eef4] text-[#35596d]",
  "bg-[#f2ece1] text-[#68583a]",
];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const total = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const tone = TONES[total % TONES.length] ?? TONES[0];

  return (
    <span
      className={cn(
        "inline-grid flex-none place-items-center overflow-hidden rounded-full font-display font-semibold tracking-[-0.01em]",
        SIZES[size],
        tone,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
