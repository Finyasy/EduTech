import { expect, test } from "@playwright/test";

test("homepage renders and links to courses", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /help kids master math and logic/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /explore courses/i }).click();
  await expect(page).toHaveURL(/\/courses$/);

  await expect(
    page.getByRole("heading", { name: /pick a course/i }),
  ).toBeVisible();
});

test("dashboard landing loads without auth", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});
