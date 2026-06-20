"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { draftReminder } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { levelMeta, type ReminderContext } from "@/lib/reminders";
import { daysOverdue } from "@/lib/invoice";
import { fmtDate, addDays } from "@/lib/dates";

async function loadInvoiceForUser(invoiceId: string, userId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { deal: true, user: true },
  });
}

function buildContext(invoice: {
  number: string;
  amount: number;
  currency: string;
  dueDate: Date;
  deal: { brandName: string; contactName: string };
  user: {
    name: string;
    businessName: string;
    lateFeePercent: number;
    paymentDetails: string;
  };
}): ReminderContext {
  return {
    creatorName: invoice.user.name,
    businessName: invoice.user.businessName,
    brandName: invoice.deal.brandName,
    contactName: invoice.deal.contactName,
    invoiceNumber: invoice.number,
    amountMinor: invoice.amount,
    currency: invoice.currency,
    dueDateLabel: fmtDate(invoice.dueDate),
    daysOverdue: daysOverdue(invoice.dueDate),
    lateFeePercent: invoice.user.lateFeePercent,
    paymentDetails: invoice.user.paymentDetails,
  };
}

// Draft a single reminder at the given escalation level (1-4).
export async function generateReminderAction(invoiceId: string, level: number) {
  const user = await requireUser();
  if (![1, 2, 3, 4].includes(level)) throw new Error("Invalid reminder level");
  const invoice = await loadInvoiceForUser(invoiceId, user.id);
  if (!invoice) throw new Error("Invoice not found");

  const draft = await draftReminder(buildContext(invoice), level);
  await prisma.reminder.create({
    data: {
      invoiceId,
      level,
      subject: draft.subject,
      body: draft.body,
      status: "Draft",
      scheduledFor: addDays(levelMeta(level).offsetDays, invoice.dueDate),
    },
  });
  revalidatePath(`/invoices/${invoiceId}`);
  return draft.source;
}

// Draft the full 4-step escalation sequence at once.
export async function generateSequenceAction(invoiceId: string) {
  const user = await requireUser();
  const invoice = await loadInvoiceForUser(invoiceId, user.id);
  if (!invoice) throw new Error("Invoice not found");

  const ctx = buildContext(invoice);
  // The four drafts are independent, so generate them in parallel and persist
  // in a single write — avoids ~4x latency and the risk of a partial sequence.
  const levels = [1, 2, 3, 4];
  const drafts = await Promise.all(levels.map((level) => draftReminder(ctx, level)));
  await prisma.reminder.createMany({
    data: drafts.map((draft, i) => ({
      invoiceId,
      level: levels[i],
      subject: draft.subject,
      body: draft.body,
      status: "Draft",
      scheduledFor: addDays(levelMeta(levels[i]).offsetDays, invoice.dueDate),
    })),
  });
  revalidatePath(`/invoices/${invoiceId}`);
}

// Email a drafted reminder to the brand contact and mark it sent on success.
// Returns the send result so the UI can surface a failure without marking sent.
export async function sendReminderAction(
  reminderId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const user = await requireUser();
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, invoice: { userId: user.id } },
    include: { invoice: { include: { deal: true } } },
  });
  if (!reminder) throw new Error("Not found");

  const to = reminder.invoice.deal.contactEmail;
  if (!to) return { ok: false, reason: "This deal has no contact email" };

  const result = await sendEmail({
    to,
    subject: reminder.subject,
    text: reminder.body,
    replyTo: user.email,
  });
  if (!result.ok) return { ok: false, reason: result.reason };

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: "Sent", sentAt: new Date() },
  });
  revalidatePath(`/invoices/${reminder.invoiceId}`);
  return { ok: true };
}

export async function markReminderSentAction(reminderId: string) {
  const user = await requireUser();
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, invoice: { userId: user.id } },
  });
  if (!reminder) throw new Error("Not found");
  await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: "Sent", sentAt: new Date() },
  });
  revalidatePath(`/invoices/${reminder.invoiceId}`);
}

export async function deleteReminderAction(reminderId: string) {
  const user = await requireUser();
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, invoice: { userId: user.id } },
    select: { id: true, invoiceId: true },
  });
  if (!reminder) return;
  await prisma.reminder.delete({ where: { id: reminderId } });
  revalidatePath(`/invoices/${reminder.invoiceId}`);
}
