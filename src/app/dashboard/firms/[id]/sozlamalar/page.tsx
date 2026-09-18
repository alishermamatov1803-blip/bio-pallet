"use client";

import { use, useEffect, useState } from "react";

type Company = {
  id: number;
  name: string;
  odataBaseUrl: string | null;
  odataUsername: string | null;
  odataPassword: string | null;
  odataEntitySet: string | null;
  odataFieldMap: string | null;
};

const DEFAULT_MAP: Record<string, string> = {
  date: "Дата",
  docNumber: "Номер",
  account: "СчетКонтрагента",
  accountName: "Контрагент",
  debit: "СуммаПриход",
  credit: "СуммаРасход",
  purpose: "НазначениеПлатежа",
  mfo: "МФО",
  vo: "ВидОперации",
};

const FIELD_LABELS: Record<string, string> = {
  date: "Sana",
  docNumber: "Hujjat raqami",
  account: "Kontragent счyoti",
  accountName: "Kontragent nomi",
  debit: "Kirim summasi (Дебет)",
  credit: "Chiqim summasi (Кредит)",
  purpose: "To'lov maqsadi",
  mfo: "MFO",
  vo: "Operatsiya turi (VO)",
};

export default function FirmSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const companyId = Number(id);

  const [company, setCompany] = useState<Company | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [entitySet, setEntitySet] = useState("");
  const [fieldMap, setFieldMap] = useState<Record<string, string>>(DEFAULT_MAP);
  const [entities, setEntities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingEntities, setFetchingEntities] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/companies/${companyId}`);
      const data = await res.json();
      const c: Company = data.company;
      setCompany(c);
      setBaseUrl(c.odataBaseUrl || "");
      setUsername(c.odataUsername || "");
      setPassword(c.odataPassword || "");
      setEntitySet(c.odataEntitySet || "");
      setFieldMap(c.odataFieldMap ? { ...DEFAULT_MAP, ...JSON.parse(c.odataFieldMap) } : DEFAULT_MAP);
      setLoading(false);
    }
    void load();
  }, [companyId]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: company?.name,
        odataBaseUrl: baseUrl || null,
        odataUsername: username || null,
        odataPassword: password || null,
        odataEntitySet: entitySet || null,
        odataFieldMap: JSON.stringify(fieldMap),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "err", text: "Saqlashda xatolik" });
      return;
    }
    setMessage({ type: "ok", text: "Sozlamalar saqlandi" });
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    const res = await fetch(`/api/companies/${companyId}/odata/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odataBaseUrl: baseUrl, odataUsername: username, odataPassword: password }),
    });
    const data = await res.json();
    setTesting(false);
    setMessage(
      res.ok
        ? { type: "ok", text: "Ulanish muvaffaqiyatli!" }
        : { type: "err", text: data.error || "Ulanib bo'lmadi" }
    );
  }

  async function handleFetchEntities() {
    setFetchingEntities(true);
    setMessage(null);
    await handleSave();
    const res = await fetch(`/api/companies/${companyId}/odata/entities`);
    const data = await res.json();
    setFetchingEntities(false);
    if (!res.ok) {
      setMessage({ type: "err", text: data.error || "Hujjat turlarini olib bo'lmadi" });
      return;
    }
    setEntities(data.entities || []);
    setMessage({ type: "ok", text: `${data.entities.length} ta hujjat turi topildi` });
  }

  if (loading) return <p className="text-sm text-slate-400">Yuklanmoqda...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">1C OData ulanishi</h3>
        <p className="mb-4 text-xs text-slate-500">
          1C serverida veb-servis (OData interfeysi) yoqilgan bo&apos;lishi kerak. Odatda manzil:{" "}
          <code className="rounded bg-slate-100 px-1">http://server/baza/odata/standard.odata</code>
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">OData manzili (URL)</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://192.168.1.10/UNF/odata/standard.odata"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Foydalanuvchi</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !baseUrl}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {testing ? "Tekshirilmoqda..." : "Ulanishni tekshirish"}
            </button>
            <button
              onClick={handleFetchEntities}
              disabled={fetchingEntities || !baseUrl}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {fetchingEntities ? "Olinmoqda..." : "Hujjat turlarini olish"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Hujjat turi (Entity Set)</h3>
        <p className="mb-3 text-xs text-slate-500">
          Bank vypiskasi qaysi 1C hujjat/registriga yozilishi kerakligini tanlang
        </p>
        {entities.length > 0 ? (
          <select
            value={entitySet}
            onChange={(e) => setEntitySet(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">— tanlang —</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={entitySet}
            onChange={(e) => setEntitySet(e.target.value)}
            placeholder="masalan: Document_ПоступлениеНаРасчетныйСчет"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Maydonlar moslashuvi</h3>
        <p className="mb-3 text-xs text-slate-500">
          Bizning ustunlarni 1C dagi haqiqiy rekvizit nomlariga moslang (1C konfiguratsiyangizga qarab farq qiladi)
        </p>
        <div className="space-y-2">
          {Object.keys(DEFAULT_MAP).map((key) => (
            <div key={key} className="grid grid-cols-2 items-center gap-3">
              <label className="text-xs text-slate-600">{FIELD_LABELS[key] || key}</label>
              <input
                value={fieldMap[key] ?? ""}
                onChange={(e) => setFieldMap({ ...fieldMap, [key]: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
        </button>
      </div>
    </div>
  );
}
