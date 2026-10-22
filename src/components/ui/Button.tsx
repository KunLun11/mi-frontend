import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "@/components/ui/Spinner";
import {
  buttonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClassName({ variant, size, block, className })}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
