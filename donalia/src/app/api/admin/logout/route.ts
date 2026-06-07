import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearCookie } from "@/lib/donalia/auth";

export async function POST() {
  const c = clearCookie();
  cookies().set(c.name, c.value, c.options);
  return NextResponse.json({ ok: true });
}
