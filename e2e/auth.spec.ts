import { test, expect } from "@playwright/test";
import { skipOnboarding, TEST_USER } from "./helpers";

test.describe("Authentification", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  // ── Page de connexion ──────────────────────────────────────────────
  test("affiche la page /auth/login correctement", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByText("SwiftPark")).toBeVisible();
    await expect(page.getByText("Connexion")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Se connecter/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    // Bonus pill
    await expect(page.getByText(/5 SwiftCoins offerts/i)).toBeVisible();
  });

  test("affiche un lien vers l'inscription", async ({ page }) => {
    await page.goto("/auth/login");
    const link = page.getByRole("link", { name: /Créer un compte/i });
    await expect(link).toHaveAttribute("href", "/auth/register");
  });

  // ── Page d'inscription ─────────────────────────────────────────────
  test("affiche la page /auth/register correctement", async ({ page }) => {
    await page.goto("/auth/register");

    await expect(page.getByText("SwiftPark")).toBeVisible();
    await expect(page.getByLabel("Nom complet")).toBeVisible();
    await expect(page.getByLabel(/Nom d'utilisateur/i)).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Créer mon compte/i })).toBeVisible();
  });

  test("valide les champs requis (register)", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByRole("button", { name: /Créer mon compte/i }).click();
    // Le navigateur HTML5 bloque la soumission — le bouton ne charge pas
    await expect(page.getByRole("button", { name: /Créer mon compte/i })).not.toHaveText("Création...");
  });

  // ── Connexion (nécessite compte de test dans Supabase) ─────────────
  test("redirige vers /map après connexion réussie", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Mot de passe").fill(TEST_USER.password);

    await Promise.all([
      page.waitForURL("**/map", { timeout: 20_000 }),
      page.getByRole("button", { name: /Se connecter/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/map/);
  });

  test("affiche une erreur pour des identifiants invalides", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("inconnu@exemple.fr");
    await page.getByLabel("Mot de passe").fill("mauvais");
    await page.getByRole("button", { name: /Se connecter/i }).click();

    // Toast d'erreur Supabase (ex: "Invalid login credentials")
    await page
      .locator('[data-sonner-toast]')
      .first()
      .waitFor({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/map/);
  });

  // ── Redirection non-authentifié ────────────────────────────────────
  test("redirige /map vers /auth/login si non connecté", async ({ page }) => {
    // Pas de session → middleware redirige
    await page.goto("/map");
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
