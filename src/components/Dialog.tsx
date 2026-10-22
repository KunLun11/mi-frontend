import { useEffect, useRef, type ReactNode } from "react";

import { CloseIcon } from "@/components/icons";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="m-auto w-[min(520px,calc(100%-32px))] rounded-lg border-0 bg-transparent p-0 backdrop:bg-[rgba(24,24,24,0.34)]"
    >
      <div className="relative rounded-lg border border-border bg-surface p-6 shadow-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-[7px] text-muted transition hover:bg-surface-soft hover:text-ink"
          aria-label="Закрыть"
        >
          <CloseIcon />
        </button>

        <div className="pr-11">
          <h2 className="text-[22px] leading-[1.2] tracking-[-0.025em]">{title}</h2>
          {description ? (
            <p className="mt-[7px] text-[13.5px] leading-[1.5] text-muted">{description}</p>
          ) : null}
        </div>

        <div className="mt-[22px]">{children}</div>

        {footer ? (
          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-[18px]">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
