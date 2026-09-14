"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StatCard from "@/components/StatCard";
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

const PIE_COLORS = ["#64748b", "#0ea5e9", "#f59e0b", "#8b5cf6", "#6366f1", "#10b981", "#f43f5e"];

export default function DashboardHome() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;
  }

  if (!report) {
    return <p className="text-sm text-red-600">Ma&apos;lumotlarni olishda xatolik</p>;
  }

  const statusData = Object.entries(report.ordersByStatus).map(([status, count]) => ({
    name: ORDER_STATUS_LABELS[status] || status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bosh sahifa</h1>
        <p className="text-sm text-slate-500">BIO PALLET faoliyati bo&apos;yicha umumiy ko&apos;rsatkichlar</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Mijozlar" value={String(report.clientsCount)} />
        <StatCard label="Mahsulotlar" value={String(report.productsCount)} />
        <StatCard label="Buyurtmalar" value={String(report.ordersCount)} />
        <StatCard label="Umumiy summa" value={formatSum(report.totalRevenue)} accent="sky" />
        <StatCard label="To'langan" value={formatSum(report.totalPaid)} accent="emerald" />
        <StatCard
          label="Qarzdorlik"
          value={formatSum(report.totalDebt)}
          accent={report.totalDebt > 0 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Oylik savdo (so&apos;nggi 6 oy)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatSum(Number(v))} />
                <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Buyurtmalar holati
          </h2>
          <div className="h-64">
            {statusData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-400">
                Ma&apos;lumot yo&apos;q
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Kam qolgan mahsulotlar
            </h2>
            <Link href="/dashboard/products" className="text-xs font-medium text-emerald-600 hover:underline">
              Ombor →
            </Link>
          </div>
          {report.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Barcha mahsulotlar yetarli miqdorda</p>
          ) : (
            <ul className="space-y-2">
              {report.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                    {p.quantity} {p.unit} (min: {p.minQuantity})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Top mijozlar</h2>
            <Link href="/dashboard/clients" className="text-xs font-medium text-emerald-600 hover:underline">
              Mijozlar →
            </Link>
          </div>
          {report.topClients.length === 0 ? (
            <p className="text-sm text-slate-400">Hozircha buyurtmalar yo&apos;q</p>
          ) : (
            <ul className="space-y-2">
              {report.topClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{c.name}</span>
                  <span className="text-slate-500">
                    {c.ordersCount} ta buyurtma — {formatSum(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
