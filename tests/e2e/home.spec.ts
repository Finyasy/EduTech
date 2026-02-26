import { expect, test } from "@playwright/test";

test("homepage renders and links to courses", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /build the future with ai, code, and mathematics/i,
    }),
  ).toBeVisible();

  const chooseMission = page
    .getByRole("main")
    .getByRole("link", { name: /choose a mission/i })
    .first();
  await expect(chooseMission).toHaveAttribute("href", /\/courses/);
  await Promise.all([
    page.waitForURL(/\/courses$/),
    chooseMission.click(),
  ]);
  await expect(page).toHaveURL(/\/courses$/);

  await expect(
    page.getByRole("heading", { name: /pick an age path and launch a mission/i }),
  ).toBeVisible();
});

test("dashboard redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in/);
});
