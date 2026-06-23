import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createDealAction } from "@/app/actions/deals";
import { CURRENCIES, PLATFORM_OPTIONS } from "@/lib/constants";
import { btn, Card, Field, PageHeader, inputClass } from "@/components/ui";

export default async function NewDealPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New deal" subtitle="Add a brand collaboration to your pipeline." />
      <Card>
        <form action={createDealAction} className="space-y-4">
          <Field label="Brand name">
            <input name="brandName" required className={inputClass} placeholder="e.g. Notion" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Platform">
              <select name="platform" className={inputClass} defaultValue="">
                <option value="">Select…</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deal value">
              <input name="amount" className={inputClass} placeholder="1500" inputMode="decimal" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency">
              <select name="currency" className={inputClass} defaultValue={user.currency}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment terms" hint="Days until payment is due">
              <input
                name="paymentTermsDays"
                type="number"
                min={0}
                max={180}
                defaultValue={30}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact name">
              <input name="contactName" className={inputClass} placeholder="Alex from Brand" />
            </Field>
            <Field label="Contact email">
              <input name="contactEmail" type="email" className={inputClass} placeholder="alex@brand.com" />
            </Field>
          </div>

          <Field label="Start date">
            <input name="startDate" type="date" className={inputClass} />
          </Field>

          <Field label="Notes">
            <textarea name="notes" rows={3} className={inputClass} placeholder="Scope, talking points, anything to remember…" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={btn.primary}>
              Create deal
            </button>
            <Link href="/deals" className={btn.secondary}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
