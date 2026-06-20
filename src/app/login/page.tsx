"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { inputClass } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl">🛫</span>
          <span className="text-xl font-bold tracking-tight">PaidPilot</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your account.</p>
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
            </div>
            {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {pending ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-violet-600 hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
