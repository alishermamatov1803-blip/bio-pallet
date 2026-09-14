import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email va parolni kiriting" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { error: "Email yoki parol noto'g'ri" },
      { status: 401 }
    );
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
