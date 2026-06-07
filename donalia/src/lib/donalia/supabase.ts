import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Client public (anon). Soumis à la RLS : ne voit que ce qui est explicitement
 * autorisé (programmes publics, besoins publiables, preuves d'impact publiques).
 * À utiliser pour TOUTE lecture côté pages publiques.
 */
export function publicClient() {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/**
 * Client admin (service_role). Contourne la RLS — RÉSERVÉ au serveur
 * (routes API admin / webhook). Ne JAMAIS l'exposer au client.
 */
export function adminClient() {
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante : configure-la pour les écritures back-office."
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export const isSupabaseConfigured = Boolean(url && anonKey);
export const isAdminConfigured = Boolean(url && serviceKey);
