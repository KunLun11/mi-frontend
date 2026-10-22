import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { useMe } from "@/hooks/useMe";
import { dashboardPathFor, type AppRole } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth";

interface RequireAuthProps {
  role?: Extract<AppRole, "client" | "psychologist">;
  children: ReactNode;
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg text-muted">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

/**
 * Пускает только авторизованных пользователей (опционально — с нужной ролью).
 * Пока сессия не восстановлена из localStorage, ничего не рендерит.
 */
export function RequireAuth({ role, children }: RequireAuthProps) {
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const meQuery = useMe();

  // `useMe` синхронизирует user в стор через эффект; до него используем данные
  // запроса напрямую, чтобы не редиректить на /login на один рендер.
  const currentUser = user ?? meQuery.data ?? null;

  if (!hydrated) {
    return <FullPageLoader />;
  }

  if (!accessToken) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!currentUser) {
    if (meQuery.isPending) {
      return <FullPageLoader />;
    }
    return <Navigate to="/login" replace />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to={dashboardPathFor(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
