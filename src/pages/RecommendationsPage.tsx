import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getErrorMessage } from "@/api/errors";
import { getQuiz, getRecommendations, type RecommendationOut } from "@/api/quizzes";
import { createSessionRequest } from "@/api/session-requests";
import { Avatar } from "@/components/Avatar";
import { Brand } from "@/components/Brand";
import { Dialog } from "@/components/Dialog";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  QuoteIcon,
  ShieldCheckIcon,
  VideoIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { inputClassName } from "@/components/ui/TextField";
import { useDictionaries } from "@/hooks/useDictionaries";
import { formatRub } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import type { components } from "@/types/api";

type Format = components["schemas"]["Format"];
type ITRole = components["schemas"]["ITRole"];

const ROLE_LABELS: Record<ITRole, string> = {
  developer: "Разработка",
  qa: "QA",
  pm: "Продукт и проекты",
  devops: "DevOps",
  designer: "Дизайн",
  manager: "Менеджмент",
  other: "Другая роль в IT",
};

const FORMAT_LABELS: Record<Format, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  both: "Гибрид",
};

const WAITING_STATUSES = new Set(["submitted", "processing"]);

function psychologistName(recommendation: RecommendationOut): string {
  const { first_name: firstName, last_name: lastName } = recommendation.psychologist;
  return [firstName, lastName].filter(Boolean).join(" ");
}

function psychologistHeadline(recommendation: RecommendationOut): string {
  const { approaches, years_experience: years } = recommendation.psychologist;
  const approachText = approaches.map((item) => item.name).join(" и ");
  return [approachText, `${years} лет практики`].filter(Boolean).join(" · ");
}

function formatLabel(formats: Format[]): string {
  if (formats.length === 0) {
    return "Формат уточним";
  }
  return formats.map((format) => FORMAT_LABELS[format]).join(", ");
}

