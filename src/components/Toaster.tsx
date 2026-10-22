import { AlertCircleIcon, CheckCircleIcon } from "@/components/icons";
import { useToastStore } from "@/store/toast";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-40px))] flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-start gap-2.5 rounded border border-[#3a3a3a] bg-ink px-3.5 py-3 text-[13px] leading-[1.45] text-white shadow-pop"
        >
          <span
            className={
              toast.tone === "error"
                ? "mt-px text-[#f0a99f]"
                : toast.tone === "success"
                  ? "mt-px text-[#a8d8c0]"
                  : "mt-px text-[#b9d2e6]"
            }
          >
            {toast.tone === "error" ? <AlertCircleIcon /> : <CheckCircleIcon />}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="-mr-1 rounded px-1 text-white/60 transition hover:text-white"
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
