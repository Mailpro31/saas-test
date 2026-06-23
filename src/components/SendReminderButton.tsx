"use client";

import { useState, useTransition } from "react";
import { btn } from "@/components/ui";
import { sendReminderAction } from "@/app/actions/reminders";

export function SendReminderButton({ reminderId }: { reminderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className={btn.ghost}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await sendReminderAction(reminderId);
            if (!res.ok) setError(res.reason ?? "Send failed");
          })
        }
      >
        {pending ? "Sending…" : "📧 Send email"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
