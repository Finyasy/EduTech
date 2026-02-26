import { expect, test } from "@playwright/test";

test("teacher workspace redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/teach");

  await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fteach/);
  await expect(
    page.getByRole("heading", { name: /sign in to edutech/i }),
  ).toBeVisible();
});

test("post-auth redirects unauthenticated users back to sign in with post-auth redirect", async ({ page }) => {
  await page.goto("/post-auth");

  await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fpost-auth/);
  await expect(
    page.getByRole("heading", { name: /sign in to edutech/i }),
  ).toBeVisible();
});
