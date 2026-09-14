"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

type Client = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  inn: string | null;
  notes: string | null;
  _count: { orders: number };
};

const EMPTY_FORM = {
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  inn: "",
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load(query = "") {
    setLoading(true);
    const res = await fetch(`/api/clients${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name,
      company: client.company || "",
      phone: client.phone,
      email: client.email || "",
      address: client.address || "",
      inn: client.inn || "",
      notes: client.notes || "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
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
    load(q);
  }

  async function handleDelete(client: Client) {
    if (!confirm(`"${client.name}" mijozini o'chirmoqchimisiz?`)) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    load(q);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mijozlar</h1>
          <p className="text-sm text-slate-500">Barcha mijozlar ro&apos;yxati</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Yangi mijoz
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          load(e.target.value);
        }}
        placeholder="Qidirish (ism, kompaniya, telefon, email)..."
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ism</th>
              <th className="px-4 py-3">Kompaniya</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Buyurtmalar</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Mijozlar topilmadi
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/dashboard/clients/${c.id}`} className="hover:text-emerald-600 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{c._count.orders}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="mr-2 text-xs font-medium text-slate-500 hover:text-emerald-600"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600"
                    >
                      O&apos;chirish
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? "Mijozni tahrirlash" : "Yangi mijoz"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Ism *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Kompaniya</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Telefon *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Izoh</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
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
