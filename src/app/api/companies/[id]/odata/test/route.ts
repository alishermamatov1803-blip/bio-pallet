import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { odataAuthHeader } from "@/lib/odata-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const company = body.odataBaseUrl
    ? { odataBaseUrl: body.odataBaseUrl, odataUsername: body.odataUsername, odataPassword: body.odataPassword }
    : await prisma.company.findUnique({ where: { id: Number(id) } });

  if (!company?.odataBaseUrl) {
    return NextResponse.json({ error: "OData manzili kiritilmagan" }, { status: 400 });
  }

  const url = `${company.odataBaseUrl.replace(/\/+$/, "")}/$metadata`;
  const auth = odataAuthHeader(company);

  try {
    const res = await fetch(url, {
      headers: auth ? { Authorization: auth } : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `1C javobi: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? `Ulanib bo'lmadi: ${e.message}` : "Ulanib bo'lmadi" },
      { status: 502 }
    );
  }
}
