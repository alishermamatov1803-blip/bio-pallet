import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { parseBankStatement } from "@/lib/bank-statement-parser";

const PAGE_SIZE = 100;
const INSERT_CHUNK = 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const companyId = Number(id);
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || "1"));

  const [imports, lines, total, totals] = await Promise.all([
    prisma.bankStatementImport.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bankStatementLine.findMany({
      where: { companyId },
      orderBy: [{ date: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.bankStatementLine.count({ where: { companyId } }),
    prisma.bankStatementLine.aggregate({
      where: { companyId },
      _sum: { debit: true, credit: true },
    }),
  ]);

  return NextResponse.json({
    imports,
    lines,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalDebit: totals._sum.debit || 0,
    totalCredit: totals._sum.credit || 0,
  });
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

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseBankStatement(buffer);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Faylni o'qib bo'lmadi" },
      { status: 400 }
    );
  }

  if (parsed.lines.length === 0) {
    return NextResponse.json(
      { error: "Faylda bironta ham tranzaksiya topilmadi" },
      { status: 400 }
    );
  }

  const imp = await prisma.bankStatementImport.create({
    data: {
      companyId,
      fileName: file.name,
      accountNumber: parsed.accountNumber,
      accountHolder: parsed.accountHolder,
      periodLabel: parsed.periodLabel,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
      rowCount: parsed.lines.length,
    },
  });

  for (let i = 0; i < parsed.lines.length; i += INSERT_CHUNK) {
    const chunk = parsed.lines.slice(i, i + INSERT_CHUNK);
    await prisma.bankStatementLine.createMany({
      data: chunk.map((l) => ({
        companyId,
        importId: imp.id,
        date: l.date,
        account: l.account,
        accountName: l.accountName,
        docNumber: l.docNumber,
        vo: l.vo,
        mfo: l.mfo,
        debit: l.debit,
        credit: l.credit,
        purpose: l.purpose,
        kasSmv: l.kasSmv,
      })),
    });
  }

  return NextResponse.json({ import: imp, rowCount: parsed.lines.length }, { status: 201 });
}
