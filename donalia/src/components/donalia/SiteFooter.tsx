import Link from "next/link";
import { LogoMark, Wordmark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="ft mt-16">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <span className="brand mb-4 inline-flex">
              <LogoMark size={32} />
              <span style={{ color: "#fff" }}>
                <Wordmark size={22} />
              </span>
            </span>
            <p className="text-sm leading-relaxed text-white/70">
              Droits d'abord, don pour le reste. Le don soutient un{" "}
              <strong className="text-white">programme</strong> porté par une
              association — jamais une personne nommée. L'argent ne transite jamais par
              Donalia.
            </p>
          </div>
          <div className="flex gap-14">
            <div>
              <h6 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-white/50">
                Explorer
              </h6>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/besoins">Les besoins</Link></li>
                <li><Link href="/don">Faire un don</Link></li>
                <li><Link href="/#comment">Comment ça marche</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-white/50">
                Association
              </h6>
              <ul className="flex flex-col gap-2.5">
                <li><Link href="/admin">Espace asso</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-white/45">
          © {new Date().getFullYear()} Donalia. Encaissement sécurisé via HelloAsso ·
          reçu fiscal émis par l'association · −66 % déductible.
        </p>
      </div>
    </footer>
  );
}
