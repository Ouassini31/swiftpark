import { DignityHeader, DignityFooter } from "@/components/dignity/DignityHeader";
import { SubmitNeedForm } from "@/components/dignity/SubmitNeedForm";

export default function SubmitNeedPage() {
  return (
    <>
      <DignityHeader />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-950">Déposer un besoin</h1>
          <p className="mt-2 text-stone-600">
            Décrivez un besoin concret. Notre équipe le vérifiera avant toute
            publication. Vos coordonnées restent confidentielles.
          </p>
        </header>

        <SubmitNeedForm />
      </main>

      <DignityFooter />
    </>
  );
}
