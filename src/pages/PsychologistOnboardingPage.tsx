import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { getErrorMessage } from "@/api/errors";
import {
  getMyPsychologistProfile,
  psychologistProfileQueryKey,
  submitMyPsychologistProfile,
  updateMyPsychologistProfile,
  type PsychologistProfileOut,
} from "@/api/profiles";
import { Avatar } from "@/components/Avatar";
import { Brand } from "@/components/Brand";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { StatusBadge, type BadgeTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField, inputClassName } from "@/components/ui/TextField";
import { useDictionaries } from "@/hooks/useDictionaries";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/cn";
import { formatRub } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import type { components } from "@/types/api";

type Format = components["schemas"]["Format"];
type PsychologistStatus = components["schemas"]["PsychologistStatus"];

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "online", label: "Онлайн" },
  { value: "offline", label: "Офлайн" },
  { value: "both", label: "Гибрид" },
];

const STATUS_META: Record<PsychologistStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Черновик", tone: "neutral" },
  pending: { label: "На проверке", tone: "warning" },
  approved: { label: "Одобрен", tone: "success" },
  rejected: { label: "Отклонён", tone: "danger" },
};

const STEPS = ["О себе", "Подход", "Образование", "Проверка"] as const;

interface FormState {
  first_name: string;
  last_name: string;
  bio: string;
  education: string;
  years_experience: string;
  session_price_rub: string;
  calendar_url: string;
  formats: Format[];
  approach_ids: number[];
  it_context_ids: number[];
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function toForm(profile: PsychologistProfileOut): FormState {
  return {
    first_name: profile.first_name,
    last_name: profile.last_name ?? "",
    bio: profile.bio ?? "",
    education: profile.education ?? "",
    years_experience: String(profile.years_experience),
    session_price_rub: profile.session_price_rub > 0 ? String(profile.session_price_rub) : "",
    calendar_url: profile.calendar_url ?? "",
    formats: profile.formats,
    approach_ids: profile.approaches.map((item) => item.id),
    it_context_ids: profile.it_contexts.map((item) => item.id),
  };
}

function stepFields(step: number): (keyof FormState)[] {
  if (step === 0) {
    return ["first_name", "last_name", "years_experience"];
  }
  if (step === 1) {
    return ["bio", "approach_ids", "formats", "session_price_rub"];
  }
  if (step === 2) {
    return ["education", "calendar_url"];
  }
  return [];
}

function validate(form: FormState, fields: (keyof FormState)[]): FieldErrors {
  const errors: FieldErrors = {};
  const experience = Number(form.years_experience);
  const price = Number(form.session_price_rub);
  const calendar = form.calendar_url.trim();

  for (const field of fields) {
    switch (field) {
      case "first_name":
        if (!form.first_name.trim()) {
          errors.first_name = "Укажите имя";
        }
        break;
      case "last_name":
        if (!form.last_name.trim()) {
          errors.last_name = "Укажите фамилию";
        }
        break;
      case "years_experience":
        if (!Number.isFinite(experience) || experience < 0 || experience > 80) {
          errors.years_experience = "Укажите опыт от 0 до 80 лет";
        }
        break;
      case "bio":
        if (form.bio.trim().length < 20) {
          errors.bio = "Расскажите о подходе — хотя бы пару предложений";
        }
        break;
      case "approach_ids":
        if (form.approach_ids.length === 0) {
          errors.approach_ids = "Выберите хотя бы один подход";
        }
        break;
      case "formats":
        if (form.formats.length === 0) {
          errors.formats = "Выберите хотя бы один формат";
        }
        break;
      case "session_price_rub":
        if (!Number.isFinite(price) || price < 500) {
          errors.session_price_rub = "Укажите стоимость от 500 ₽";
        }
        break;
      case "education":
        if (!form.education.trim()) {
          errors.education = "Укажите образование и программы";
        }
        break;
      case "calendar_url":
        if (calendar && !calendar.startsWith("https://")) {
          errors.calendar_url = "Ссылка должна начинаться с https://";
        }
        break;
      default:
        break;
    }
  }
  return errors;
}

function ChipToggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 text-[12.5px] transition",
        checked
          ? "border-accent bg-accent-tint text-accent-ink"
          : "border-border bg-surface text-ink-soft hover:border-border-strong",
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={cn(
          "grid h-4 w-4 flex-none place-items-center rounded-[3px] border",
          checked ? "border-accent bg-accent text-white" : "border-border-strong text-transparent",
        )}
      >
        <CheckIcon className="h-2.5 w-2.5" />
      </span>
      {children}
    </label>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-medium text-ink-soft">{children}</span>;
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return <span className="text-[12.5px] leading-[1.45] text-danger">{message}</span>;
}

