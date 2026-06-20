import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, sumByCurrency, formatTotals } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { isOverdue, daysOverdue } from "@/lib/invoice";
import { btn, Card, PageHeader, Stat, StageBadge, EmptyState } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireUser();

  const [deals, invoices, upcoming] = await Promise.all([
    prisma.deal.findMany({ where: { userId: user.id } }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { deal: true },
    }),
    prisma.deliverable.findMany({
      where: { deal: { userId: user.id }, done: false, dueDate: { not: null } },
      include: { deal: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  const cur = user.currency;
  const activeDeals = deals.filter((d) => d.stage !== "Lost");
  // Totals are grouped by currency so mixed-currency accounts stay accurate.
  const pipelineValue = formatTotals(
    sumByCurrency(activeDeals.filter((d) => d.stage !== "Paid")),
    cur,
  );
  const paidTotal = formatTotals(
    sumByCurrency(invoices.filter((i) => i.status === "Paid")),
    cur,
  );
  const outstanding = formatTotals(
    sumByCurrency(invoices.filter((i) => i.status !== "Paid")),
    cur,
  );
  const overdueInvoices = invoices.filter(isOverdue);
  const overdueTotal = formatTotals(sumByCurrency(overdueInvoices), cur);

  const recentDeals = [...deals]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]} 👋`}
        subtitle="Here's where your brand deals and money stand today."
        action={
          <Link href="/deals/new" className={btn.primary}>
            + New deal
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pipeline value" value={pipelineValue} sub={`${activeDeals.length} active deals`} />
        <Stat label="Paid" value={paidTotal} tone="good" sub="Collected to date" />
        <Stat label="Outstanding" value={outstanding} tone="warn" sub="Invoiced, awaiting payment" />
        <Stat
          label="Overdue"
          value={overdueTotal}
          tone={overdueInvoices.length > 0 ? "bad" : "default"}
          sub={`${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? "" : "s"}`}
        />
      </div>

      {overdueInvoices.length > 0 && (
        <Card className="mt-6 border-rose-200 bg-rose-50">
          <h2 className="text-sm font-bold text-rose-800">⚠️ Needs chasing</h2>
          <ul className="mt-3 space-y-2">
            {overdueInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  <span className="font-semibold">{inv.deal.brandName}</span> · {inv.number} ·{" "}
                  {formatMoney(inv.amount, inv.currency)}
                  <span className="ml-2 text-rose-600">
                    {daysOverdue(inv.dueDate)} days overdue
                  </span>
                </span>
                <Link href={`/invoices/${inv.id}`} className={btn.danger}>
                  Chase payment →
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Recent deals</h2>
          {recentDeals.length === 0 ? (
            <EmptyState
              title="No deals yet"
              description="Add your first brand deal to start tracking it through to payment."
              cta={{ href: "/deals/new", label: "Add a deal" }}
            />
          ) : (
            <Card className="divide-y divide-slate-100 p-0">
              {recentDeals.map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">{d.brandName}</p>
                    <p className="text-xs text-slate-400">
                      {d.platform || "—"} · {formatMoney(d.amount, d.currency)}
                    </p>
                  </div>
                  <StageBadge stage={d.stage} />
                </Link>
              ))}
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            Upcoming deliverables
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing due"
              description="Deliverable deadlines from your deals will show up here so you never miss one."
            />
          ) : (
            <Card className="divide-y divide-slate-100 p-0">
              {upcoming.map((dv) => {
                const overdue = dv.dueDate! < new Date();
                return (
                  <Link
                    key={dv.id}
                    href={`/deals/${dv.dealId}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{dv.title}</p>
                      <p className="text-xs text-slate-400">{dv.deal.brandName}</p>
                    </div>
                    <span
                      className={`text-xs font-medium ${overdue ? "text-rose-600" : "text-slate-500"}`}
                    >
                      {fmtDate(dv.dueDate)}
                    </span>
                  </Link>
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
