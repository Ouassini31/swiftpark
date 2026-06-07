import { NextResponse } from "next/server";
import { markDonationPaid } from "@/lib/donalia/donations-server";

/**
 * Webhook HelloAsso. À configurer dans le back-office HelloAsso de l'asso.
 * Sur un paiement confirmé (Order), on marque le don payé via la référence
 * passée en metadata lors de la création de l'intent.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.HELLOASSO_WEBHOOK_SECRET;
    if (secret) {
      const provided = req.headers.get("x-helloasso-signature") ?? req.headers.get("authorization");
      if (provided !== secret) {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const payload = await req.json();
    // HelloAsso : la structure varie selon l'event ; on cherche la metadata.ref
    const meta =
      payload?.metadata ??
      payload?.data?.metadata ??
      payload?.order?.metadata ??
      {};
    const ref = meta.ref ?? payload?.data?.checkoutIntentId ?? payload?.id;

    const eventType = payload?.eventType ?? payload?.type ?? "";
    const isPaid =
      /order|payment/i.test(String(eventType)) ||
      payload?.data?.state === "Authorized" ||
      payload?.state === "Processed";

    if (ref && isPaid) {
      await markDonationPaid(String(ref));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("helloasso webhook error", err);
    // 200 pour éviter les retries en boucle sur payload non géré
    return NextResponse.json({ ok: true });
  }
}
