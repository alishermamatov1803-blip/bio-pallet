import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) {
    return NextResponse.json({ error: "Firma topilmadi" }, { status: 404 });
  }
  return NextResponse.json({ company });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      inn: body.inn ?? null,
      address: body.address ?? null,
      odataBaseUrl: body.odataBaseUrl ?? null,
      odataUsername: body.odataUsername ?? null,
      odataPassword: body.odataPassword ?? null,
      odataEntitySet: body.odataEntitySet ?? null,
      odataFieldMap: body.odataFieldMap ?? null,
    },
  });

  return NextResponse.json({ company });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  await prisma.company.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
