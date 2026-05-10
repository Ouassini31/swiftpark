/**
 * Edge Function : send-push
 *
 * Envoie une notification Web Push VAPID (RFC 8291 / RFC 8188).
 * Peut être appelée de deux façons :
 *   1. Webhook Supabase (INSERT sur la table notifications)
 *   2. Appel direct depuis une autre Edge Function
 *      → body: { user_id, title, body, url? }
 *
 * Variables d'environnement requises :
 *   VAPID_PUBLIC_KEY   — base64url-encoded 65-byte P-256 uncompressed public key
 *   VAPID_PRIVATE_KEY  — base64url-encoded 32-byte P-256 private key
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:admin@swiftpark.app";

/* ── Utilities ──────────────────────────────────────────────────────────── */

const enc = new TextEncoder();

const b64u = (s: string) =>
  btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const b64uBuf = (b: Uint8Array): string => {
  let s = "";
  b.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

const fromB64u = (s: string): Uint8Array => {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b + "===".slice((b.length + 3) % 4)), (c) =>
    c.charCodeAt(0));
};

/** HMAC-SHA-256 */
async function hmac256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

/** HKDF-Extract(salt, IKM) = HMAC-SHA-256(key=salt, data=IKM) */
const hkdfExtract = (salt: Uint8Array, ikm: Uint8Array) => hmac256(salt, ikm);

/** HKDF-Expand(PRK, info, len) = HMAC-SHA-256(key=PRK, data=info‖0x01)[:len] */
const hkdfExpand = (prk: Uint8Array, info: Uint8Array, len: number) =>
  hmac256(prk, new Uint8Array([...info, 0x01])).then((t) => t.slice(0, len));

/** Full HKDF (Extract + Expand) */
const hkdf = async (
  salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number
) => hkdfExpand(await hkdfExtract(salt, ikm), info, len);

/**
 * Wrap a raw 32-byte P-256 private key in a minimal PKCS#8 DER envelope
 * so Web Crypto can import it via "pkcs8".
 */
function buildPkcs8(raw: Uint8Array): Uint8Array {
  // SEQUENCE { version, AlgorithmIdentifier (ecPublicKey + prime256v1), privateKey }
  const header = new Uint8Array([
    0x30, 0x41,                                     // SEQUENCE (65 bytes)
    0x02, 0x01, 0x00,                               // version = 0
    0x30, 0x13,                                     // AlgorithmIdentifier
      0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey
      0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID prime256v1
    0x04, 0x27,                                     // OCTET STRING (39 bytes)
      0x30, 0x25,                                   // ECPrivateKey SEQUENCE
        0x02, 0x01, 0x01,                           // version = 1
        0x04, 0x20,                                 // privateKey (32 bytes follow)
  ]);
  const out = new Uint8Array(header.length + 32);
  out.set(header);
  out.set(raw.slice(0, 32), header.length);
  return out;
}

/* ── VAPID JWT (ES256) ──────────────────────────────────────────────────── */

async function buildVapidJwt(endpoint: string): Promise<string> {
  const { origin } = new URL(endpoint);
  const now = Math.floor(Date.now() / 1000);

  const header = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = b64u(
    JSON.stringify({ aud: origin, exp: now + 86400, sub: VAPID_SUBJECT })
  );
  const sigInput = `${header}.${claims}`;

  const pkcs8  = buildPkcs8(fromB64u(VAPID_PRIVATE));
  const key    = await crypto.subtle.importKey(
    "pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, key, enc.encode(sigInput)
  );

  return `${sigInput}.${b64uBuf(new Uint8Array(sigBuf))}`;
}

/* ── aes128gcm Payload Encryption (RFC 8291 § 3 + RFC 8188) ────────────── */

