import { cn } from "@/lib/cn";

export type AuthRole = "client" | "psychologist";

interface AuthTabsProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
}

const TABS: Array<{ role: AuthRole; label: string }> = [
  { role: "client", label: "Я клиент" },
  { role: "psychologist", label: "Я психолог" },
];

export function AuthTabs({ value, onChange }: AuthTabsProps) {
  return (
    <div
      className="mb-[22px] grid grid-cols-2 gap-[3px] rounded border border-border bg-[#f4f6f8] p-[3px]"
      role="tablist"
      aria-label="Тип аккаунта"
    >
      {TABS.map((tab) => {
        const selected = tab.role === value;
        return (
          <button
            key={tab.role}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.role)}
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-[6px] text-[13.5px] font-medium transition",
              selected
                ? "bg-surface text-ink shadow-xs"
                : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
