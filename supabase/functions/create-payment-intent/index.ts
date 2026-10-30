// create-payment-intent — crée/retrouve un Customer Stripe pour l'utilisateur,
// génère une ephemeral key + un PaymentIntent. Retourne ce qu'il faut
// pour initialiser la PaymentSheet côté client.
//
// Body attendu :
//  {
//    amount_eur_cents: number,   // montant en centimes EUR (ex: 999 = 9,99€)
//    sc_amount: number,          // nombre de SwiftCoins à créditer
//    pack_id: string             // 'starter_10' | 'pro_25' | 'max_50' | 'free'
//  }
//
// Secrets requis (Supabase Edge Functions secrets) :
//   STRIPE_SECRET_KEY  — sk_live_... ou sk_test_...
//   SUPABASE_URL       — auto-injecté
//   SUPABASE_SERVICE_ROLE_KEY — auto-injecté
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import Stripe from 'npm:stripe@17.6.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Les montants viennent du client : ils doivent correspondre au pack, ou à 1 SC = 1 € en montant libre
const PACKS: Record<string, { sc: number; cents: number }> = {
  starter_10: { sc: 10, cents: 999 },
  pro_25: { sc: 25, cents: 2399 },
  max_50: { sc: 50, cents: 4499 },
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return json(500, { error: 'stripe_not_configured' })
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })

  // Auth — must come from a signed-in user
  const auth = req.headers.get('Authorization') ?? ''
  const supaUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  )
  const { data: userRes, error: userErr } = await supaUser.auth.getUser()
  if (userErr || !userRes.user) return json(401, { error: 'unauthorized' })
  const user = userRes.user

  // Body
  let body: { amount_eur_cents?: number; sc_amount?: number; pack_id?: string }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  const amount = Math.round(Number(body.amount_eur_cents) || 0)
  const sc = Math.round(Number(body.sc_amount) || 0)
  const packId = String(body.pack_id ?? 'free')
  if (amount < 500 || sc < 5) return json(400, { error: 'amount_too_low' })
  if (amount > 1_000_00) return json(400, { error: 'amount_too_high' })
  const pack = Object.hasOwn(PACKS, packId) ? PACKS[packId] : null
  const validAmount = pack
    ? pack.sc === sc && pack.cents === amount
    : packId === 'free' && sc * 100 === amount
  if (!validAmount) return json(400, { error: 'invalid_pack' })

  // Admin client — for DB writes
  const supaAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Get-or-create the Stripe customer for this user
  const { data: profile } = await supaAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supaAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Ephemeral key required by PaymentSheet
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: '2024-11-20.acacia' },
  )

  // PaymentIntent — the webhook will read metadata to credit the right user/amount
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: {
      user_id: user.id,
      sc_amount: String(sc),
      pack_id: packId,
      type: 'sc_recharge',
    },
    description: `SwiftPark · Recharge ${sc} SC`,
  })

  return json(200, {
    paymentIntentClientSecret: pi.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
  })
})
