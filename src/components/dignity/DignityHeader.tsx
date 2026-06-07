import Link from "next/link";

// En-tête public du module Dignity Layer.
export function DignityHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dignity" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-amber-400">
            D
          </span>
          <span className="text-lg font-semibold tracking-tight text-blue-950">
            Dignity<span className="text-emerald-600">Layer</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dignity/needs"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-blue-950"
          >
            Voir les besoins
          </Link>
          <Link
            href="/dignity/submit-need"
            className="rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:px-4"
          >
            Déposer un besoin
          </Link>
        </nav>
      </div>
    </header>
  );
}

// Pied de page public.
export function DignityFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Dignity Layer — Ce n&apos;est plus un don. C&apos;est une action.</p>
        <Link href="/dignity/admin" className="text-stone-400 transition hover:text-stone-600">
          Espace admin
        </Link>
      </div>
    </footer>
  );
}
