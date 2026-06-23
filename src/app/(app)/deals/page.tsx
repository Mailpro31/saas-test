import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { STAGES, STAGE_LABELS } from "@/lib/constants";
import { btn, PageHeader, EmptyState } from "@/components/ui";

export default async function DealsPage() {
  const user = await requireUser();
  const deals = await prisma.deal.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const lost = deals.filter((d) => d.stage === "Lost");
  const byStage = STAGES.map((stage) => ({
    stage,
    deals: deals.filter((d) => d.stage === stage),
  }));

  return (
    <>
      <PageHeader
        title="Deal pipeline"
        subtitle="Drag your brand deals from first pitch all the way to paid."
        action={
          <Link href="/deals/new" className={btn.primary}>
            + New deal
          </Link>
        }
      />

      {deals.length === 0 ? (
        <EmptyState
          title="Your pipeline is empty"
          description="Track every brand collaboration in one place — from the first DM to the final payment."
          cta={{ href: "/deals/new", label: "Add your first deal" }}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {byStage.map((col) => {
            const total = col.deals.reduce((s, d) => s + d.amount, 0);
            return (
              <div key={col.stage} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-slate-700">
                    {STAGE_LABELS[col.stage]}
                  </span>
                  <span className="text-xs text-slate-400">
                    {col.deals.length}
                  </span>
                </div>
                <div className="mb-2 px-1 text-xs font-medium text-slate-400">
                  {total > 0 ? formatMoney(total, user.currency) : "—"}
                </div>
                <div className="space-y-2">
                  {col.deals.map((d) => (
                    <Link
                      key={d.id}
                      href={`/deals/${d.id}`}
                      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-violet-300 hover:shadow"
                    >
                      <p className="font-medium text-slate-800">{d.brandName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {d.platform || "—"}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {formatMoney(d.amount, d.currency)}
                      </p>
                    </Link>
                  ))}
                  {col.deals.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-300">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lost.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">
            Lost deals ({lost.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {lost.map((d) => (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 line-through hover:bg-slate-50"
              >
                {d.brandName}
              </Link>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
