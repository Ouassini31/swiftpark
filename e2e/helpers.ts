import { Page } from "@playwright/test";

/** Identifiants de test (compte Supabase créé manuellement ou via seed) */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL ?? "marie@exemple.fr",
  password: process.env.TEST_USER_PASSWORD ?? "motdepasse",
};

/** Skip l'onboarding en écrivant la clé dans localStorage */
export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("sp_ob", "1");
    localStorage.setItem("theme", "light");
  });
}

/** Se connecte via la page /auth/login et attend la redirection vers /map */
export async function loginAs(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await skipOnboarding(page);
  await page.goto("/auth/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: /Se connecter/i }).click();

  // Attend que l'URL soit /map (redirection post-login)
  await page.waitForURL("**/map", { timeout: 15_000 });
}

/** Attend qu'un toast Sonner apparaisse avec le texte attendu */
export async function expectToast(page: Page, text: string | RegExp) {
  await page.locator('[data-sonner-toast]').filter({ hasText: text }).first().waitFor({ timeout: 8_000 });
}
