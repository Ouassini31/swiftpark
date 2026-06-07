import {
  Info,
  ReceiptText,
  Bike,
  Laptop,
  Glasses,
  Utensils,
  Home,
  Zap,
  GraduationCap,
  Briefcase,
  Package,
} from "lucide-react";
import { GAP_REASONS, ESTIMATE_DISCLAIMER, type GapReason } from "@/lib/donalia/constants";

/** Badge de trou — pastille courte + classe couleur (jamais couleur seule). */
const TROU: Record<GapReason, { cls: string; short: string }> = {
  reste_a_charge: { cls: "trou--reste", short: "Reste à charge" },
  hors_couverture: { cls: "trou--hors", short: "Hors aides" },
  avance_delai: { cls: "trou--avance", short: "Avance urgente" },
  non_recours: { cls: "trou--droit", short: "Droit en cours d'activation" },
};

export function GapBadge({ reason }: { reason: GapReason }) {
  const t = TROU[reason];
  return <span className={`trou ${t.cls}`}>{t.short}</span>;
}

export function gapHelp(reason: GapReason): string {
  return GAP_REASONS[reason].help;
}

/** Bannière estimation — obligatoire dès qu'un droit s'affiche, non masquable. */
export function EstimationBanner() {
  return (
    <div className="estim">
      <Info />
      <p>
        <b>Estimation indicative</b> — seul l'organisme (CAF, CPAM…) décide de
        l'éligibilité réelle.
      </p>
    </div>
  );
}

export { ESTIMATE_DISCLAIMER };

/** Bandeau reçu fiscal −66 %. */
export function ReceiptBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="recu">
      <div className="recu__ic">
        <ReceiptText />
      </div>
      <div>
        <h5>Reçu fiscal — déduction 66 %</h5>
        <p>
          {compact
            ? "66 % déductible des impôts."
            : "Un don de 90 € ne vous coûte que 30,60 € après réduction d'impôt."}
        </p>
      </div>
    </div>
  );
}

/** Iconographie = l'OBJET du besoin, jamais un visage. Mappé par catégorie. */
const OBJECT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  mobilite: Bike,
  numerique: Laptop,
  sante: Glasses,
  alimentaire: Utensils,
  logement_ponctuel: Home,
  energie: Zap,
  enfance_ecole: GraduationCap,
  insertion_emploi: Briefcase,
  equipement_1ere_necessite: Package,
};

export function ObjectIcon({ category, className }: { category?: string; className?: string }) {
  const Icon = (category && OBJECT_ICON[category]) || Package;
  return <Icon className={className} />;
}
