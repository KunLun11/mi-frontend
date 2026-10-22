import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { getErrorMessage } from "@/api/errors";
import {
  cancelSessionRequest,
  listSessionRequests,
  type SessionRequestOut,
} from "@/api/session-requests";
import { listSessions, type TherapySessionOut } from "@/api/sessions";
import { Avatar } from "@/components/Avatar";
import { Brand } from "@/components/Brand";
import { Dialog } from "@/components/Dialog";
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  InboxIcon,
  LogOutIcon,
} from "@/components/icons";
import { StatusBadge, type BadgeTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLogout } from "@/hooks/useLogout";
import { formatDate, formatDateTime, formatDayParts, formatTime } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import type { components } from "@/types/api";

type RequestStatus = components["schemas"]["RequestStatus"];
type TherapyStatus = components["schemas"]["TherapyStatus"];
type Format = components["schemas"]["Format"];

type View = "overview" | "applications" | "sessions";

const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Ожидает", tone: "warning" },
  accepted: { label: "Принята", tone: "success" },
  declined: { label: "Отклонена", tone: "neutral" },
  cancelled: { label: "Отменена", tone: "neutral" },
  completed: { label: "Завершена", tone: "info" },
};

const SESSION_STATUS: Record<TherapyStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Запланирована", tone: "info" },
  completed: { label: "Проведена", tone: "success" },
  no_show: { label: "Не состоялась", tone: "neutral" },
  cancelled: { label: "Отменена", tone: "neutral" },
};

const FORMAT_LABELS: Record<Format, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  both: "Гибрид",
};

const CANCELABLE = new Set<RequestStatus>(["pending", "accepted"]);

const TABS: { id: View; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "applications", label: "Заявки" },
  { id: "sessions", label: "Сессии" },
];

function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Доброе утро";
  }
  if (hour < 18) {
    return "Добрый день";
  }
  return "Добрый вечер";
}

function personName(
  person: SessionRequestOut["psychologist"] | TherapySessionOut["psychologist"],
  fallback: string,
): string {
  if (!person) {
    return fallback;
  }
  return [person.first_name, person.last_name].filter(Boolean).join(" ") || fallback;
}

function schedulesAt(session: TherapySessionOut): number {
  return new Date(session.scheduled_at).getTime();
}

function byCreatedDesc(a: SessionRequestOut, b: SessionRequestOut): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function byScheduledDesc(a: TherapySessionOut, b: TherapySessionOut): number {
  return schedulesAt(b) - schedulesAt(a);
}

function requestHint(request: SessionRequestOut): string {
  if (request.status === "accepted") {
    return "Встреча назначена";
  }
  if (request.status === "pending") {
    return "Ждёт ответа психолога";
  }
  if (request.status === "completed") {
    return "Консультация проведена";
  }
  return "Заявка закрыта";
}

