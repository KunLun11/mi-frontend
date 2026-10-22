import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { register } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { AuthDivider, AuthShell } from "@/components/AuthShell";
import { AuthTabs, type AuthRole } from "@/components/AuthTabs";
import { OAuthButtons } from "@/components/OAuthButtons";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/store/toast";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [role, setRole] = useState<AuthRole>(
    searchParams.get("role") === "psychologist" ? "psychologist" : "client",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmailError = EMAIL_PATTERN.test(email.trim()) ? null : "Введите корректный email";
    const nextPasswordError =
      password.length >= PASSWORD_MIN_LENGTH
        ? null
        : `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов`;
    const nextConfirmError = password === confirmPassword ? null : "Пароли не совпадают";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);

    if (nextEmailError || nextPasswordError || nextConfirmError) {
      return;
    }

    registerMutation.mutate({
      email: email.trim(),
      password,
      role,
    });
  }

  return (
    <AuthShell
      title="Создать аккаунт"
      description="Зарегистрируйтесь как клиент или психолог — код подтверждения придёт на email."
    >
      <AuthTabs value={role} onChange={setRole} />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="register-email"
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
          id="register-password"
          label="Пароль"
          value={password}
          onChange={(value) => {
            setPassword(value);
            setPasswordError(null);
          }}
          autoComplete="new-password"
          placeholder={`Минимум ${PASSWORD_MIN_LENGTH} символов`}
          error={passwordError ?? undefined}
          hint={`Минимум ${PASSWORD_MIN_LENGTH} символов`}
        />

        <PasswordField
          id="register-password-confirm"
          label="Повторите пароль"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            setConfirmError(null);
          }}
          autoComplete="new-password"
          placeholder="Ещё раз"
          error={confirmError ?? undefined}
        />

        <Button type="submit" size="lg" block loading={registerMutation.isPending}>
          {registerMutation.isPending ? "Создаём аккаунт…" : "Зарегистрироваться"}
        </Button>
      </form>

      <AuthDivider />
      <OAuthButtons />

      <p className="mt-5 border-t border-border pt-4 text-center text-[12.5px] text-muted">
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          className="text-ink-soft underline underline-offset-[3px] transition hover:text-accent-ink"
        >
          Войти
        </Link>
      </p>
    </AuthShell>
  );
}
