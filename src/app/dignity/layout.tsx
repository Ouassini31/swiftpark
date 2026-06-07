import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dignity Layer — Ce n'est plus un don. C'est une action.",
  description:
    "Connecter directement des personnes ayant des ressources avec des personnes ayant des besoins réels, vérifiés et traçables.",
};

export default function DignityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-stone-50 text-stone-800">{children}</div>;
}
