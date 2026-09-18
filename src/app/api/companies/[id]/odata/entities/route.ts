import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { odataAuthHeader, parseEntitySets } from "@/lib/odata-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company?.odataBaseUrl) {
    return NextResponse.json({ error: "OData manzili sozlanmagan" }, { status: 400 });
  }

  const url = `${company.odataBaseUrl.replace(/\/+$/, "")}/$metadata`;
  const auth = odataAuthHeader(company);

  try {
    const res = await fetch(url, {
      headers: auth ? { Authorization: auth } : undefined,
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `1C javobi: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }
    const xml = await res.text();
    const entities = parseEntitySets(xml);
    return NextResponse.json({ entities });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? `Ulanib bo'lmadi: ${e.message}` : "Ulanib bo'lmadi" },
      { status: 502 }
    );
  }
}
