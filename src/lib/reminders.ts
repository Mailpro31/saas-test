import { formatMoney } from "@/lib/money";

export type ReminderContext = {
  creatorName: string;
  businessName: string;
  brandName: string;
  contactName: string;
  invoiceNumber: string;
  amountMinor: number;
  currency: string;
  dueDateLabel: string;
  daysOverdue: number;
  lateFeePercent: number;
  paymentDetails: string;
};

export const REMINDER_LEVELS = [
  { level: 1, name: "Friendly nudge", offsetDays: 0, tone: "warm and upbeat" },
  { level: 2, name: "Gentle reminder", offsetDays: 7, tone: "polite but clearer" },
  { level: 3, name: "Firm follow-up", offsetDays: 14, tone: "firm and professional" },
  { level: 4, name: "Final notice + late fee", offsetDays: 30, tone: "serious, formal" },
] as const;

export function levelMeta(level: number) {
  return REMINDER_LEVELS.find((l) => l.level === level) ?? REMINDER_LEVELS[0];
}

// Accepts any object with the three relevant fields (e.g. a full ReminderContext).
export function lateFeeMinor(input: {
  amountMinor: number;
  lateFeePercent: number;
  daysOverdue: number;
}): number {
  if (input.daysOverdue <= 0) return 0;
  return Math.round((input.amountMinor * input.lateFeePercent) / 100);
}

// Built-in escalation templates. These are intentionally good enough to send
// as-is, so the product is fully functional without any AI provider.
export function buildReminderTemplate(ctx: ReminderContext, level: number) {
  const greeting = ctx.contactName ? `Hi ${ctx.contactName},` : `Hi there,`;
  const amount = formatMoney(ctx.amountMinor, ctx.currency);
  const signoff = `Best,\n${ctx.creatorName}${
    ctx.businessName ? `\n${ctx.businessName}` : ""
  }`;
  const payLine = ctx.paymentDetails
    ? `\n\nPayment details:\n${ctx.paymentDetails}`
    : "";

  switch (level) {
    case 1:
      return {
        subject: `Invoice ${ctx.invoiceNumber} — just a quick heads up`,
        body: `${greeting}\n\nHope the campaign with ${ctx.brandName} is performing well! This is a friendly heads up that invoice ${ctx.invoiceNumber} for ${amount} is due on ${ctx.dueDateLabel}.\n\nNo action needed if it's already on its way — just keeping us both in sync.${payLine}\n\n${signoff}`,
      };
    case 2:
      return {
        subject: `Reminder: invoice ${ctx.invoiceNumber} (${amount}) is now due`,
        body: `${greeting}\n\nJust following up on invoice ${ctx.invoiceNumber} for ${amount}, which was due on ${ctx.dueDateLabel}${
          ctx.daysOverdue > 0 ? ` (${ctx.daysOverdue} days ago)` : ""
        }. Could you let me know the expected payment date?\n\nHappy to resend the invoice or sort out anything that's holding it up.${payLine}\n\n${signoff}`,
      };
    case 3:
      return {
        subject: `Action needed: invoice ${ctx.invoiceNumber} is ${ctx.daysOverdue} days overdue`,
        body: `${greeting}\n\nI still haven't received payment for invoice ${ctx.invoiceNumber} (${amount}), now ${ctx.daysOverdue} days past the due date of ${ctx.dueDateLabel}. I'd appreciate your help getting this resolved this week.\n\nIf there's an issue with the invoice or the approval process, please let me know who I should follow up with.${payLine}\n\n${signoff}`,
      };
    default: {
      const fee = lateFeeMinor(ctx);
      const total = ctx.amountMinor + fee;
      return {
        subject: `Final notice: invoice ${ctx.invoiceNumber} — ${ctx.daysOverdue} days overdue`,
        body: `${greeting}\n\nThis is a final notice regarding invoice ${ctx.invoiceNumber}, originally due ${ctx.dueDateLabel} and now ${ctx.daysOverdue} days overdue. As per the agreed terms, a late fee of ${ctx.lateFeePercent}% (${formatMoney(
          fee,
          ctx.currency,
        )}) now applies, bringing the total to ${formatMoney(total, ctx.currency)}.\n\nPlease arrange payment within 5 business days to avoid further action.${payLine}\n\n${signoff}`,
      };
    }
  }
}
