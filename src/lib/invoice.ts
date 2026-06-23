import { prisma } from "@/lib/db";

export type LineItem = { description: string; amount: number };

export function parseLineItems(json: string): LineItem[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i) =>
          i && typeof i.description === "string" && typeof i.amount === "number",
      )
      .map((i) => ({ description: i.description, amount: i.amount }));
  } catch {
    return [];
  }
}

// Generate a sequential, human-friendly invoice number per user: INV-0001.
// Derives the next number from the highest existing one (not a row count) so
// deleting an invoice never causes a number to be reused — which would collide
// with the @@unique([userId, number]) constraint.
export async function nextInvoiceNumber(userId: string): Promise<string> {
  const last = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastN = last ? Number.parseInt(last.number.replace(/\D/g, ""), 10) || 0 : 0;
  return `INV-${String(lastN + 1).padStart(4, "0")}`;
}

// An invoice is overdue when it's unpaid and past its due date.
export function isOverdue(invoice: {
  status: string;
  dueDate: Date;
}): boolean {
  return invoice.status !== "Paid" && invoice.dueDate.getTime() < Date.now();
}

export function daysOverdue(dueDate: Date): number {
  const ms = Date.now() - dueDate.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / (1000 * 60 * 60 * 24));
}
