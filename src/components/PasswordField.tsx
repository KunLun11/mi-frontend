import { useState, type ReactNode } from "react";

import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { inputClassName } from "@/components/ui/TextField";
import { cn } from "@/lib/cn";

interface PasswordFieldProps {
  id: string;
  label?: string | undefined;
  action?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
}

export function PasswordField({
  id,
  label,
  action,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-[13px] font-medium text-ink-soft" htmlFor={id}>
            {label}
          </label>
          {action}
        </div>
      ) : null}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(inputClassName, "pr-[46px]", error && "border-danger")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute bottom-[5px] right-[5px] grid h-[38px] w-[38px] place-items-center rounded-[6px] text-muted transition hover:bg-surface-soft hover:text-ink"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <span id={errorId} className="text-[12.5px] leading-[1.45] text-danger">
          {error}
        </span>
      ) : null}
      {!error && hint ? (
        <span className="text-[12.5px] leading-[1.45] text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
