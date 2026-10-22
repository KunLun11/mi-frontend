import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { fetchMe, login } from "@/api/auth";
import { getErrorCode, getErrorMessage } from "@/api/errors";
import { AuthDivider, AuthShell } from "@/components/AuthShell";
import { AuthTabs, type AuthRole } from "@/components/AuthTabs";
import { OAuthButtons } from "@/components/OAuthButtons";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { dashboardPathFor, safeNextPath } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const [role, setRole] = useState<AuthRole>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (tokens) => {
      setTokens(tokens);
      // Кэш предыдущей сессии не должен просачиваться в новый аккаунт.
      queryClient.removeQueries();
      const me = await fetchMe();
      setUser(me);
      const next = safeNextPath(searchParams.get("next"));
      navigate(next ?? dashboardPathFor(me.role), { replace: true });
    },
    onError: (error) => {
      if (getErrorCode(error) === "email_not_verified") {
        toast("Подтвердите email — код уже отправлен", "info");
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      toast(getErrorMessage(error), "error");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmailError = EMAIL_PATTERN.test(email.trim()) ? null : "Введите корректный email";
    const nextPasswordError = password.length > 0 ? null : "Введите пароль";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  }

  return (
    <AuthShell
      title="Войти в Контекст"
      description="Один вход для клиентов и психологов. Выберите, кто вы."
    >
      <AuthTabs value={role} onChange={setRole} />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="login-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          error={emailError ?? undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
          }}
        />

        <PasswordField
          id="login-password"
          label="Пароль"
          action={
            // В MVP нет эндпоинта восстановления пароля — показываем пояснение.
            <button
              type="button"
              className="text-[12px] text-muted underline underline-offset-[3px] transition hover:text-ink"
              onClick={() => toast("Восстановление пароля пока недоступно", "info")}
            >
              Забыли пароль?
            </button>
          }
          value={password}
          onChange={(value) => {
            setPassword(value);
            setPasswordError(null);
          }}
          autoComplete="current-password"
          placeholder="Ваш пароль"
          error={passwordError ?? undefined}
        />

        <Button type="submit" size="lg" block loading={loginMutation.isPending}>
          {loginMutation.isPending ? "Входим…" : "Войти"}
        </Button>
      </form>

      <AuthDivider />
      <OAuthButtons />

      <p className="mt-5 border-t border-border pt-4 text-center text-[12.5px] text-muted">
        Ещё нет аккаунта?{" "}
        <Link
          to={`/register?role=${role}`}
          className="text-ink-soft underline underline-offset-[3px] transition hover:text-accent-ink"
        >
          Зарегистрироваться
        </Link>
      </p>
    </AuthShell>
  );
}
