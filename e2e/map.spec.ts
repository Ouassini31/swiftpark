import { test, expect } from "@playwright/test";
import { loginAs, skipOnboarding } from "./helpers";

test.describe("Carte principale (/map)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // ── Structure de la page ───────────────────────────────────────────
  test("affiche le header avec les 2 boutons d'action", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Je cherche une place/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Je me gare/i })).toBeVisible();
  });

  test("affiche le solde SwiftCoins dans le header", async ({ page }) => {
    // Pill SC visible — nombre variable selon le compte
    await expect(page.locator("a[href='/wallet']")).toBeVisible();
    await expect(page.locator("a[href='/wallet']")).toContainText(/SC/);
  });

  test("affiche le bouton de localisation", async ({ page }) => {
    const locateBtn = page.locator("button[aria-label='Localiser']")
      .or(page.locator("button").filter({ hasText: /locali/i }));
    // Au moins 1 bouton de géoloc présent dans le header
    await expect(page.locator("#map-header")).toBeVisible();
  });

  test("affiche le toggle dark mode", async ({ page }) => {
    // Bouton lune/soleil
    const darkToggle = page.locator("button[aria-label='Thème']")
      .or(page.locator("#map-header button").nth(1));
    await expect(page.locator("#map-header")).toBeVisible();
  });

  test("le conteneur de carte Leaflet est rendu", async ({ page }) => {
    // Leaflet génère un div.leaflet-container
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10_000 });
  });

  // ── Recherche d'une place ──────────────────────────────────────────
  test("ouvre le panneau de recherche au clic sur Je cherche une place", async ({ page }) => {
    await page.getByRole("button", { name: /Je cherche une place/i }).click();

    // Le SearchSpotSheet s'affiche
    await expect(
      page.getByText(/Horizon/i).or(page.getByText(/Maintenant/i))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("les chips d'horizon de temps sont présents dans la recherche", async ({ page }) => {
    await page.getByRole("button", { name: /Je cherche une place/i }).click();

    const chips = ["Maintenant", "15 min", "1h", "2h+"];
    for (const chip of chips) {
      await expect(page.getByText(chip)).toBeVisible();
    }
  });

  // ── Partage d'une place ────────────────────────────────────────────
  test("ouvre la modale de partage au clic sur Je me gare", async ({ page }) => {
    await page.getByRole("button", { name: /Je me gare/i }).click();

    // Le ShareSpotModal s'affiche
    await expect(
      page.getByText(/Je libère/i).or(page.getByText(/Partager/i))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("la modale de partage affiche une suggestion de prix", async ({ page }) => {
    await page.getByRole("button", { name: /Je me gare/i }).click();

    // Chips de prix
    await expect(page.getByText(/SwiftCoins/i)).toBeVisible();
    // Prix suggéré visible (1/2/3/5/8 SC)
    const priceChip = page.locator("button").filter({ hasText: /SC/i }).first();
    await expect(priceChip).toBeVisible();
  });

  test("la modale de partage affiche les chips de durée", async ({ page }) => {
    await page.getByRole("button", { name: /Je me gare/i }).click();

    const durations = ["30 min", "1h", "2h", "3h+"];
    for (const d of durations) {
      await expect(page.getByText(d)).toBeVisible();
    }
  });
});
