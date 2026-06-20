import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { parsePlatformStats } from "@/lib/platforms";
import { formatMoney, formatCompact } from "@/lib/money";

async function getCreator(handle: string) {
  const user = await prisma.user.findUnique({
    where: { handle },
    include: { packages: { orderBy: { sortOrder: "asc" } } },
  });
  if (!user || !user.mediaKitPublic) return null;
  return user;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const user = await getCreator(handle);
  if (!user) return { title: "Media kit not found" };
  return {
    title: `${user.name} — Media kit`,
    description: user.tagline || `Work with ${user.name}`,
  };
}

export default async function PublicMediaKitPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const user = await getCreator(handle);
  if (!user) notFound();

  const stats = parsePlatformStats(user.platforms);
  const color = user.brandColor || "#6d28d9";

  return (
    <div className="min-h-screen w-full" style={{ background: `${color}10` }}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Hero */}
        <header
          className="rounded-2xl p-8 text-white shadow-lg"
          style={{ background: color }}
        >
          <h1 className="text-3xl font-bold">{user.name}</h1>
          {user.tagline && <p className="mt-2 text-lg opacity-90">{user.tagline}</p>}
          {user.audienceTotal > 0 && (
            <p className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
              {formatCompact(user.audienceTotal)} total followers
            </p>
          )}
        </header>

        {user.bio && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
              {user.bio}
            </p>
          </section>
        )}

        {stats.length > 0 && (
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.platform}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold" style={{ color }}>
                  {formatCompact(s.followers)}
                </p>
                <p className="text-sm font-medium text-slate-700">{s.platform}</p>
                {s.handle && <p className="text-xs text-slate-400">{s.handle}</p>}
              </div>
            ))}
          </section>
        )}

        {user.packages.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Work with me
            </h2>
            <ul className="space-y-3">
              {user.packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-sm text-slate-500">{pkg.description}</p>
                    )}
                  </div>
                  <span className="text-lg font-bold" style={{ color }}>
                    {formatMoney(pkg.price, pkg.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 text-center">
          <a
            href={`mailto:${user.email}?subject=${encodeURIComponent(
              `Collaboration with ${user.name}`,
            )}`}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-90"
            style={{ background: color }}
          >
            📩 Get in touch
          </a>
        </section>

        <footer className="mt-10 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">
            Made with PaidPilot
          </Link>
        </footer>
      </div>
    </div>
  );
}
