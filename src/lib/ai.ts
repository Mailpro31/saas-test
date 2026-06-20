import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildReminderTemplate,
  lateFeeMinor,
  levelMeta,
  type ReminderContext,
} from "@/lib/reminders";
import { formatMoney } from "@/lib/money";

// Default to the latest Sonnet: a strong balance of quality and cost for
// short drafting tasks. Override with ANTHROPIC_MODEL if desired.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export type DraftResult = {
  subject: string;
  body: string;
  source: "ai" | "template";
};

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// Ask Claude for JSON and parse it defensively.
async function completeJSON(
  system: string,
  user: string,
): Promise<Record<string, unknown> | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch (err) {
    console.error("AI draft failed, falling back to template:", err);
    return null;
  }
}

export async function draftReminder(
  ctx: ReminderContext,
  level: number,
): Promise<DraftResult> {
  const fallback = buildReminderTemplate(ctx, level);
  const meta = levelMeta(level);
  const fee = lateFeeMinor(ctx);

  const system =
    "You are an assistant that writes payment-chasing emails for independent creators and freelancers. " +
    "Write a short, effective email matching the requested tone. Never be rude. " +
    'Respond ONLY with JSON: {"subject": "...", "body": "..."}. Use \\n for newlines in the body.';

  const user = [
    `Tone: ${meta.tone} (escalation level ${level} of 4).`,
    `From: ${ctx.creatorName}${ctx.businessName ? ` (${ctx.businessName})` : ""}`,
    `To: ${ctx.contactName || "the brand contact"} at ${ctx.brandName}`,
    `Invoice ${ctx.invoiceNumber} for ${formatMoney(ctx.amountMinor, ctx.currency)}, due ${ctx.dueDateLabel}.`,
    ctx.daysOverdue > 0
      ? `It is ${ctx.daysOverdue} days overdue.`
      : `It is not yet overdue.`,
    level >= 4 && fee > 0
      ? `Mention a ${ctx.lateFeePercent}% late fee of ${formatMoney(fee, ctx.currency)} (new total ${formatMoney(ctx.amountMinor + fee, ctx.currency)}).`
      : "",
    ctx.paymentDetails ? `Payment details to include: ${ctx.paymentDetails}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const json = await completeJSON(system, user);
  if (json && typeof json.subject === "string" && typeof json.body === "string") {
    return { subject: json.subject, body: json.body, source: "ai" };
  }
  return { ...fallback, source: "template" };
}

// Draft a reply to a brand for negotiation / pitch handling.
export async function draftPitchReply(input: {
  creatorName: string;
  brandName: string;
  goal: string;
  context: string;
}): Promise<{ body: string; source: "ai" | "template" }> {
  const fallback = {
    body: `Hi,\n\nThanks so much for reaching out about a collaboration with ${input.brandName} — I'd love to explore this.\n\n${input.goal}\n\nCould you share the campaign timeline, deliverables, and budget so I can put together a tailored proposal? Happy to hop on a quick call as well.\n\nLooking forward to working together!\n\nBest,\n${input.creatorName}`,
    source: "template" as const,
  };

  const system =
    "You write concise, friendly, professional outreach replies for a content creator negotiating brand deals. " +
    'Respond ONLY with JSON: {"body": "..."} using \\n for newlines.';
  const user = [
    `Creator: ${input.creatorName}`,
    `Brand: ${input.brandName}`,
    `Goal of this reply: ${input.goal}`,
    input.context ? `Context: ${input.context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const json = await completeJSON(system, user);
  if (json && typeof json.body === "string") {
    return { body: json.body, source: "ai" };
  }
  return fallback;
}
