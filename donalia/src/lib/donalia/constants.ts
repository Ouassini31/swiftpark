export const BRAND = {
  name: "Donalia",
  baseline: "les droits d'abord, le don pour le reste",
  tagline:
    "On active d'abord les droits existants. Le don ne finance que le résiduel — concret, vérifié, prouvé.",
};

/** Catégories de programmes (cf. brief §1), par priorité de « trou ». */
export type CategoryTier = "prioritaire" | "a_cadrer" | "filtree";

export const CATEGORIES: {
  key: string;
  label: string;
  tier: CategoryTier;
}[] = [
  { key: "equipement_1ere_necessite", label: "Équipement 1ère nécessité", tier: "prioritaire" },
  { key: "mobilite", label: "Mobilité", tier: "prioritaire" },
  { key: "insertion_emploi", label: "Insertion / emploi", tier: "prioritaire" },
  { key: "numerique", label: "Numérique", tier: "prioritaire" },
  { key: "logement_ponctuel", label: "Logement (ponctuel)", tier: "a_cadrer" },
  { key: "energie", label: "Énergie", tier: "a_cadrer" },
  { key: "alimentaire", label: "Alimentaire", tier: "a_cadrer" },
  { key: "enfance_ecole", label: "Enfance / école", tier: "a_cadrer" },
  { key: "sante", label: "Santé (non-recours / hors-panier)", tier: "filtree" },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label])
);

/** Bornes besoin (centimes) — alignées sur le CHECK SQL. */
export const NEED_MIN_CENTS = 3000;
export const NEED_MAX_CENTS = 50000;

/** Montants suggérés au don (euros). */
export const DONATION_CHIPS = [10, 20, 50, 100];

/** Raisons du « trou » (gap_reason). */
export type GapReason =
  | "hors_couverture"
  | "non_recours"
  | "avance_delai"
  | "reste_a_charge";

export const GAP_REASONS: Record<
  GapReason,
  { label: string; help: string; blocksPublication: boolean }
> = {
  hors_couverture: {
    label: "Hors couverture",
    help: "Aucun droit ne couvre l'objet.",
    blocksPublication: false,
  },
  non_recours: {
    label: "Non-recours",
    help: "Un droit existe mais n'est pas activé — l'activation doit être tracée avant publication ; on ne finance que le résiduel.",
    blocksPublication: true,
  },
  avance_delai: {
    label: "Avance / délai",
    help: "Le droit existe mais arrive trop tard : on avance le montant.",
    blocksPublication: false,
  },
  reste_a_charge: {
    label: "Reste à charge",
    help: "Couvert en partie ; le résidu reste impayable.",
    blocksPublication: false,
  },
};

export type NeedStatus =
  | "draft"
  | "diagnostic"
  | "en_revue"
  | "publie"
  | "finance"
  | "achete"
  | "remis"
  | "cloture"
  | "rejete"
  | "clos_sans_suite";

export const STATUS_META: Record<NeedStatus, { label: string; tone: string }> = {
  draft: { label: "Brouillon", tone: "bg-stone-100 text-stone-600" },
  diagnostic: { label: "Diagnostic droits", tone: "bg-amber-50 text-amber-700" },
  en_revue: { label: "En revue", tone: "bg-amber-100 text-amber-800" },
  publie: { label: "Publié", tone: "bg-emerald-50 text-emerald-700" },
  finance: { label: "Financé", tone: "bg-emerald-100 text-emerald-800" },
  achete: { label: "Acheté", tone: "bg-sky-50 text-sky-700" },
  remis: { label: "Remis", tone: "bg-indigo-50 text-indigo-700" },
  cloture: { label: "Clôturé — preuve publiée", tone: "bg-[#e8efe9] text-ink" },
  rejete: { label: "Rejeté", tone: "bg-rose-50 text-rose-700" },
  clos_sans_suite: { label: "Clos sans suite", tone: "bg-stone-100 text-stone-500" },
};

/** Statuts visibles publiquement (cohérent avec la RLS). */
export const PUBLIC_STATUSES: NeedStatus[] = [
  "publie",
  "finance",
  "achete",
  "remis",
  "cloture",
];

/**
 * Machine à états (transitions autorisées côté back-office).
 * draft → diagnostic → en_revue → publie → finance → achete → remis → cloture
 */
export const TRANSITIONS: Record<NeedStatus, NeedStatus[]> = {
  draft: ["diagnostic", "clos_sans_suite"],
  diagnostic: ["en_revue", "clos_sans_suite"],
  en_revue: ["publie", "rejete", "clos_sans_suite"],
  publie: ["finance", "clos_sans_suite"],
  finance: ["achete", "clos_sans_suite"],
  achete: ["remis"],
  remis: ["cloture"],
  cloture: [],
  rejete: ["diagnostic"],
  clos_sans_suite: [],
};

export const ESTIMATE_DISCLAIMER =
  "Estimation indicative — seul l'organisme (CAF, CPAM…) décide de l'éligibilité réelle.";
