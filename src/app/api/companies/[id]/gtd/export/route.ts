import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { odataAuthHeader } from "@/lib/odata-client";

const DEFAULT_FIELD_MAP: Record<string, string> = {
  declarationNumber: "НомерДекларации",
  declarationDate: "Дата",
  senderName: "Отправитель",
  receiverName: "Получатель",
  receiverInn: "ПолучательИНН",
  currencyCode: "Валюта",
  invoiceTotal: "ФактурнаяСтоимость",
  customsValue: "СтатистическаяСтоимость",
  dutyTotal: "СуммаПошлин",
  weightBrutto: "ВесБрутто",
  weightNetto: "ВесНетто",
};

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
  if (!company.odataBaseUrl) {
    return NextResponse.json({ error: "1C OData manzili sozlanmagan" }, { status: 400 });
  }
  if (!company.gtdEntitySet) {
    return NextResponse.json({ error: "GTD uchun hujjat turi (entity set) tanlanmagan" }, { status: 400 });
  }

  const fieldMap: Record<string, string> = company.gtdFieldMap
    ? { ...DEFAULT_FIELD_MAP, ...JSON.parse(company.gtdFieldMap) }
    : DEFAULT_FIELD_MAP;

  const auth = odataAuthHeader(company);
  const url = `${company.odataBaseUrl.replace(/\/+$/, "")}/${company.gtdEntitySet}`;

  const pending = await prisma.gtdDeclaration.findMany({
    where: { companyId, exportedAt: null },
    include: { items: true },
    take: 50,
  });

  let success = 0;
  let failed = 0;

  for (const gtd of pending) {
    const payload: Record<string, unknown> = {};
    for (const [srcKey, targetField] of Object.entries(fieldMap)) {
      const value = (gtd as unknown as Record<string, unknown>)[srcKey];
      payload[targetField] = value instanceof Date ? value.toISOString() : value ?? "";
    }
    payload["Товары"] = gtd.items.map((it) => ({
      НомерТовара: it.itemNo,
      Описание: it.description,
      КодТовара: it.hsCode,
      КодСтраны: it.originCountryCode,
      Количество: it.quantity,
      ЕдИзм: it.unit,
      Вес: it.weightNetto,
      Сумма: it.invoiceValue,
    }));

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
        await prisma.gtdDeclaration.update({
          where: { id: gtd.id },
          data: { odataError: `${res.status} ${res.statusText}: ${text.slice(0, 500)}` },
        });
        failed++;
        continue;
      }

      const data = await res.json().catch(() => ({}));
      await prisma.gtdDeclaration.update({
        where: { id: gtd.id },
        data: {
          exportedAt: new Date(),
          odataId: data?.Ref_Key || data?.id || null,
          odataError: null,
        },
      });
      success++;
    } catch (e) {
      await prisma.gtdDeclaration.update({
        where: { id: gtd.id },
        data: { odataError: e instanceof Error ? e.message : "Noma'lum xatolik" },
      });
      failed++;
    }
  }

  return NextResponse.json({ attempted: pending.length, success, failed });
}
