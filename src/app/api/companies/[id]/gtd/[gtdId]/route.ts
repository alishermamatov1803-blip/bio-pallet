import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const HEADER_FIELDS = [
  "declarationNumber",
  "senderName",
  "receiverName",
  "receiverInn",
  "brokerName",
  "originCountry",
  "destinationCountry",
  "deliveryTerms",
  "currencyCode",
  "invoiceTotal",
  "exchangeRate",
  "weightBrutto",
  "weightNetto",
  "customsValue",
  "dutyTotal",
  "notes",
] as const;

const NUMERIC_FIELDS = new Set([
  "invoiceTotal",
  "exchangeRate",
  "weightBrutto",
  "weightNetto",
  "customsValue",
  "dutyTotal",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; gtdId: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { gtdId } = await params;
  const gtd = await prisma.gtdDeclaration.findUnique({
    where: { id: Number(gtdId) },
    include: { items: { orderBy: { itemNo: "asc" } } },
    omit: { fileData: true },
  });
  if (!gtd) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({ gtd });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; gtdId: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { gtdId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const key of HEADER_FIELDS) {
    if (!(key in body)) continue;
    const raw = body[key];
    if (raw === "" || raw == null) {
      data[key] = null;
    } else if (NUMERIC_FIELDS.has(key)) {
      const n = Number(raw);
      data[key] = Number.isFinite(n) ? n : null;
    } else {
      data[key] = raw;
    }
  }
  if (body.declarationDate) data.declarationDate = new Date(body.declarationDate);

  const gtd = await prisma.gtdDeclaration.update({
    where: { id: Number(gtdId) },
    data,
    omit: { fileData: true },
  });

  if (Array.isArray(body.items)) {
    for (const item of body.items) {
      if (!item.id) continue;
      await prisma.gtdItem.update({
        where: { id: item.id },
        data: {
          hsCode: item.hsCode ?? null,
          originCountryCode: item.originCountryCode ?? null,
          quantity: item.quantity === "" || item.quantity == null ? null : Number(item.quantity),
          unit: item.unit ?? null,
          invoiceValue:
            item.invoiceValue === "" || item.invoiceValue == null ? null : Number(item.invoiceValue),
        },
      });
    }
  }

  return NextResponse.json({ gtd });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; gtdId: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { gtdId } = await params;
  await prisma.gtdDeclaration.delete({ where: { id: Number(gtdId) } });
  return NextResponse.json({ ok: true });
}
