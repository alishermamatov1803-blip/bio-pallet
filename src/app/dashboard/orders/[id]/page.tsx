"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import {
  formatSum,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/format";

type OrderDetail = {
  id: number;
  number: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  client: { id: number; name: string; phone: string };
  manager: { fullName: string } | null;
  items: { id: number; quantity: number; price: number; product: { name: string; unit: string } }[];
  payments: { id: number; amount: number; method: string; paidAt: string; notes: string | null }[];
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payError, setPayError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setOrder(data.order || null);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: string) {
    if (status === "CANCELLED" && !confirm("Buyurtmani bekor qilmoqchimisiz? Ombor qoldig'i qaytariladi.")) return;
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    setPayError(null);
    const res = await fetch(`/api/orders/${id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(payAmount), method: payMethod }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPayError(data.error || "Xatolik yuz berdi");
      return;
    }
    setPayModalOpen(false);
    setPayAmount("");
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;
  if (!order) return <p className="text-sm text-red-600">Buyurtma topilmadi</p>;

  const debt = order.totalAmount - order.paidAmount;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/orders" className="text-xs font-medium text-emerald-600 hover:underline">
            ← Buyurtmalar
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{order.number}</h1>
          <p className="text-sm text-slate-500">
            Mijoz:{" "}
            <Link href={`/dashboard/clients/${order.client.id}`} className="text-emerald-600 hover:underline">
              {order.client.name}
            </Link>{" "}
            · {order.client.phone}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Umumiy summa</p>
          <p className="text-lg font-semibold text-slate-900">{formatSum(order.totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">To&apos;langan</p>
          <p className="text-lg font-semibold text-emerald-600">{formatSum(order.paidAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Qarzdorlik</p>
          <p className={`text-lg font-semibold ${debt > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {formatSum(debt)}
          </p>
        </div>
      </div>

      {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-600">Holatni o&apos;zgartirish</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ORDER_STATUS_LABELS)
              .filter(([key]) => key !== order.status)
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {label}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Mahsulotlar</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Mahsulot</th>
              <th className="px-4 py-2">Miqdor</th>
              <th className="px-4 py-2">Narx</th>
              <th className="px-4 py-2">Jami</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-slate-800">{item.product.name}</td>
                <td className="px-4 py-2 text-slate-600">
                  {item.quantity} {item.product.unit}
                </td>
                <td className="px-4 py-2 text-slate-600">{formatSum(item.price)}</td>
                <td className="px-4 py-2 font-medium text-slate-800">
                  {formatSum(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">To&apos;lovlar</h2>
          {debt > 0 && (
            <button
              onClick={() => setPayModalOpen(true)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              + To&apos;lov qo&apos;shish
            </button>
          )}
        </div>
        {order.payments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">To&apos;lovlar yo&apos;q</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {order.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-700">
                  {new Date(p.paidAt).toLocaleDateString("uz-UZ")} ·{" "}
                  {PAYMENT_METHOD_LABELS[p.method] || p.method}
                </span>
                <span className="font-medium text-emerald-600">{formatSum(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {payModalOpen && (
        <Modal title="To'lov qo'shish" onClose={() => setPayModalOpen(false)}>
          <form onSubmit={handlePaySubmit} className="space-y-3">
            <p className="text-sm text-slate-500">
              Qolgan qarz: <span className="font-medium text-slate-900">{formatSum(debt)}</span>
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Summa *</label>
              <input
                type="number"
                required
                min={0.01}
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To&apos;lov usuli</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {payError && <p className="text-sm text-red-600">{payError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Saqlash
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
