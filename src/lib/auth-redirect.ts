import type { UserPublic } from "@/store/auth";

export type AppRole = UserPublic["role"];

export function dashboardPathFor(role: AppRole): string {
  switch (role) {
    case "psychologist":
      return "/dashboard/psychologist";
    case "client":
      return "/dashboard/client";
    default:
      return "/";
  }
}

export function postVerifyPathFor(role: AppRole): string {
  return role === "psychologist" ? "/onboarding/psychologist" : "/dashboard/client";
}

/**
 * Разрешает только относительные внутренние пути, чтобы `?next=`
 * нельзя было использовать для open redirect.
 */
export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}
