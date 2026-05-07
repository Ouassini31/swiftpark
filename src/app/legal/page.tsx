import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Mentions légales & CGU – SwiftPark",
  description:
    "Mentions légales, Conditions Générales d'Utilisation et Politique de Confidentialité de SwiftPark.",
};

/* ─────────────────────────────────────────────────────────────
   Composants utilitaires
──────────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <h2 className="text-base font-black text-white bg-gradient-to-r from-[#22956b] to-[#1a7a58] px-5 py-3.5">
        {title}
      </h2>
      <div className="px-5 py-4 space-y-4 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-0.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page principale
──────────────────────────────────────────────────────────────── */

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-20">
      {/* ── En-tête ── */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute top-6 -right-4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-3 mb-4">
          <Link
            href="/map"
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-white leading-tight">
            Informations légales
          </h1>
        </div>

        {/* Sommaire rapide */}
        <nav className="flex flex-wrap gap-2 relative">
          {[
            ["#mentions", "Mentions légales"],
            ["#cgu", "CGU"],
            ["#confidentialite", "Confidentialité"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-xs font-semibold bg-white/20 text-white px-3 py-1.5 rounded-full"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Corps ── */}
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        <p className="text-xs text-gray-400 text-center">
          Dernière mise à jour : mai 2025
        </p>

        {/* ══════════════════════════════════════════════
            1. MENTIONS LÉGALES
        ══════════════════════════════════════════════ */}
        <Section id="mentions" title="1. Mentions légales">
          <Sub title="Éditeur du site et de l'application">
            <P>
              <strong>SwiftPark France</strong> – Société par Actions Simplifiée
              Unipersonnelle (SASU) au capital de 1 000 €
            </P>
            <P>Adresse : 8 rue du Général Camou, 75007 Paris, France</P>
            <P>
              SIRET : en cours d'immatriculation (demande déposée au greffe du
              Tribunal de Commerce de Paris)
            </P>
            <P>TVA intracommunautaire : non applicable (franchise en base de TVA)</P>
            <P>
              Email :{" "}
              <a
                href="mailto:contact@swiftpark.fr"
                className="text-[#22956b] underline"
              >
                contact@swiftpark.fr
              </a>
            </P>
          </Sub>

          <Sub title="Directeur de la publication">
            <P>Le directeur de la publication est le Président de SwiftPark France.</P>
          </Sub>

          <Sub title="Hébergement">
            <P>
              <strong>Vercel Inc.</strong>
              <br />
              340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis
              <br />
              Site :{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22956b] underline"
              >
                vercel.com
              </a>
            </P>
          </Sub>

          <Sub title="Propriété intellectuelle">
            <P>
              L'ensemble des contenus présents sur SwiftPark (logo, textes,
              design, interface, algorithmes) est la propriété exclusive de
              SwiftPark France ou fait l'objet d'une licence d'utilisation. Toute
              reproduction, distribution ou exploitation sans autorisation écrite
              préalable est strictement interdite.
            </P>
          </Sub>
        </Section>

        {/* ══════════════════════════════════════════════
            2. CONDITIONS GÉNÉRALES D'UTILISATION
        ══════════════════════════════════════════════ */}
        <Section id="cgu" title="2. Conditions Générales d'Utilisation (CGU)">
          <Sub title="2.1 Objet du service">
            <P>
              SwiftPark est une application mobile et web qui met en relation des
              conducteurs souhaitant libérer leur place de stationnement sur la
              voie publique (ci-après « Partageur ») avec des conducteurs
              recherchant un emplacement (ci-après « Chercheur »).
            </P>
            <P className="font-semibold text-[#22956b]">
              IMPORTANT – Nature du service : SwiftPark vend exclusivement une
              information en temps réel sur le départ imminent d'un conducteur.
              SwiftPark ne vend, ne réserve, ne loue et ne garantit en aucun cas
              une place de stationnement. L'emplacement sur la voie publique
              demeure accessible à tout tiers sans limitation. SwiftPark ne peut
              être tenu responsable si un tiers occupe l'emplacement avant
              l'arrivée du Chercheur.
            </P>
          </Sub>

          <Sub title="2.2 Accès et inscription">
            <Ul
              items={[
                "L'utilisation de SwiftPark nécessite la création d'un compte via une adresse e-mail valide.",
                "L'utilisateur doit être titulaire d'un permis de conduire et majeur (18 ans ou plus).",
                "Chaque utilisateur est responsable de la confidentialité de ses identifiants.",
                "SwiftPark se réserve le droit de suspendre ou supprimer tout compte en cas d'utilisation frauduleuse.",
              ]}
            />
          </Sub>

          <Sub title="2.3 SwiftCoins – Monnaie virtuelle">
            <P>
              Les <strong>SwiftCoins (SC)</strong> sont la monnaie virtuelle
              interne à SwiftPark. Ils permettent de rémunérer les Partageurs et
              de rétribuer les Chercheurs pour leur confiance.
            </P>
            <Ul
              items={[
                "Les SwiftCoins sont achetés via la plateforme de paiement sécurisée Stripe (carte bancaire).",
                "Les SwiftCoins ne sont pas une monnaie légale, ne produisent aucun intérêt et ne peuvent être échangés contre de l'argent réel.",
                "Les SwiftCoins sont strictement personnels et non cessibles.",
                "SwiftPark se réserve le droit de modifier la valeur, les modalités d'acquisition ou d'utilisation des SwiftCoins avec un préavis de 30 jours.",
              ]}
            />
          </Sub>

          <Sub title="2.4 Prix et paiement">
            <P>
              Les tarifs des packs de SwiftCoins sont affichés en euros TTC dans
              l'application au moment de l'achat. Le paiement est effectué via
              Stripe. En cas de litige sur un paiement, l'utilisateur doit
              contacter{" "}
              <a
                href="mailto:contact@swiftpark.fr"
                className="text-[#22956b] underline"
              >
                contact@swiftpark.fr
              </a>{" "}
              dans un délai de 30 jours à compter de la transaction.
            </P>
          </Sub>

          <Sub title="2.5 Politique de remboursement">
            <P>
              Conformément à l'article L.221-28 du Code de la consommation, le
              droit de rétractation de 14 jours ne s'applique pas aux contenus
              numériques dont l'exécution a commencé avant l'expiration de ce
              délai, avec l'accord exprès du consommateur.
            </P>
            <P>
              Toutefois, SwiftPark s'engage à rembourser, à titre commercial, les
              SwiftCoins non utilisés dans les cas suivants :
            </P>
            <Ul
              items={[
                "Dysfonctionnement technique avéré imputable à SwiftPark empêchant l'utilisation du service.",
                "Double facturation consécutive à une erreur technique.",
              ]}
            />
            <P>
              Toute demande de remboursement doit être adressée à{" "}
              <a
                href="mailto:contact@swiftpark.fr"
                className="text-[#22956b] underline"
              >
                contact@swiftpark.fr
              </a>{" "}
              avec justificatif.
            </P>
          </Sub>

          <Sub title="2.6 Obligations des utilisateurs">
            <P>L'utilisateur s'engage à :</P>
            <Ul
              items={[
                "Renseigner des informations exactes et à jour lors de son inscription.",
                "Ne pas utiliser SwiftPark à des fins frauduleuses, commerciales non autorisées ou contraires à la loi.",
                "Ne pas créer de fausses alertes de départ.",
                "Respecter le Code de la route et les règles de stationnement en vigueur.",
                "Ne pas harceler ou intimider d'autres utilisateurs.",
              ]}
            />
          </Sub>

          <Sub title="2.7 Limitation de responsabilité">
            <P>SwiftPark ne pourra être tenu responsable :</P>
            <Ul
              items={[
                "De l'occupation de l'emplacement par un tiers avant l'arrivée du Chercheur.",
                "Des infractions au Code de la route commises par les utilisateurs.",
                "Des dommages matériels ou corporels survenus à l'occasion de l'utilisation de l'application.",
                "Des interruptions de service dues à des événements de force majeure ou à la maintenance.",
                "De l'exactitude des informations partagées par les Partageurs.",
              ]}
            />
            <P>
              La responsabilité de SwiftPark est en tout état de cause limitée au
              montant des SwiftCoins achetés au cours des 30 derniers jours
              précédant le dommage allégué.
            </P>
          </Sub>

          <Sub title="2.8 Résiliation">
            <P>
              L'utilisateur peut supprimer son compte à tout moment depuis les
              paramètres de l'application ou en envoyant une demande à{" "}
              <a
                href="mailto:contact@swiftpark.fr"
                className="text-[#22956b] underline"
              >
                contact@swiftpark.fr
              </a>
              . La suppression du compte entraîne la perte définitive des
              SwiftCoins non utilisés.
            </P>
            <P>
              SwiftPark peut résilier un compte sans préavis en cas de violation
              grave des présentes CGU.
            </P>
          </Sub>

          <Sub title="2.9 Droit applicable et litiges">
            <P>
              Les présentes CGU sont soumises au droit français. En cas de
              litige, et à défaut de résolution amiable dans un délai de 60 jours,
              le tribunal compétent sera celui du siège social de SwiftPark
              France, sauf disposition légale contraire applicable aux
              consommateurs.
            </P>
            <P>
              Conformément à l'article L.612-1 du Code de la consommation, les
              utilisateurs peuvent recourir gratuitement au service de médiation{" "}
              <strong>MEDICYS</strong> (www.medicys.fr) en cas de litige non
              résolu.
            </P>
          </Sub>
        </Section>

        {/* ══════════════════════════════════════════════
            3. POLITIQUE DE CONFIDENTIALITÉ
        ══════════════════════════════════════════════ */}
        <Section
          id="confidentialite"
          title="3. Politique de Confidentialité (RGPD)"
        >
          <Sub title="3.1 Responsable du traitement">
            <P>
              SwiftPark France, SASU – 8 rue du Général Camou, 75007 Paris.
              Contact DPO :{" "}
              <a
                href="mailto:contact@swiftpark.fr"
                className="text-[#22956b] underline"
              >
                contact@swiftpark.fr
              </a>
            </P>
          </Sub>

          <Sub title="3.2 Données collectées">
            <P>SwiftPark collecte les données suivantes :</P>
            <Ul
              items={[
                "Identité : prénom, nom d'utilisateur, adresse e-mail.",
                "Données de connexion : adresse IP, type d'appareil, système d'exploitation, identifiants de session.",
                "Données de géolocalisation : position GPS en temps réel (uniquement lorsque l'application est en cours d'utilisation et avec votre consentement explicite).",
                "Données de paiement : référence de transaction Stripe (aucune donnée bancaire n'est stockée par SwiftPark).",
                "Données d'utilisation : historique des partages, des recherches, des transactions SwiftCoins.",
                "Évaluations et avis laissés par ou pour l'utilisateur.",
              ]}
            />
          </Sub>

          <Sub title="3.3 Finalités et bases légales">
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-[#e8f5ef]">
                    <th className="text-left p-2 border border-gray-200 font-bold text-gray-800">
                      Finalité
                    </th>
                    <th className="text-left p-2 border border-gray-200 font-bold text-gray-800">
                      Base légale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Fourniture du service", "Exécution du contrat (CGU)"],
                    ["Gestion des paiements", "Exécution du contrat"],
                    ["Géolocalisation temps réel", "Consentement explicite"],
                    ["Prévention de la fraude", "Intérêt légitime"],
                    ["Envoi de notifications push", "Consentement"],
                    ["Amélioration du service / statistiques", "Intérêt légitime"],
                    ["Obligations légales et comptables", "Obligation légale"],
                  ].map(([fin, base]) => (
                    <tr key={fin} className="even:bg-gray-50">
                      <td className="p-2 border border-gray-200">{fin}</td>
                      <td className="p-2 border border-gray-200">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sub>

          <Sub title="3.4 Durée de conservation">
            <Ul
              items={[
                "Données de compte actif : pendant toute la durée de la relation contractuelle.",
                "Données de géolocalisation : 90 jours glissants.",
                "Données de paiement / transactions : 10 ans (obligation comptable).",
                "Données de compte supprimé : 3 ans à compter de la suppression (prescriptions légales).",
                "Logs de connexion : 12 mois (obligation LCEN).",
              ]}
            />
          </Sub>

          <Sub title="3.5 Destinataires des données">
            <P>
              Les données peuvent être partagées avec les sous-traitants suivants,
              dans le strict respect du RGPD :
            </P>
            <Ul
              items={[
                "Supabase Inc. (base de données et authentification) – États-Unis, contrat SCCs.",
                "Vercel Inc. (hébergement) – États-Unis, contrat SCCs.",
                "Stripe Inc. (paiement) – certifié PCI-DSS.",
                "Expo (notifications push) – États-Unis.",
              ]}
            />
            <P>
              Aucune donnée personnelle n'est vendue à des tiers à des fins
              commerciales.
            </P>
          </Sub>

          <Sub title="3.6 Vos droits">
            <P>
              Conformément au RGPD (Règlement UE 2016/679), vous disposez des
              droits suivants :
            </P>
            <Ul
              items={[
                "Droit d'accès à vos données personnelles.",
                "Droit de rectification des données inexactes.",
                "Droit à l'effacement (« droit à l'oubli »).",
                "Droit à la limitation du traitement.",
                "Droit à la portabilité de vos données.",
                "Droit d'opposition au traitement fondé sur l'intérêt légitime.",
                "Droit de retirer votre consentement à tout moment.",
              ]}
            />
            <P>
              Pour exercer ces droits, contactez-nous à{" "}
              <a
                href="mailto:contact@swiftpark.fr"
                className="text-[#22956b] underline"
              >
                contact@swiftpark.fr
              </a>{" "}
              avec une copie de votre pièce d'identité. Nous répondrons dans un
              délai de 30 jours. En cas de réponse insatisfaisante, vous pouvez
              introduire une réclamation auprès de la{" "}
              <strong>CNIL</strong> (www.cnil.fr).
            </P>
          </Sub>

          <Sub title="3.7 Cookies et traceurs">
            <P>
              L'application SwiftPark utilise des cookies techniques strictement
              nécessaires au fonctionnement du service (session, authentification)
              et des cookies analytiques anonymisés pour mesurer l'audience. Aucun
              cookie publicitaire tiers n'est déposé.
            </P>
          </Sub>

          <Sub title="3.8 Sécurité">
            <P>
              SwiftPark met en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données : chiffrement TLS en transit,
              chiffrement au repos, contrôle d'accès strict, surveillance des
              accès. En cas de violation de données susceptible d'engendrer un
              risque élevé pour vos droits, vous serez notifié dans les 72 heures
              conformément à l'article 34 du RGPD.
            </P>
          </Sub>

          <Sub title="3.9 Modifications de la présente politique">
            <P>
              SwiftPark se réserve le droit de modifier cette politique de
              confidentialité. Toute modification substantielle fera l'objet d'une
              notification dans l'application ou par e-mail au moins 15 jours
              avant son entrée en vigueur.
            </P>
          </Sub>
        </Section>

        {/* ── Retour en haut ── */}
        <div className="text-center pt-2">
          <a
            href="#"
            className="text-xs text-[#22956b] font-semibold underline"
          >
            ↑ Retour en haut
          </a>
        </div>

        <p className="text-[10px] text-gray-300 text-center pb-2">
          © {new Date().getFullYear()} SwiftPark France – Tous droits réservés
        </p>
      </div>
    </div>
  );
}
