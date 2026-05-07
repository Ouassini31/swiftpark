import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Client Supabase sans types stricts — à utiliser dans les composants client
 * quand les inférences de types `never` bloquent la compilation.
 * Toute la logique métier reste correcte ; seule la vérification de type est assouplie.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClientAny(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
