import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createQuiz, type QuizIn } from "@/api/quizzes";
import { getErrorMessage } from "@/api/errors";
import { Brand } from "@/components/Brand";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ClockIcon, CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/TextField";
import { useDictionaries } from "@/hooks/useDictionaries";
import { cn } from "@/lib/cn";
import { useQuizStore, type BudgetChoice } from "@/store/quiz";
import { toast } from "@/store/toast";
import type { components } from "@/types/api";

type ITRole = components["schemas"]["ITRole"];
type Format = components["schemas"]["Format"];

const TOTAL_STEPS = 5;

const ROLE_OPTIONS: Array<{ value: ITRole; label: string }> = [
  { value: "developer", label: "Разработка" },
  { value: "designer", label: "Дизайн" },
  { value: "pm", label: "Продукт и проекты" },
  { value: "other", label: "Другая роль в IT" },
];

const FORMAT_OPTIONS: Array<{ value: Format; label: string }> = [
  { value: "online", label: "Онлайн" },
  { value: "offline", label: "Офлайн" },
  { value: "both", label: "Гибрид" },
];

const BUDGET_OPTIONS: Array<{ value: BudgetChoice; label: string }> = [
  { value: 3000, label: "До 3 000 ₽" },
  { value: 5000, label: "3 000–5 000 ₽" },
  { value: 8000, label: "5 000–8 000 ₽" },
  { value: "unknown", label: "Пока не знаю" },
];

