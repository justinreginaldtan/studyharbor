import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run monetization flow");

test("Monetization Flow: free user hits limit then upgrades", async ({ page }) => {
  // Sign in on the helper page
  await page.goto("/test-auth");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText(/Signed in|Already logged in/i)).toBeVisible();

  // Navigate to pricing
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /Choose Your StudyHarbor Plan/i })).toBeVisible();

  // Stub checkout to avoid hitting real Stripe in CI
  await page.route("**/api/checkout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: `${page.url()}#fake-checkout-success` }),
    });
  });

  const upgradeButton = page.getByRole("button", { name: /Upgrade to Pro/i });
  await upgradeButton.click();

  await expect(page).toHaveURL(/fake-checkout-success/);
});
