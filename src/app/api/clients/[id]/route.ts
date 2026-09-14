import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } }, payments: true },
      },
    },
  });

  if (!client)
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({ client });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.phone) {
    return NextResponse.json(
      { error: "Ism va telefon raqami majburiy" },
      { status: 400 }
    );
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: body.name,
      company: body.company || null,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      inn: body.inn || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json({ client });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
