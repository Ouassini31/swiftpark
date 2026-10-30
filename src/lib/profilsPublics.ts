export interface ProfilPublic {
  id: string;
  username: string;
  full_name: string | null;
  rating: number | null;
}

/** Nom et note des autres conducteurs : chacun ne lit que sa propre ligne de `profiles` (migration 014). */
export async function profilsPublics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  ids: string[]
): Promise<Record<string, ProfilPublic>> {
  if (ids.length === 0) return {};
  const { data } = await supabase.rpc("profils_publics", { p_ids: Array.from(new Set(ids)) });
  return Object.fromEntries(((data ?? []) as ProfilPublic[]).map((p) => [p.id, p]));
}
