/**
 * Smoke tests — vérifient que les pages clés répondent (200) sans crasher
 */
import { test, expect } from "@playwright/test";
import { skipOnboarding } from "./helpers";

const PUBLIC_PAGES = [
  { path: "/auth/login",    title: /SwiftPark/ },
  { path: "/auth/register", title: /SwiftPark/ },
];

test.describe("Smoke — pages publiques", () => {
  for (const { path, title } of PUBLIC_PAGES) {
    test(`${path} charge sans erreur`, async ({ page }) => {
      await skipOnboarding(page);
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(title);
    });
  }
});

test.describe("Smoke — assets critiques", () => {
  test("robots.txt accessible", async ({ page }) => {
    const res = await page.goto("/robots.txt");
    expect(res?.status()).toBeLessThan(400);
  });

  test("favicon accessible", async ({ page }) => {
    const res = await page.goto("/favicon.ico");
    expect(res?.status()).toBeLessThan(400);
  });
});

test.describe("Smoke — erreur 404", () => {
  test("une route inexistante retourne 404", async ({ page }) => {
    await skipOnboarding(page);
    const response = await page.goto("/cette-page-n-existe-pas");
    // Next.js renvoie 404 pour les pages inconnues
    expect(response?.status()).toBe(404);
  });
});
