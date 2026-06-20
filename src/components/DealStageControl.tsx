"use client";

import { useTransition } from "react";
import { ALL_STAGES, STAGE_LABELS } from "@/lib/constants";
import { moveDealStageAction } from "@/app/actions/deals";

export function DealStageControl({
  dealId,
  stage,
}: {
  dealId: string;
  stage: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Deal stage"
      defaultValue={stage}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await moveDealStageAction(dealId, next);
        });
      }}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-60"
    >
      {ALL_STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
