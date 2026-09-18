import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FirmTabs from "@/components/FirmTabs";

export default async function FirmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/firms" className="text-sm text-slate-400 hover:text-slate-600">
          ← Firmalar
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{company.name}</h1>
        <p className="text-sm text-slate-500">{company.inn ? `STIR: ${company.inn}` : "Firma kabineti"}</p>
      </div>
      <FirmTabs companyId={company.id} />
      {children}
    </div>
  );
}
