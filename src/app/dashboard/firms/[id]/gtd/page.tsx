"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatSum } from "@/lib/format";

type Declaration = {
  id: number;
  fileName: string;
  declarationNumber: string | null;
  declarationDate: string | null;
  senderName: string | null;
  receiverName: string | null;
  customsValue: number | null;
  exportedAt: string | null;
  odataError: string | null;
  createdAt: string;
  _count: { items: number };
};

export default function GtdListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const companyId = Number(id);

  const [list, setList] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/companies/${companyId}/gtd`);
    const data = await res.json();
    setList(data.declarations || []);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/companies/${companyId}/gtd`, { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(data.error || "Yuklashda xatolik");
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function handleExport() {
    setExporting(true);
    setExportMsg(null);
    const res = await fetch(`/api/companies/${companyId}/gtd/export`, { method: "POST" });
    const data = await res.json();
    setExporting(false);
    if (!res.ok) {
      setExportMsg(data.error || "Eksportda xatolik");
      return;
    }
    setExportMsg(`Yuborildi: ${data.success} ta, xatolik: ${data.failed} ta (jami ${data.attempted})`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">GTD (bojxona deklaratsiyalari)</h2>
          <p className="text-sm text-slate-500">
            PDF yuklang — tovar ro&apos;yxati avtomatik ajratiladi, qolgan maydonlarni tahrirlab to&apos;ldirasiz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            {uploading ? "Yuklanmoqda..." : "+ PDF yuklash"}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            disabled={exporting || list.length === 0}
            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {exporting ? "Eksport qilinmoqda..." : "1C ga eksport qilish"}
          </button>
        </div>
      </div>

      {uploadError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{uploadError}</p>
      )}
      {exportMsg && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">{exportMsg}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Deklaratsiya №</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Jo&apos;natuvchi</th>
              <th className="px-4 py-3">Oluvchi</th>
              <th className="px-4 py-3">Tovarlar</th>
              <th className="px-4 py-3">1C</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Yuklanmoqda...</td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Hali GTD yuklanmagan</td>
              </tr>
            ) : (
              list.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/dashboard/firms/${companyId}/gtd/${g.id}`} className="hover:text-emerald-600 hover:underline">
                      {g.declarationNumber || g.fileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {g.declarationDate ? new Date(g.declarationDate).toLocaleDateString("ru-RU", { timeZone: "UTC" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{g.senderName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{g.receiverName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{g._count.items}</td>
                  <td className="px-4 py-3">
                    {g.exportedAt ? (
                      <span className="text-emerald-600">✓ yuborilgan</span>
                    ) : g.odataError ? (
                      <span className="text-rose-600" title={g.odataError}>xato</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {g.customsValue ? formatSum(g.customsValue) : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
