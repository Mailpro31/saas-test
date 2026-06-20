import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatTotals, sumByCurrency } from "@/lib/money";
import { format, differenceInCalendarDays, subMonths, isSameMonth } from "date-fns";
import { Card, PageHeader, Stat, EmptyState } from "@/components/ui";

export default async function InsightsPage() {
  const user = await requireUser();
  const cur = user.currency;

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { deal: true },
  });
  const deals = await prisma.deal.findMany({ where: { userId: user.id } });

  const paid = invoices.filter((i) => i.status === "Paid" && i.paidAt);

  if (paid.length === 0) {
    return (
      <>
        <PageHeader title="Insights" subtitle="Your earnings, once the money lands." />
        <EmptyState
          title="No paid invoices yet"
          description="As soon as you collect your first payment, your revenue trends and top brands will appear here."
        />
      </>
    );
  }

  // Headline numbers (grouped by currency so they stay accurate).
  const totalPaid = formatTotals(sumByCurrency(paid), cur);
  const avgDealMinor = Math.round(
    paid.reduce((s, i) => s + i.amount, 0) / paid.length,
  );
  const daysToPay = paid.map((i) =>
    Math.max(0, differenceInCalendarDays(i.paidAt!, i.issueDate)),
  );
  const avgDaysToPay = Math.round(
    daysToPay.reduce((s, d) => s + d, 0) / daysToPay.length,
  );

  // Monthly revenue for the last 6 months, in the user's primary currency.
  const primaryPaid = paid.filter((i) => i.currency === cur);
  const months = Array.from({ length: 6 }, (_, idx) => subMonths(new Date(), 5 - idx));
  const monthly = months.map((m) => ({
    label: format(m, "MMM"),
    total: primaryPaid
      .filter((i) => isSameMonth(i.paidAt!, m))
      .reduce((s, i) => s + i.amount, 0),
  }));
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));

  // Top brands by amount paid (each brand keeps its own currency).
  const brandMap = new Map<string, { amount: number; currency: string }>();
  for (const i of paid) {
    const prev = brandMap.get(i.deal.brandName);
    brandMap.set(i.deal.brandName, {
      amount: (prev?.amount ?? 0) + i.amount,
      currency: i.currency,
    });
  }
  const topBrands = [...brandMap.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);

  // Deals by platform (all non-lost deals).
  const platformMap = new Map<string, number>();
  for (const d of deals.filter((d) => d.stage !== "Lost")) {
    const key = d.platform || "Other";
    platformMap.set(key, (platformMap.get(key) ?? 0) + 1);
  }
  const byPlatform = [...platformMap.entries()].sort((a, b) => b[1] - a[1]);
  const dealCount = byPlatform.reduce((s, [, n]) => s + n, 0);

  return (
    <>
      <PageHeader title="Insights" subtitle="Where your money comes from — and how fast." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total collected" value={totalPaid} tone="good" sub={`${paid.length} paid invoices`} />
        <Stat label="Avg invoice" value={formatMoney(avgDealMinor, cur)} sub="Across paid invoices" />
        <Stat
          label="Avg days to pay"
          value={`${avgDaysToPay}d`}
          tone={avgDaysToPay > 30 ? "warn" : "good"}
          sub="Issue → payment"
        />
        <Stat label="Brands paid" value={String(brandMap.size)} sub="Unique paying brands" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-bold text-slate-700">
            Revenue — last 6 months{" "}
            <span className="font-normal text-slate-400">(in {cur})</span>
          </h2>
          <div className="flex h-44 items-end justify-between gap-2">
            {monthly.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-violet-500"
                    style={{ height: `${Math.round((m.total / maxMonthly) * 100)}%` }}
                    title={formatMoney(m.total, cur)}
                  />
                </div>
                <span className="text-xs text-slate-400">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-bold text-slate-700">Top brands</h2>
          <ul className="space-y-2">
            {topBrands.map(([name, { amount, currency }]) => (
              <li key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{name}</span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-bold text-slate-700">Deals by platform</h2>
        <div className="space-y-2">
          {byPlatform.map(([platform, count]) => (
            <div key={platform} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-slate-600">{platform}</span>
              <div className="h-3 flex-1 rounded bg-slate-100">
                <div
                  className="h-3 rounded bg-fuchsia-400"
                  style={{ width: `${Math.round((count / dealCount) * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-slate-400">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
