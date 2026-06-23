"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nextInvoiceNumber, type LineItem } from "@/lib/invoice";
import { addDays } from "@/lib/dates";

// Create an invoice from a deal, seeding a single line item from the deal value.
export async function createInvoiceFromDealAction(dealId: string) {
  const user = await requireUser();
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, userId: user.id },
  });
  if (!deal) throw new Error("Deal not found");

  const lineItems: LineItem[] = [
    {
      description: `${deal.platform ? deal.platform + " " : ""}collaboration — ${deal.brandName}`,
      amount: deal.amount,
    },
  ];

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      dealId: deal.id,
      number: await nextInvoiceNumber(user.id),
      status: "Draft",
      issueDate: new Date(),
      dueDate: addDays(deal.paymentTermsDays),
      amount: deal.amount,
      currency: deal.currency,
      notes: user.paymentDetails,
      lineItems: JSON.stringify(lineItems),
    },
  });

  // Advance the deal to "Invoiced" if it isn't already paid.
  if (deal.stage !== "Paid") {
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: "Invoiced" },
    });
  }

  revalidatePath(`/deals/${dealId}`);
  redirect(`/invoices/${invoice.id}`);
}

export async function setInvoiceStatusAction(invoiceId: string, status: string) {
  const user = await requireUser();
  if (!["Draft", "Sent", "Paid"].includes(status)) {
    throw new Error("Invalid status");
  }
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: user.id },
  });
  if (!invoice) throw new Error("Invoice not found");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      paidAt: status === "Paid" ? new Date() : null,
    },
  });

  // Keep the parent deal in sync with the invoice. updateMany is scoped by
  // userId (defensive) and won't throw if the deal is gone.
  if (status === "Paid") {
    await prisma.deal.updateMany({
      where: { id: invoice.dealId, userId: user.id },
      data: { stage: "Paid", paidAt: new Date() },
    });
  } else if (invoice.status === "Paid") {
    // Reverting a previously-paid invoice: pull the deal back out of "Paid".
    await prisma.deal.updateMany({
      where: { id: invoice.dealId, userId: user.id },
      data: { stage: "Invoiced", paidAt: null },
    });
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/deals/${invoice.dealId}`);
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
}

export async function deleteInvoiceAction(invoiceId: string) {
  const user = await requireUser();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: user.id },
    select: { id: true, dealId: true },
  });
  if (!invoice) return;
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath(`/deals/${invoice.dealId}`);
  redirect(`/deals/${invoice.dealId}`);
}
