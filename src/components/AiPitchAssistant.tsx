"use client";

import { useState, useTransition } from "react";
import { draftPitchReplyAction } from "@/app/actions/profile";
import { btn, inputClass } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

const GOALS = [
  "Respond to an inbound offer and ask for their budget & brief",
  "Negotiate a higher rate politely",
  "Propose a package and next steps",
  "Politely decline but keep the door open",
];

export function AiPitchAssistant({
  brandName,
  aiEnabled,
}: {
  brandName: string;
  aiEnabled: boolean;
}) {
  const [goal, setGoal] = useState(GOALS[0]);
  const [context, setContext] = useState("");
  const [result, setResult] = useState<{ body: string; source: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Draft a reply to {brandName}.{" "}
        {aiEnabled ? (
          <span className="text-emerald-600">Powered by Claude.</span>
        ) : (
          <span className="text-slate-400">
            Using built-in templates (add an API key for AI drafts).
          </span>
        )}
      </p>
      <select
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className={inputClass}
      >
        {GOALS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Optional context (e.g. they offered $800 for 2 Reels, I usually charge $1,200)"
        rows={2}
        className={inputClass}
      />
      <button
        type="button"
        disabled={pending}
        className={btn.primary}
        onClick={() => {
          startTransition(async () => {
            const res = await draftPitchReplyAction({ brandName, goal, context });
            setResult(res);
          });
        }}
      >
        {pending ? "Drafting…" : "Draft reply"}
      </button>

      {result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {result.source === "ai" ? "Claude draft" : "Template draft"}
            </span>
            <CopyButton text={result.body} className={btn.ghost} />
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
            {result.body}
          </pre>
        </div>
      )}
    </div>
  );
}
