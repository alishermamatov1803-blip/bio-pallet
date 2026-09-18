"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Bank vypiskalari" },
  { href: "/gtd", label: "GTD (bojxona)" },
  { href: "/sozlamalar", label: "1C ulanish sozlamalari" },
];

export default function FirmTabs({ companyId }: { companyId: number }) {
  const pathname = usePathname();
  const base = `/dashboard/firms/${companyId}`;

  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-4">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          const active = tab.href === "" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={tab.href}
              href={href}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
