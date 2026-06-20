"use client";

import { useState, useTransition } from "react";
import { btn } from "@/components/ui";
import {
  generateSequenceAction,
  generateReminderAction,
} from "@/app/actions/reminders";
import { REMINDER_LEVELS } from "@/lib/reminders";

export function ReminderGenerator({
  invoiceId,
  aiEnabled,
}: {
  invoiceId: string;
  aiEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        {aiEnabled ? (
          <span className="text-emerald-600">
            Drafts are written by Claude, tuned to each escalation level.
          </span>
        ) : (
          "Drafts use built-in escalation templates. Add an Anthropic API key to write them with Claude."
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className={btn.primary}
          onClick={() =>
            startTransition(async () => {
              await generateSequenceAction(invoiceId);
              setNote("Drafted the full 4-step sequence below.");
            })
          }
        >
          {pending ? "Drafting…" : "Draft full 4-step sequence"}
        </button>
        {REMINDER_LEVELS.map((l) => (
          <button
            key={l.level}
            type="button"
            disabled={pending}
            className={btn.secondary}
            onClick={() =>
              startTransition(async () => {
                const source = await generateReminderAction(invoiceId, l.level);
                setNote(
                  `Drafted "${l.name}" (${source === "ai" ? "AI" : "template"}).`,
                );
              })
            }
          >
            {l.level}. {l.name}
          </button>
        ))}
      </div>
      {note && <p className="text-xs text-slate-400">{note}</p>}
    </div>
  );
}
