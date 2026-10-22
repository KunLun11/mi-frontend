import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { fetchMe, resendCode, verifyEmail } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/TextField";
import { postVerifyPathFor } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import { cn } from "@/lib/cn";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: async (tokens) => {
      setTokens(tokens);
      queryClient.removeQueries();
      const me = await fetchMe();
      setUser(me);
      navigate(postVerifyPathFor(me.role), { replace: true });
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
      setCode("");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendCode,
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast("Код отправлен повторно", "success");
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) {
      return;
    }
    verifyMutation.mutate({ email, code });
  }

  return (
    <AuthShell
      title="Подтвердите email"
      description={`Мы отправили 6-значный код на ${email}. Введите его ниже.`}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-ink-soft" htmlFor="verify-code">
            Код из письма
          </label>
          <input
            id="verify-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className={cn(inputClassName, "text-center text-[20px] tracking-[0.45em]")}
            aria-describedby="verify-code-hint"
          />
          <span id="verify-code-hint" className="text-[12.5px] leading-[1.45] text-muted">
            Письмо может занять пару минут. Проверьте папку «Спам».
          </span>
        </div>

        <Button
          type="submit"
          size="lg"
          block
          loading={verifyMutation.isPending}
          disabled={code.length !== 6}
        >
          {verifyMutation.isPending ? "Проверяем…" : "Подтвердить"}
        </Button>
      </form>

      <div className="mt-5 border-t border-border pt-4 text-center text-[12.5px] text-muted">
        <button
          type="button"
          onClick={() => resendMutation.mutate({ email })}
          disabled={cooldown > 0 || resendMutation.isPending}
          className="text-ink-soft underline underline-offset-[3px] transition hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cooldown > 0
            ? `Отправить код повторно через ${cooldown} с`
            : "Отправить код повторно"}
        </button>
        <span className="mx-2 text-border-strong">·</span>
        <Link
          to="/register"
          className="text-ink-soft underline underline-offset-[3px] transition hover:text-accent-ink"
        >
          Изменить email
        </Link>
      </div>
    </AuthShell>
  );
}
