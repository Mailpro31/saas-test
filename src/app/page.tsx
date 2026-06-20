import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: "🤝",
    title: "Deal pipeline",
    body: "Track every brand collaboration from first pitch to paid, on a clean visual board.",
  },
  {
    icon: "🧾",
    title: "One-click invoices",
    body: "Turn a deal into a professional, printable invoice in seconds — with your payment details baked in.",
  },
  {
    icon: "💸",
    title: "Auto payment-chasing",
    body: "Generate a polite-to-firm escalation sequence (with late fees) so you never send the awkward email again.",
  },
  {
    icon: "✨",
    title: "Shareable media kit",
    body: "A beautiful public rate card at your own link — send it to brands and land deals faster.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛫</span>
          <span className="text-xl font-bold tracking-tight">PaidPilot</span>
        </div>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Open dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
            For creators &amp; freelancers
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Brand deals &amp; getting paid,
            <br />
            <span className="text-violet-600">on autopilot.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            85% of creators get paid late. PaidPilot tracks every deal, sends the
            invoice, and chases the money for you — so you can get back to making.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              Start free — no card
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-violet-600">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center text-white">
            <h2 className="text-3xl font-bold">Stop chasing. Start collecting.</h2>
            <p className="mx-auto mt-3 max-w-xl text-violet-100">
              Set up your media kit, add your first deal, and let PaidPilot handle
              the follow-ups.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-base font-semibold text-violet-700 hover:bg-violet-50"
            >
              Create your free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-center text-sm text-slate-400">
        PaidPilot · Built for creators and freelancers
      </footer>
    </div>
  );
}