export default function RecommendationsPage() {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const dictionaries = useDictionaries();

  const quizQuery = useQuery({
    queryKey: ["quizzes", quizId],
    queryFn: () => getQuiz(quizId),
    enabled: Boolean(quizId),
    refetchInterval: (query) =>
      query.state.data?.status === "recommended" ? false : 15_000,
  });

  const isRecommended = quizQuery.data?.status === "recommended";

  const recommendationsQuery = useQuery({
    queryKey: ["quizzes", quizId, "recommendations"],
    queryFn: () => getRecommendations(quizId),
    enabled: Boolean(quizId) && isRecommended,
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? false : 15_000,
  });

  const [selected, setSelected] = useState<RecommendationOut | null>(null);
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const createMutation = useMutation({
    mutationFn: createSessionRequest,
    onSuccess: () => {
      toast("Заявка отправлена", "success");
      void queryClient.invalidateQueries({ queryKey: ["session-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["quizzes", quizId] });
      setSelected(null);
      navigate("/dashboard/client");
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  function openBooking(recommendation: RecommendationOut) {
    setSelected(recommendation);
    setMessage("");
    setPreferredTime("");
  }

  function submitBooking() {
    if (!selected) {
      return;
    }
    createMutation.mutate({
      recommendation_id: selected.id,
      message: message.trim() ? message.trim() : null,
      preferred_time: preferredTime ? new Date(preferredTime).toISOString() : null,
    });
  }

  const quiz = quizQuery.data;
  const concernName = quiz
    ? dictionaries.data?.concerns.find((item) => item.id === quiz.primary_concern_id)?.name
    : undefined;

  const chips = quiz
    ? [
        ROLE_LABELS[quiz.role_in_it],
        concernName ?? "Ваш запрос",
        FORMAT_LABELS[quiz.preferred_format],
        quiz.preferred_price_max
          ? `до ${formatRub(quiz.preferred_price_max)}`
          : "Бюджет обсудим",
      ]
    : [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg/95">
        <div className="container-app flex h-[68px] items-center justify-between gap-5">
          <Brand />
          <div className="flex items-center gap-3">
            <span className="hidden min-h-6 items-center rounded-pill bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent-ink sm:inline-flex">
              Подобрано вручную
            </span>
            <Link
              to="/dashboard/client"
              className="flex min-h-11 items-center gap-2 px-1 text-[13px] text-muted transition hover:text-ink"
            >
              <Avatar name={user?.email ?? "Клиент"} size="sm" />
              <span className="hidden max-w-[200px] truncate sm:inline">{user?.email}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-20 pt-[clamp(36px,5vw,60px)]">
        <div className="container-app">
          {quizQuery.isPending ? (
            <div className="space-y-5">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-[220px] w-full" />
            </div>
          ) : null}

          {quizQuery.isError ? (
            <div className="mx-auto max-w-[520px] rounded border border-border bg-surface p-6 text-center">
              <h1 className="text-[24px] leading-[1.2] tracking-[-0.02em]">
                Не удалось открыть подборку
              </h1>
              <p className="mt-2 text-sm leading-[1.55] text-muted">
                {getErrorMessage(quizQuery.error)}
              </p>
              <Link
                to="/dashboard/client"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded border border-accent bg-accent px-[18px] text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                В личный кабинет
              </Link>
            </div>
          ) : null}

          {quiz && WAITING_STATUSES.has(quiz.status) ? (
            <div className="mx-auto max-w-[560px] py-12 text-center">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-accent-tint text-accent">
                <ClockIcon className="h-7 w-7" />
              </div>
              <h1 className="text-[clamp(30px,4vw,42px)] leading-[1.1] tracking-[-0.035em]">
                Куратор подбирает специалиста
              </h1>
              <p className="mx-auto mt-3.5 max-w-[42ch] text-[15px] leading-[1.6] text-muted">
                Обычно это занимает до 24 часов. Мы обновляем статус автоматически —
                страницу можно оставить открытой.
              </p>

              {chips.length > 0 ? (
                <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex min-h-7 items-center rounded-pill border border-border bg-surface px-2.5 text-xs text-muted"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 inline-flex items-center gap-2 text-[12.5px] text-muted">
                <Spinner className="h-4 w-4" />
                Проверяем статус каждые 15 секунд
              </div>

              <div className="mt-8">
                <Link
                  to="/dashboard/client"
                  className="text-sm text-accent-ink underline underline-offset-4"
                >
                  В личный кабинет
                </Link>
              </div>
            </div>
          ) : null}

          {quiz && quiz.status === "closed" ? (
            <div className="mx-auto max-w-[520px] rounded border border-border bg-surface p-6 text-center">
              <h1 className="text-[24px] leading-[1.2] tracking-[-0.02em]">Подбор закрыт</h1>
              <p className="mt-2 text-sm text-muted">
                Если нужна новая подборка, пройдите квиз ещё раз.
              </p>
              <Link to="/quiz" className="mt-5 inline-block text-sm text-accent-ink underline">
                Пройти квиз
              </Link>
            </div>
          ) : null}

          {quiz && isRecommended ? (
            <>
              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                <div>
                  <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Подборка куратора
                  </p>
                  <h1 className="mt-3 text-[clamp(32px,4vw,46px)] leading-[1.05] tracking-[-0.04em]">
                    Подборка для вас
                  </h1>
                  <p className="mt-2.5 text-[15px] text-muted">
                    Куратор прочитал ответы и выбрал специалистов. Можно записаться сразу
                    или вернуться позже.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 lg:justify-end">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex min-h-7 items-center rounded-pill border border-border bg-surface px-2.5 text-xs text-muted"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <div className="mb-4 flex items-start gap-3.5 rounded border border-border bg-surface p-[18px]">
                    <Avatar name="Куратор подбора" />
                    <div>
                      <p className="text-[13.5px] leading-[1.55] text-ink-soft">
                        Смотрел на три вещи: опыт с вашим запросом, работу с IT-командами
                        и бюджет. Ниже — почему выбран каждый специалист.
                      </p>
                      <div className="mt-1.5 text-[11.5px] text-muted">Куратор подбора</div>
                    </div>
                  </div>

                  <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[12.5px] text-muted">
                      {recommendationsQuery.data
                        ? `${recommendationsQuery.data.length} специалиста · проверены куратором`
                        : "Загружаем подборку…"}
                    </span>
                    <span className="inline-flex min-h-6 items-center rounded-pill bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-medium text-[#5f5f5f]">
                      Не каталог
                    </span>
                  </div>

                  {recommendationsQuery.isPending ? (
                    <div className="flex flex-col gap-4">
                      <Skeleton className="h-[280px] w-full" />
                      <Skeleton className="h-[280px] w-full" />
                    </div>
                  ) : null}

                  {recommendationsQuery.isError ? (
                    <div className="rounded border border-border bg-surface p-5 text-sm text-muted">
                      Не удалось загрузить подборку.{" "}
                      <button
                        type="button"
                        className="text-accent-ink underline underline-offset-4"
                        onClick={() => void recommendationsQuery.refetch()}
                      >
                        Повторить
                      </button>
                    </div>
                  ) : null}

                  {recommendationsQuery.data?.length === 0 ? (
                    <div className="rounded border border-dashed border-border-strong bg-[#fcfcfc] px-6 py-12 text-center">
                      <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-surface-soft text-muted">
                        <ClockIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg leading-[1.3] tracking-[-0.02em]">
                        Куратор ещё подбирает
                      </h3>
                      <p className="mx-auto mt-2 max-w-[36ch] text-[13px] leading-[1.5] text-muted">
                        Мы напишем, когда всё будет готово. Статус обновляется автоматически.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-4">
                    {recommendationsQuery.data?.map((recommendation) => {
                      const psychologist = recommendation.psychologist;
                      return (
                        <article
                          key={recommendation.id}
                          className="rounded border border-border bg-surface p-[22px]"
                        >
                          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3.5">
                            <Avatar name={psychologistName(recommendation)} size="lg" />
                            <div className="min-w-0">
                              <h2 className="font-display text-[21px] font-semibold leading-[1.2] tracking-[-0.025em]">
                                {psychologistName(recommendation)}
                              </h2>
                              <p className="mt-[5px] text-[13px] leading-[1.5] text-muted">
                                {psychologistHeadline(recommendation)}
                              </p>
                              {psychologist.is_verified_it_context ? (
                                <span className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-accent-ink">
                                  <ShieldCheckIcon className="h-[14px] w-[14px]" />
                                  IT-контекст проверен
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {psychologist.bio ? (
                            <p className="mt-3 text-[13.5px] leading-[1.55] text-ink-soft">
                              {psychologist.bio}
                            </p>
                          ) : null}

                          <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-[#ededed] pt-3.5 text-[12.5px] text-muted">
                            <span className="inline-flex items-center gap-1.5">
                              <VideoIcon className="h-3.5 w-3.5" />
                              {formatLabel(psychologist.formats)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <ClockIcon className="h-3.5 w-3.5" />
                              50 минут
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CreditCardIcon className="h-3.5 w-3.5" />
                              {formatRub(psychologist.session_price_rub)}
                            </span>
                            {psychologist.calendar_url ? (
                              <a
                                href={psychologist.calendar_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 underline underline-offset-4"
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Календарь
                              </a>
                            ) : null}
                          </div>

                          <div className="mt-4 rounded bg-accent-tint p-4">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-accent-ink">
                              <QuoteIcon className="h-[13px] w-[13px]" />
                              Почему мы выбрали этого специалиста
                            </div>
                            <p className="text-[13.5px] leading-[1.52] text-accent-ink">
                              {recommendation.admin_note}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-end">
                            <Button onClick={() => openBooking(recommendation)}>
                              Записаться
                              <ArrowRightIcon className="h-[15px] w-[15px]" />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-6 rounded border border-border bg-[#fbfbfb] p-[18px]">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted">
                      Никто не подошёл?
                    </h2>
                    <p className="mt-2 text-[12.5px] leading-[1.55] text-muted">
                      Так бывает. Напишите, что не откликнулось, — куратор соберёт другую
                      подборку.
                    </p>
                    {/* В MVP нет эндпоинта запроса другой подборки — показываем пояснение. */}
                    <button
                      type="button"
                      className="mt-2.5 text-[12.5px] text-danger underline underline-offset-[3px]"
                      onClick={() => toast("Запрос другой подборки пока недоступен", "info")}
                    >
                      Попросить другую подборку
                    </button>
                  </div>
                </div>

                <aside className="rounded border border-border bg-surface p-[22px] shadow-xs lg:sticky lg:top-[92px]">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Как проходит запись
                  </div>
                  <ol className="mt-3 space-y-3 text-[13px] leading-[1.5] text-ink-soft">
                    <li className="flex gap-2.5">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-accent" />
                      Выберите специалиста и отправьте заявку.
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-accent" />
                      Психолог подтвердит время в течение 24 часов.
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-accent" />
                      Оплата — после подтверждения встречи.
                    </li>
                  </ol>
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Записаться на сессию"
        description={
          selected
            ? `${psychologistName(selected)} · ${formatRub(selected.psychologist.session_price_rub)}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Отмена
            </Button>
            <Button onClick={submitBooking} loading={createMutation.isPending}>
              Отправить заявку
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-ink-soft" htmlFor="booking-message">
              Комментарий <span className="text-muted">— необязательно</span>
            </label>
            <textarea
              id="booking-message"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
              placeholder="Коротко о запросе или пожеланиях ко времени"
              className={`${inputClassName} min-h-[110px] resize-y`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-ink-soft" htmlFor="booking-time">
              Удобное время <span className="text-muted">— необязательно</span>
            </label>
            <input
              id="booking-time"
              type="datetime-local"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className={inputClassName}
            />
            <span className="text-[12px] leading-[1.45] text-muted">
              Психолог подтвердит точное время. Заявка ни к чему не обязывает.
            </span>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
