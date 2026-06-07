// Constantes métier du module Dignity Layer (isolé de SwiftPark).

export const DIGNITY_CATEGORIES = [
  "Santé",
  "Logement",
  "Alimentation",
  "Éducation",
  "Énergie / chauffage",
  "Urgence familiale",
  "Autre besoin essentiel",
] as const;

export type DignityCategory = (typeof DIGNITY_CATEGORIES)[number];

export const DIGNITY_URGENCY_LEVELS = [
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "forte", label: "Forte" },
  { value: "critique", label: "Critique" },
] as const;

export type DignityUrgencyValue = (typeof DIGNITY_URGENCY_LEVELS)[number]["value"];

export const DIGNITY_STATUSES = {
  pending_verification: "Besoin déposé mais non validé",
  rejected: "Besoin refusé",
  verified: "Besoin contrôlé",
  funding: "Besoin visible et finançable",
  funded: "Montant atteint",
  completed: "Preuve d'impact ajoutée",
} as const;

export type DignityStatus = keyof typeof DIGNITY_STATUSES;

export const DIGNITY_STATUS_LABELS: Record<DignityStatus, string> = {
  pending_verification: "En vérification",
  rejected: "Refusé",
  verified: "Vérifié",
  funding: "En financement",
  funded: "Financé",
  completed: "Impact publié",
};

// Couleurs Tailwind par statut (badges).
export const DIGNITY_STATUS_STYLES: Record<DignityStatus, string> = {
  pending_verification: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  verified: "bg-blue-50 text-blue-700 ring-blue-600/20",
  funding: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  funded: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  completed: "bg-stone-100 text-stone-700 ring-stone-500/20",
};

// Statuts considérés comme « publics » (visibles côté donateur).
export const DIGNITY_PUBLIC_STATUSES: DignityStatus[] = [
  "funding",
  "funded",
  "completed",
];

export const DIGNITY_VERIFICATION_METHODS = [
  { value: "document", label: "Document justificatif" },
  { value: "video_call", label: "Appel vidéo" },
  { value: "local_contact", label: "Contact local" },
  { value: "human_validation", label: "Validation humaine" },
  { value: "partner_association", label: "Association partenaire" },
] as const;
