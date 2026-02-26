import { expect, test, type Page } from "@playwright/test";

function learnerCreds() {
  const email =
    process.env.E2E_LEARNER_EMAIL ?? process.env.E2E_TEACHER_EMAIL;
  const password =
    process.env.E2E_LEARNER_PASSWORD ?? process.env.E2E_TEACHER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing learner e2e credentials. Set E2E_LEARNER_EMAIL/E2E_LEARNER_PASSWORD or reuse E2E_TEACHER_EMAIL/E2E_TEACHER_PASSWORD.",
    );
  }

  return { email, password };
}

async function recoverClientError(page: Page) {
  const appError = page.getByRole("heading", {
    name: /application error: a client-side exception/i,
  });
  if (await appError.isVisible().catch(() => false)) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
}

async function ensureSignedInSession(page: Page) {
  const { email, password } = learnerCreds();
  await page.goto("/teach", { waitUntil: "domcontentloaded" });
  await recoverClientError(page);

  if (!page.url().includes("/sign-in")) {
    return;
  }

  await expect(
    page.getByRole("heading", { name: /sign in to edutech/i }),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("textbox", { name: /email address/i }).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill(password);
  await page.getByRole("button", { name: /^continue$/i }).click();

  await page
    .waitForURL(/\/(teach|admin\/teach)(\/|\?|$)/, { timeout: 40_000 })
    .catch(async () => {
      if (page.url().includes("/post-auth")) {
        await page.reload({ waitUntil: "domcontentloaded" });
      }
    });
}

async function ensureDashboardVisible(page: Page) {
  const heading = page.getByRole("heading", { name: /welcome back, explorer/i });
  await ensureSignedInSession(page);

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    if (page.url().includes("/sign-in")) {
      await ensureSignedInSession(page);
      continue;
    }
    if (await heading.isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(500);
  }

  await expect(heading).toBeVisible({ timeout: 15_000 });
}

test("learner pages smoke flow (dashboard, courses, games)", async ({ page }) => {
  test.setTimeout(120_000);

  await ensureDashboardVisible(page);
  await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard");
  await expect(page.getByText(/continue watching/i)).toBeVisible();
  await expect(page.getByText(/mastery map/i)).toBeVisible();

  // Courses mission library + detail smoke
  await page.goto("/courses", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /pick an age path and launch a mission/i }),
  ).toBeVisible();

  const viewMission = page.getByRole("link", { name: /view mission/i }).first();
  await expect(viewMission).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/courses\/[^/]+$/),
    viewMission.click(),
  ]);
  await expect(page.getByText(/curriculum spine/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /start mission/i }).first()).toBeVisible();

  const backToCourses = page.getByRole("link", { name: /back to courses/i });
  await Promise.all([
    page.waitForURL(/\/courses$/),
    backToCourses.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: /pick an age path and launch a mission/i }),
  ).toBeVisible();

  // Games catalog + game detail smoke (signed-in route)
  await page.goto("/games", { waitUntil: "domcontentloaded" });
  if (page.url().includes("/sign-in")) {
    await ensureSignedInSession(page);
    await page.goto("/games", { waitUntil: "domcontentloaded" });
  }
  await expect.poll(() => new URL(page.url()).pathname).toBe("/games");
  await expect(
    page.getByRole("heading", { name: /play to practice\./i }),
  ).toBeVisible();

  if (await page.getByText(/no games available yet/i).count()) {
    await expect(page.getByText(/no games available yet/i)).toBeVisible();
    return;
  }

  const playButton = page.getByRole("link", { name: /^play$/i }).first();
  await expect(playButton).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/games\/[^/]+$/),
    playButton.click(),
  ]);

  await expect(page.getByRole("link", { name: /← games/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const backToGames = page.getByRole("link", { name: /← games/i });
  await Promise.all([
    page.waitForURL(/\/games$/),
    backToGames.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: /play to practice\./i }),
  ).toBeVisible();
});
