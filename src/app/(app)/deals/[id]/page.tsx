import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { fmtDate, toInputDate } from "@/lib/dates";
import { isOverdue } from "@/lib/invoice";
import { aiEnabled } from "@/lib/ai";
import { CURRENCIES, PLATFORM_OPTIONS } from "@/lib/constants";
import {
  btn,
  Card,
  Field,
  PageHeader,
  StageBadge,
  inputClass,
} from "@/components/ui";
import { DealStageControl } from "@/components/DealStageControl";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AiPitchAssistant } from "@/components/AiPitchAssistant";
import {
  updateDealAction,
  deleteDealAction,
  addDeliverableAction,
  toggleDeliverableAction,
  deleteDeliverableAction,
} from "@/app/actions/deals";
import { createInvoiceFromDealAction } from "@/app/actions/invoices";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const deal = await prisma.deal.findFirst({
    where: { id, userId: user.id },
    include: {
      deliverables: { orderBy: { createdAt: "asc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!deal) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={deal.brandName}
        subtitle={`${deal.platform || "Collaboration"} · ${formatMoney(deal.amount, deal.currency)}`}
        action={
          <div className="flex items-center gap-2">
            <StageBadge stage={deal.stage} />
            <DealStageControl dealId={deal.id} stage={deal.stage} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Deliverables */}
          <Card>
            <h2 className="mb-3 text-sm font-bold text-slate-700">Deliverables</h2>
            <ul className="space-y-2">
              {deal.deliverables.map((dv) => (
                <li
                  key={dv.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <form action={toggleDeliverableAction.bind(null, dv.id)} className="flex items-center gap-2">
                    <button
                      type="submit"
                      aria-label="Toggle done"
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        dv.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {dv.done ? "✓" : ""}
                    </button>
                    <span className={dv.done ? "text-slate-400 line-through" : "text-slate-700"}>
                      {dv.title}
                    </span>
                  </form>
                  <div className="flex items-center gap-3">
                    {dv.dueDate && (
                      <span
                        className={`text-xs ${
                          !dv.done && dv.dueDate < new Date()
                            ? "text-rose-600"
                            : "text-slate-400"
                        }`}
                      >
                        {fmtDate(dv.dueDate)}
                      </span>
                    )}
                    <ConfirmButton
                      action={deleteDeliverableAction.bind(null, dv.id)}
                      className="text-xs text-slate-300 hover:text-rose-500"
                      confirm="Delete this deliverable?"
                    >
                      ✕
                    </ConfirmButton>
                  </div>
                </li>
              ))}
              {deal.deliverables.length === 0 && (
                <li className="text-sm text-slate-400">No deliverables yet.</li>
              )}
            </ul>
            <form
              action={addDeliverableAction.bind(null, deal.id)}
              className="mt-3 flex gap-2"
            >
              <input name="title" placeholder="Add a deliverable…" className={inputClass} required />
              <input name="dueDate" type="date" className="rounded-lg border border-slate-300 px-2 text-sm" />
              <button type="submit" className={btn.secondary}>
                Add
              </button>
            </form>
          </Card>

          {/* Invoices */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">Invoices</h2>
              <form action={createInvoiceFromDealAction.bind(null, deal.id)}>
                <button type="submit" className={btn.primary}>
                  + Create invoice
                </button>
              </form>
            </div>
            <ul className="divide-y divide-slate-100">
              {deal.invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-2">
                  <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-violet-700 hover:underline">
                    {inv.number}
                  </Link>
                  <span className="text-sm text-slate-500">
                    {formatMoney(inv.amount, inv.currency)}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      inv.status === "Paid"
                        ? "text-emerald-600"
                        : isOverdue(inv)
                          ? "text-rose-600"
                          : "text-amber-600"
                    }`}
                  >
                    {isOverdue(inv) ? "Overdue" : inv.status}
                  </span>
                </li>
              ))}
              {deal.invoices.length === 0 && (
                <li className="py-2 text-sm text-slate-400">
                  No invoice yet. Create one when the work is delivered.
                </li>
              )}
            </ul>
          </Card>

          {/* AI assistant */}
          <Card>
            <h2 className="mb-3 text-sm font-bold text-slate-700">
              ✍️ Reply assistant
            </h2>
            <AiPitchAssistant brandName={deal.brandName} aiEnabled={aiEnabled()} />
          </Card>
        </div>

        {/* Sidebar: editable details */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-bold text-slate-700">Details</h2>
            <form action={updateDealAction.bind(null, deal.id)} className="space-y-3">
              <Field label="Brand">
                <input name="brandName" defaultValue={deal.brandName} required className={inputClass} />
              </Field>
              <Field label="Platform">
                <select name="platform" defaultValue={deal.platform} className={inputClass}>
                  <option value="">—</option>
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Value">
                  <input name="amount" defaultValue={(deal.amount / 100).toString()} className={inputClass} inputMode="decimal" />
                </Field>
                <Field label="Currency">
                  <select name="currency" defaultValue={deal.currency} className={inputClass}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Payment terms (days)">
                <input name="paymentTermsDays" type="number" defaultValue={deal.paymentTermsDays} className={inputClass} />
              </Field>
              <Field label="Contact name">
                <input name="contactName" defaultValue={deal.contactName} className={inputClass} />
              </Field>
              <Field label="Contact email">
                <input name="contactEmail" type="email" defaultValue={deal.contactEmail} className={inputClass} />
              </Field>
              <Field label="Start date">
                <input name="startDate" type="date" defaultValue={toInputDate(deal.startDate)} className={inputClass} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={3} defaultValue={deal.notes} className={inputClass} />
              </Field>
              <button type="submit" className={`${btn.primary} w-full`}>
                Save changes
              </button>
            </form>
          </Card>

          <ConfirmButton
            action={deleteDealAction.bind(null, deal.id)}
            className={`${btn.danger} w-full`}
            confirm={`Delete the deal with ${deal.brandName}? This cannot be undone.`}
          >
            Delete deal
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}
