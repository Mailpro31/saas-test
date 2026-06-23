"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { parseMoney } from "@/lib/money";
import { draftPitchReply } from "@/lib/ai";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  businessName: z.string().trim().max(120).optional().default(""),
  currency: z.string().trim().max(8).default("USD"),
  lateFeePercent: z.coerce.number().min(0).max(100).default(5),
  paymentDetails: z.string().max(2000).optional().default(""),
});

export type FormState = { error?: string; ok?: boolean };

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  revalidatePath("/settings");
  return { ok: true };
}

type PlatformEntry = { platform: string; handle: string; followers: number };

function parsePlatforms(formData: FormData): PlatformEntry[] {
  const names = formData.getAll("pName").map(String);
  const handles = formData.getAll("pHandle").map(String);
  const followers = formData.getAll("pFollowers").map(String);
  const out: PlatformEntry[] = [];
  for (let i = 0; i < names.length; i++) {
    const platform = (names[i] ?? "").trim();
    const handle = (handles[i] ?? "").trim();
    const count = Math.max(0, Math.round(Number(followers[i]) || 0));
    // Skip rows the user left blank.
    if (!platform || (!handle && count === 0)) continue;
    out.push({ platform, handle, followers: count });
  }
  return out;
}

const mediaKitSchema = z.object({
  handle: z.string().trim().min(2).max(32),
  tagline: z.string().trim().max(160).optional().default(""),
  bio: z.string().max(2000).optional().default(""),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #6d28d9")
    .default("#6d28d9"),
});

export async function updateMediaKitAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = mediaKitSchema.safeParse({
    handle: formData.get("handle"),
    tagline: formData.get("tagline"),
    bio: formData.get("bio"),
    brandColor: formData.get("brandColor"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const handle = slugify(parsed.data.handle);
  if (!handle) return { error: "Handle must contain letters or numbers" };

  // Ensure the handle isn't taken by someone else.
  const clash = await prisma.user.findFirst({
    where: { handle, NOT: { id: user.id } },
    select: { id: true },
  });
  if (clash) return { error: "That handle is already taken" };

  const platforms = parsePlatforms(formData);
  const audienceTotal = platforms.reduce((sum, p) => sum + p.followers, 0);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      handle,
      tagline: parsed.data.tagline,
      bio: parsed.data.bio,
      brandColor: parsed.data.brandColor,
      platforms: JSON.stringify(platforms),
      audienceTotal,
      mediaKitPublic: formData.get("mediaKitPublic") === "on",
    },
  });
  revalidatePath("/media-kit");
  revalidatePath(`/m/${handle}`);
  return { ok: true };
}

export async function addPackageAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const count = await prisma.package.count({ where: { userId: user.id } });
  await prisma.package.create({
    data: {
      userId: user.id,
      name: name.slice(0, 120),
      description: String(formData.get("description") ?? "").slice(0, 400),
      price: parseMoney(String(formData.get("price") ?? "0")),
      currency: user.currency,
      sortOrder: count,
    },
  });
  revalidatePath("/media-kit");
}

export async function deletePackageAction(packageId: string) {
  const user = await requireUser();
  await prisma.package.deleteMany({
    where: { id: packageId, userId: user.id },
  });
  revalidatePath("/media-kit");
}

// Used by the AI assistant on the deal page to draft an outreach/negotiation reply.
export async function draftPitchReplyAction(input: {
  brandName: string;
  goal: string;
  context: string;
}) {
  const user = await requireUser();
  return draftPitchReply({
    creatorName: user.name,
    brandName: input.brandName,
    goal: input.goal,
    context: input.context,
  });
}
