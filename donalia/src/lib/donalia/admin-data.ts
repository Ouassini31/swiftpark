import "server-only";
import { adminClient } from "./supabase";
import type {
  Need,
  Program,
  Organization,
  Fulfillment,
  Proof,
  Donation,
  RightsDiagnosis,
} from "./types";

export async function adminListPrograms(): Promise<Program[]> {
  const sb = adminClient();
  const { data } = await sb.from("donalia_programs").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Program[];
}

export async function adminListNeeds(): Promise<Need[]> {
  const sb = adminClient();
  const { data } = await sb.from("donalia_needs").select("*").order("updated_at", { ascending: false });
  return (data ?? []) as Need[];
}

export async function adminGetNeed(id: string): Promise<{
  need: Need | null;
  program: Program | null;
  diagnoses: RightsDiagnosis[];
  fulfillments: Fulfillment[];
  proofs: Proof[];
  donations: Donation[];
}> {
  const sb = adminClient();
  const { data: need } = await sb.from("donalia_needs").select("*").eq("id", id).maybeSingle();
  if (!need)
    return { need: null, program: null, diagnoses: [], fulfillments: [], proofs: [], donations: [] };

  const [{ data: program }, { data: diagnoses }, { data: fulfillments }, { data: proofs }, { data: donations }] =
    await Promise.all([
      sb.from("donalia_programs").select("*").eq("id", (need as Need).program_id).maybeSingle(),
      sb.from("donalia_rights_diagnoses").select("*").eq("need_id", id).order("performed_at", { ascending: false }),
      sb.from("donalia_fulfillments").select("*").eq("need_id", id).order("created_at"),
      sb.from("donalia_proofs").select("*").eq("need_id", id).order("created_at"),
      sb.from("donalia_donations").select("*").eq("need_id", id).order("created_at", { ascending: false }),
    ]);

  return {
    need: need as Need,
    program: (program as Program) ?? null,
    diagnoses: (diagnoses ?? []) as RightsDiagnosis[],
    fulfillments: (fulfillments ?? []) as Fulfillment[],
    proofs: (proofs ?? []) as Proof[],
    donations: (donations ?? []) as Donation[],
  };
}

export async function adminOrg(): Promise<Organization | null> {
  const sb = adminClient();
  const { data } = await sb.from("donalia_organizations").select("*").limit(1).maybeSingle();
  return (data as Organization) ?? null;
}

export async function adminReportsCount(): Promise<number> {
  const sb = adminClient();
  const { count } = await sb.from("donalia_reports").select("*", { count: "exact", head: true });
  return count ?? 0;
}