async function encryptPayload(
  message: string,
  p256dh: string, // base64url-encoded 65-byte uncompressed P-256 recipient public key
  auth: string    // base64url-encoded 16-byte auth secret
): Promise<Uint8Array> {
  const plaintext   = enc.encode(message);
  const authSecret  = fromB64u(auth);
  const uaPublic    = fromB64u(p256dh);

  // 1. Import recipient public key
  const recipientKey = await crypto.subtle.importKey(
    "raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // 2. Generate ephemeral sender (application server) key pair
  const senderKP = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const asPublic = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKP.publicKey)
  ); // 65 bytes, uncompressed

  // 3. ECDH shared secret
  const ecdhBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientKey }, senderKP.privateKey, 256
  );
  const ecdhSecret = new Uint8Array(ecdhBits);

  // 4. IKM derivation (RFC 8291 § 3.3)
  //    PRK_key = HKDF-Extract(salt=auth_secret, IKM=ecdh_secret)
  //    key_info = "WebPush: info\x00" || ua_public || as_public
  //    IKM = HKDF-Expand(PRK_key, key_info, 32)
  const prkKey  = await hkdfExtract(authSecret, ecdhSecret);
  const keyInfo = new Uint8Array([
    ...enc.encode("WebPush: info\x00"),
    ...uaPublic,
    ...asPublic,
  ]);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  // 5. Random salt for content encryption header
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 6. Derive CEK (16 bytes) and NONCE (12 bytes) via HKDF (RFC 8188)
  const cek   = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\x00"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\x00"),     12);

  // 7. AES-128-GCM encrypt: plaintext + \x02 (single-record padding delimiter)
  const aesKey     = await crypto.subtle.importKey(
    "raw", cek, { name: "AES-GCM" }, false, ["encrypt"]
  );
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      aesKey,
      new Uint8Array([...plaintext, 0x02])
    )
  );

  // 8. aes128gcm HTTP body (RFC 8188 § 2.1):
  //    salt (16) | rs (4 BE) | idlen (1 = 65) | keyid (65 = asPublic) | ciphertext
  const body = new Uint8Array(16 + 4 + 1 + 65 + ciphertext.length);
  let off = 0;
  body.set(salt, off);                                   off += 16;
  new DataView(body.buffer).setUint32(off, 4096, false); off += 4;  // rs = 4096
  body[off++] = 65;                                                   // idlen
  body.set(asPublic, off);                               off += 65;
  body.set(ciphertext, off);

  return body;
}

/* ── Core send function ─────────────────────────────────────────────────── */

interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function sendOnePush(
  sub: PushSub,
  title: string,
  body: string,
  url?: string
): Promise<"ok" | "expired" | "error"> {
  const payload = JSON.stringify({
    title,
    body,
    icon:  "/icon-192.png",
    badge: "/icon-192.png",
    data:  { url: url ?? "/map" },
  });

  try {
    const [jwt, encrypted] = await Promise.all([
      buildVapidJwt(sub.endpoint),
      encryptPayload(payload, sub.keys.p256dh, sub.keys.auth),
    ]);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization:       `vapid t=${jwt},k=${VAPID_PUBLIC}`,
        "Content-Encoding":  "aes128gcm",
        "Content-Type":      "application/octet-stream",
        TTL:                 "86400",
        Urgency:             "normal",
      },
      body: encrypted,
    });

    if (res.status === 410 || res.status === 404) return "expired";
    return res.ok || res.status === 201 ? "ok" : "error";
  } catch (err) {
    console.error("sendOnePush error:", err);
    return "error";
  }
}

/* ── Entry point ────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  const raw = await req.json();

  // Normalise: webhook (record.user_id) OR direct call (user_id at root)
  const notification: { user_id: string; title: string; body?: string; message?: string; url?: string } =
    raw.type === "INSERT" && raw.table === "notifications"
      ? raw.record
      : raw.user_id
        ? raw
        : null;

  if (!notification) {
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }

  const { user_id, title, url } = notification;
  const body = notification.body ?? notification.message ?? "";

  // Fetch push subscriptions for this user
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", user_id);

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no_subs" }), { status: 200 });
  }

  let sent = 0;
  const expired: string[] = [];

  for (const { subscription } of subs) {
    const sub = typeof subscription === "string" ? JSON.parse(subscription) : subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) continue;

    const result = await sendOnePush(sub as PushSub, title, body, url);
    if (result === "ok") {
      sent++;
    } else if (result === "expired") {
      expired.push(sub.endpoint);
    }
  }

  // Purge expired subscriptions
  if (expired.length > 0) {
    for (const endpoint of expired) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user_id)
        .filter("subscription->endpoint", "eq", endpoint);
    }
    console.log(`🗑️ Purged ${expired.length} expired subscription(s) for ${user_id}`);
  }

  return new Response(
    JSON.stringify({ sent, expired: expired.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
