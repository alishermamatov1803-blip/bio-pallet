import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 }),
    } as const;
  }
  return { session, response: null } as const;
}
