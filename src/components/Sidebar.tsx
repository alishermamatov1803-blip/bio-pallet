"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Bosh sahifa", icon: "🏠" },
  { href: "/dashboard/clients", label: "Mijozlar", icon: "👥" },
  { href: "/dashboard/orders", label: "Buyurtmalar", icon: "📦" },
  { href: "/dashboard/products", label: "Ombor", icon: "🏭" },
  { href: "/dashboard/reports", label: "Hisobotlar", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          BP
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">
            BIO PALLET
          </p>
          <p className="text-xs text-slate-500">CRM tizimi</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
