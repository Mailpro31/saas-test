import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, emailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

// Auto-send any drafted payment reminders that are now due.
//
// Schedule this on a daily cron (see vercel.json). Protect it with a secret:
// the request must carry `Authorization: Bearer <CRON_SECRET>`. Vercel Cron
// sends this header automatically when CRON_SECRET is set in the project.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!emailEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Email provider not configured (set RESEND_API_KEY)" },
      { status: 503 },
    );
  }

  // Drafted reminders whose scheduled date has arrived, for unpaid invoices.
  const due = await prisma.reminder.findMany({
    where: {
      status: "Draft",
      scheduledFor: { lte: new Date() },
      invoice: { status: { not: "Paid" } },
    },
    include: { invoice: { include: { deal: true, user: true } } },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const reminder of due) {
    const to = reminder.invoice.deal.contactEmail;
    if (!to) {
      skipped++;
      continue;
    }
    const result = await sendEmail({
      to,
      subject: reminder.subject,
      text: reminder.body,
      replyTo: reminder.invoice.user.email,
    });
    if (result.ok) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "Sent", sentAt: new Date() },
      });
      sent++;
    } else {
      skipped++;
      if (result.reason) errors.push(`${reminder.id}: ${result.reason}`);
    }
  }

  return NextResponse.json({ ok: true, checked: due.length, sent, skipped, errors });
}
