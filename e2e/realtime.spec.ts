import { test, expect } from "@playwright/test";

const runRealtime = process.env.E2E_REALTIME === "true";

test.skip(!runRealtime, "Set E2E_REALTIME=true with a configured Supabase backend to run realtime flow");

test("Realtime Flow: two clients see each other", async ({ browser, page }) => {
  await page.goto("/");
  await expect(page.getByRole("application", { name: /StudyHarbor shared space/i })).toBeVisible();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/");
  await expect(secondPage.getByRole("application", { name: /StudyHarbor shared space/i })).toBeVisible();

  // Move pointer on the first page to force a presence broadcast
  await page.mouse.move(200, 300);
  await page.mouse.down();
  await page.mouse.up();

  // Wait for the second client to reflect at least one remote avatar
  await expect(
    secondPage.locator('[data-testid="avatar-remote"]')
  ).toBeVisible({ timeout: 10_000 });

  await secondContext.close();
});
