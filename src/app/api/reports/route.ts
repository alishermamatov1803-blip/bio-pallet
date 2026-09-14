import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const [clientsCount, productsCount, ordersCount, orders, allProducts, topClients] =
    await Promise.all([
      prisma.client.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany(),
      prisma.client.findMany({
        include: {
          orders: { select: { totalAmount: true } },
          _count: { select: { orders: true } },
        },
      }),
    ]);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);
  const totalDebt = totalRevenue - totalPaid;

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  }

  const monthly: Record<string, number> = {};
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(
      o.createdAt.getMonth() + 1
    ).padStart(2, "0")}`;
    monthly[key] = (monthly[key] || 0) + o.totalAmount;
  }
  const monthlyRevenue = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  const topClientsRanked = topClients
    .map((c) => ({
      id: c.id,
      name: c.name,
      ordersCount: c._count.orders,
      total: c.orders.reduce((s, o) => s + o.totalAmount, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const lowStockProducts = allProducts
    .filter((p) => p.quantity <= p.minQuantity)
    .slice(0, 10);

  return NextResponse.json({
    clientsCount,
    productsCount,
    ordersCount,
    totalRevenue,
    totalPaid,
    totalDebt,
    ordersByStatus,
    monthlyRevenue,
    lowStockProducts,
    topClients: topClientsRanked,
  });
}