function StatusCard({ profile }: { profile: PsychologistProfileOut }) {
  const meta = STATUS_META[profile.status];
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return (
    <div className="mx-auto mt-8 max-w-[620px] rounded border border-border bg-surface p-6 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-soft text-muted">
        {profile.status === "approved" ? (
          <ShieldCheckIcon className="h-6 w-6" />
        ) : (
          <ClockIcon className="h-6 w-6" />
        )}
      </div>
      <h1 className="text-[26px] leading-[1.15] tracking-[-0.03em]">
        {profile.status === "approved" ? "Профиль одобрен" : "Профиль на проверке"}
      </h1>
      <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-[1.55] text-muted">
        {profile.status === "approved"
          ? "Куратор одобрил профиль — вы появляетесь в подборках и можете принимать заявки."
          : "Куратор проверит документы и IT-контекст. Обычно это занимает 1–2 рабочих дня — напишем на email, когда профиль будет готов."}
      </p>

      <div className="mt-6 flex items-center gap-3 rounded border border-border bg-[#fcfcfc] p-4 text-left">
        <Avatar name={name || "Психолог"} size="md" />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[14px] font-medium">{name || "Психолог"}</strong>
          <span className="mt-0.5 block text-[12px] text-muted">
            {profile.approaches.map((item) => item.name).join(", ") || "Подходы не выбраны"}
          </span>
        </div>
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      </div>

      {profile.verification_notes ? (
        <div className="mt-4 rounded bg-surface-soft p-3 text-left text-[12.5px] leading-[1.5] text-ink-soft">
          <strong className="mb-1 block text-[10.5px] uppercase tracking-[0.09em] text-muted">
            Комментарий куратора
          </strong>
          {profile.verification_notes}
        </div>
      ) : null}
    </div>
  );
}

