import { Link } from "react-router-dom";

import { Brand } from "@/components/Brand";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5">
      <div className="w-full max-w-[420px] text-center">
        <div className="mb-10 flex justify-center">
          <Brand />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">404</p>
        <h1 className="mt-3 text-[30px] leading-[1.12] tracking-[-0.03em]">Страница не найдена</h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-muted">
          Возможно, ссылка устарела или страница была перемещена.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded border border-accent bg-accent px-[18px] text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
