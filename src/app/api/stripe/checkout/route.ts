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
    const { pack_id, name: packName, coins: packCoins, price_eur_cents: packPrice, bonus_pct: packBonus } = await req.json();

    if (!pack_id) {
      return NextResponse.json({ error: "pack_id requis" }, { status: 400 });
    }

    // Auth Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Récupérer le pack — depuis la DB ou depuis les données envoyées directement
    let pack: { id: string; name: string; coins: number; price_eur_cents: number; bonus_pct: number } | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbPack } = await (supabase as any)
      .from("coin_packs")
      .select("*")
      .eq("id", pack_id)
      .single() as { data: { id: string; name: string; coins: number; price_eur_cents: number; bonus_pct: number } | null };

    if (dbPack) {
      pack = dbPack;
    } else if (packName && packCoins && packPrice) {
      // Fallback : utiliser les données envoyées directement (DEFAULT_PACKS)
      pack = { id: pack_id, name: packName, coins: packCoins, price_eur_cents: packPrice, bonus_pct: packBonus ?? 0 };
    }

    if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });

    const appUrl = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pack.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("stripe_orders").insert({
      user_id:           user.id,
      pack_id:           isRealUuid ? pack.id : null,
      stripe_session_id: session.id,
      status:            "pending",
      coins:             pack.coins,
      amount_eur_cents:  pack.price_eur_cents,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
