import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { parseGtdPdf } from "@/lib/gtd-parser";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const companyId = Number(id);

  const declarations = await prisma.gtdDeclaration.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      declarationNumber: true,
      declarationDate: true,
      senderName: true,
      receiverName: true,
      customsValue: true,
      exportedAt: true,
      odataError: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ declarations });
}

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

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parseGtdPdf(buffer);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF faylni o'qib bo'lmadi" },
      { status: 400 }
    );
  }

  const gtd = await prisma.gtdDeclaration.create({
    data: {
      companyId,
      fileName: file.name,
      fileData: buffer,
      declarationNumber: parsed.declarationNumber,
      declarationDate: parsed.declarationDate,
      items: {
        create: parsed.items.map((it) => ({
          itemNo: it.itemNo,
          description: it.description,
          weightNetto: it.weightNetto,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: gtd.id }, { status: 201 });
}
