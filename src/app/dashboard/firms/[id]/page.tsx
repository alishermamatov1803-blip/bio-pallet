"use client";

import { use, useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

type Line = {
  id: number;
  date: string;
  account: string;
  accountName: string | null;
  docNumber: string | null;
  vo: string | null;
  mfo: string | null;
  debit: number;
  credit: number;
  purpose: string | null;
  kasSmv: string | null;
  exportedAt: string | null;
  odataError: string | null;
};

type Imp = {
  id: number;
  fileName: string;
  accountNumber: string | null;
  accountHolder: string | null;
  periodLabel: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  rowCount: number;
  createdAt: string;
};

export default function BankStatementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const companyId = Number(id);

  const [imports, setImports] = useState<Imp[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load(p = page) {
    setLoading(true);
    const res = await fetch(`/api/companies/${companyId}/bank-statements?page=${p}`);
    const data = await res.json();
    setImports(data.imports || []);
    setLines(data.lines || []);
    setTotal(data.total || 0);
    setPageSize(data.pageSize || 100);
    setTotalDebit(data.totalDebit || 0);
    setTotalCredit(data.totalCredit || 0);
    setPage(p);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/companies/${companyId}/bank-statements`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(data.error || "Yuklashda xatolik");
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    load(1);
  }

  async function handleExport() {
    setExporting(true);
    setExportMsg(null);
    const res = await fetch(`/api/companies/${companyId}/bank-statements/export`, {
      method: "POST",
    });
    const data = await res.json();
    setExporting(false);
    if (!res.ok) {
      setExportMsg(data.error || "Eksportda xatolik");
      return;
    }
    setExportMsg(
      `Yuborildi: ${data.success} ta, xatolik: ${data.failed} ta (jami ${data.attempted})`
    );
    load(page);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const notExported = lines.filter((l) => !l.exportedAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bank vypiskalari</h2>
          <p className="text-sm text-slate-500">
            {total > 0
              ? `${formatNumber(total)} ta tranzaksiya`
              : "Hali ma'lumot yuklanmagan"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            {uploading ? "Yuklanmoqda..." : "+ Excel yuklash"}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
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

      {imports.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Yuklangan fayllar
          </p>
          <div className="space-y-1 text-sm text-slate-600">
            {imports.map((imp) => (
              <div key={imp.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-1 last:border-0">
                <span className="font-medium text-slate-800">{imp.fileName}</span>
                <span className="text-xs text-slate-500">
                  {imp.accountHolder} · {imp.accountNumber} · {imp.periodLabel} · {formatNumber(imp.rowCount)} qator
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {notExported > 0 && (
        <p className="text-xs text-amber-600">
          Ushbu sahifada {notExported} ta yozuv hali 1C ga yuborilmagan
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse font-mono text-[13px]">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="border border-slate-200 px-2 py-2">Дата</th>
              <th className="border border-slate-200 px-2 py-2">Счет</th>
              <th className="border border-slate-200 px-2 py-2">Наименование счета</th>
              <th className="border border-slate-200 px-2 py-2">N док-та</th>
              <th className="border border-slate-200 px-2 py-2">ВО</th>
              <th className="border border-slate-200 px-2 py-2">МФО</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Дебет</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Кредит</th>
              <th className="border border-slate-200 px-2 py-2">Назначение платежа</th>
              <th className="border border-slate-200 px-2 py-2">1C</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  Ma&apos;lumot yo&apos;q — Excel fayl yuklang
                </td>
              </tr>
            ) : (
              lines.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="border border-slate-100 px-2 py-1 whitespace-nowrap">
                    {new Date(l.date).toLocaleDateString("ru-RU", { timeZone: "UTC" })}
                  </td>
                  <td className="border border-slate-100 px-2 py-1 whitespace-nowrap">{l.account}</td>
                  <td className="border border-slate-100 px-2 py-1 max-w-[220px] truncate" title={l.accountName || ""}>
                    {l.accountName}
                  </td>
                  <td className="border border-slate-100 px-2 py-1">{l.docNumber}</td>
                  <td className="border border-slate-100 px-2 py-1">{l.vo}</td>
                  <td className="border border-slate-100 px-2 py-1">{l.mfo}</td>
                  <td className="border border-slate-100 px-2 py-1 text-right text-emerald-700">
                    {l.debit ? formatNumber(l.debit) : ""}
                  </td>
                  <td className="border border-slate-100 px-2 py-1 text-right text-rose-700">
                    {l.credit ? formatNumber(l.credit) : ""}
                  </td>
                  <td className="border border-slate-100 px-2 py-1 max-w-[320px] truncate" title={l.purpose || ""}>
                    {l.purpose}
                  </td>
                  <td className="border border-slate-100 px-2 py-1 text-center">
                    {l.exportedAt ? (
                      <span className="text-emerald-600" title="1C ga yuborilgan">✓</span>
                    ) : l.odataError ? (
                      <span className="text-rose-600" title={l.odataError}>!</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot className="bg-slate-50 font-semibold">
              <tr>
                <td colSpan={6} className="border border-slate-200 px-2 py-2 text-right">
                  Jami (barcha yozuvlar):
                </td>
                <td className="border border-slate-200 px-2 py-2 text-right text-emerald-700">
                  {formatNumber(totalDebit)}
                </td>
                <td className="border border-slate-200 px-2 py-2 text-right text-rose-700">
                  {formatNumber(totalCredit)}
                </td>
                <td colSpan={2} className="border border-slate-200 px-2 py-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => load(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            ← Oldingi
          </button>
          <span className="text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => load(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Keyingi →
          </button>
        </div>
      )}
    </div>
  );
}