function RadioOption({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-[58px] cursor-pointer items-center justify-between gap-3 rounded border px-[15px] py-[13px] text-[14.5px] leading-[1.35] transition",
        checked
          ? "border-accent bg-accent-tint text-ink shadow-[0_0_0_1px_var(--accent)]"
          : "border-border bg-surface text-ink-soft hover:border-border-strong hover:bg-[#fcfcfc]",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span>{label}</span>
      <span
        className={cn(
          "grid h-5 w-5 flex-none place-items-center rounded-full border transition",
          checked
            ? "border-accent bg-accent text-white"
            : "border-border-strong bg-surface text-transparent",
        )}
        aria-hidden="true"
      >
        <CheckIcon />
      </span>
    </label>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const dictionaries = useDictionaries();

  const step = useQuizStore((state) => state.step);
  const setStep = useQuizStore((state) => state.setStep);
  const roleInIt = useQuizStore((state) => state.roleInIt);
  const setRoleInIt = useQuizStore((state) => state.setRoleInIt);
  const concernId = useQuizStore((state) => state.concernId);
  const setConcernId = useQuizStore((state) => state.setConcernId);
  const format = useQuizStore((state) => state.format);
  const setFormat = useQuizStore((state) => state.setFormat);
  const budget = useQuizStore((state) => state.budget);
  const setBudget = useQuizStore((state) => state.setBudget);
  const freeText = useQuizStore((state) => state.freeText);
  const setFreeText = useQuizStore((state) => state.setFreeText);
  const reset = useQuizStore((state) => state.reset);

  const [consent, setConsent] = useState(false);

  const createMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: (quiz) => {
      reset();
      navigate(`/recommendations/${quiz.id}`, { replace: true });
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const canProceed =
    step === 1
      ? roleInIt !== null
      : step === 2
        ? concernId !== null
        : step === 3
          ? format !== null
          : step === 4
            ? budget !== null
            : consent;

  function handleNext() {
    if (!canProceed) {
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    if (!roleInIt || concernId === null || !format || budget === null) {
      return;
    }

    const payload: QuizIn = {
      role_in_it: roleInIt,
      primary_concern_id: concernId,
      preferred_format: format,
      preferred_price_max: budget === "unknown" ? null : budget,
      free_text: freeText.trim() ? freeText.trim() : null,
    };
    createMutation.mutate(payload);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container-app flex h-[68px] items-center justify-between gap-5">
          <Brand />
          <Link
            to="/dashboard/client"
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
          >
            Выйти
            <CloseIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div
        className="h-[3px] bg-[#ececec]"
        role="progressbar"
        aria-label="Прогресс квиза"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={step * 20}
      >
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${step * 20}%` }}
        />
      </div>

      <main className="mx-auto w-full max-w-[760px] flex-1 px-[22px] pb-16 pt-[clamp(36px,5vw,64px)]">
        <section key={step} className="animate-[quiz-step-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="mb-[18px] flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Шаг {step} из {TOTAL_STEPS}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <ClockIcon className="h-3.5 w-3.5" />
              {step === TOTAL_STEPS ? "Последний шаг" : "≈ 4 минуты"}
            </span>
          </div>

          {step === 1 ? (
            <>
              <h1 className="max-w-[18ch] text-[clamp(30px,4.4vw,44px)] leading-[1.08] tracking-[-0.04em]">
                Чем вы занимаетесь?
              </h1>
              <p className="mt-3 max-w-[50ch] text-[14.5px] leading-[1.55] text-muted">
                Это поможет куратору понять рабочий контекст. Выберите основную роль.
              </p>
              <div className="mt-[30px] grid gap-2.5 sm:grid-cols-2">
                {ROLE_OPTIONS.map((option) => (
                  <RadioOption
                    key={option.value}
                    name="role"
                    label={option.label}
                    checked={roleInIt === option.value}
                    onChange={() => setRoleInIt(option.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 className="max-w-[18ch] text-[clamp(30px,4.4vw,44px)] leading-[1.08] tracking-[-0.04em]">
                Что сейчас происходит?
              </h1>
              <p className="mt-3 max-w-[50ch] text-[14.5px] leading-[1.55] text-muted">
                Выберите то, что откликается больше всего. Одного варианта достаточно.
              </p>

              {dictionaries.isPending ? (
                <div className="mt-[30px] grid gap-2.5 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[58px] animate-pulse rounded border border-border bg-surface-soft"
                    />
                  ))}
                </div>
              ) : null}

              {dictionaries.isError ? (
                <div className="mt-[30px] rounded border border-border bg-surface p-5 text-sm text-muted">
                  Не удалось загрузить справочник запросов.{" "}
                  <button
                    type="button"
                    className="text-accent-ink underline underline-offset-4"
                    onClick={() => void dictionaries.refetch()}
                  >
                    Повторить
                  </button>
                </div>
              ) : null}

              {dictionaries.data ? (
                <div className="mt-[30px] grid gap-2.5 sm:grid-cols-2">
                  {dictionaries.data.concerns.map((concern) => (
                    <RadioOption
                      key={concern.id}
                      name="concern"
                      label={concern.name}
                      checked={concernId === concern.id}
                      onChange={() => setConcernId(concern.id)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h1 className="max-w-[18ch] text-[clamp(30px,4.4vw,44px)] leading-[1.08] tracking-[-0.04em]">
                Как удобнее встречаться?
              </h1>
              <p className="mt-3 max-w-[50ch] text-[14.5px] leading-[1.55] text-muted">
                Если не уверены — выберите «Гибрид»: обсудим на первой встрече.
              </p>
              <div className="mt-[30px] grid gap-2.5 sm:grid-cols-2">
                {FORMAT_OPTIONS.map((option) => (
                  <RadioOption
                    key={option.value}
                    name="format"
                    label={option.label}
                    checked={format === option.value}
                    onChange={() => setFormat(option.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <h1 className="max-w-[18ch] text-[clamp(30px,4.4vw,44px)] leading-[1.08] tracking-[-0.04em]">
                Комфортный бюджет за сессию
              </h1>
              <p className="mt-3 max-w-[50ch] text-[14.5px] leading-[1.55] text-muted">
                Куратор подберёт специалистов в этом диапазоне. Цены фиксированные, доплат нет.
              </p>
              <div className="mt-[30px] grid gap-2.5 sm:grid-cols-2">
                {BUDGET_OPTIONS.map((option) => (
                  <RadioOption
                    key={String(option.value)}
                    name="budget"
                    label={option.label}
                    checked={budget === option.value}
                    onChange={() => setBudget(option.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <h1 className="max-w-[18ch] text-[clamp(30px,4.4vw,44px)] leading-[1.08] tracking-[-0.04em]">
                Что важно знать психологу?
              </h1>
              <p className="mt-3 max-w-[50ch] text-[14.5px] leading-[1.55] text-muted">
                Пара предложений о ситуации — этого достаточно. Текст увидит только куратор
                и подобранный специалист.
              </p>

              <div className="mt-[30px]">
                <label className="text-[13px] font-medium text-ink-soft" htmlFor="quiz-note">
                  Комментарий <span className="text-muted">— необязательно</span>
                </label>
                <textarea
                  id="quiz-note"
                  value={freeText}
                  onChange={(event) => setFreeText(event.target.value.slice(0, 500))}
                  maxLength={500}
                  placeholder="Например: полгода живу в режиме релизов, перестало радовать то, что раньше нравилось…"
                  className={cn(inputClassName, "mt-2 min-h-[150px] resize-y")}
                />
                <span className="mt-[7px] block text-right text-[11.5px] text-muted">
                  {freeText.length} / 500
                </span>

                <label className="mt-[18px] flex cursor-pointer items-start gap-2.5 text-sm leading-[1.45] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-[17px] w-[17px] flex-none accent-accent"
                  />
                  <span>Согласен передать ответы куратору, чтобы он подобрал специалиста</span>
                </label>
              </div>
            </>
          ) : null}
        </section>

        <div className="mt-[38px] flex items-center justify-between gap-4 border-t border-border pt-[22px]">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeftIcon className="h-[15px] w-[15px]" />
              Назад
            </Button>
          ) : (
            <span />
          )}

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            loading={createMutation.isPending}
          >
            {createMutation.isPending
              ? "Отправляем…"
              : step === TOTAL_STEPS
                ? "Отправить заявку"
                : "Далее"}
            {step < TOTAL_STEPS ? (
              <ArrowRightIcon className="h-[15px] w-[15px]" />
            ) : null}
          </Button>
        </div>

        <p className="mt-7 text-center text-[11.5px] text-muted">
          Ответы увидит только куратор и подобранный специалист.
        </p>
      </main>
    </div>
  );
}
