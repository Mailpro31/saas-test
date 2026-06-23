import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { isOverdue, daysOverdue } from "@/lib/invoice";
import { Card, PageHeader, EmptyState } from "@/components/ui";

export default async function InvoicesPage() {
  const user = await requireUser();
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { deal: true },
    orderBy: { issueDate: "desc" },
  });

  return (
    <>
      <PageHeader title="Invoices" subtitle="Every invoice and where it stands." />

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Open a deal and create an invoice once you've delivered the work."
          cta={{ href: "/deals", label: "Go to deals" }}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const overdue = isOverdue(inv);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-violet-700 hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{inv.deal.brandName}</td>
                    <td className="px-5 py-3 text-slate-700">{formatMoney(inv.amount, inv.currency)}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {fmtDate(inv.dueDate)}
                      {overdue && (
                        <span className="ml-2 text-xs text-rose-600">
                          {daysOverdue(inv.dueDate)}d late
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          inv.status === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : overdue
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {overdue ? "Overdue" : inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
