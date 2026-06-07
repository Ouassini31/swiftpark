import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

/**
 * Client Supabase « service_role » réservé au serveur Dignity Layer.
 * Contourne RLS — à n'utiliser que dans des Route Handlers / Server Actions
 * protégés (dépôt de besoin, actions admin). Ne JAMAIS exposer côté client.
 *
 * Typé `any` volontairement : le module Dignity est isolé et ne partage pas
 * le type `Database` généré pour SwiftPark.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDignityAdminClient(): any {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Client public (clé anon) pour la lecture côté serveur des besoins publiés.
 * Soumis à RLS : ne voit que ce que les policies autorisent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDignityPublicClient(): any {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
