import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; gtdId: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { gtdId } = await params;
  const gtd = await prisma.gtdDeclaration.findUnique({
    where: { id: Number(gtdId) },
    select: { fileData: true, fileName: true },
  });
  if (!gtd) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return new NextResponse(new Uint8Array(gtd.fileData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(gtd.fileName)}"`,
    },
  });
}
