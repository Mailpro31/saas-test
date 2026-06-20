import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { logoutAction } from "@/app/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
      <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="text-xl">🛫</span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            PaidPilot
          </span>
        </Link>
        <Sidebar />
        <div className="mt-6 hidden border-t border-slate-100 pt-4 lg:block">
          <p className="px-3 text-sm font-medium text-slate-700">{user.name}</p>
          <p className="px-3 text-xs text-slate-400">{user.email}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-2 px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
