"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatSum } from "@/lib/format";

type Client = { id: number; name: string; company: string | null };
type Product = { id: number; name: string; unit: string; price: number; quantity: number };
type Line = { productId: number; quantity: string; price: string };

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState(searchParams.get("clientId") || "");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: 0, quantity: "1", price: "0" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []));
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: 0, quantity: "1", price: "0" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function onProductChange(index: number, productId: number) {
    const product = products.find((p) => p.id === productId);
    updateLine(index, { productId, price: product ? String(product.price) : "0" });
  }

  const total = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.price || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validLines = lines.filter((l) => l.productId);
    if (!clientId || validLines.length === 0) {
      setError("Mijoz va kamida bitta mahsulot tanlang");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: Number(clientId),
        dueDate: dueDate || null,
        notes,
        items: validLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          price: Number(l.price),
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Xatolik yuz berdi");
      return;
    }
    router.push(`/dashboard/orders/${data.order.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/orders" className="text-xs font-medium text-emerald-600 hover:underline">
          ← Buyurtmalar
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Yangi buyurtma</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mijoz *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Tanlang...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Yetkazib berish muddati</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">Mahsulotlar *</label>
            <button
              type="button"
              onClick={addLine}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              + Qator qo&apos;shish
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <select
                    value={line.productId}
                    onChange={(e) => onProductChange(i, Number(e.target.value))}
                    className="col-span-5 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value={0}>Mahsulot tanlang...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (qoldiq: {p.quantity} {p.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    placeholder="Miqdor"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Narx"
                    value={line.price}
                    onChange={(e) => updateLine(i, { price: e.target.value })}
                    className="col-span-3 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <div className="col-span-1 flex items-center text-xs text-slate-500">
                    {product ? formatSum(Number(line.quantity || 0) * Number(line.price || 0)) : ""}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="col-span-1 text-xs text-slate-400 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Izoh</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">
            Jami: <span className="text-lg font-semibold text-slate-900">{formatSum(total)}</span>
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saqlanmoqda..." : "Buyurtma yaratish"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yuklanmoqda...</p>}>
      <NewOrderForm />
    </Suspense>
  );
}
