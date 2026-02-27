import { expect, test, type Page } from "@playwright/test";

function teacherCreds() {
  const email = process.env.E2E_TEACHER_EMAIL;
  const password = process.env.E2E_TEACHER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing E2E teacher credentials. Set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD.",
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

async function waitForTeacherWorkspace(page: Page) {
  const workspaceReady = page.getByRole("button", { name: /school qr code/i });
  const retryButton = page.getByRole("button", { name: /^retry$/i });

  for (let attempt = 0; attempt < 45; attempt++) {
    if (await workspaceReady.isVisible().catch(() => false)) {
      return;
    }

    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
    }

    await page.waitForTimeout(1_000);
  }

  await expect(workspaceReady).toBeVisible({ timeout: 10_000 });
}

async function signInToTeacherWorkspace(page: Page) {
  const { email, password } = teacherCreds();

  await page.goto("/teach", { waitUntil: "domcontentloaded" });
  await recoverClientError(page);

  if (await page.getByRole("button", { name: /school qr code/i }).count()) {
    await waitForTeacherWorkspace(page);
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

  await waitForTeacherWorkspace(page);
  await expect(page).toHaveURL(/\/teach(\/|\?|$)/);
}

async function expectPath(page: Page, pattern: RegExp) {
  await expect.poll(() => new URL(page.url()).pathname).toMatch(pattern);
}

async function clickWorkspaceTab(page: Page, tabName: RegExp, pathPattern: RegExp) {
  const tab = page.getByRole("main").getByRole("link", { name: tabName }).first();

  for (let attempt = 0; attempt < 3; attempt++) {
    await tab.click();
    const path = new URL(page.url()).pathname;
    if (pathPattern.test(path)) {
      return;
    }
    await page.waitForTimeout(500);
  }

  await expectPath(page, pathPattern);
}

async function closeInlineFormByCancel(page: Page) {
  const cancel = page.getByRole("button", { name: /^cancel$/i });
  await expect(cancel.first()).toBeVisible();
  await cancel.first().click();
}

async function expectAlignmentPanel(page: Page, activityTitle: RegExp) {
  await expect(page.getByText(/curriculum alignment/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /stay in teach/i }).first()).toBeVisible();
  await expect(page.getByText(activityTitle).first()).toBeVisible();
}

async function expectAlignedMission(page: Page, missionTitle: RegExp) {
  const card = page
    .locator("article")
    .filter({ has: page.getByText(missionTitle) })
    .filter({ has: page.getByRole("link", { name: /stay in teach/i }) })
    .first();
  await expect(card).toBeVisible();
}

