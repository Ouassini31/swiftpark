import { NextRequest, NextResponse } from "next/server";
import {
  DIGNITY_ADMIN_COOKIE,
  checkDignityAdminPassword,
  dignityAdminCookieValue,
} from "@/lib/dignity/auth";

// Connexion admin par mot de passe partagé (MVP).
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!checkDignityAdminPassword(String(password || ""))) {
      return NextResponse.json(
        { error: "Mot de passe incorrect." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(DIGNITY_ADMIN_COOKIE, dignityAdminCookieValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/dignity",
      maxAge: 60 * 60 * 8, // 8 h
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
