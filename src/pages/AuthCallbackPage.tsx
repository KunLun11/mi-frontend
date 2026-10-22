import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { fetchMe } from "@/api/auth";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { dashboardPathFor } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const clear = useAuthStore((state) => state.clear);

  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const accessToken = searchParams.get("access");
    const refreshToken = searchParams.get("refresh");

    if (!accessToken || !refreshToken) {
      setError("Не удалось получить токены входа. Попробуйте войти снова.");
      return;
    }

    setTokens({ access_token: accessToken, refresh_token: refreshToken });
    queryClient.removeQueries();

    void (async () => {
      try {
        const me = await fetchMe();
        setUser(me);
        navigate(dashboardPathFor(me.role), { replace: true });
      } catch {
        clear();
        setError("Не удалось завершить вход. Попробуйте войти снова.");
      }
    })();
  }, [clear, navigate, queryClient, searchParams, setTokens, setUser]);

  if (error) {
    return (
      <AuthShell title="Не удалось войти" description={error}>
        <Button size="lg" block onClick={() => navigate("/login", { replace: true })}>
          Войти снова
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Завершаем вход" description="Сохраняем сессию и открываем кабинет…">
      <div className="grid place-items-center py-6 text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    </AuthShell>
  );
}
