import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Wallet (/wallet)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto("/wallet");
  });

  test("affiche la page Wallet", async ({ page }) => {
    await expect(page).toHaveURL(/\/wallet/);
    // Titre ou solde visible
    await expect(
      page.getByText(/Wallet/i).or(page.getByText(/SwiftCoins/i))
    ).toBeVisible();
  });

  test("affiche le solde courant", async ({ page }) => {
    // Doit contenir un nombre suivi de SC ou SwiftCoins
    await expect(
      page.locator("text=/\\d+ SC/").or(page.locator("text=/\\d+ SwiftCoins/"))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("affiche l'historique des transactions", async ({ page }) => {
    // Section historique ou message "aucune transaction"
    await expect(
      page.getByText(/Transaction/i)
        .or(page.getByText(/Historique/i))
        .or(page.getByText(/Bienvenue/i))
        .or(page.getByText(/aucune/i))
    ).toBeVisible({ timeout: 8_000 });
  });
});
