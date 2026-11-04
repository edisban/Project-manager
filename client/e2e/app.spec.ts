import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "e2e-password-123";
const uniqueUser = () => `e2e_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Removes the test account (and its projects) so runs don't accumulate data. */
const deleteAccount = async (page: Page) => {
  const csrf = (await page.context().cookies()).find((cookie) => cookie.name === "XSRF-TOKEN");
  await page.request.delete("/api/users/me", { headers: { "X-XSRF-TOKEN": csrf?.value ?? "" } });
};

const signUp = async (page: Page, username: string) => {
  await page.goto("/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // New users land on the overview with the welcome tour open; dismiss it.
  await expect(page.getByRole("dialog", { name: "Your overview" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Create your first project" })).toBeVisible();
};

test("security headers and auth cookie are hardened", async ({ page, context }) => {
  const response = await page.goto("/login");
  const headers = response!.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");

  await signUp(page, uniqueUser());
  const authCookie = (await context.cookies()).find((cookie) => cookie.name === "access_token");
  expect(authCookie?.httpOnly).toBe(true);
  expect(authCookie?.sameSite).toBe("Strict");
  // The token is never readable from JavaScript.
  expect(await page.evaluate(() => document.cookie)).not.toContain("access_token");
  await deleteAccount(page);
});

test("full journey: sign up, manage a project and its students, sign out", async ({ page }) => {
  const username = uniqueUser();
  await signUp(page, username);

  // Create a project.
  await page.getByRole("button", { name: "New project" }).first().click();
  const projectDialog = page.getByRole("dialog", { name: "New project" });
  await projectDialog.getByLabel("Project name").fill("Apollo");
  await projectDialog.getByLabel("Description").fill("Moon landing programme");
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText("Project “Apollo” created")).toBeVisible();

  // Open it and add two students (one with a Greek name).
  await page.getByRole("article", { name: "Apollo" }).getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1, name: "Apollo" })).toBeVisible();

  for (const [first, last, code] of [
    ["Ada", "Lovelace", "100001"],
    ["Γιώργος", "Παπαδόπουλος", "100002"],
  ]) {
    await page.getByRole("button", { name: "Add student" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add student" });
    await dialog.getByLabel("First name").fill(first);
    await dialog.getByLabel("Last name").fill(last);
    await dialog.getByLabel("Student ID").fill(code);
    await dialog.getByLabel("Role").fill("Engineer");
    await dialog.getByRole("button", { name: "Add student" }).click();
    await expect(page.getByText(`${first} ${last} added`)).toBeVisible();
  }

  // Duplicate student IDs are rejected with a field error.
  await page.getByRole("button", { name: "Add student" }).first().click();
  const duplicate = page.getByRole("dialog", { name: "Add student" });
  await duplicate.getByLabel("First name").fill("Copy");
  await duplicate.getByLabel("Last name").fill("Cat");
  await duplicate.getByLabel("Student ID").fill("100001");
  await duplicate.getByLabel("Role").fill("Engineer");
  await duplicate.getByRole("button", { name: "Add student" }).click();
  await expect(
    duplicate.getByText("A student with this ID already exists in the project"),
  ).toBeVisible();
  await duplicate.getByRole("button", { name: "Cancel" }).click();

  // Partial search.
  await page.getByRole("searchbox", { name: "Search students" }).fill("παπα");
  // exact: the "… added" toasts contain the same names.
  await expect(page.getByText("Γιώργος Παπαδόπουλος", { exact: true })).toBeVisible();
  await expect(page.getByText("Ada Lovelace", { exact: true })).toBeHidden();
  await expect(page).toHaveURL(/q=/);

  // Sign out; the old session no longer works.
  const sessionCookies = await page.context().cookies();
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  // Replaying the old (revoked) cookie is rejected by the server.
  await page.context().addCookies(sessionCookies);
  expect((await page.request.get("/api/auth/me")).status()).toBe(401);

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await deleteAccount(page);
});

test("users cannot see each other's projects", async ({ browser }) => {
  const alice = await browser.newPage();
  await signUp(alice, uniqueUser());
  await alice.getByRole("button", { name: "New project" }).first().click();
  await alice.getByLabel("Project name").fill("Private plans");
  await alice.getByRole("button", { name: "Create project" }).click();
  await alice.getByRole("article", { name: "Private plans" }).getByRole("link").click();
  await expect(alice.getByRole("heading", { level: 1, name: "Private plans" })).toBeVisible();
  const privateUrl = alice.url();

  const bob = await browser.newPage();
  await signUp(bob, uniqueUser());
  await bob.goto(privateUrl);
  await expect(bob.getByRole("heading", { name: "Project not found" })).toBeVisible();

  await deleteAccount(alice);
  await deleteAccount(bob);
  await alice.close();
  await bob.close();
});

test("landing page, welcome tour and first project from the overview", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /organise projects and the people behind them/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /get started free/i }).click();

  await page.getByLabel("Username").fill(uniqueUser());
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // Walk the whole tour; steps whose target is hidden (e.g. on mobile) are skipped automatically.
  await expect(page.getByRole("dialog", { name: "Your overview" })).toBeVisible();
  for (let i = 0; i < 6; i++) {
    const finish = page.getByRole("button", { name: "Finish" });
    if (await finish.isVisible()) break;
    await page.getByRole("button", { name: "Next" }).click();
  }
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  // Not shown again after a reload.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Set up your workspace in three steps" }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByRole("dialog")).toBeHidden();

  // Creating a project from the overview opens it.
  await page.getByRole("button", { name: "Create a project" }).click();
  await page.getByRole("dialog", { name: "New project" }).getByLabel("Project name").fill("Apollo");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Apollo" })).toBeVisible();

  // The overview reflects it.
  await page.goto("/dashboard");
  await expect(page.getByRole("group", { name: "Projects" })).toContainText("1");
  await deleteAccount(page);
});

test("intro plays once per session at app start, then gets out of the way", async ({ page }) => {
  await page.goto("/");
  const intro = page.getByTestId("intro-splash");
  await expect(intro).toBeVisible();
  await expect(intro).toBeHidden({ timeout: 6000 });
  await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible();

  await page.reload();
  await page.waitForTimeout(300);
  await expect(intro).toBeHidden();
});
