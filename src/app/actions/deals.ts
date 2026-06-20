"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { dateFromInput } from "@/lib/dates";
import { ALL_STAGES } from "@/lib/constants";

const dealSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required").max(120),
  contactName: z.string().trim().max(120).optional().default(""),
  contactEmail: z
    .union([z.string().trim().email(), z.literal("")])
    .optional()
    .default(""),
  platform: z.string().trim().max(40).optional().default(""),
  amount: z.string().optional().default("0"),
  // Empty by default so we can fall back to the user's configured currency.
  currency: z.string().trim().max(8).optional().default(""),
  paymentTermsDays: z.coerce.number().int().min(0).max(180).default(30),
  notes: z.string().max(4000).optional().default(""),
});

export async function createDealAction(formData: FormData) {
  const user = await requireUser();
  const parsed = dealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid deal");
  }
  const d = parsed.data;
  const deal = await prisma.deal.create({
    data: {
      userId: user.id,
      brandName: d.brandName,
      contactName: d.contactName,
      contactEmail: d.contactEmail,
      platform: d.platform,
      amount: parseMoney(d.amount),
      currency: d.currency || user.currency,
      paymentTermsDays: d.paymentTermsDays,
      notes: d.notes,
      startDate: dateFromInput(formData.get("startDate")),
    },
  });
  redirect(`/deals/${deal.id}`);
}

export async function updateDealAction(dealId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = dealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid deal");
  }
  const d = parsed.data;
  // updateMany with userId scope ensures users can only edit their own deals.
  await prisma.deal.updateMany({
    where: { id: dealId, userId: user.id },
    data: {
      brandName: d.brandName,
      contactName: d.contactName,
      contactEmail: d.contactEmail,
      platform: d.platform,
      amount: parseMoney(d.amount),
      currency: d.currency || user.currency,
      paymentTermsDays: d.paymentTermsDays,
      notes: d.notes,
      startDate: dateFromInput(formData.get("startDate")),
    },
  });
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
}

export async function moveDealStageAction(dealId: string, stage: string) {
  const user = await requireUser();
  if (!ALL_STAGES.includes(stage as (typeof ALL_STAGES)[number])) {
    throw new Error("Unknown stage");
  }
  await prisma.deal.updateMany({
    where: { id: dealId, userId: user.id },
    data: {
      stage,
      paidAt: stage === "Paid" ? new Date() : null,
    },
  });
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
}

export async function deleteDealAction(dealId: string) {
  const user = await requireUser();
  await prisma.deal.deleteMany({ where: { id: dealId, userId: user.id } });
  revalidatePath("/deals");
  redirect("/deals");
}

// --- Deliverables ---

export async function addDeliverableAction(dealId: string, formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  // Confirm the deal belongs to the user before attaching.
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, userId: user.id },
    select: { id: true },
  });
  if (!deal) throw new Error("Deal not found");
  await prisma.deliverable.create({
    data: {
      dealId,
      title: title.slice(0, 200),
      dueDate: dateFromInput(formData.get("dueDate")),
    },
  });
  revalidatePath(`/deals/${dealId}`);
}

export async function toggleDeliverableAction(deliverableId: string) {
  const user = await requireUser();
  const deliverable = await prisma.deliverable.findFirst({
    where: { id: deliverableId, deal: { userId: user.id } },
  });
  if (!deliverable) throw new Error("Not found");
  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { done: !deliverable.done },
  });
  revalidatePath(`/deals/${deliverable.dealId}`);
}

export async function deleteDeliverableAction(deliverableId: string) {
  const user = await requireUser();
  const deliverable = await prisma.deliverable.findFirst({
    where: { id: deliverableId, deal: { userId: user.id } },
    select: { id: true, dealId: true },
  });
  if (!deliverable) return;
  await prisma.deliverable.delete({ where: { id: deliverableId } });
  revalidatePath(`/deals/${deliverable.dealId}`);
}