function RequestBadge({ status }: { status: RequestStatus }) {
  const meta = REQUEST_STATUS[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

function SessionBadge({ status }: { status: TherapyStatus }) {
  const meta = SESSION_STATUS[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

function EmptyState({
  icon,
  title,
  copy,
  cta = "Пройти квиз",
}: {
  icon: "inbox" | "calendar";
  title: string;
  copy: string;
  cta?: string;
}) {
  return (
    <div className="rounded border border-dashed border-border-strong bg-[#fcfcfc] px-6 py-12 text-center">
      <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-surface-soft text-muted">
        {icon === "inbox" ? (
          <InboxIcon className="h-5 w-5" />
        ) : (
          <CalendarIcon className="h-5 w-5" />
        )}
      </div>
      <h3 className="text-lg leading-[1.3] tracking-[-0.02em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[40ch] text-[13px] leading-[1.5] text-muted">{copy}</p>
      <Link
        to="/quiz"
        className="mt-5 inline-flex min-h-9 items-center justify-center rounded border border-accent bg-accent px-[13px] text-[13px] font-medium text-white transition hover:border-accent-hover hover:bg-accent-hover"
      >
        {cta}
      </Link>
    </div>
  );
}

function StatCard({
  label,
  icon,
  value,
  note,
}: {
  label: string;
  icon: ReactNode;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded border border-border bg-surface px-5 py-[18px]">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-3.5 font-display text-[34px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
        {value}
      </div>
      <div className="mt-2 text-[11.5px] text-muted">{note}</div>
    </div>
  );
}

function RequestRow({
  request,
  timezone,
  onOpen,
}: {
  request: SessionRequestOut;
  timezone: string;
  onOpen: (request: SessionRequestOut) => void;
}) {
  const name = personName(request.psychologist, "Специалист");
  return (
    <button
      type="button"
      onClick={() => onOpen(request)}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-[#ededed] px-4 py-3 text-left transition first:border-t-0 hover:bg-[#fafbfc] sm:grid-cols-[minmax(0,1.55fr)_minmax(120px,0.8fr)_auto_18px] sm:gap-4 sm:px-[18px]"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar name={name} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium leading-[1.35]">{name}</span>
          <span className="mt-0.5 block truncate text-[11.5px] leading-[1.4] text-muted">
            {request.message ?? "Заявка на консультацию"}
          </span>
        </span>
      </span>
      <span className="hidden text-[12.5px] leading-[1.4] text-muted sm:block">
        <strong className="block font-medium text-ink-soft">
          {formatDate(request.created_at, timezone)}
        </strong>
        <span>{requestHint(request)}</span>
      </span>
      <RequestBadge status={request.status} />
      <ChevronRightIcon className="hidden text-[#a3a3a3] sm:block" />
    </button>
  );
}

function SessionRow({ session, timezone }: { session: TherapySessionOut; timezone: string }) {
  const parts = formatDayParts(session.scheduled_at, timezone);
  const name = personName(session.psychologist, "психологом");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-[#ededed] px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1.5fr)_minmax(130px,0.7fr)_auto] sm:gap-4 sm:px-[18px]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[7px] border border-border bg-[#fafafa] font-display text-[15px] font-semibold leading-none">
          <span>{parts.day}</span>
          <span className="font-body text-[8.5px] font-semibold uppercase leading-none tracking-[0.05em] text-muted">
            {parts.month}
          </span>
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-[13px] font-medium leading-[1.35]">
            Сессия с {name}
          </strong>
          <span className="mt-0.5 block truncate text-[11.5px] text-muted">
            {formatDateTime(session.scheduled_at, timezone)}
          </span>
        </div>
      </div>
      <div className="hidden text-[12.5px] leading-[1.4] text-muted sm:block">
        <strong className="block font-medium text-ink-soft">
          {formatTime(session.scheduled_at, timezone)}
        </strong>
        <span>{session.duration_minutes} минут</span>
      </div>
      <SessionBadge status={session.status} />
    </div>
  );
}

function RequestDetails({
  request,
  timezone,
}: {
  request: SessionRequestOut;
  timezone: string;
}) {
  const psychologist = request.psychologist;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={personName(psychologist, "Специалист")} size="md" />
          <div className="text-[12.5px] text-muted">Психолог, проверенный куратором</div>
        </div>
        <RequestBadge status={request.status} />
      </div>

      <dl className="grid gap-3 border-y border-border py-3.5 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
            Формат
          </dt>
          <dd className="mt-1">
            {psychologist && psychologist.formats.length > 0
              ? psychologist.formats.map((format) => FORMAT_LABELS[format]).join(", ")
              : "Уточним при подтверждении"}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
            Желаемое время
          </dt>
          <dd className="mt-1">
            {request.preferred_time
              ? formatDateTime(request.preferred_time, timezone)
              : "Не указано"}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
            Номер заявки
          </dt>
          <dd className="mt-1">№ {request.id.slice(0, 8)}</dd>
        </div>
      </dl>

      {request.message ? (
        <div className="rounded bg-surface-soft p-4 text-[13.5px] leading-[1.55] text-ink-soft">
          {request.message}
        </div>
      ) : null}

      <div className="rounded bg-accent-tint p-4 text-[13px] leading-[1.55] text-accent-ink">
        <strong className="mb-1 block text-[11px] uppercase tracking-[0.09em]">
          {request.status === "accepted"
            ? "Встреча подтверждена"
            : request.status === "pending"
              ? "Что дальше"
              : "Заявка закрыта"}
        </strong>
        {request.status === "accepted"
          ? "Психолог подтвердил встречу. Детали появятся в разделе «Сессии»."
          : request.status === "pending"
            ? "Психолог подтвердит встречу в течение 24 часов. Оплата — только после подтверждения."
            : "Если захотите вернуться, куратор подберёт специалиста заново."}
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["session-requests"],
    queryFn: listSessionRequests,
  });
  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
  });

  const [view, setView] = useState<View>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: cancelSessionRequest,
    onSuccess: () => {
      toast("Заявка отменена", "success");
      void queryClient.invalidateQueries({ queryKey: ["session-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setCancelOpen(false);
      setSelectedId(null);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const timezone =
    user?.profile && "timezone" in user.profile ? user.profile.timezone : "Europe/Moscow";
  const displayName =
    (user?.profile && "first_name" in user.profile ? user.profile.first_name : null) ?? "";

  const requests = [...(requestsQuery.data ?? [])].sort(byCreatedDesc);
  const sessions = [...(sessionsQuery.data ?? [])].sort(byScheduledDesc);
  const now = Date.now();
  const upcoming = sessions
    .filter((session) => session.status === "scheduled" && schedulesAt(session) > now)
    .sort((a, b) => schedulesAt(a) - schedulesAt(b));
  const nextSession = upcoming[0];
  const activeRequests = requests.filter((request) => request.status === "pending").length;

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  const isLoading = requestsQuery.isPending || sessionsQuery.isPending;

  function retry() {
    void requestsQuery.refetch();
    void sessionsQuery.refetch();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg/95">
        <div className="container-app flex h-[68px] items-center justify-between gap-4">
          <Brand />

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              to="/quiz"
              className="hidden min-h-9 items-center justify-center rounded border border-accent bg-accent px-[13px] text-[13px] font-medium text-white transition hover:border-accent-hover hover:bg-accent-hover sm:inline-flex"
            >
              Новая заявка
            </Link>
            <div className="flex min-h-11 items-center gap-2 px-1">
              <Avatar name={displayName || user?.email || "Клиент"} size="sm" />
              <span className="hidden max-w-[200px] truncate text-[13px] text-muted md:inline">
                {user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
              aria-label="Выйти"
              className="gap-2"
            >
              <LogOutIcon />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1060px] px-[clamp(20px,5vw,36px)] pb-16 pt-8 sm:pt-10">
        <h1 className="text-[clamp(27px,3vw,34px)] leading-[1.12] tracking-[-0.035em]">
          {greeting()}
          {displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.5] text-muted">
          Вот что происходит с вашими заявками и встречами.
        </p>

        {requestsQuery.isError || sessionsQuery.isError ? (
          <div className="mt-8 rounded border border-border bg-surface p-5 text-sm text-muted">
            Не удалось загрузить данные кабинета.{" "}
            <button
              type="button"
              onClick={retry}
              className="text-accent-ink underline underline-offset-4"
            >
              Повторить
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-7 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-[124px] w-full" />
              <Skeleton className="h-[124px] w-full" />
              <Skeleton className="h-[124px] w-full" />
            </div>
            <Skeleton className="h-[76px] w-full" />
            <Skeleton className="h-[240px] w-full" />
          </div>
        ) : null}

        {!isLoading ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Активные заявки"
                icon={<InboxIcon className="h-3.5 w-3.5" />}
                value={activeRequests}
                note={activeRequests > 0 ? "Ждут ответа психолога" : "Все заявки обработаны"}
              />
              <StatCard
                label="Ближайшие сессии"
                icon={<CalendarIcon className="h-3.5 w-3.5" />}
                value={upcoming.length}
                note={
                  nextSession
                    ? formatDateTime(nextSession.scheduled_at, timezone)
                    : "Нет запланированных встреч"
                }
              />
              <StatCard
                label="Всего сессий"
                icon={<CheckCircleIcon className="h-3.5 w-3.5" />}
                value={sessions.length}
                note="С момента первой заявки"
              />
            </div>

            <div className="mt-7 flex gap-1 border-b border-border" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={view === tab.id}
                  onClick={() => setView(tab.id)}
                  className={
                    view === tab.id
                      ? "-mb-px border-b-2 border-accent px-3 pb-2.5 pt-1 text-[13.5px] font-medium text-ink"
                      : "-mb-px border-b-2 border-transparent px-3 pb-2.5 pt-1 text-[13.5px] text-muted transition hover:text-ink"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {view === "overview" ? (
              <div className="mt-6 space-y-7">
                <section>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Ближайшая встреча
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView("sessions")}
                      className="text-[12.5px] text-muted transition hover:text-ink"
                    >
                      Все сессии
                    </button>
                  </div>

                  {nextSession ? (
                    <div className="flex flex-col gap-4 rounded border border-border bg-surface p-5 sm:flex-row sm:items-center sm:gap-[18px]">
                      <div className="flex h-[68px] w-[62px] flex-none flex-col items-center justify-center gap-0.5 rounded bg-surface-blue text-blue-ink">
                        <strong className="font-display text-[25px] font-semibold leading-none tracking-[-0.03em]">
                          {formatDayParts(nextSession.scheduled_at, timezone).day}
                        </strong>
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                          {formatDayParts(nextSession.scheduled_at, timezone).month}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold leading-[1.35]">
                          Сессия с {personName(nextSession.psychologist, "психологом")}
                        </h3>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-muted">
                          {formatDate(nextSession.scheduled_at, timezone)} ·{" "}
                          {formatTime(nextSession.scheduled_at, timezone)} ·{" "}
                          {nextSession.duration_minutes} минут
                        </p>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon="calendar"
                      title="Ближайших встреч нет"
                      copy="Выберите психолога в подборке или пройдите квиз заново."
                    />
                  )}
                </section>

                <section>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Заявки
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView("applications")}
                      className="text-[12.5px] text-muted transition hover:text-ink"
                    >
                      Все заявки
                    </button>
                  </div>

                  {requests.length > 0 ? (
                    <div className="overflow-hidden rounded border border-border bg-surface">
                      {requests.slice(0, 3).map((request) => (
                        <RequestRow
                          key={request.id}
                          request={request}
                          timezone={timezone}
                          onOpen={(item) => setSelectedId(item.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="inbox"
                      title="Заявок пока нет"
                      copy="Первый шаг — короткий квиз. Дальше подбором займётся куратор."
                    />
                  )}
                </section>

                <section>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Последние сессии
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView("sessions")}
                      className="text-[12.5px] text-muted transition hover:text-ink"
                    >
                      История
                    </button>
                  </div>

                  {sessions.length > 0 ? (
                    <div className="overflow-hidden rounded border border-border bg-surface">
                      {sessions.slice(0, 3).map((session) => (
                        <SessionRow key={session.id} session={session} timezone={timezone} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="calendar"
                      title="История пуста"
                      copy="Здесь появятся прошедшие и запланированные встречи."
                      cta="Записаться"
                    />
                  )}
                </section>
              </div>
            ) : null}

            {view === "applications" ? (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted">
                    {requests.length} {plural(requests.length, "заявка", "заявки", "заявок")}
                  </span>
                  <StatusBadge tone="neutral">Куратор отвечает до 24 часов</StatusBadge>
                </div>

                {requests.length > 0 ? (
                  <div className="overflow-hidden rounded border border-border bg-surface">
                    {requests.map((request) => (
                      <RequestRow
                        key={request.id}
                        request={request}
                        timezone={timezone}
                        onOpen={(item) => setSelectedId(item.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="inbox"
                    title="Пока нет заявок"
                    copy="Расскажите, что происходит, — куратор вручную подберёт психолога."
                  />
                )}
              </div>
            ) : null}

            {view === "sessions" ? (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted">
                    {sessions.length} {plural(sessions.length, "сессия", "сессии", "сессий")}
                  </span>
                  <StatusBadge tone="neutral">Все встречи по 50 минут</StatusBadge>
                </div>

                {sessions.length > 0 ? (
                  <div className="overflow-hidden rounded border border-border bg-surface">
                    {sessions.map((session) => (
                      <SessionRow key={session.id} session={session} timezone={timezone} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="calendar"
                    title="Встреч пока нет"
                    copy="Когда психолог подтвердит заявку, встреча появится здесь."
                    cta="Найти психолога"
                  />
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </main>

      <Dialog
        open={selected !== null && !cancelOpen}
        onClose={() => setSelectedId(null)}
        title={selected ? personName(selected.psychologist, "Заявка") : "Заявка"}
        {...(selected
          ? { description: `Заявка от ${formatDate(selected.created_at, timezone)}` }
          : {})}
        footer={
          <>
            {selected && CANCELABLE.has(selected.status) ? (
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                Отменить заявку
              </Button>
            ) : null}
            <Button onClick={() => setSelectedId(null)}>Закрыть</Button>
          </>
        }
      >
        {selected ? <RequestDetails request={selected} timezone={timezone} /> : null}
      </Dialog>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Отменить заявку?"
        description="Психолог ещё не подтвердил встречу. Вы сможете пройти квиз заново в любой момент."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Не отменять
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => {
                if (selectedId) {
                  cancelMutation.mutate(selectedId);
                }
              }}
            >
              Отменить заявку
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <ClockIcon className="h-4 w-4" />
          Отмена освободит место в расписании психолога
        </div>
      </Dialog>
    </div>
  );
}

