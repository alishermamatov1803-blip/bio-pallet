"use client";

import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  MANAGER: "Menejer",
  WAREHOUSE: "Ombor mudiri",
};

export default function Header({ user }: { user: SessionPayload }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div>
        <p className="text-sm text-slate-500">Xush kelibsiz,</p>
        <p className="font-medium text-slate-900">{user.fullName}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline">
          {ROLE_LABELS[user.role] || user.role}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Chiqish
        </button>
      </div>
    </header>
  );
}
