import type { NeedStatus, GapReason } from "./constants";

export type { NeedStatus, GapReason };

export type Organization = {
  id: string;
  name: string;
  rna: string | null;
  is_interet_general: boolean | null;
};

export type Program = {
  id: string;
  org_id: string;
  slug: string;
  category: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
};

export type Need = {
  id: string;
  program_id: string;
  title: string;
  amount_cents: number;
  collected_cents: number;
  gap_reason: GapReason;
  gap_explainer: string | null;
  status: NeedStatus;
  activation_traced: boolean;
  region: string | null;
  beneficiary_ref: string | null; // jamais exposé publiquement
  justification_url: string | null; // jamais exposé publiquement
  proof_required: boolean | null;
  created_at: string;
  updated_at: string;
};

/** Champs sûrs à exposer publiquement (sans données sensibles). */
export const PUBLIC_NEED_FIELDS =
  "id, program_id, title, amount_cents, collected_cents, gap_reason, gap_explainer, status, region, created_at, updated_at";

export type RightsDiagnosis = {
  id: string;
  need_id: string;
  estimated_aids: Record<string, number> | null;
  residual_cents: number | null;
  source: string;
  is_estimate: boolean;
  note: string | null;
  performed_at: string;
};

export type Donation = {
  id: string;
  program_id: string;
  need_id: string | null;
  amount_cents: number;
  tip_cents: number;
  donor_email: string;
  donor_name: string | null;
  helloasso_checkout_intent_id: string | null;
  status: "pending" | "paid" | "refunded";
  receipt_id: string | null;
  created_at: string;
};

export type Fulfillment = {
  id: string;
  need_id: string;
  vendor: string | null;
  amount_cents: number | null;
  invoice_url: string | null;
  purchased_at: string | null;
  created_at: string;
};

export type Proof = {
  id: string;
  need_id: string;
  media_url: string | null;
  caption: string | null;
  published: boolean;
  created_at: string;
};
