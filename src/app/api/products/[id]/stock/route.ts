import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const body = await req.json().catch(() => null);
  const type = body?.type === "OUT" ? "OUT" : "IN";
  const quantity = Number(body?.quantity);
  const reason = body?.reason || null;

  if (!quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "Miqdorni to'g'ri kiriting" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product)
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  if (type === "OUT" && product.quantity < quantity) {
    return NextResponse.json(
      { error: "Omborda yetarli mahsulot yo'q" },
      { status: 400 }
    );
  }

  const newQuantity =
    type === "IN" ? product.quantity + quantity : product.quantity - quantity;

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { quantity: newQuantity },
    }),
    prisma.stockMovement.create({
      data: { productId: id, type, quantity, reason },
    }),
  ]);

  return NextResponse.json({ product: updated });
}
