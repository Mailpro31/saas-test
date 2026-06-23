import "server-only";

export type SendResult = { ok: boolean; reason?: string; id?: string };

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  // Resend's shared sandbox sender works out of the box for testing.
  return process.env.EMAIL_FROM || "PaidPilot <onboarding@resend.dev>";
}

// Send a plain-text email via Resend's HTTP API. Returns ok:false (never
// throws) when no provider is configured or the request fails, so callers can
// degrade gracefully to "draft only".
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "Email not configured" };
  if (!input.to) return { ok: false, reason: "No recipient address" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, reason: `Provider error ${res.status}: ${detail.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Send failed" };
  }
}