export default function PsychologistOnboardingPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const queryClient = useQueryClient();
  const dictionaries = useDictionaries();
  const profileQuery = useQuery({
    queryKey: psychologistProfileQueryKey,
    queryFn: getMyPsychologistProfile,
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (profileQuery.data) {
      setForm((current) => current ?? toForm(profileQuery.data));
    }
  }, [profileQuery.data]);

  const profile = profileQuery.data ?? null;
  const needsForm =
    editing || profile === null || profile.status === "draft" || profile.status === "rejected";

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: psychologistProfileQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }

  function buildPayload(state: FormState) {
    return {
      first_name: state.first_name.trim(),
      last_name: state.last_name.trim() || null,
      bio: state.bio.trim() || null,
      education: state.education.trim() || null,
      years_experience: Number(state.years_experience),
      session_price_rub: Number(state.session_price_rub),
      calendar_url: state.calendar_url.trim() || null,
      formats: state.formats,
      approach_ids: state.approach_ids,
      it_context_ids: state.it_context_ids,
    };
  }

  const saveMutation = useMutation({
    mutationFn: updateMyPsychologistProfile,
    onSuccess: (saved) => {
      queryClient.setQueryData(psychologistProfileQueryKey, saved);
      invalidate();
      toast("Черновик сохранён", "success");
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (state: FormState) => {
      await updateMyPsychologistProfile(buildPayload(state));
      return submitMyPsychologistProfile();
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(psychologistProfileQueryKey, saved);
      invalidate();
      setEditing(false);
      setStep(0);
      toast("Профиль отправлен на модерацию", "success");
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleArray<T>(items: T[], value: T): T[] {
    return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
  }

  function goNext() {
    if (!form) {
      return;
    }
    const stepErrors = validate(form, stepFields(step));
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function saveDraft() {
    if (!form) {
      return;
    }
    const stepErrors = validate(form, stepFields(step));
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    saveMutation.mutate(buildPayload(form));
  }

  function submitProfile() {
    if (!form) {
      return;
    }
    const allFields = stepFields(0).concat(stepFields(1), stepFields(2));
    const allErrors = validate(form, allFields);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstStep = [0, 1, 2].find((index) => {
        const stepError = validate(form, stepFields(index));
        return Object.keys(stepError).length > 0;
      });
      setStep(firstStep ?? 0);
      toast("Проверьте заполнение профиля", "error");
      return;
    }
    if (!consent) {
      toast("Отметьте согласие на проверку данных", "error");
      return;
    }
    submitMutation.mutate(form);
  }

  const approaches = dictionaries.data?.approaches ?? [];
  const itContexts = dictionaries.data?.itContexts ?? [];
  const dictionariesLoading = dictionaries.isPending;

  const busy = saveMutation.isPending || submitMutation.isPending;
  const statusMeta = profile ? STATUS_META[profile.status] : null;

  function retry() {
    void profileQuery.refetch();
    void dictionaries.refetch();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg/95">
        <div className="container-app flex h-[68px] items-center justify-between gap-4">
          <Brand />

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex min-h-11 items-center gap-2 px-1">
              <Avatar name={form?.first_name || user?.email || "Психолог"} size="sm" />
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

      <main className="mx-auto w-full max-w-[860px] px-[clamp(20px,5vw,36px)] pb-16 pt-8 sm:pt-10">
        {profileQuery.isError ? (
          <div className="rounded border border-border bg-surface p-5 text-sm text-muted">
            Не удалось загрузить профиль.{" "}
            <button
              type="button"
              onClick={retry}
              className="text-accent-ink underline underline-offset-4"
            >
              Повторить
            </button>
          </div>
        ) : null}

        {profileQuery.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-[280px]" />
            <Skeleton className="h-4 w-[360px]" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        ) : null}

        {profile && !needsForm ? <StatusCard profile={profile} /> : null}

        {profile && !needsForm ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {profile.status === "approved" ? (
              <Link
                to="/dashboard/psychologist"
                className="inline-flex min-h-11 items-center justify-center rounded border border-accent bg-accent px-[18px] text-sm font-medium text-white transition hover:border-accent-hover hover:bg-accent-hover"
              >
                Перейти в кабинет
              </Link>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setForm(toForm(profile));
                  setErrors({});
                  setEditing(true);
                }}
              >
                Изменить профиль
              </Button>
            )}
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded border border-border bg-surface px-[18px] text-sm font-medium text-ink transition hover:border-border-strong hover:bg-[#f6f8fa]"
            >
              На главную
            </Link>
          </div>
        ) : null}

        {profile && needsForm && form ? (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Шаг {step + 1} из {STEPS.length}
                </span>
                <h1 className="mt-1.5 text-[clamp(26px,3vw,32px)] leading-[1.12] tracking-[-0.035em]">
                  {STEPS[step]}
                </h1>
                <p className="mt-1.5 max-w-[56ch] text-[13.5px] leading-[1.5] text-muted">
                  {step === 0
                    ? "Основное, что нужно куратору и клиентам. Заполнение занимает около шести минут."
                    : step === 1
                      ? "Расскажите о подходе и выберите, с какими запросами и IT-контекстами работаете."
                      : step === 2
                        ? "Образование, программы повышения квалификации и ссылка на календарь."
                        : "Проверьте данные и отправьте профиль куратору на модерацию."}
                </p>
              </div>
              {statusMeta ? <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge> : null}
            </div>

            {profile.status === "rejected" && profile.verification_notes ? (
              <div className="mt-5 rounded border border-danger/40 bg-danger-tint p-4 text-[13px] leading-[1.55] text-danger">
                <strong className="mb-1 block text-[11px] uppercase tracking-[0.09em]">
                  Комментарий куратора
                </strong>
                {profile.verification_notes}
              </div>
            ) : null}

            <div className="mt-5 h-1 overflow-hidden rounded-pill bg-surface-soft">
              <div
                className="h-full rounded-pill bg-accent transition-[width] duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="mt-5 rounded border border-border bg-surface p-5 sm:p-6">
              {step === 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Имя"
                    name="first_name"
                    value={form.first_name}
                    onChange={(event) => update("first_name", event.target.value)}
                    error={errors.first_name}
                    placeholder="Марина"
                    autoComplete="given-name"
                  />
                  <TextField
                    label="Фамилия"
                    name="last_name"
                    value={form.last_name}
                    onChange={(event) => update("last_name", event.target.value)}
                    error={errors.last_name}
                    placeholder="Ковалёва"
                    autoComplete="family-name"
                  />
                  <TextField
                    label="Email"
                    name="email"
                    value={user?.email ?? ""}
                    disabled
                    hint="Email менять нельзя — он подтверждён при регистрации."
                  />
                  <TextField
                    label="Опыт практики, лет"
                    name="years_experience"
                    type="number"
                    min={0}
                    max={80}
                    value={form.years_experience}
                    onChange={(event) => update("years_experience", event.target.value)}
                    error={errors.years_experience}
                    placeholder="7"
                  />
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-ink-soft" htmlFor="bio">
                      О подходе
                    </label>
                    <textarea
                      id="bio"
                      className={cn(inputClassName, "min-h-[112px] resize-y", errors.bio && "border-danger")}
                      value={form.bio}
                      onChange={(event) => update("bio", event.target.value)}
                      placeholder="КПТ и ACT. Работаю с выгоранием и тревожностью у специалистов из продуктовых и инфраструктурных команд."
                    />
                    <FieldError message={errors.bio} />
                    {!errors.bio ? (
                      <span className="text-[12.5px] leading-[1.45] text-muted">
                        2–3 предложения: с чем работаете и как проходят сессии. Без обещаний и громких слов.
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel>Подходы в работе</FieldLabel>
                    {dictionariesLoading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {approaches.map((item) => (
                          <ChipToggle
                            key={item.id}
                            checked={form.approach_ids.includes(item.id)}
                            onChange={() =>
                              update("approach_ids", toggleArray(form.approach_ids, item.id))
                            }
                          >
                            {item.name}
                          </ChipToggle>
                        ))}
                      </div>
                    )}
                    <FieldError message={errors.approach_ids} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel>IT-контексты</FieldLabel>
                    {dictionariesLoading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {itContexts.map((item) => (
                          <ChipToggle
                            key={item.id}
                            checked={form.it_context_ids.includes(item.id)}
                            onChange={() =>
                              update("it_context_ids", toggleArray(form.it_context_ids, item.id))
                            }
                          >
                            {item.name}
                          </ChipToggle>
                        ))}
                      </div>
                    )}
                    <span className="text-[12.5px] leading-[1.45] text-muted">
                      Отметьте, с какими командами и ролями вам комфортно работать.
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel>Формат встреч</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {FORMAT_OPTIONS.map((format) => (
                        <ChipToggle
                          key={format.value}
                          checked={form.formats.includes(format.value)}
                          onChange={() => update("formats", toggleArray(form.formats, format.value))}
                        >
                          {format.label}
                        </ChipToggle>
                      ))}
                    </div>
                    <FieldError message={errors.formats} />
                  </div>

                  <div className="max-w-[280px]">
                    <TextField
                      label="Стоимость сессии, ₽"
                      name="session_price_rub"
                      type="number"
                      min={500}
                      step={100}
                      value={form.session_price_rub}
                      onChange={(event) => update("session_price_rub", event.target.value)}
                      error={errors.session_price_rub}
                      hint="Комиссия сервиса уже включена в цену."
                      placeholder="2500"
                    />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-ink-soft" htmlFor="education">
                      Образование
                    </label>
                    <textarea
                      id="education"
                      className={cn(
                        inputClassName,
                        "min-h-[112px] resize-y",
                        errors.education && "border-danger",
                      )}
                      value={form.education}
                      onChange={(event) => update("education", event.target.value)}
                      placeholder="МГУ, факультет психологии, 2015. Программа по КПТ, 2018."
                    />
                    <FieldError message={errors.education} />
                    {!errors.education ? (
                      <span className="text-[12.5px] leading-[1.45] text-muted">
                        Вуз, год выпуска и основные программы повышения квалификации.
                      </span>
                    ) : null}
                  </div>

                  <TextField
                    label="Ссылка на календарь"
                    name="calendar_url"
                    type="url"
                    value={form.calendar_url}
                    onChange={(event) => update("calendar_url", event.target.value)}
                    error={errors.calendar_url}
                    hint="Необязательно. Если есть Cal.com или Calendly, клиент увидит свободные слоты."
                    placeholder="https://cal.com/your-name"
                    autoComplete="url"
                  />

                  <div className="rounded bg-surface-soft p-4 text-[13px] leading-[1.55] text-ink-soft">
                    <strong className="mb-1 block text-[11px] uppercase tracking-[0.09em] text-muted">
                      Что проверит куратор
                    </strong>
                    Диплом, супервизию и IT-контекст. Обычно это занимает 1–2 рабочих дня. После проверки
                    профиль появится в подборках, а вы получите доступ к кабинету.
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        Имя
                      </dt>
                      <dd className="mt-1 text-[13.5px]">
                        {[form.first_name, form.last_name].filter(Boolean).join(" ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        Опыт
                      </dt>
                      <dd className="mt-1 text-[13.5px]">{form.years_experience || "0"} лет</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        О подходе
                      </dt>
                      <dd className="mt-1 text-[13.5px] leading-[1.55]">{form.bio || "—"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        Подходы и контексты
                      </dt>
                      <dd className="mt-1 text-[13.5px]">
                        {approaches
                          .filter((item) => form.approach_ids.includes(item.id))
                          .map((item) => item.name)
                          .join(", ") || "—"}
                        {form.it_context_ids.length > 0
                          ? ` · ${itContexts
                              .filter((item) => form.it_context_ids.includes(item.id))
                              .map((item) => item.name)
                              .join(", ")}`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        Формат
                      </dt>
                      <dd className="mt-1 text-[13.5px]">
                        {FORMAT_OPTIONS.filter((item) => form.formats.includes(item.value))
                          .map((item) => item.label)
                          .join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        Стоимость
                      </dt>
                      <dd className="mt-1 text-[13.5px]">
                        {Number(form.session_price_rub) > 0
                          ? formatRub(Number(form.session_price_rub))
                          : "—"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
                        Образование
                      </dt>
                      <dd className="mt-1 text-[13.5px] leading-[1.55]">{form.education || "—"}</dd>
                    </div>
                  </dl>

                  <label className="flex cursor-pointer items-start gap-2.5 border-t border-border pt-4 text-[13px] leading-[1.5] text-ink-soft">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    <span>
                      Согласен с проверкой данных и передачей профиля куратору для подбора клиентов
                    </span>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                disabled={step === 0 || busy}
              >
                <ArrowLeftIcon />
                Назад
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={saveDraft} loading={saveMutation.isPending} disabled={busy}>
                  Сохранить черновик
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={goNext} disabled={busy}>
                    Далее
                    <ArrowRightIcon />
                  </Button>
                ) : (
                  <Button onClick={submitProfile} loading={submitMutation.isPending} disabled={busy}>
                    Отправить на модерацию
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
