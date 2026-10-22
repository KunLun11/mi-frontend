import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Brand } from "@/components/Brand";
import { ArrowLeftIcon } from "@/components/icons";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-app flex h-[76px] items-center justify-between gap-5">
        <Brand />
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-[7px] text-[13.5px] text-muted transition hover:text-ink"
        >
          <ArrowLeftIcon />
          На главную
        </Link>
      </header>

      <main className="grid flex-1 place-items-center px-5 pb-14 pt-5">
        <div className="w-full max-w-[440px] rounded-lg border border-border bg-surface p-7 shadow-card">
          <div className="mb-[22px]">
            <h1 className="text-[28px] leading-[1.15] tracking-[-0.03em]">{title}</h1>
            <p className="mt-2 text-[13.5px] leading-[1.5] text-muted">{description}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11.5px] text-muted">
      <span className="h-px flex-1 bg-border" />
      или
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
