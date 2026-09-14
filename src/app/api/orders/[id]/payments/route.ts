import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const orderId = Number((await params).id);
  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "To'lov summasini to'g'ri kiriting" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const [, updatedOrder] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId,
        amount,
        method: body?.method || "CASH",
        notes: body?.notes || null,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paidAmount: { increment: amount } },
      include: { payments: true },
    }),
  ]);

  return NextResponse.json({ order: updatedOrder }, { status: 201 });
}
