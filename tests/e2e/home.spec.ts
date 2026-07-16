import { expect, test } from "@playwright/test";

test("homepage renders public previews and gates the full library", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /build the future with ai, code, and mathematics/i,
    }),
  ).toBeVisible();

  const chooseMission = page
    .getByRole("main")
    .getByRole("link", { name: /try sample missions/i })
    .first();
  await expect(chooseMission).toHaveAttribute("href", /#mission-previews/);
  await Promise.all([
    page.waitForURL(/\/#mission-previews$/),
    chooseMission.click(),
  ]);
  await expect(page.getByRole("heading", { name: /let learners try two guided samples/i })).toBeVisible();

  await page.getByRole("button", { name: /try preview/i }).first().click();
  await expect(page.getByRole("heading", { name: /ai pattern detectives|robot coders math lab/i })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/sign-in\?redirect_url=%2Fcourses/),
    page.getByRole("link", { name: /continue to full courses/i }).click(),
  ]);
});

test("courses redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/courses");

  await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Fcourses/);
});

test("dashboard redirects unauthenticated users to sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in/);
});
