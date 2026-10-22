import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { getErrorCode, getErrorMessage } from "@/api/errors";
import {
  getMyPsychologistProfile,
  psychologistProfileQueryKey,
  updateMyPsychologistProfile,
  type PsychologistProfileOut,
} from "@/api/profiles";
import {
  acceptSessionRequest,
  declineSessionRequest,
  listSessionRequests,
  type SessionRequestAcceptIn,
  type SessionRequestOut,
} from "@/api/session-requests";
import {
  completeSession,
  listSessions,
  markSessionNoShow,
  type TherapySessionOut,
} from "@/api/sessions";
import { Avatar } from "@/components/Avatar";
import { Brand } from "@/components/Brand";
import { Dialog } from "@/components/Dialog";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  InboxIcon,
  LogOutIcon,
} from "@/components/icons";
import { StatusBadge, type BadgeTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField, inputClassName } from "@/components/ui/TextField";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDateTime,
  formatDayParts,
  formatRub,
  localTimezone,
} from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import type { components } from "@/types/api";

type RequestStatus = components["schemas"]["RequestStatus"];
type TherapyStatus = components["schemas"]["TherapyStatus"];
type Format = components["schemas"]["Format"];

type View = "overview" | "requests" | "sessions" | "profile";

const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Новая", tone: "warning" },
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

const TABS: { id: View; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "requests", label: "Заявки" },
  { id: "sessions", label: "Расписание" },
  { id: "profile", label: "Профиль" },
];

const REQUEST_FILTERS: { id: "all" | RequestStatus; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "pending", label: "Новые" },
  { id: "accepted", label: "Принятые" },
  { id: "declined", label: "Отклонённые" },
];

interface ProfileForm {
  bio: string;
  price: string;
  calendar: string;
}

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

function clientName(request: SessionRequestOut | TherapySessionOut): string {
  const name = request.client?.first_name?.trim();
  return name ? name : "Клиент";
}

function toLocalInputValue(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function defaultSlot(preferred: string | null): string {
  if (preferred) {
    const date = new Date(preferred);
    if (!Number.isNaN(date.getTime())) {
      return toLocalInputValue(date);
    }
  }
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);
  return toLocalInputValue(date);
}

function schedulesAt(session: TherapySessionOut): number {
  return new Date(session.scheduled_at).getTime();
}

