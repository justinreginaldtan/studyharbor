import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run onboarding flow");

test("New User Flow: sign up -> onboarding -> land in lounge", async ({ page }) => {
  await page.goto("/test-auth");

  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);

  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(
    page.getByText(/Signed up|Signed in|Already logged in/i)
  ).toBeVisible({ timeout: 15_000 });

  await page.goto("/");
  await expect(
    page.getByRole("application", { name: /StudyHarbor shared space/i })
  ).toBeVisible();

  // If the welcome modal appears, confirm the defaults to finish onboarding.
  const welcomeModal = page.locator("text=Pull up a chair");
  if (await welcomeModal.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /Sign In|Sign Up|Continue/i }).first().click({ timeout: 5_000 }).catch(() => {});
  }

  // Basic smoke: timer controls should render.
  await expect(page.getByText(/Focus|Break/i)).toBeVisible();
});
