"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: number;
  itemNo: number | null;
  description: string;
  hsCode: string | null;
  originCountryCode: string | null;
  quantity: number | null;
  unit: string | null;
  weightNetto: number | null;
  invoiceValue: number | null;
};

type Gtd = {
  id: number;
  fileName: string;
  declarationNumber: string | null;
  declarationDate: string | null;
  senderName: string | null;
  receiverName: string | null;
  receiverInn: string | null;
  brokerName: string | null;
  originCountry: string | null;
  destinationCountry: string | null;
  deliveryTerms: string | null;
  currencyCode: string | null;
  invoiceTotal: number | null;
  exchangeRate: number | null;
  weightBrutto: number | null;
  weightNetto: number | null;
  customsValue: number | null;
  dutyTotal: number | null;
  notes: string | null;
  exportedAt: string | null;
  odataError: string | null;
  items: Item[];
};

const FIELDS: { key: keyof Gtd; label: string; type?: string }[] = [
  { key: "declarationNumber", label: "Deklaratsiya raqami" },
  { key: "senderName", label: "Jo'natuvchi/eksportyor" },
  { key: "receiverName", label: "Oluvchi/importyor" },
  { key: "receiverInn", label: "Oluvchi STIR" },
  { key: "brokerName", label: "Deklarant/vakil" },
  { key: "originCountry", label: "Kelib chiqish mamlakati" },
  { key: "destinationCountry", label: "Mo'ljal mamlakati" },
  { key: "deliveryTerms", label: "Yetkazib berish sharti" },
  { key: "currencyCode", label: "Valyuta kodi" },
  { key: "invoiceTotal", label: "Faktura summasi", type: "number" },
  { key: "exchangeRate", label: "Valyuta kursi", type: "number" },
  { key: "weightBrutto", label: "Vazn brutto (kg)", type: "number" },
  { key: "weightNetto", label: "Vazn netto (kg)", type: "number" },
  { key: "customsValue", label: "Statistik qiymat", type: "number" },
  { key: "dutyTotal", label: "Bojxona to'lovlari jami", type: "number" },
];

export default function GtdDetailPage({
  params,
}: {
  params: Promise<{ id: string; gtdId: string }>;
}) {
  const { id, gtdId } = use(params);
  const companyId = Number(id);

  const [gtd, setGtd] = useState<Gtd | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/companies/${companyId}/gtd/${gtdId}`);
    const data = await res.json();
    const g: Gtd = data.gtd;
    setGtd(g);
    setItems(g.items || []);
    const f: Record<string, string> = {};
    for (const field of FIELDS) f[field.key] = (g[field.key] as string | number | null)?.toString() ?? "";
    f.declarationDate = g.declarationDate ? g.declarationDate.slice(0, 10) : "";
    f.notes = g.notes || "";
    setForm(f);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gtdId]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/companies/${companyId}/gtd/${gtdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Saqlashda xatolik");
      return;
    }
    setMessage("Saqlandi");
    load();
  }

  function updateItem(itemId: number, key: keyof Item, value: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [key]: value } : it))
    );
  }

  if (loading || !gtd) return <p className="text-sm text-slate-400">Yuklanmoqda...</p>;

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/firms/${companyId}/gtd`} className="text-sm text-slate-400 hover:text-slate-600">
        ← GTD ro&apos;yxati
      </Link>

      {gtd.exportedAt && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ 1C ga yuborilgan
        </p>
      )}
      {gtd.odataError && !gtd.exportedAt && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{gtd.odataError}</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            PDF ko&apos;rinishi
          </p>
          <iframe
            src={`/api/companies/${companyId}/gtd/${gtdId}/file`}
            className="h-[600px] w-full"
            title="GTD PDF"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ma&apos;lumotlar (PDF ga qarab to&apos;ldiring)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sana</label>
              <input
                type="date"
                value={form.declarationDate || ""}
                onChange={(e) => setForm({ ...form, declarationDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            {FIELDS.map((f) => (
              <div key={f.key} className={f.key === "senderName" || f.key === "receiverName" ? "col-span-2" : ""}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                <input
                  type={f.type || "text"}
                  step={f.type === "number" ? "any" : undefined}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Izoh</label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tovarlar (avtomatik ajratilgan tavsif — TIF kodi va summani PDF dan qarab kiriting)
        </p>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">№</th>
              <th className="px-3 py-2">Tavsifi</th>
              <th className="px-3 py-2">TIF kodi</th>
              <th className="px-3 py-2">Kelib chiqish</th>
              <th className="px-3 py-2">Miqdor</th>
              <th className="px-3 py-2">O&apos;lchov</th>
              <th className="px-3 py-2">Vazn netto</th>
              <th className="px-3 py-2">Summasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="px-3 py-2 text-slate-500">{it.itemNo}</td>
                <td className="max-w-xs px-3 py-2 text-xs text-slate-700" title={it.description}>
                  {it.description}
                </td>
                <td className="px-3 py-2">
                  <input
                    value={it.hsCode || ""}
                    onChange={(e) => updateItem(it.id, "hsCode", e.target.value)}
                    className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={it.originCountryCode || ""}
                    onChange={(e) => updateItem(it.id, "originCountryCode", e.target.value)}
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={it.quantity ?? ""}
                    onChange={(e) => updateItem(it.id, "quantity", e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={it.unit || ""}
                    onChange={(e) => updateItem(it.id, "unit", e.target.value)}
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">{it.weightNetto ?? "—"}</td>
                <td className="px-3 py-2">
                  <input
                    value={it.invoiceValue ?? ""}
                    onChange={(e) => updateItem(it.id, "invoiceValue", e.target.value)}
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
