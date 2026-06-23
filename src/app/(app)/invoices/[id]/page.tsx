import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { parseLineItems, isOverdue, daysOverdue } from "@/lib/invoice";
import { lateFeeMinor, levelMeta } from "@/lib/reminders";
import { aiEnabled } from "@/lib/ai";
import { emailEnabled } from "@/lib/email";
import { btn, Card, PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ReminderGenerator } from "@/components/ReminderGenerator";
import { SendReminderButton } from "@/components/SendReminderButton";
import {
  setInvoiceStatusAction,
  deleteInvoiceAction,
} from "@/app/actions/invoices";
import {
  markReminderSentAction,
  deleteReminderAction,
} from "@/app/actions/reminders";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: {
      deal: true,
      reminders: { orderBy: { level: "asc" } },
    },
  });
  if (!invoice) notFound();

  const items = parseLineItems(invoice.lineItems);
  // Whether the "Send email" action can be offered for this invoice's reminders.
  const canEmail = emailEnabled() && Boolean(invoice.deal.contactEmail);
  const overdue = isOverdue(invoice);
  const overdueDays = daysOverdue(invoice.dueDate);
  // Only apply a late fee while the invoice is genuinely overdue — never on an
  // invoice that has already been paid (even if it was paid late).
  const fee = overdue
    ? lateFeeMinor({
        amountMinor: invoice.amount,
        lateFeePercent: user.lateFeePercent,
        daysOverdue: overdueDays,
      })
    : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print">
        <PageHeader
          title={`Invoice ${invoice.number}`}
          subtitle={`${invoice.deal.brandName} · ${formatMoney(invoice.amount, invoice.currency)}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <PrintButton />
              {(["Draft", "Sent", "Paid"] as const).map((s) => (
                <form key={s} action={setInvoiceStatusAction.bind(null, invoice.id, s)}>
                  <button
                    type="submit"
                    className={
                      invoice.status === s ? btn.primary : btn.secondary
                    }
                  >
                    {s === "Paid" ? "✓ Mark paid" : `Mark ${s}`}
                  </button>
                </form>
              ))}
            </div>
          }
        />
      </div>

      {/* The printable invoice sheet */}
      <div className="print-sheet rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {user.businessName || user.name}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase tracking-wide text-slate-400">
              Invoice
            </p>
            <p className="font-mono text-sm text-slate-700">{invoice.number}</p>
            {overdue && (
              <p className="mt-1 text-xs font-semibold text-rose-600">
                {overdueDays} days overdue
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase text-slate-400">Bill to</p>
            <p className="font-medium text-slate-800">{invoice.deal.brandName}</p>
            {invoice.deal.contactName && (
              <p className="text-slate-600">{invoice.deal.contactName}</p>
            )}
            {invoice.deal.contactEmail && (
              <p className="text-slate-600">{invoice.deal.contactEmail}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">
              Issued: {fmtDate(invoice.issueDate)}
            </p>
            <p className="text-sm text-slate-600">Due: {fmtDate(invoice.dueDate)}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 text-slate-700">{it.description}</td>
                <td className="py-2 text-right text-slate-700">
                  {formatMoney(it.amount, invoice.currency)}
                </td>
              </tr>
            ))}
            {fee > 0 && (
              <tr className="border-b border-slate-100">
                <td className="py-2 text-rose-600">
                  Late fee ({user.lateFeePercent}%)
                </td>
                <td className="py-2 text-right text-rose-600">
                  {formatMoney(fee, invoice.currency)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-semibold text-slate-500">Total</td>
              <td className="py-3 text-right text-lg font-bold text-slate-900">
                {formatMoney(invoice.amount + fee, invoice.currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
              Payment details
            </p>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment-chasing engine */}
      <div className="no-print mt-6 space-y-6">
        <Card>
          <h2 className="mb-3 text-sm font-bold text-slate-700">
            💸 Payment reminders
          </h2>
          <ReminderGenerator invoiceId={invoice.id} aiEnabled={aiEnabled()} />
        </Card>

        {invoice.reminders.length > 0 && (
          <div className="space-y-3">
            {invoice.reminders.map((r) => (
              <Card key={r.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                      Step {r.level}: {levelMeta(r.level).name}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        r.status === "Sent" ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {r.status === "Sent"
                        ? `Sent ${fmtDate(r.sentAt)}`
                        : `Scheduled ${fmtDate(r.scheduledFor)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton
                      text={`Subject: ${r.subject}\n\n${r.body}`}
                      className={btn.ghost}
                      label="Copy"
                    />
                    {r.status !== "Sent" && canEmail && (
                      <SendReminderButton reminderId={r.id} />
                    )}
                    {r.status !== "Sent" && (
                      <form action={markReminderSentAction.bind(null, r.id)}>
                        <button type="submit" className={btn.ghost}>
                          Mark sent
                        </button>
                      </form>
                    )}
                    <ConfirmButton
                      action={deleteReminderAction.bind(null, r.id)}
                      className={btn.ghost}
                      confirm="Delete this reminder?"
                    >
                      ✕
                    </ConfirmButton>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-800">{r.subject}</p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-600">
                  {r.body}
                </pre>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <Link href={`/deals/${invoice.dealId}`} className={btn.secondary}>
            ← Back to deal
          </Link>
          <ConfirmButton
            action={deleteInvoiceAction.bind(null, invoice.id)}
            className={btn.danger}
            confirm={`Delete invoice ${invoice.number}?`}
          >
            Delete invoice
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}
