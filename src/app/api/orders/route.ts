import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const status = req.nextUrl.searchParams.get("status");
  const clientId = req.nextUrl.searchParams.get("clientId");

  const orders = await prisma.order.findMany({
    where: {
      status: status ? (status as never) : undefined,
      clientId: clientId ? Number(clientId) : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      manager: { select: { id: true, fullName: true, email: true, role: true } },
      items: { include: { product: true } },
      payments: true,
    },
  });

  return NextResponse.json({ orders });
}

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BP-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const clientId = Number(body?.clientId);
  const items: { productId: number; quantity: number; price: number }[] =
    Array.isArray(body?.items) ? body.items : [];

  if (!clientId || items.length === 0) {
    return NextResponse.json(
      { error: "Mijoz va kamida bitta mahsulot tanlang" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return NextResponse.json(
        { error: "Mahsulot miqdori noto'g'ri" },
        { status: 400 }
      );
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "Mahsulot topilmadi" },
        { status: 400 }
      );
    }
    if (product.quantity < item.quantity) {
      return NextResponse.json(
        { error: `"${product.name}" uchun omborda yetarli qoldiq yo'q` },
        { status: 400 }
      );
    }
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: generateOrderNumber(),
        clientId,
        managerId: session!.userId,
        status: "NEW",
        totalAmount,
        dueDate: body?.dueDate ? new Date(body.dueDate) : null,
        notes: body?.notes || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } }, client: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          reason: `Buyurtma ${created.number}`,
        },
      });
    }

    return created;
  });

  return NextResponse.json({ order }, { status: 201 });
}
