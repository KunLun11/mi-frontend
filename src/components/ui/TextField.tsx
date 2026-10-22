import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const inputClassName =
  "w-full min-h-12 rounded border border-border bg-surface px-3.5 py-3 text-[15px] leading-[1.4] text-ink placeholder:text-[#8a8a8a] transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-ring)] disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-muted";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function TextField({ label, error, hint, id, className, ...rest }: TextFieldProps) {
  const fieldId = id ?? rest.name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-ink-soft" htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(inputClassName, error && "border-danger", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
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
