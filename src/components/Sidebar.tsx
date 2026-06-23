"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/deals", label: "Deals", icon: "🤝" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
  { href: "/insights", label: "Insights", icon: "📈" },
  { href: "/media-kit", label: "Media Kit", icon: "✨" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 lg:flex-col">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
