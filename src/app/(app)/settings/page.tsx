import { requireUser } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai";
import { updateProfileAction } from "@/app/actions/profile";
import { CURRENCIES } from "@/lib/constants";
import { Card, Field, PageHeader, inputClass } from "@/components/ui";
import { StatefulForm } from "@/components/StatefulForm";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Your business and invoicing defaults." />

      <Card>
        <StatefulForm action={updateProfileAction} submitLabel="Save settings">
          <Field label="Your name">
            <input name="name" defaultValue={user.name} required className={inputClass} />
          </Field>
          <Field label="Business name" hint="Shown on your invoices">
            <input name="businessName" defaultValue={user.businessName} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Default currency">
              <select name="currency" defaultValue={user.currency} className={inputClass}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Late fee %" hint="Applied by the final reminder">
              <input
                name="lateFeePercent"
                type="number"
                step="0.5"
                min={0}
                max={100}
                defaultValue={user.lateFeePercent}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Payment details" hint="Bank / PayPal / Wise info shown on invoices">
            <textarea
              name="paymentDetails"
              rows={4}
              defaultValue={user.paymentDetails}
              className={inputClass}
              placeholder={"Bank: ...\nIBAN: ...\nOr PayPal: you@email.com"}
            />
          </Field>
        </StatefulForm>
      </Card>

      <Card className="mt-6">
        <h2 className="text-sm font-bold text-slate-700">AI assistant</h2>
        <p className="mt-1 text-sm text-slate-500">
          {aiEnabled() ? (
            <>
              <span className="font-semibold text-emerald-600">Connected.</span>{" "}
              Reminder and reply drafts are written by Claude.
            </>
          ) : (
            <>
              Not configured. Add an <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code>{" "}
              to your environment to enable Claude-powered drafts. Until then,
              high-quality built-in templates are used.
            </>
          )}
        </p>
      </Card>
    </div>
  );
}
