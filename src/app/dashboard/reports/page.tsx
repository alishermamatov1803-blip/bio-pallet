"use client";

import { useEffect, useState } from "react";
import { formatSum, ORDER_STATUS_LABELS } from "@/lib/format";

type Report = {
  clientsCount: number;
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  totalPaid: number;
  totalDebt: number;
  ordersByStatus: Record<string, number>;
  monthlyRevenue: { month: string; total: number }[];
  lowStockProducts: { id: number; name: string; quantity: number; unit: string; minQuantity: number }[];
  topClients: { id: number; name: string; ordersCount: number; total: number }[];
};

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;
  if (!report) return <p className="text-sm text-red-600">Ma&apos;lumotlarni olishda xatolik</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hisobotlar</h1>
        <p className="text-sm text-slate-500">Batafsil moliyaviy va savdo hisobotlari</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Umumiy savdo summasi</p>
          <p className="text-xl font-semibold text-slate-900">{formatSum(report.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Jami to&apos;langan</p>
          <p className="text-xl font-semibold text-emerald-600">{formatSum(report.totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Umumiy qarzdorlik</p>
          <p className="text-xl font-semibold text-rose-600">{formatSum(report.totalDebt)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Oylik savdo</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.monthlyRevenue.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td>
                </tr>
              ) : (
                report.monthlyRevenue.map((m) => (
                  <tr key={m.month}>
                    <td className="px-4 py-2 text-slate-600">{m.month}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800">{formatSum(m.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Buyurtmalar holati bo&apos;yicha</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {Object.entries(report.ordersByStatus).length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td>
                </tr>
              ) : (
                Object.entries(report.ordersByStatus).map(([status, count]) => (
                  <tr key={status}>
                    <td className="px-4 py-2 text-slate-600">{ORDER_STATUS_LABELS[status] || status}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800">{count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Top 5 mijoz</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.topClients.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td>
                </tr>
              ) : (
                report.topClients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-600">{c.name}</td>
                    <td className="px-4 py-2 text-slate-500">{c.ordersCount} ta buyurtma</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800">{formatSum(c.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Kam qolgan mahsulotlar</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.lowStockProducts.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-400">Barchasi yetarli</td>
                </tr>
              ) : (
                report.lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-slate-600">{p.name}</td>
                    <td className="px-4 py-2 text-right font-medium text-rose-600">
                      {p.quantity} {p.unit} (min: {p.minQuantity})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
