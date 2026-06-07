import type {
  DignityStatus,
  DignityUrgencyValue,
} from "./constants";

// Types des entités Dignity Layer (alignés sur la migration 014).

export interface DignityNeed {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string;
  description: string;
  category: string;
  country: string;
  city: string;
  amount_requested: number;
  amount_collected: number;
  urgency_level: DignityUrgencyValue;
  status: DignityStatus;
  is_public: boolean;
  anonymized_publication: boolean;
  main_image_url: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  completed_at: string | null;
}

export interface DignityDocument {
  id: string;
  need_id: string;
  file_url: string;
  file_type: string | null;
  visibility: "admin_only" | "public";
  created_at: string;
}

export interface DignityContribution {
  id: string;
  need_id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  message: string | null;
  payment_status: "pending" | "paid" | "failed";
  created_at: string;
}

export interface DignityVerificationLog {
  id: string;
  need_id: string;
  admin_label: string | null;
  verification_method: string | null;
  internal_note: string | null;
  public_note: string | null;
  status_before: string | null;
  status_after: string | null;
  created_at: string;
}

export interface DignityImpactUpdate {
  id: string;
  need_id: string;
  title: string;
  description: string;
  image_url: string | null;
  proof_file_url: string | null;
  created_at: string;
}
