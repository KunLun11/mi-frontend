const rubFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatRub(value: number): string {
  return `${rubFormatter.format(value)} ₽`;
}

/** Часовой пояс браузера — для дашбордов без явного профиля с timezone. */
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow";
}

export function formatDateTime(iso: string, timeZone = "Europe/Moscow"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatDate(iso: string, timeZone = "Europe/Moscow"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone,
  }).format(date);
}

export function formatDayParts(
  iso: string,
  timeZone = "Europe/Moscow",
): { day: string; month: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { day: "—", month: "" };
  }
  const parts = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone,
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "—";
  const month = (parts.find((part) => part.type === "month")?.value ?? "").replace(".", "");
  return { day, month };
}

export function formatTime(iso: string, timeZone = "Europe/Moscow"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}
