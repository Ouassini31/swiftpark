import { adminClient, isAdminConfigured } from "./supabase";

/**
 * Marque un don payé et met à jour les compteurs (centimes).
 * Appelé par le webhook HelloAsso (réel) ou /merci (démo). Idempotent.
 */
export async function markDonationPaid(intentRef: string): Promise<boolean> {
  if (!isAdminConfigured || !intentRef) return false;
  const sb = adminClient();

  const { data: donation } = await sb
    .from("donalia_donations")
    .select("id, amount_cents, need_id, status")
    .eq("helloasso_checkout_intent_id", intentRef)
    .maybeSingle();

  if (!donation) return false;
  if (donation.status === "paid") return true; // idempotent

  await sb.from("donalia_donations").update({ status: "paid" }).eq("id", donation.id);

  // Affichage : si le don illustre un besoin, on incrémente son collecté.
  if (donation.need_id) {
    const { data: need } = await sb
      .from("donalia_needs")
      .select("id, collected_cents, amount_cents, status")
      .eq("id", donation.need_id)
      .maybeSingle();
    if (need) {
      const collected = Number(need.collected_cents) + Number(donation.amount_cents);
      const reached = collected >= Number(need.amount_cents);
      await sb
        .from("donalia_needs")
        .update({
          collected_cents: collected,
          status: reached && need.status === "publie" ? "finance" : need.status,
        })
        .eq("id", need.id);
    }
  }
  return true;
}
