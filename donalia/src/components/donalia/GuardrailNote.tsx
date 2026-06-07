import { Info } from "lucide-react";

/** Rappel transparent du garde-fou : le don va au programme. */
export function GuardrailNote({ programTitle }: { programTitle?: string }) {
  return (
    <div className="flex gap-3 rounded-xl2 border border-line bg-paper/60 p-4 text-sm text-ink/80">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" />
      <p>
        Votre don soutient le programme
        {programTitle ? (
          <>
            {" «"} <strong>{programTitle}</strong> {"»"}
          </>
        ) : (
          " concerné"
        )}
        , porté par une association. Ce besoin est montré à titre d'illustration :
        l'association décide de l'allocation et achète le bien, puis publie la preuve.
        Aucun versement n'est fait directement à une personne.
      </p>
    </div>
  );
}
