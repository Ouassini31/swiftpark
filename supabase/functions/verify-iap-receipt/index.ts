// verify-iap-receipt v2 — App Store Server API (JWT-based, no shared secret).
// Verifies an iOS transaction with Apple, then grants SC to the user.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create as jwtCreate, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const APPLE_PROD_URL    = 'https://api.storekit.itunes.apple.com/inApps/v1/transactions';
const APPLE_SANDBOX_URL = 'https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions';

interface Body { product_id: string; transaction_id: string }

function pemToCryptoKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    bin.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

async function appleJwt(): Promise<string> {
  const keyId    = Deno.env.get('APPLE_KEY_ID')!;
  const issuerId = Deno.env.get('APPLE_ISSUER_ID')!;
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID')!;
  const keyB64   = Deno.env.get('APPLE_KEY_B64')!;
  const pem      = atob(keyB64);
  const key      = await pemToCryptoKey(pem);

  return await jwtCreate(
    { alg: 'ES256', kid: keyId, typ: 'JWT' },
    {
      iss: issuerId,
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 20),       // 20 min
      aud: 'appstoreconnect-v1',
      bid: bundleId,
    },
    key,
  );
}

function decodeJWS(jws: string): Record<string, unknown> {
  // Apple signedTransactionInfo = JWS "header.payload.signature".
  // We only need the payload for verification of transactionId/productId match.
  const parts = jws.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWS');
  const padded = parts[1] + '='.repeat((4 - parts[1].length % 4) % 4);
  const json   = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}

async function fetchTransaction(jwt: string, transactionId: string, useSandbox = false) {
  const url = `${useSandbox ? APPLE_SANDBOX_URL : APPLE_PROD_URL}/${encodeURIComponent(transactionId)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Auth: get user from JWT
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${authHeader}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return new Response('Unauthorized', { status: 401 });
  const userId = userData.user.id;

  let body: Body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  if (!body.product_id || !body.transaction_id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing fields' }), { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // Anti-replay
  const { data: existing } = await admin
    .from('iap_purchases')
    .select('id')
    .eq('transaction_id', body.transaction_id)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sign Apple JWT
  let jwt: string;
  try { jwt = await appleJwt(); }
  catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'JWT signing failed: ' + String(e) }), { status: 500 });
  }

  // Call Apple (prod first, fallback sandbox)
  let apple = await fetchTransaction(jwt, body.transaction_id, false);
  if (apple.status === 404) {
    apple = await fetchTransaction(jwt, body.transaction_id, true);
  }
  if (apple.status !== 200) {
    return new Response(JSON.stringify({ ok: false, error: 'Apple verify failed', status: apple.status, body: apple.json }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Apple returns { signedTransactionInfo: "<JWS>" }
  const signedJws = (apple.json as { signedTransactionInfo?: string }).signedTransactionInfo;
  if (!signedJws) {
    return new Response(JSON.stringify({ ok: false, error: 'No signedTransactionInfo' }), { status: 402 });
  }
  let payload: Record<string, unknown>;
  try { payload = decodeJWS(signedJws); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'JWS decode failed' }), { status: 402 }); }

  // Check productId + transactionId match
  if (payload.productId !== body.product_id || payload.transactionId !== body.transaction_id) {
    return new Response(JSON.stringify({ ok: false, error: 'productId/transactionId mismatch' }), { status: 402 });
  }

  // Lookup pack
  const { data: pack } = await admin
    .from('coin_packs')
    .select('coins, price_eur_cents, bonus_pct')
    .eq('iap_product_id', body.product_id)
    .maybeSingle();
  if (!pack) {
    return new Response(JSON.stringify({ ok: false, error: 'Unknown pack' }), { status: 404 });
  }

  const baseCoins  = pack.coins as number;
  const bonusPct   = pack.bonus_pct as number;
  const totalCoins = Math.floor(baseCoins * (1 + bonusPct / 100));
  const eurCents   = pack.price_eur_cents as number;

  // Store IAP record
  const { error: insErr } = await admin.from('iap_purchases').insert({
    user_id:        userId,
    product_id:     body.product_id,
    transaction_id: body.transaction_id,
    receipt:        signedJws.substring(0, 200) + '...[truncated]',
    coins_granted:  totalCoins,
    amount_eur:     eurCents,
    status:         'completed',
    raw_response:   { payload },
  });
  if (insErr) {
    return new Response(JSON.stringify({ ok: false, error: insErr.message }), { status: 500 });
  }

  // Grant coins (non-withdrawable per Apple rules)
  const { error: rpcErr } = await admin.rpc('process_coin_transaction', {
    p_user_id:         userId,
    p_amount:          totalCoins,
    p_type:            'recharge',
    p_description:     `Achat ${body.product_id} (${totalCoins} SC)`,
    p_reservation_id:  null,
    p_metadata:        { transaction_id: body.transaction_id, product_id: body.product_id, source: 'apple_iap' },
    p_is_withdrawable: false,
  });
  if (rpcErr) {
    // L'anti-rejeu ne doit pas bloquer un nouvel essai pour un achat jamais crédité
    await admin.from('iap_purchases').delete().eq('transaction_id', body.transaction_id);
    return new Response(JSON.stringify({ ok: false, error: rpcErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, coins_granted: totalCoins }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
