"use client";

import { useTransition } from "react";

// A button that runs a bound server action after a confirmation prompt.
export function ConfirmButton({
  action,
  children,
  className,
  confirm = "Are you sure?",
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (!window.confirm(confirm)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
