import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appliquerParrainage } from "@/lib/parrainage";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get("code");
  const asked    = searchParams.get("redirect") ?? "/map";
  // Un chemin du site seulement : "@evil.com" ou "//evil.com" sortiraient du domaine
  const redirect = /^\/(?!\/)/.test(asked) ? asked : "/map";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("referred_by")
        .eq("id", user.id)
        .single();

      // Le bonus de bienvenue vient du déclencheur on_profile_created_bonus.
      // Traiter le code de parrainage (pas encore parrainé)
      const ref = searchParams.get("ref");
      if (ref && profile && !profile.referred_by) {
        await appliquerParrainage(user.id, ref);
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
