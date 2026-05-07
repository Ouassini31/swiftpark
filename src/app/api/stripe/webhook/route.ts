import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_placeholder", {
  apiVersion: "2026-04-22.dahlia",
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] Invalid signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { user_id, pack_id, coins } = session.metadata ?? {};

    if (!user_id || !coins) {
      console.error("[stripe/webhook] Missing metadata");
      return NextResponse.json({ ok: true });
    }

    // Marquer la commande comme payée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("stripe_orders")
      .update({
        status:                 "paid",
        stripe_payment_intent:  session.payment_intent as string,
        paid_at:                new Date().toISOString(),
      })
      .eq("stripe_session_id", session.id);

    // Créditer les SwiftCoins
    const coinsInt = parseInt(coins, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("process_coin_transaction", {
      p_user_id:    user_id,
      p_amount:     coinsInt,
      p_type:       "earn",
      p_description: `Achat pack ${coinsInt} SC`,
      p_reservation_id: null,
    });

    console.log(`[stripe/webhook] ✅ +${coinsInt} SC → user ${user_id}`);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("stripe_orders")
      .update({ status: "failed" })
      .eq("stripe_session_id", session.id);
  }

  return NextResponse.json({ ok: true });
}
