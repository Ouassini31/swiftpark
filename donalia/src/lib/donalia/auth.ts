import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "donalia_admin";
const SECRET = process.env.DONALIA_ADMIN_PASSWORD ?? "donalia-admin";

function token(): string {
  return createHmac("sha256", SECRET).update("org_admin").digest("hex");
}

export function verifyPassword(input: string): boolean {
  const a = Buffer.from(input ?? "");
  const b = Buffer.from(SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sessionCookie() {
  return {
    name: COOKIE,
    value: token(),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  };
}

export function clearCookie() {
  return { name: COOKIE, value: "", options: { path: "/", maxAge: 0 } };
}

/** À appeler dans les pages/route admin côté serveur. */
export function isAdmin(): boolean {
  const c = cookies().get(COOKIE)?.value;
  return Boolean(c && c === token());
}
