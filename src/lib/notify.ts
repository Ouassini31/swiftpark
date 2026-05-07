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
      }),
    });
  } catch (err) {
    console.warn("[notify]", err);
  }
}
