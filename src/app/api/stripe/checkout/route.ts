import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquant");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(req: NextRequest) {
  try {
    const { pack_id } = await req.json();

    if (!pack_id) {
      return NextResponse.json({ error: "pack_id requis" }, { status: 400 });
    }

    // Auth Supabase
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get:    (name: string) => cookieStore.get(name)?.value,
          set:    (name: string, value: string, options: CookieOptions) => { try { (cookieStore as any).set({ name, value, ...options }); } catch {} },
          remove: (name: string, options: CookieOptions) => { try { (cookieStore as any).set({ name, value: "", ...options }); } catch {} },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Récupérer le pack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pack } = await (supabase as any)
      .from("coin_packs")
      .select("*")
      .eq("id", pack_id)
      .single() as { data: { id: string; name: string; coins: number; price_eur_cents: number; bonus_pct: number } | null };

    if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.price_eur_cents,
            product_data: {
              name: `SwiftCoins — Pack ${pack.name}`,
              description: `${pack.coins} SC${pack.bonus_pct > 0 ? ` (+${pack.bonus_pct}% bonus)` : ""}`,
              images: [`${appUrl}/icon-512.png`],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/wallet?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/wallet?canceled=1`,
      metadata: {
        user_id: user.id,
        pack_id: pack.id,
        coins:   pack.coins.toString(),
      },
    });

    // Enregistrer l'ordre pending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("stripe_orders").insert({
      user_id:           user.id,
      pack_id:           pack.id,
      stripe_session_id: session.id,
      status:            "pending",
      coins:             pack.coins,
      amount_eur_cents:  pack.price_eur_cents,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
