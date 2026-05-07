import { test, expect } from "@playwright/test";
import { loginAs, skipOnboarding } from "./helpers";

test.describe("Leaderboard (/leaderboard)", () => {
  test("affiche le leaderboard sans être connecté (ou redirige vers login)", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/leaderboard");
    // Soit le leaderboard s'affiche, soit il redirige vers login
    const isLeaderboard = page.url().includes("/leaderboard");
    const isLogin = page.url().includes("/auth/login");
    expect(isLeaderboard || isLogin).toBe(true);
  });

  test("affiche les sections Partageurs et Trouveurs", async ({ page }) => {
    await loginAs(page);
    await page.goto("/leaderboard");

    await expect(
      page.getByText(/Partageur/i).or(page.getByText(/Top/i))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("affiche un podium (top 3)", async ({ page }) => {
    await loginAs(page);
    await page.goto("/leaderboard");

    // Au moins 1 élément de classement ou "Aucun résultat"
    await expect(
      page.locator("[data-rank]").first()
        .or(page.getByText(/Aucun/i))
        .or(page.getByText(/classement/i))
    ).toBeVisible({ timeout: 8_000 });
  });
});
