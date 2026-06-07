/**
 * HelloAsso Checkout (API v5). Le don est rattaché à un PROGRAMME ; l'argent va
 * sur le compte HelloAsso de l'association — jamais via Donalia/VALTYS.
 * Le pourboire (tip) est un revenu HelloAsso, pas Donalia.
 *
 * Sans clés HELLOASSO_*, MODE DÉMO : redirection vers /merci (parcours complet
 * sans paiement réel).
 */

const BASE = process.env.HELLOASSO_API_BASE ?? "https://api.helloasso-sandbox.com";
const CLIENT_ID = process.env.HELLOASSO_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.HELLOASSO_CLIENT_SECRET ?? "";
const ORG_SLUG = process.env.HELLOASSO_ORG_SLUG ?? "";

export const helloAssoConfigured = Boolean(CLIENT_ID && CLIENT_SECRET && ORG_SLUG);

type CheckoutInput = {
  amountCents: number;
  tipCents: number;
  donorEmail: string;
  donorName?: string;
  programId: string; // OBLIGATOIRE
  needId?: string | null; // affichage seulement
  siteUrl: string;
};

type CheckoutResult = { redirectUrl: string; checkoutIntentId: string; demo: boolean };

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HelloAsso OAuth: ${res.status}`);
  return (await res.json()).access_token as string;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const ref = `donalia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const total = input.amountCents + (input.tipCents || 0);

  if (!helloAssoConfigured) {
    const params = new URLSearchParams({
      demo: "1",
      ref,
      amount: String(input.amountCents),
      program: input.programId,
    });
    if (input.needId) params.set("need", input.needId);
    return { redirectUrl: `${input.siteUrl}/merci?${params}`, checkoutIntentId: ref, demo: true };
  }

  const token = await getToken();
  const res = await fetch(`${BASE}/v5/organizations/${ORG_SLUG}/checkout-intents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      totalAmount: total,
      initialAmount: total,
      itemName: "Don à un programme",
      backUrl: `${input.siteUrl}/don`,
      errorUrl: `${input.siteUrl}/don?error=1`,
      returnUrl: `${input.siteUrl}/merci?ref=${ref}`,
      containsDonation: true,
      payer: { email: input.donorEmail },
      metadata: {
        ref,
        program_id: input.programId,
        need_id: input.needId ?? null,
        donor_name: input.donorName ?? null,
        tip_cents: input.tipCents ?? 0,
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HelloAsso checkout: ${res.status}`);
  const json = await res.json();
  return { redirectUrl: json.redirectUrl as string, checkoutIntentId: String(json.id ?? ref), demo: false };
}
