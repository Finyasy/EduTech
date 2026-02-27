import { expect, test, type Page } from "@playwright/test";

async function ensureCoursesPage(page: Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/courses", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", {
      name: /pick an age path and launch a mission/i,
    });
    if (await heading.isVisible().catch(() => false)) {
      return;
    }

    const appError = page.getByRole("heading", {
      name: /application error: a client-side exception/i,
    });
    if (await appError.isVisible().catch(() => false)) {
      await page.reload({ waitUntil: "domcontentloaded" });
    }
  }

  await expect(
    page.getByRole("heading", { name: /pick an age path and launch a mission/i }),
  ).toBeVisible();
}

test("courses library shows expanded mission catalog and grouped age paths", async ({
  page,
}) => {
  await ensureCoursesPage(page);

  await expect(
    page.getByRole("heading", { name: /pick an age path and launch a mission/i }),
  ).toBeVisible();
  await expect(page.getByText(/AI \+ Coding \+ Maths/i)).toBeVisible();

  // Sticky quick-jump chips / grouped age paths
  await expect(page.getByRole("link", { name: /ages 5-7/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /ages 8-10/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /ages 11-14/i }).first()).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /ages 5-7 mission paths/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /ages 8-10 mission paths/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /ages 11-14 mission paths/i }),
  ).toBeVisible();

  // New missions added across age bands
  await expect(page.getByRole("heading", { name: /sound sorting safari/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /treasure bot trail/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /space signal detectives/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /eco sensor builders/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /climate data code studio/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /vision lab ethics arcade/i })).toBeVisible();

  const viewMissionLinks = page.getByRole("link", { name: /view mission/i });
  await expect(viewMissionLinks).toHaveCount(9);

  // Spot-check a new course detail route still works
  await page.goto("/courses/course-space-signals", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: /space signal detectives/i }),
  ).toBeVisible();
  await expect(page.getByText(/curriculum spine/i)).toBeVisible();
});
