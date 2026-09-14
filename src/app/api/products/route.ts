import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json(
      { error: "Mahsulot nomi majburiy" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      type: body.type || "PALLET",
      sku: body.sku || null,
      unit: body.unit || "dona",
      price: Number(body.price) || 0,
      quantity: Number(body.quantity) || 0,
      minQuantity: Number(body.minQuantity) || 0,
      description: body.description || null,
    },
  });

  if (product.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: product.quantity,
        reason: "Boshlang'ich qoldiq",
      },
    });
  }

  return NextResponse.json({ product }, { status: 201 });
}
