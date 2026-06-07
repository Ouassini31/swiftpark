import { cookies } from "next/headers";

// Authentification admin minimaliste et isolée pour Dignity Layer.
// Un simple secret partagé (DIGNITY_ADMIN_PASSWORD) protège l'espace admin.
// Suffisant pour le MVP ; à remplacer par une vraie auth plus tard.

export const DIGNITY_ADMIN_COOKIE = "dignity_admin";

function getAdminPassword(): string {
  // Valeur par défaut explicite pour le dev local si la variable n'est pas posée.
  return process.env.DIGNITY_ADMIN_PASSWORD || "dignity-admin";
}

/** Vérifie un mot de passe fourni contre le secret configuré. */
export function checkDignityAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  return Boolean(password) && password === expected;
}

/** Valeur stockée dans le cookie une fois authentifié. */
export function dignityAdminCookieValue(): string {
  return getAdminPassword();
}

/** Indique si la requête courante (serveur) est authentifiée comme admin. */
export async function isDignityAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(DIGNITY_ADMIN_COOKIE)?.value;
  return Boolean(value) && value === getAdminPassword();
}
