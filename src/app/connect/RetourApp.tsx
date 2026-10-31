export default function RetourApp({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}
    >
      <h1 className="text-3xl font-black text-gray-900 mb-3">{titre}</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">{texte}</p>
      <a
        href="swiftpark://"
        className="bg-[#22956b] text-white font-bold rounded-2xl px-6 py-3"
      >
        Retourner dans l&apos;app
      </a>
    </div>
  );
}
