// POST /api/cancel-spot
// Moment 4 — si le sharer annule : rembourse le finder + notifie.
// Utilisé par : DepartBanner (bouton "Annuler ma place") + Edge Function pré-départ.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { spot_id, user_id, reason } = await req.json() as {
      spot_id: string;
      user_id: string;
      reason?: string; // "no_show" | "cancelled" | "expired"
    };

    if (!spot_id || !user_id) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Vérifier que l'utilisateur est bien le sharer
    const { data: spot } = await supabase
      .from("parking_spots" as never)
      .select("id, address, sharer_id, status, coin_price")
      .eq("id", spot_id)
      .single() as { data: { id: string; address: string; sharer_id: string; status: string; coin_price: number } | null };

    if (!spot) {
      return NextResponse.json({ error: "Place introuvable" }, { status: 404 });
    }

    if (spot.sharer_id !== user_id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (!["available", "reserved"].includes(spot.status)) {
      return NextResponse.json({ error: "Place déjà terminée ou annulée" }, { status: 409 });
    }

    // Chercher une réservation active sur cette place
    const { data: reservation } = await supabase
      .from("reservations" as never)
      .select("id, finder_id, coin_amount, status")
      .eq("spot_id", spot_id)
      .eq("status", "reserved")
      .maybeSingle() as { data: { id: string; finder_id: string; coin_amount: number; status: string } | null };

    // Rembourser le finder s'il y en a un
    if (reservation) {
      // Rembourser le coin_amount au finder
      const { error: refundError } = await supabase.rpc("process_coin_transaction" as never, {
        p_user_id:        reservation.finder_id,
        p_amount:         reservation.coin_amount,
        p_type:           "refund",
        p_description:    `↩️ Remboursement · ${spot.address ?? "Place annulée"}`,
        p_reservation_id: reservation.id,
      });

      if (refundError) {
        console.error("Refund error:", refundError);
        return NextResponse.json({ error: "Erreur lors du remboursement" }, { status: 500 });
      }

      // Marquer la réservation comme annulée
      await supabase
        .from("reservations" as never)
        .update({ status: "cancelled" })
        .eq("id", reservation.id);

      // Notifier le finder du remboursement
      await supabase.from("notifications" as never).insert({
        user_id: reservation.finder_id,
        type:    "refund",
        title:   "↩️ Remboursement effectué",
        message: `Le partageur a annulé. Tes ${reservation.coin_amount} SC ont été remboursés. Cherche une autre place !`,
        url:     "/map",
        read:    false,
      });
    }

    // Marquer la place comme annulée
    await supabase
      .from("parking_spots" as never)
      .update({
        status:     "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason ?? "cancelled_by_sharer",
      })
      .eq("id", spot_id);

    return NextResponse.json({
      success:  true,
      refunded: !!reservation,
      amount:   reservation?.coin_amount ?? 0,
    });
  } catch (err) {
    console.error("Cancel spot error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
