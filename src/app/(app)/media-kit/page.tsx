import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePlatformStats } from "@/lib/platforms";
import { formatMoney, formatCompact } from "@/lib/money";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import {
  updateMediaKitAction,
  addPackageAction,
  deletePackageAction,
} from "@/app/actions/profile";
import { btn, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { StatefulForm } from "@/components/StatefulForm";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function MediaKitPage() {
  const user = await requireUser();
  const packages = await prisma.package.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });
  const stats = parsePlatformStats(user.platforms);
  const statFor = (platform: string) =>
    stats.find((s) => s.platform === platform);

  // Platforms offered as rows in the editor (excludes the free-text "Other").
  const editablePlatforms = PLATFORM_OPTIONS.filter((p) => p !== "Other");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Media kit"
        subtitle="Your shareable rate card. Send it to brands to land deals faster."
        action={
          <Link href={`/m/${user.handle}`} className={btn.secondary} target="_blank">
            View public page ↗
          </Link>
        }
      />

      <Card className="mb-6 border-violet-200 bg-violet-50">
        <p className="text-sm text-violet-800">
          Your public media kit lives at{" "}
          <Link href={`/m/${user.handle}`} className="font-semibold underline" target="_blank">
            /m/{user.handle}
          </Link>
          . Share it anywhere — it works as a link in bio and updates automatically.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-bold text-slate-700">Profile</h2>
        <StatefulForm action={updateMediaKitAction} submitLabel="Save media kit">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Handle" hint="Used in your public URL">
              <input name="handle" defaultValue={user.handle} required className={inputClass} />
            </Field>
            <Field label="Brand color">
              <input name="brandColor" type="color" defaultValue={user.brandColor} className="h-10 w-full rounded-lg border border-slate-300" />
            </Field>
          </div>
          <Field label="Tagline">
            <input name="tagline" defaultValue={user.tagline} className={inputClass} placeholder="Tech reviews for everyday humans" />
          </Field>
          <Field label="Bio">
            <textarea name="bio" rows={3} defaultValue={user.bio} className={inputClass} placeholder="A short intro brands will read first…" />
          </Field>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Audience by platform
            </span>
            <div className="space-y-2">
              {editablePlatforms.map((p) => {
                const s = statFor(p);
                return (
                  <div key={p} className="grid grid-cols-[7rem_1fr_8rem] items-center gap-2">
                    <span className="text-sm text-slate-600">{p}</span>
                    <input type="hidden" name="pName" value={p} />
                    <input
                      name="pHandle"
                      defaultValue={s?.handle ?? ""}
                      placeholder="@handle"
                      className={inputClass}
                    />
                    <input
                      name="pFollowers"
                      type="number"
                      min={0}
                      defaultValue={s?.followers || ""}
                      placeholder="followers"
                      className={inputClass}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="mediaKitPublic"
              defaultChecked={user.mediaKitPublic}
              className="h-4 w-4 rounded border-slate-300"
            />
            Make my media kit publicly visible
          </label>
        </StatefulForm>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-bold text-slate-700">Rate card</h2>
        <ul className="mb-4 space-y-2">
          {packages.map((pkg) => (
            <li key={pkg.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div>
                <p className="font-medium text-slate-800">{pkg.name}</p>
                {pkg.description && <p className="text-xs text-slate-400">{pkg.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  {formatMoney(pkg.price, pkg.currency)}
                </span>
                <ConfirmButton
                  action={deletePackageAction.bind(null, pkg.id)}
                  className="text-xs text-slate-300 hover:text-rose-500"
                  confirm="Remove this package?"
                >
                  ✕
                </ConfirmButton>
              </div>
            </li>
          ))}
          {packages.length === 0 && (
            <li className="text-sm text-slate-400">No packages yet — add your offers below.</li>
          )}
        </ul>
        <form action={addPackageAction} className="grid grid-cols-[1fr_1fr_8rem_auto] gap-2">
          <input name="name" placeholder="Package (e.g. 1 Reel)" className={inputClass} required />
          <input name="description" placeholder="What's included" className={inputClass} />
          <input name="price" placeholder="Price" inputMode="decimal" className={inputClass} />
          <button type="submit" className={btn.secondary}>
            Add
          </button>
        </form>
      </Card>

      {user.audienceTotal > 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">
          Total reach across platforms: {formatCompact(user.audienceTotal)} followers
        </p>
      )}
    </div>
  );
}
