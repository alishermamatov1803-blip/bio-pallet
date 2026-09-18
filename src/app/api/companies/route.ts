import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { bankStatementLines: true, bankStatementImports: true } },
    },
  });

  return NextResponse.json({ companies });
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Firma nomi majburiy" }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: {
      name: body.name,
      inn: body.inn || null,
      address: body.address || null,
    },
  });

  return NextResponse.json({ company }, { status: 201 });
}
