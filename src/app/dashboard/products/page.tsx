"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { formatSum, PRODUCT_TYPE_LABELS } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  type: string;
  sku: string | null;
  unit: string;
  price: number;
  quantity: number;
  minQuantity: number;
  description: string | null;
};

const EMPTY_FORM = {
  name: "",
  type: "PALLET",
  sku: "",
  unit: "dona",
  price: "0",
  quantity: "0",
  minQuantity: "0",
  description: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [stockModal, setStockModal] = useState<Product | null>(null);
  const [stockType, setStockType] = useState<"IN" | "OUT">("IN");
  const [stockQty, setStockQty] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);

  async function load(query = "") {
    setLoading(true);
    const res = await fetch(`/api/products${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setProducts(data.products || []);
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

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      type: p.type,
      sku: p.sku || "",
      unit: p.unit,
      price: String(p.price),
      quantity: String(p.quantity),
      minQuantity: String(p.minQuantity),
      description: p.description || "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editing ? `/api/products/${editing.id}` : "/api/products";
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

  async function handleDelete(p: Product) {
    if (!confirm(`"${p.name}" mahsulotini o'chirmoqchimisiz?`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    load(q);
  }

  function openStock(p: Product, type: "IN" | "OUT") {
    setStockModal(p);
    setStockType(type);
    setStockQty("");
    setStockReason("");
    setStockError(null);
  }

  async function handleStockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stockModal) return;
    setStockError(null);
    const res = await fetch(`/api/products/${stockModal.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: stockType, quantity: Number(stockQty), reason: stockReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStockError(data.error || "Xatolik yuz berdi");
      return;
    }
    setStockModal(null);
    load(q);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Ombor</h1>
          <p className="text-sm text-slate-500">Mahsulotlar va zaxira miqdorlari</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Yangi mahsulot
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          load(e.target.value);
        }}
        placeholder="Qidirish (nomi, SKU)..."
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nomi</th>
              <th className="px-4 py-3">Turi</th>
              <th className="px-4 py-3">Narx</th>
              <th className="px-4 py-3">Qoldiq</th>
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
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Mahsulotlar topilmadi
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const low = p.quantity <= p.minQuantity;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.name}
                      {p.sku && <span className="ml-2 text-xs text-slate-400">#{p.sku}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{PRODUCT_TYPE_LABELS[p.type] || p.type}</td>
                    <td className="px-4 py-3 text-slate-600">{formatSum(p.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          low ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {p.quantity} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openStock(p, "IN")}
                        className="mr-2 text-xs font-medium text-slate-500 hover:text-emerald-600"
                      >
                        + Kirim
                      </button>
                      <button
                        onClick={() => openStock(p, "OUT")}
                        className="mr-2 text-xs font-medium text-slate-500 hover:text-amber-600"
                      >
                        - Chiqim
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="mr-2 text-xs font-medium text-slate-500 hover:text-emerald-600"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-xs font-medium text-slate-500 hover:text-rose-600"
                      >
                        O&apos;chirish
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Nomi *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Turi</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="PALLET">Pallet</option>
                  <option value="MATERIAL">Xomashyo</option>
                  <option value="SERVICE">Xizmat</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">O&apos;lchov birligi</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Narx (so&apos;m)</label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              {!editing && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Boshlang&apos;ich qoldiq</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Minimal zaxira</label>
                <input
                  type="number"
                  min={0}
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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

      {stockModal && (
        <Modal
          title={`${stockType === "IN" ? "Kirim" : "Chiqim"}: ${stockModal.name}`}
          onClose={() => setStockModal(null)}
        >
          <form onSubmit={handleStockSubmit} className="space-y-3">
            <p className="text-sm text-slate-500">
              Joriy qoldiq: <span className="font-medium text-slate-900">{stockModal.quantity} {stockModal.unit}</span>
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Miqdor *</label>
              <input
                type="number"
                required
                min={0.01}
                step="any"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sabab</label>
              <input
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder="Masalan: yetkazib berildi, inventarizatsiya..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            {stockError && <p className="text-sm text-red-600">{stockError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStockModal(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Tasdiqlash
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
