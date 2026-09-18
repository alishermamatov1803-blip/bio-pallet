"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

type Company = {
  id: number;
  name: string;
  inn: string | null;
  address: string | null;
  _count: { bankStatementLines: number; bankStatementImports: number };
};

const EMPTY_FORM = { name: "", inn: "", address: "" };

export default function FirmsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/companies");
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Xatolik yuz berdi");
      return;
    }
    setModalOpen(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Firmalar</h1>
          <p className="text-sm text-slate-500">
            Har bir firma uchun alohida kabinet — ma&apos;lumot yuklash va 1C ga eksport
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Yangi firma
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-400">Yuklanmoqda...</p>
        ) : companies.length === 0 ? (
          <p className="text-sm text-slate-400">Hali firma qo&apos;shilmagan</p>
        ) : (
          companies.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/firms/${c.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-700">
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <p className="mt-3 font-semibold text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-500">{c.inn ? `STIR: ${c.inn}` : "STIR kiritilmagan"}</p>
              <p className="mt-2 text-xs text-slate-400">
                {c._count.bankStatementLines} ta bank tranzaksiya
              </p>
            </Link>
          ))
        )}
      </div>

      {modalOpen && (
        <Modal title="Yangi firma" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Firma nomi *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">STIR</label>
              <input
                value={form.inn}
                onChange={(e) => setForm({ ...form, inn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Manzil</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
