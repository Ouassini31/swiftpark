import { NextResponse } from "next/server";
import { DIGNITY_ADMIN_COOKIE } from "@/lib/dignity/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DIGNITY_ADMIN_COOKIE, "", {
    httpOnly: true,
    path: "/dignity",
    maxAge: 0,
  });
  return res;
}
