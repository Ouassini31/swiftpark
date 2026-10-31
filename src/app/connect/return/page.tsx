import RetourApp from "../RetourApp";

// Stripe ramène ici après la vérification d'identité lancée depuis l'app.
export default function ConnectReturnPage() {
  return (
    <RetourApp
      titre="C'est enregistré"
      texte="Retourne dans SwiftPark : l'écran Retirer indique si ta vérification est validée."
    />
  );
}
