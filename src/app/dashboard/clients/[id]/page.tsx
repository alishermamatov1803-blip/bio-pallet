"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { formatSum, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/format";

type ClientDetail = {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  inn: string | null;
  notes: string | null;
  orders: {
    id: number;
    number: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    createdAt: string;
  }[];
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => res.json())
      .then((data) => setClient(data.client))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;
  if (!client) return <p className="text-sm text-red-600">Mijoz topilmadi</p>;

  const totalOrdered = client.orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = client.orders.reduce((s, o) => s + o.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/clients" className="text-xs font-medium text-emerald-600 hover:underline">
            ← Mijozlar
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{client.name}</h1>
          <p className="text-sm text-slate-500">{client.company || "Kompaniya ko'rsatilmagan"}</p>
        </div>
        <Link
          href={`/dashboard/orders/new?clientId=${client.id}`}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Buyurtma yaratish
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Telefon</p>
          <p className="text-sm font-medium text-slate-900">{client.phone}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Email</p>
          <p className="text-sm font-medium text-slate-900">{client.email || "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Jami buyurtma summasi</p>
          <p className="text-sm font-medium text-slate-900">{formatSum(totalOrdered)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">To&apos;langan / Qarz</p>
          <p className="text-sm font-medium text-slate-900">
            {formatSum(totalPaid)} / {formatSum(totalOrdered - totalPaid)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Buyurtmalar tarixi</h2>
        </div>
        {client.orders.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Buyurtmalar yo&apos;q</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Raqam</th>
                <th className="px-4 py-2">Sana</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2">Summa</th>
                <th className="px-4 py-2">To&apos;langan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-emerald-600 hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(o.createdAt).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status]}`}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{formatSum(o.totalAmount)}</td>
                  <td className="px-4 py-2 text-slate-600">{formatSum(o.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