function RequestBadge({ status }: { status: RequestStatus }) {
  const meta = REQUEST_STATUS[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

function SessionBadge({ status }: { status: TherapyStatus }) {
  const meta = SESSION_STATUS[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
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

function EmptyState({
  icon,
  title,
  copy,
}: {
  icon: "inbox" | "calendar";
  title: string;
  copy: string;
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
    </div>
  );
}

function RequestRow({
  request,
  timezone,
  onAccept,
  onDecline,
}: {
  request: SessionRequestOut;
  timezone: string;
  onAccept: (request: SessionRequestOut) => void;
  onDecline: (request: SessionRequestOut) => void;
}) {
  const name = clientName(request);

  return (
    <div className="border-t border-[#ededed] px-4 py-3 first:border-t-0 sm:px-[18px]">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[13.5px] font-medium leading-[1.35]">{name}</strong>
          <span className="mt-0.5 block truncate text-[11.5px] leading-[1.4] text-muted">
            {request.message ?? "Заявка на консультацию"}
          </span>
        </div>
        <div className="hidden text-right text-[12px] leading-[1.4] text-muted sm:block">
          <span className="block">{formatDate(request.created_at, timezone)}</span>
          <span>
            {request.preferred_time
              ? `Желаемое время: ${formatDateTime(request.preferred_time, timezone)}`
              : "Время не указано"}
          </span>
        </div>
        <RequestBadge status={request.status} />
      </div>

      {request.status === "pending" ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-11">
          <Button size="sm" onClick={() => onAccept(request)}>
            Принять
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onDecline(request)}>
            Отклонить
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SessionRow({
  session,
  timezone,
  onComplete,
}: {
  session: TherapySessionOut;
  timezone: string;
  onComplete: (session: TherapySessionOut) => void;
}) {
  const parts = formatDayParts(session.scheduled_at, timezone);

  return (
    <div className="border-t border-[#ededed] px-4 py-3 first:border-t-0 sm:px-[18px]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[7px] border border-border bg-[#fafafa] font-display text-[15px] font-semibold leading-none">
          <span>{parts.day}</span>
          <span className="font-body text-[8.5px] font-semibold uppercase leading-none tracking-[0.05em] text-muted">
            {parts.month}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[13.5px] font-medium leading-[1.35]">
            Сессия с {clientName(session)}
          </strong>
          <span className="mt-0.5 block truncate text-[11.5px] text-muted">
            {formatDateTime(session.scheduled_at, timezone)} · {session.duration_minutes} минут ·{" "}
            {formatRub(session.price_rub)}
          </span>
        </div>
        <SessionBadge status={session.status} />
      </div>

      {session.status === "scheduled" ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-[54px]">
          <Button size="sm" onClick={() => onComplete(session)}>
            Отметить проведённой
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function PsychologistDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: psychologistProfileQueryKey,
    queryFn: getMyPsychologistProfile,
  });
  const approved = profileQuery.data?.status === "approved";

  const requestsQuery = useQuery({
    queryKey: ["session-requests"],
    queryFn: listSessionRequests,
    enabled: approved,
  });
  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
    enabled: approved,
  });

  const [view, setView] = useState<View>("overview");
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [acceptTarget, setAcceptTarget] = useState<SessionRequestOut | null>(null);
  const [declineTarget, setDeclineTarget] = useState<SessionRequestOut | null>(null);
  const [completeTarget, setCompleteTarget] = useState<TherapySessionOut | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [price, setPrice] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);

  const profile: PsychologistProfileOut | null = profileQuery.data ?? null;

  useEffect(() => {
    if (profile && profileForm === null) {
      setProfileForm({
        bio: profile.bio ?? "",
        price: profile.session_price_rub > 0 ? String(profile.session_price_rub) : "",
        calendar: profile.calendar_url ?? "",
      });
    }
  }, [profile, profileForm]);

  function invalidateDeals() {
    void queryClient.invalidateQueries({ queryKey: ["session-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["sessions"] });
  }

  const acceptMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SessionRequestAcceptIn }) =>
      acceptSessionRequest(id, payload),
    onSuccess: () => {
      toast("Встреча назначена, клиент увидит её в кабинете", "success");
      invalidateDeals();
      setAcceptTarget(null);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineSessionRequest,
    onSuccess: () => {
      toast("Заявка отклонена", "success");
      invalidateDeals();
      setDeclineTarget(null);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeSession,
    onSuccess: () => {
      toast("Сессия отмечена проведённой", "success");
      invalidateDeals();
      setCompleteTarget(null);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const noShowMutation = useMutation({
    mutationFn: markSessionNoShow,
    onSuccess: () => {
      toast("Отмечена неявка клиента", "success");
      invalidateDeals();
      setCompleteTarget(null);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: (state: ProfileForm) =>
      updateMyPsychologistProfile({
        bio: state.bio.trim() || null,
        years_experience: profile?.years_experience ?? 0,
        session_price_rub: Number(state.price),
        calendar_url: state.calendar.trim() || null,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(psychologistProfileQueryKey, saved);
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast("Профиль обновлён", "success");
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  function openAccept(request: SessionRequestOut) {
    setAcceptTarget(request);
    setScheduledAt(defaultSlot(request.preferred_time));
    setPrice(String(profile?.session_price_rub ?? 0));
  }

  function submitAccept() {
    if (!acceptTarget) {
      return;
    }
    const priceValue = Number(price);
    const date = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(date.getTime())) {
      toast("Укажите дату и время встречи", "error");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      toast("Укажите корректную стоимость", "error");
      return;
    }
    acceptMutation.mutate({
      id: acceptTarget.id,
      payload: { scheduled_at: date.toISOString(), price_rub: priceValue },
    });
  }

  function saveProfile() {
    if (!profileForm) {
      return;
    }
    const priceValue = Number(profileForm.price);
    if (!Number.isFinite(priceValue) || priceValue < 500) {
      toast("Стоимость сессии должна быть не меньше 500 ₽", "error");
      return;
    }
    if (profileForm.calendar.trim() && !profileForm.calendar.trim().startsWith("https://")) {
      toast("Ссылка на календарь должна начинаться с https://", "error");
      return;
    }
    saveProfileMutation.mutate(profileForm);
  }

  if (profileQuery.isSuccess && profileQuery.data.status !== "approved") {
    return <Navigate to="/onboarding/psychologist" replace />;
  }

  if (getErrorCode(requestsQuery.error) === "psychologist_not_approved") {
    return <Navigate to="/onboarding/psychologist" replace />;
  }

  const timezone = localTimezone();
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  const requests = [...(requestsQuery.data ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => schedulesAt(b) - schedulesAt(a));

  const now = Date.now();
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const upcoming = sessions
    .filter((session) => session.status === "scheduled" && schedulesAt(session) > now)
    .sort((a, b) => schedulesAt(a) - schedulesAt(b));
  const completed = sessions.filter((session) => session.status === "completed");

  const visibleRequests =
    filter === "all" ? requests : requests.filter((request) => request.status === filter);

  const isLoading = profileQuery.isPending || requestsQuery.isPending || sessionsQuery.isPending;
  const hasError = profileQuery.isError || requestsQuery.isError || sessionsQuery.isError;

  function retry() {
    void profileQuery.refetch();
    void requestsQuery.refetch();
    void sessionsQuery.refetch();
  }

  function updateProfileForm<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    setProfileForm((current) => (current ? { ...current, [field]: value } : current));
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg/95">
        <div className="container-app flex h-[68px] items-center justify-between gap-4">
          <Brand />

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setView("profile")}
              className="hidden sm:inline-flex"
            >
              Профиль
            </Button>
            <div className="flex min-h-11 items-center gap-2 px-1">
              <Avatar name={displayName || user?.email || "Психолог"} size="sm" />
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
          {displayName ? `, ${displayName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-[7px] text-[13.5px] leading-[1.5] text-muted">
          Новые запросы от куратора и ближайшие встречи.
        </p>

        {hasError ? (
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
                label="Новые заявки"
                icon={<InboxIcon className="h-3.5 w-3.5" />}
                value={pendingRequests.length}
                note={pendingRequests.length > 0 ? "Ждут вашего ответа" : "Все заявки обработаны"}
              />
              <StatCard
                label="Запланировано"
                icon={<CalendarIcon className="h-3.5 w-3.5" />}
                value={upcoming.length}
                note="предстоящих сессий"
              />
              <StatCard
                label="Проведено"
                icon={<CheckCircleIcon className="h-3.5 w-3.5" />}
                value={completed.length}
                note="в этом кабинете"
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-1 border-b border-border" role="tablist">
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
                      Новые заявки
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView("requests")}
                      className="text-[12.5px] text-muted transition hover:text-ink"
                    >
                      Все заявки
                    </button>
                  </div>

                  {pendingRequests.length > 0 ? (
                    <div className="overflow-hidden rounded border border-border bg-surface">
                      {pendingRequests.slice(0, 3).map((request) => (
                        <RequestRow
                          key={request.id}
                          request={request}
                          timezone={timezone}
                          onAccept={openAccept}
                          onDecline={setDeclineTarget}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="inbox"
                      title="Новых заявок нет"
                      copy="Куратор передаст запрос, когда подберёт клиента под ваш профиль."
                    />
                  )}
                </section>

                <section>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Ближайшие сессии
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView("sessions")}
                      className="text-[12.5px] text-muted transition hover:text-ink"
                    >
                      Расписание
                    </button>
                  </div>

                  {upcoming.length > 0 ? (
                    <div className="overflow-hidden rounded border border-border bg-surface">
                      {upcoming.slice(0, 3).map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          timezone={timezone}
                          onComplete={setCompleteTarget}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="calendar"
                      title="Предстоящих встреч нет"
                      copy="Примите заявку, чтобы назначить клиенту время консультации."
                    />
                  )}
                </section>
              </div>
            ) : null}

            {view === "requests" ? (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted">
                    {requests.length} {plural(requests.length, "заявка", "заявки", "заявок")}
                  </span>
                  <div className="flex flex-wrap gap-1" role="group" aria-label="Фильтр заявок">
                    {REQUEST_FILTERS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={filter === item.id}
                        onClick={() => setFilter(item.id)}
                        className={cn(
                          "rounded-pill border px-3 py-1 text-[12px] transition",
                          filter === item.id
                            ? "border-accent bg-accent-tint text-accent-ink"
                            : "border-border bg-surface text-muted hover:text-ink",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {visibleRequests.length > 0 ? (
                  <div className="overflow-hidden rounded border border-border bg-surface">
                    {visibleRequests.map((request) => (
                      <RequestRow
                        key={request.id}
                        request={request}
                        timezone={timezone}
                        onAccept={openAccept}
                        onDecline={setDeclineTarget}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="inbox"
                    title="Заявок нет"
                    copy="В этом фильтре пока пусто. Новые запросы появятся здесь."
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
                  <StatusBadge tone="neutral">Время в вашем часовом поясе</StatusBadge>
                </div>

                {sessions.length > 0 ? (
                  <div className="overflow-hidden rounded border border-border bg-surface">
                    {sessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        timezone={timezone}
                        onComplete={setCompleteTarget}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="calendar"
                    title="Расписание пусто"
                    copy="Принятые заявки автоматически появятся в расписании."
                  />
                )}
              </div>
            ) : null}

            {view === "profile" && profile && profileForm ? (
              <div className="mt-6 max-w-[760px]">
                <div className="rounded border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-ink-soft" htmlFor="psych-bio">
                      О подходе
                    </label>
                    <textarea
                      id="psych-bio"
                      className={cn(inputClassName, "min-h-[112px] resize-y")}
                      value={profileForm.bio}
                      onChange={(event) => updateProfileForm("bio", event.target.value)}
                    />
                    <span className="text-[12.5px] leading-[1.45] text-muted">
                      Эта информация попадает в подборки, которые собирает куратор.
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Стоимость сессии, ₽"
                      name="profile-price"
                      type="number"
                      min={500}
                      step={100}
                      value={profileForm.price}
                      onChange={(event) => updateProfileForm("price", event.target.value)}
                      hint="Комиссия сервиса уже включена в цену."
                    />
                    <TextField
                      label="Ссылка на календарь"
                      name="profile-calendar"
                      type="url"
                      value={profileForm.calendar}
                      onChange={(event) => updateProfileForm("calendar", event.target.value)}
                      hint="Необязательно. Cal.com или Calendly."
                      placeholder="https://cal.com/your-name"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button onClick={saveProfile} loading={saveProfileMutation.isPending}>
                      Сохранить
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setProfileForm({
                          bio: profile.bio ?? "",
                          price:
                            profile.session_price_rub > 0
                              ? String(profile.session_price_rub)
                              : "",
                          calendar: profile.calendar_url ?? "",
                        })
                      }
                    >
                      Вернуть как было
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded border border-border bg-[#fcfcfc] p-4 text-[12.5px] leading-[1.55] text-muted">
                  <strong className="mb-1 block text-[11px] uppercase tracking-[0.09em]">
                    Форматы:{" "}
                    {profile.formats.map((format) => FORMAT_LABELS[format]).join(", ") || "—"}
                  </strong>
                  Изменения в тексте и цене видит куратор — он обновит карточку в ближайших подборках.
                  Диплом и супервизия уже проверены.
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </main>

      <Dialog
        open={acceptTarget !== null}
        onClose={() => setAcceptTarget(null)}
        title="Принять заявку"
        description={
          acceptTarget
            ? `${clientName(acceptTarget)} · заявка от ${formatDate(acceptTarget.created_at, timezone)}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setAcceptTarget(null)}>
              Отмена
            </Button>
            <Button onClick={submitAccept} loading={acceptMutation.isPending}>
              Назначить встречу
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {acceptTarget?.message ? (
            <div className="rounded bg-surface-soft p-3.5 text-[13px] leading-[1.55] text-ink-soft">
              {acceptTarget.message}
            </div>
          ) : null}

          <TextField
            label="Дата и время"
            name="accept-scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
          <TextField
            label="Стоимость сессии, ₽"
            name="accept-price"
            type="number"
            min={0}
            step={100}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            hint={
              acceptTarget?.preferred_time
                ? `Клиент просил: ${formatDateTime(acceptTarget.preferred_time, timezone)}`
                : "Длительность встречи — 50 минут."
            }
          />
        </div>
      </Dialog>

      <Dialog
        open={declineTarget !== null}
        onClose={() => setDeclineTarget(null)}
        title="Отклонить заявку?"
        description="Куратор увидит отказ и подберёт клиенту другого специалиста."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclineTarget(null)}>
              Оставить заявку
            </Button>
            <Button
              variant="danger"
              loading={declineMutation.isPending}
              onClick={() => {
                if (declineTarget) {
                  declineMutation.mutate(declineTarget.id);
                }
              }}
            >
              Отклонить
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <ClockIcon className="h-4 w-4" />
          Клиент получит уведомление и сможет выбрать другого психолога
        </div>
      </Dialog>

      <Dialog
        open={completeTarget !== null}
        onClose={() => setCompleteTarget(null)}
        title="Завершить сессию"
        description={
          completeTarget
            ? `${clientName(completeTarget)} · ${formatDateTime(completeTarget.scheduled_at, timezone)}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompleteTarget(null)}>
              Отмена
            </Button>
            <Button
              variant="secondary"
              loading={noShowMutation.isPending}
              onClick={() => {
                if (completeTarget) {
                  noShowMutation.mutate(completeTarget.id);
                }
              }}
            >
              Клиент не пришёл
            </Button>
            <Button
              loading={completeMutation.isPending}
              onClick={() => {
                if (completeTarget) {
                  completeMutation.mutate(completeTarget.id);
                }
              }}
            >
              Сессия проведена
            </Button>
          </>
        }
      >
        <div className="rounded bg-accent-tint p-3.5 text-[12.5px] leading-[1.55] text-accent-ink">
          После подтверждения сессия закроется, а комиссия сервиса будет начислена автоматически.
        </div>
      </Dialog>
    </div>
  );
}

