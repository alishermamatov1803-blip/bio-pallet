"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSum, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/format";

type Order = {
  id: number;
  number: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  client: { id: number; name: string };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function load(statusFilter = "") {
    setLoading(true);
    const res = await fetch(`/api/orders${statusFilter ? `?status=${statusFilter}` : ""}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Buyurtmalar</h1>
          <p className="text-sm text-slate-500">Barcha buyurtmalar ro&apos;yxati</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Yangi buyurtma
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setStatus("");
            load("");
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === "" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Barchasi
        </button>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setStatus(key);
              load(key);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Raqam</th>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Summa</th>
              <th className="px-4 py-3">To&apos;langan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Buyurtmalar topilmadi
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-emerald-600 hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/clients/${o.client.id}`} className="text-slate-700 hover:underline">
                      {o.client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(o.createdAt).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status]}`}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatSum(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatSum(o.paidAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
