import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      manager: { select: { id: true, fullName: true, email: true, role: true } },
      items: { include: { product: true } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  return NextResponse.json({ order });
}

const CANCELABLE_RESTORE_STATUSES = new Set([
  "NEW",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
  "SHIPPED",
  "COMPLETED",
]);

export async function PUT(req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const body = await req.json().catch(() => null);

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body?.notes !== undefined) data.notes = body.notes || null;
  if (body?.dueDate !== undefined)
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (body?.status && body.status !== existing.status) {
    if (
      body.status === "CANCELLED" &&
      existing.status !== "CANCELLED" &&
      CANCELABLE_RESTORE_STATUSES.has(existing.status)
    ) {
      await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "IN",
              quantity: item.quantity,
              reason: `Buyurtma ${existing.number} bekor qilindi`,
            },
          });
        }
      });
    }
    data.status = body.status;
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: {
      client: true,
      manager: { select: { id: true, fullName: true, email: true, role: true } },
      items: { include: { product: true } },
      payments: true,
    },
  });

  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const id = Number((await params).id);
  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    if (CANCELABLE_RESTORE_STATUSES.has(existing.status)) {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            reason: `Buyurtma ${existing.number} o'chirildi`,
          },
        });
      }
    }
    await tx.order.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
