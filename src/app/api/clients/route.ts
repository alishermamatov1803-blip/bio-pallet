import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.phone) {
    return NextResponse.json(
      { error: "Ism va telefon raqami majburiy" },
      { status: 400 }
    );
  }

  const client = await prisma.client.create({
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

  return NextResponse.json({ client }, { status: 201 });
}
