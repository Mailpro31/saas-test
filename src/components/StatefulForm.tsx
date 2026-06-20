"use client";

import { useActionState } from "react";
import { btn } from "@/components/ui";
import type { FormState } from "@/app/actions/profile";

// Wraps a (prevState, formData) server action and surfaces success/error.
export function StatefulForm({
  action,
  children,
  submitLabel = "Save",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {children}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.ok && <span className="text-sm text-emerald-600">Saved ✓</span>}
        {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}
