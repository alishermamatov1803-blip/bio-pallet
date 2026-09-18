import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { odataAuthHeader, requireOdataConfig } from "@/lib/odata-client";

const DEFAULT_FIELD_MAP: Record<string, string> = {
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

const EXPORT_BATCH_LIMIT = 200;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const companyId = Number(id);
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: "Firma topilmadi" }, { status: 404 });
  }

  let baseUrl: string, entitySet: string;
  try {
    ({ baseUrl, entitySet } = requireOdataConfig(company));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OData sozlanmagan" },
      { status: 400 }
    );
  }

  const fieldMap: Record<string, string> = company.odataFieldMap
    ? { ...DEFAULT_FIELD_MAP, ...JSON.parse(company.odataFieldMap) }
    : DEFAULT_FIELD_MAP;

  const auth = odataAuthHeader(company);
  const url = `${baseUrl}/${entitySet}`;

  const pending = await prisma.bankStatementLine.findMany({
    where: { companyId, exportedAt: null },
    orderBy: { id: "asc" },
    take: EXPORT_BATCH_LIMIT,
  });

  let success = 0;
  let failed = 0;

  for (const line of pending) {
    const payload: Record<string, unknown> = {};
    for (const [srcKey, targetField] of Object.entries(fieldMap)) {
      const value = (line as unknown as Record<string, unknown>)[srcKey];
      if (value instanceof Date) {
        payload[targetField] = value.toISOString();
      } else {
        payload[targetField] = value ?? "";
      }
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        await prisma.bankStatementLine.update({
          where: { id: line.id },
          data: { odataError: `${res.status} ${res.statusText}: ${text.slice(0, 500)}` },
        });
        failed++;
        continue;
      }

      const data = await res.json().catch(() => ({}));
      await prisma.bankStatementLine.update({
        where: { id: line.id },
        data: {
          exportedAt: new Date(),
          odataId: data?.Ref_Key || data?.id || null,
          odataError: null,
        },
      });
      success++;
    } catch (e) {
      await prisma.bankStatementLine.update({
        where: { id: line.id },
        data: { odataError: e instanceof Error ? e.message : "Noma'lum xatolik" },
      });
      failed++;
    }
  }

  return NextResponse.json({ attempted: pending.length, success, failed });
}
