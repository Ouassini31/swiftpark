/**
 * Envoie une notification ciblée à un utilisateur (in-app + push)
 */
export async function notifyUser(params: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  url?: string;
  reservation_id?: string;
  data?: Record<string, unknown>;
  push_seulement?: boolean;
}) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:        params.user_id,
        type:           params.type,
        title:          params.title,
        message:        params.message,
        url:            params.url ?? "/reservations",
        reservation_id: params.reservation_id,
        data:           params.data ?? {},
        push_seulement: params.push_seulement ?? false,
      }),
    });
  } catch (err) {
    console.warn("[notify]", err);
  }
}

/**
 * Prévient le chercheur sur son téléphone : le serveur a déjà écrit sa notification (valider_position)
 */
export function pousserDepart(reservation: { id: string; finder_id: string }) {
  return notifyUser({
    user_id:        reservation.finder_id,
    type:           "spot_validated",
    title:          "🏃 Il part maintenant !",
    message:        "La place se libère. Si elle est occupée à ton arrivée, déclare-le dans tes échanges : tu seras remboursé.",
    reservation_id: reservation.id,
    url:            "/reservations",
    push_seulement: true,
  });
}
