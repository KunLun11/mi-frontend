import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { oauthAuthorize, type OAuthProvider } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { GithubIcon, GoogleIcon } from "@/components/icons";
import { toast } from "@/store/toast";

const PROVIDERS: Array<{
  provider: OAuthProvider;
  label: string;
  icon: ReactNode;
}> = [
  {
    provider: "google",
    label: "Продолжить с Google",
    icon: <GoogleIcon />,
  },
  {
    provider: "yandex",
    label: "Продолжить с Яндекс ID",
    icon: (
      <span className="grid h-[18px] w-[18px] place-items-center rounded-[4px] bg-[#fc3f1d] text-xs font-bold leading-none text-white">
        Я
      </span>
    ),
  },
  {
    provider: "github",
    label: "Продолжить с GitHub",
    icon: <GithubIcon />,
  },
];

export function OAuthButtons() {
  const mutation = useMutation({
    mutationFn: oauthAuthorize,
    onSuccess: (authorizeUrl) => {
      window.location.assign(authorizeUrl);
    },
    onError: (error) => {
      toast(getErrorMessage(error), "error");
    },
  });

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map(({ provider, label, icon }) => (
        <button
          key={provider}
          type="button"
          onClick={() => mutation.mutate(provider)}
          disabled={mutation.isPending}
          className="flex min-h-11 items-center gap-[11px] rounded border border-border bg-surface px-3.5 text-left text-[13.5px] font-medium text-ink-soft transition hover:-translate-y-px hover:border-border-strong hover:bg-[#f7f9fb] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="grid h-[22px] w-[22px] flex-none place-items-center">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
