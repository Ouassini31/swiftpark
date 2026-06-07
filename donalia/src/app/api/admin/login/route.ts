import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword, sessionCookie } from "@/lib/donalia/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!verifyPassword(password ?? "")) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }
  const c = sessionCookie();
  cookies().set(c.name, c.value, c.options);
  return NextResponse.json({ ok: true });
}
