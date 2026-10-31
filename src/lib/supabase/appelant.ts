import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

/** Qui appelle cette route : la session du site (cookie) ou l'app mobile (jeton Bearer). */
export async function appelant(req: Request) {
  const jeton = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (jeton) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${jeton}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data: { user } } = await client.auth.getUser(jeton);
    return { client, user };
  }
  const client = await createServerClient();
  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}
