import { publicClient, isSupabaseConfigured } from "./supabase";
import { PUBLIC_NEED_FIELDS, type Need, type Program, type Organization, type Proof } from "./types";

/** Accès données PUBLIC uniquement (client anon, RLS). Sans colonnes sensibles. */

export async function getPublishedNeeds(category?: string): Promise<{
  needs: Need[];
  programs: Map<string, Program>;
}> {
  if (!isSupabaseConfigured) return { needs: [], programs: new Map() };
  const sb = publicClient();

  const { data: programs } = await sb.from("donalia_programs").select("*").eq("is_public", true);
  const progMap = new Map<string, Program>((programs ?? []).map((p) => [p.id, p as Program]));

  let allowed = Array.from(progMap.keys());
  if (category) {
    allowed = (programs ?? []).filter((p) => p.category === category).map((p) => p.id);
  }
  if (allowed.length === 0) return { needs: [], programs: progMap };

  const { data: needs } = await sb
    .from("donalia_needs")
    .select(PUBLIC_NEED_FIELDS)
    .in("program_id", allowed)
    .order("created_at", { ascending: false });

  return { needs: (needs ?? []) as Need[], programs: progMap };
}

export async function getFeaturedNeeds(limit = 3): Promise<{
  needs: Need[];
  programs: Map<string, Program>;
}> {
  const { needs, programs } = await getPublishedNeeds();
  const sorted = [...needs].sort((a, b) => {
    const rank = (s: string) => (s === "publie" || s === "finance" ? 0 : 1);
    return rank(a.status) - rank(b.status);
  });
  return { needs: sorted.slice(0, limit), programs };
}

export async function getNeed(id: string): Promise<{
  need: Need | null;
  program: Program | null;
  org: Organization | null;
}> {
  if (!isSupabaseConfigured) return { need: null, program: null, org: null };
  const sb = publicClient();
  const { data: need } = await sb
    .from("donalia_needs")
    .select(PUBLIC_NEED_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (!need) return { need: null, program: null, org: null };

  const { data: program } = await sb
    .from("donalia_programs")
    .select("*")
    .eq("id", (need as Need).program_id)
    .maybeSingle();

  const org = program?.org_id ? await getOrg(program.org_id) : null;
  return { need: need as Need, program: (program as Program) ?? null, org };
}

export async function getProgramBySlug(slug: string): Promise<{
  program: Program | null;
  org: Organization | null;
  needs: Need[];
}> {
  if (!isSupabaseConfigured) return { program: null, org: null, needs: [] };
  const sb = publicClient();
  const { data: program } = await sb
    .from("donalia_programs")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!program) return { program: null, org: null, needs: [] };

  const { data: needs } = await sb
    .from("donalia_needs")
    .select(PUBLIC_NEED_FIELDS)
    .eq("program_id", program.id)
    .order("created_at", { ascending: false });

  const org = program.org_id ? await getOrg(program.org_id) : null;
  return { program: program as Program, org, needs: (needs ?? []) as Need[] };
}

export async function getPublicPrograms(): Promise<Program[]> {
  if (!isSupabaseConfigured) return [];
  const sb = publicClient();
  const { data } = await sb
    .from("donalia_programs")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as Program[];
}

export async function getPublishedProof(needId: string): Promise<Proof | null> {
  if (!isSupabaseConfigured) return null;
  const sb = publicClient();
  const { data } = await sb
    .from("donalia_proofs")
    .select("*")
    .eq("need_id", needId)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .maybeSingle();
  return (data as Proof) ?? null;
}

async function getOrg(id: string): Promise<Organization | null> {
  const sb = publicClient();
  const { data } = await sb.from("donalia_organizations").select("*").eq("id", id).maybeSingle();
  return (data as Organization) ?? null;
}
