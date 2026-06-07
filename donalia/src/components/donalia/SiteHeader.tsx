import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-[color:var(--paper)]/85 backdrop-blur">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <header className="hdr">
          <Link href="/" aria-label="Donalia — accueil">
            <Logo />
          </Link>
          <nav className="hdr__nav hidden sm:flex">
            <Link href="/besoins">Les besoins</Link>
            <Link href="/#comment">Comment ça marche</Link>
          </nav>
          <div className="hdr__right">
            <Link href="/besoins" className="btn btn--ghost btn--sm hidden sm:inline-flex">
              Explorer
            </Link>
            <Link href="/don" className="btn btn--primary btn--sm">
              Donner
            </Link>
          </div>
        </header>
      </div>
    </div>
  );
}
