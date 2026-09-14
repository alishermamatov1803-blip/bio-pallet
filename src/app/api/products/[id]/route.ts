import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      movements: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!product)
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json(
      { error: "Mahsulot nomi majburiy" },
      { status: 400 }
    );
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type || "PALLET",
      sku: body.sku || null,
      unit: body.unit || "dona",
      price: Number(body.price) || 0,
      minQuantity: Number(body.minQuantity) || 0,
      description: body.description || null,
    },
  });

  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
