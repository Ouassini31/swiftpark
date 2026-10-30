// create-payout — retire des SwiftCoins retirables en euros sur l'IBAN.
// Process :
//   1. Vérifie auth
//   2. Vérifie que user.withdrawable_balance >= amount_sc et >= 20
//   3. Vérifie compte Connect actif (payouts_enabled)
//   4. Débite le wallet via process_coin_transaction(type='withdraw')
//   5. Crée un Transfer (platform → compte Connect)
//   6. Crée un Payout (Connect → IBAN, en mode manuel)
//   7. Trace dans stripe_payouts
//
// Body : { amount_sc: number }   (1 SC = 1 € = 100 centimes)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import Stripe from 'npm:stripe@17.6.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

const MIN_SC = 20

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return json(500, { error: 'stripe_not_configured' })
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })

  const auth = req.headers.get('Authorization') ?? ''
  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  )
  const { data: userRes, error: userErr } = await supa.auth.getUser()
  if (userErr || !userRes.user) return json(401, { error: 'unauthorized' })
  const user = userRes.user

  let body: { amount_sc?: number }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  const sc = Math.round(Number(body.amount_sc) || 0)
  if (sc < MIN_SC) return json(400, { error: 'amount_too_low', min: MIN_SC })

  const supaAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile } = await supaAdmin
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.stripe_connect_account_id || !profile.stripe_connect_payouts_enabled) {
    return json(409, { error: 'connect_not_ready' })
  }

  const { data: withdrawableData, error: withdrawableErr } = await supaAdmin.rpc(
    'get_withdrawable_balance',
    { p_user_id: user.id },
  )
  if (withdrawableErr) {
    console.error('withdrawable', withdrawableErr)
    return json(500, { error: 'balance_lookup_failed' })
  }
  const withdrawable = (withdrawableData ?? 0) as number
  if (withdrawable < sc) {
    return json(409, { error: 'insufficient_balance', withdrawable })
  }

  // 1 SC = 1 € = 100 centimes
  const cents = sc * 100

  // 1) Débiter le wallet (les SC retirables baissent)
  const { data: txData, error: txErr } = await supaAdmin.rpc(
    'process_coin_transaction',
    {
      p_user_id: user.id,
      p_amount: -sc,
      p_type: 'withdraw',
      p_description: `Retrait · ${sc} SC`,
      p_is_withdrawable: true,
      p_metadata: { amount_eur_cents: cents },
    },
  )
  if (txErr) {
    console.error('debit', txErr)
    return json(500, { error: 'debit_failed' })
  }

  // 2) Trace de la demande de payout (pending)
  const { data: payoutRow } = await supaAdmin
    .from('stripe_payouts')
    .insert({
      user_id: user.id,
      amount_sc: sc,
      amount_eur_cents: cents,
      status: 'pending',
      coin_transaction_id: (txData as string | null) ?? null,
    })
    .select('id')
    .single()

  try {
    // 3) Transfer platform → connected account
    const transfer = await stripe.transfers.create({
      amount: cents,
      currency: 'eur',
      destination: profile.stripe_connect_account_id,
      metadata: {
        user_id: user.id,
        payout_request_id: payoutRow?.id ?? '',
      },
    })

    // 4) Payout connected account → banque
    const payout = await stripe.payouts.create(
      {
        amount: cents,
        currency: 'eur',
        method: 'standard',
        metadata: { user_id: user.id, payout_request_id: payoutRow?.id ?? '' },
      },
      { stripeAccount: profile.stripe_connect_account_id },
    )

    await supaAdmin
      .from('stripe_payouts')
      .update({
        stripe_transfer_id: transfer.id,
        stripe_payout_id: payout.id,
        status: 'in_transit',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutRow?.id)

    return json(200, { ok: true, payout_id: payout.id })
  } catch (err) {
    console.error('stripe payout failed', err)
    // Compensate: re-credit the user (manual refund of the debit)
    await supaAdmin.rpc('process_coin_transaction', {
      p_user_id: user.id,
      p_amount: sc,
      p_type: 'refund',
      p_description: `Remboursement retrait échoué · ${sc} SC`,
      p_is_withdrawable: true,
      p_metadata: { reason: 'stripe_payout_failed', payout_request_id: payoutRow?.id },
    })
    await supaAdmin
      .from('stripe_payouts')
      .update({
        status: 'failed',
        failure_reason: (err as Error).message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutRow?.id)
    return json(502, { error: 'stripe_failure', detail: (err as Error).message })
  }
})
