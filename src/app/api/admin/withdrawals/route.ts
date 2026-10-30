// POST /api/admin/withdrawals
// L'admin marque un virement comme fait, ou rejette la demande : les pièces reviennent alors au compte.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: isAdmin } = await (supabaseAuth as any).rpc("est_admin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !["completed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = getSupabase();

    // La condition sur le statut empêche de rembourser deux fois
    const { data: request } = await supabase
      .from("withdrawal_requests" as never)
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", ["pending", "processing"])
      .select("user_id, amount_sc")
      .maybeSingle() as { data: { user_id: string; amount_sc: number } | null };

    if (!request) {
      return NextResponse.json({ error: "Demande déjà traitée" }, { status: 409 });
    }

    if (status === "rejected") {
      const { error: refundError } = await supabase.rpc("process_coin_transaction" as never, {
        p_user_id:        request.user_id,
        p_amount:         request.amount_sc,
        p_type:           "refund",
        p_description:    `↩️ Retrait rejeté – ${request.amount_sc} SC`,
        p_reservation_id: null,
      });

      if (refundError) {
        console.error("Withdrawal refund error:", refundError);
        await supabase
          .from("withdrawal_requests" as never)
          .update({ status: "pending", processed_at: null })
          .eq("id", id);
        return NextResponse.json({ error: "Erreur lors du remboursement" }, { status: 500 });
      }

      await supabase.from("notifications" as never).insert({
        user_id: request.user_id,
        type:    "withdrawal_rejected",
        title:   "↩️ Retrait rejeté",
        body:    `Ta demande de retrait a été rejetée. Tes ${request.amount_sc} SC sont de retour sur ton compte.`,
        data:    { url: "/wallet" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/withdrawals]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
