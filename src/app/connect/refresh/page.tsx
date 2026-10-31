import RetourApp from "../RetourApp";

// Stripe envoie ici quand le lien de vérification a expiré.
export default function ConnectRefreshPage() {
  return (
    <RetourApp
      titre="Lien expiré"
      texte="Retourne dans SwiftPark et relance la vérification depuis l'écran Retirer."
    />
  );
}