test("teacher workspace smoke flow (tabs + actions)", async ({ page }) => {
  test.setTimeout(240_000);

  await signInToTeacherWorkspace(page);

  await expect(
    page.getByRole("heading", { name: /teacher workspace/i }),
  ).toBeVisible();

  // Top controls and inline panels/forms
  await page.getByRole("button", { name: /school qr code/i }).click();
  await expect(page.getByText(/school account qr/i)).toBeVisible();
  await page.getByRole("button", { name: /school qr code/i }).click();
  await expect(page.getByText(/school account qr/i)).toBeHidden();

  await page.getByRole("button", { name: /restore deleted classes/i }).click();
  await expect(page.getByText("Deleted classes", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /restore deleted classes/i }).click();
  await expect(page.getByText("Deleted classes", { exact: true })).toBeHidden();

  await page.getByRole("button", { name: /^edit class$/i }).click();
  await expect(
    page.getByRole("heading", { name: /^edit class$/i }),
  ).toBeVisible();
  await closeInlineFormByCancel(page);
  await expect(
    page.getByRole("heading", { name: /^edit class$/i }),
  ).toBeHidden();

  await page.getByRole("button", { name: /add a class/i }).last().click();
  await expect(
    page.getByRole("heading", { name: /^add a class$/i }),
  ).toBeVisible();
  await closeInlineFormByCancel(page);
  await expect(
    page.getByRole("heading", { name: /^add a class$/i }),
  ).toBeHidden();

  // /teach tab routes
  await clickWorkspaceTab(page, /^progress$/i, /\/teach\/progress$/);
  await expect(page.getByText(/weekly class progress/i)).toBeVisible();

  await clickWorkspaceTab(page, /^settings$/i, /\/teach\/settings$/);
  await expect(page.getByText(/school account/i)).toBeVisible();

  await clickWorkspaceTab(page, /^learners$/i, /\/teach\/learners$/);
  await expect(page.getByText(/class learners/i)).toBeVisible();

  // Learner write action
  const learnerName = `E2E Learner ${Date.now()}`;
  await page.getByPlaceholder("Learner name").fill(learnerName);
  await page.getByRole("button", { name: /add learner/i }).click();
  await expect(page.getByText(learnerName)).toBeVisible();

  // Back to teach + selection/query sync checks
  await clickWorkspaceTab(page, /^teach$/i, /\/teach$/);
  await waitForTeacherWorkspace(page);
  await expectAlignmentPanel(page, /sorting and grouping/i);
  await expectAlignedMission(page, /ai pattern detectives/i);
  await expectAlignedMission(page, /robot coders math lab/i);
  await page
    .getByRole("button", { name: /assign ai pattern detectives to class/i })
    .first()
    .click();
  await expect(page.getByText(/assigned mission queue/i)).toBeVisible();
  await expect(page.getByText(/assigned to class\./i)).toBeVisible();

  await page.getByRole("button", { name: /pp2 dorcas/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("classId")).toContain(
    "pp2a",
  );
  await expect(page.getByText(/class not found\./i)).toHaveCount(0);

  await page.getByRole("button", { name: /pp1 .*mary/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("classId")).toContain(
    "pp1",
  );

  await page.getByRole("button", { name: /^language$/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("subjectId")).toBe(
    "subject-language",
  );
  await expectAlignmentPanel(page, /listening for comprehension/i);
  await expectAlignedMission(page, /story chatbot studio/i);

  const activityBefore = new URL(page.url()).searchParams.get("activityId");
  await page.getByRole("button", { name: /auditory memory/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("activityId")).not.toBe(
    activityBefore,
  );
  await expectAlignmentPanel(page, /auditory memory/i);
  await expectAlignedMission(page, /story chatbot studio/i);

  await page.getByRole("button", { name: /^reading$/i }).click();
  await expectAlignmentPanel(page, /print awareness/i);
  await expectAlignedMission(page, /story chatbot studio/i);

  await page.getByRole("button", { name: /^writing$/i }).click();
  await expectAlignmentPanel(page, /letter formation/i);
  await expectAlignedMission(page, /story chatbot studio/i);

  await page.getByRole("button", { name: /^mathematics$/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("subjectId")).toBe(
    "subject-math",
  );
  await expectAlignmentPanel(page, /sorting and grouping|number recognition/i);

  await page.getByRole("button", { name: /^numbers$/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("strandId")).toBe(
    "strand-numbers",
  );
  await expectAlignmentPanel(page, /number recognition/i);
  await expectAlignedMission(page, /robot coders math lab/i);

  await page.getByRole("button", { name: /^measurement$/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("strandId")).toBe(
    "strand-measurement",
  );
  await expectAlignmentPanel(page, /comparing sizes/i);
  await expectAlignedMission(page, /robot coders math lab/i);

  await page.getByRole("button", { name: /^geometry$/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("strandId")).toBe(
    "strand-geometry",
  );
  await expectAlignmentPanel(page, /sides of objects/i);
  await expectAlignedMission(page, /robot coders math lab/i);

  await page.getByRole("button", { name: /^pre-number$/i }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("strandId")).toBe(
    "strand-pre-number",
  );
  await expectAlignmentPanel(page, /sorting and grouping/i);
  await expectAlignedMission(page, /ai pattern detectives/i);

  await page.getByRole("button", { name: /matching and pairing/i }).click();
  await expectAlignmentPanel(page, /matching and pairing/i);
  await expectAlignedMission(page, /ai pattern detectives/i);

  await page.getByRole("button", { name: /ordering/i }).click();
  await expectAlignmentPanel(page, /ordering/i);
  await expectAlignedMission(page, /ai pattern detectives/i);
  await expectAlignedMission(page, /robot coders math lab/i);

  await page.getByRole("button", { name: /patterns/i }).click();
  await expectAlignmentPanel(page, /patterns/i);
  await expectAlignedMission(page, /ai pattern detectives/i);

  const advanceButton = page.getByRole("button", { name: /^advance$/i }).first();
  if (await advanceButton.count()) {
    await advanceButton.click();
    await expect(page.getByText(/class not found\./i)).toHaveCount(0);
  }

  // Admin alias route renders admin shell and tabs
  await page.getByRole("link", { name: /open admin route/i }).click();
  await expectPath(page, /\/admin\/teach$/);
  await expect(
    page.getByRole("heading", { name: /admin teaching console/i }),
  ).toBeVisible();

  await clickWorkspaceTab(page, /^progress$/i, /\/admin\/teach\/progress$/);
  await clickWorkspaceTab(page, /^settings$/i, /\/admin\/teach\/settings$/);
  await clickWorkspaceTab(page, /^teach$/i, /\/admin\/teach$/);

  // Sign-out availability (and actual sign-out flow)
  await page.getByRole("button", { name: /open user menu/i }).click();
  await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
  await page.keyboard.press("Escape");
});
