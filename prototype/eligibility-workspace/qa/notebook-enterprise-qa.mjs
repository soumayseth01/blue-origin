import { chromium } from "playwright";
import { strict as assert } from "node:assert";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:3111";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
const createdNotebookIds = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("favicon") && !message.text().includes("Failed to load resource")) errors.push(message.text());
});

async function notebookList() {
  const response = await context.request.get(`${baseURL}/api/studio/notebooks?page_size=100`);
  assert.equal(response.status(), 200);
  return (await response.json()).items;
}

async function archiveNotebook(id) {
  await context.request.post(`${baseURL}/api/studio/notebooks/${encodeURIComponent(id)}/archive`, {
    headers: { Origin: baseURL },
  });
}

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator('[data-view="notebook"]').first().click();
  await page.getByRole("heading", { name: "Notebooks", exact: true }).waitFor();
  await page.waitForFunction(() => !document.body.textContent.includes("Loading workspace…"));

  const beforeIds = new Set((await notebookList()).map((notebook) => notebook.id));
  const createButton = page.getByRole("button", { name: "Create notebook", exact: true }).first();
  await createButton.click();
  await page.locator("[data-notebook-title]").waitFor();
  assert.equal(await page.getByRole("dialog").count(), 0, "Quick create must not open the old setup dialog");
  assert.equal(await page.locator("[data-notebook-title]").inputValue(), "Untitled notebook");
  assert.equal(await page.locator("[data-notebook-title]").evaluate((node) => document.activeElement === node), true);

  const afterCreate = await notebookList();
  const instantNotebook = afterCreate.find((notebook) => !beforeIds.has(notebook.id));
  assert.ok(instantNotebook, "Quick create should persist a new notebook");
  createdNotebookIds.push(instantNotebook.id);
  assert.deepEqual({
    title: instantNotebook.title,
    purpose: instantNotebook.purpose,
    audience: instantNotebook.audience,
    access: instantNotebook.access_scope,
    programs: instantNotebook.programs,
    sources: instantNotebook.source_ids,
  }, {
    title: "Untitled notebook",
    purpose: "",
    audience: "Eligibility operations staff",
    access: "private",
    programs: [],
    sources: [],
  });

  await page.getByRole("button", { name: "Publish notebook" }).click();
  await page.getByRole("button", { name: "Publish version" }).click();
  await page.locator(".notebook-dialog-error").waitFor();
  const publishErrors = await page.locator(".notebook-dialog-error").textContent();
  assert.match(publishErrors, /Replace the default notebook name/i);
  assert.match(publishErrors, /Purpose is required/i);
  assert.match(publishErrors, /Add at least one source/i);
  await page.getByRole("button", { name: "Cancel" }).click();

  const title = `Instant notebook QA ${Date.now()}`;
  const purpose = "Verify the form-free notebook creation and source workflow.";
  await page.locator("[data-notebook-title]").fill(title);
  await page.locator("[data-notebook-objective]").fill(purpose);
  await page.waitForTimeout(900);
  let saved = await context.request.get(`${baseURL}/api/studio/notebooks/${instantNotebook.id}`).then((response) => response.json());
  assert.equal(saved.title, title);
  assert.equal(saved.purpose, purpose);

  const sourceCheckbox = page.locator("[data-notebook-source]").first();
  await sourceCheckbox.check();
  await page.waitForTimeout(500);
  saved = await context.request.get(`${baseURL}/api/studio/notebooks/${instantNotebook.id}`).then((response) => response.json());
  assert.equal(saved.source_ids.length, 1);
  await sourceCheckbox.uncheck();
  await page.waitForTimeout(500);
  saved = await context.request.get(`${baseURL}/api/studio/notebooks/${instantNotebook.id}`).then((response) => response.json());
  assert.equal(saved.source_ids.length, 0);

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  assert.equal(await page.locator("[data-notebook-title]").isVisible(), true);
  await page.setViewportSize({ width: 1440, height: 920 });

  await page.locator('[data-action="back-to-notebook-landing"]').click();
  await page.locator('[data-view="library"]').first().click();
  await page.locator("[data-library-select-source]").first().check();
  const beforeLibraryCreate = new Set((await notebookList()).map((notebook) => notebook.id));
  await page.locator('[data-action="use-selected-in-notebook"]').click();
  await page.locator("[data-notebook-title]").waitFor();
  const afterLibraryCreate = await notebookList();
  const libraryNotebook = afterLibraryCreate.find((notebook) => !beforeLibraryCreate.has(notebook.id));
  assert.ok(libraryNotebook, "Creating from a Library selection should persist a notebook");
  createdNotebookIds.push(libraryNotebook.id);
  assert.equal(libraryNotebook.title, "Untitled notebook");
  const libraryNotebookDetail = await context.request.get(`${baseURL}/api/studio/notebooks/${libraryNotebook.id}`).then((response) => response.json());
  assert.equal(libraryNotebookDetail.source_ids.length, 1);

  await page.locator('[data-action="back-to-notebook-landing"]').click();
  let rejectCreate = true;
  await page.route("**/api/studio/notebooks", async (route) => {
    if (rejectCreate && route.request().method() === "POST") {
      rejectCreate = false;
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Simulated create failure" }) });
    }
    return route.continue();
  });
  await page.getByRole("button", { name: "Create notebook", exact: true }).first().click();
  await page.getByRole("heading", { name: "Notebooks", exact: true }).waitFor();
  await page.getByRole("button", { name: "Create notebook", exact: true }).first().waitFor({ state: "visible" });
  assert.equal(await page.getByRole("button", { name: "Create notebook", exact: true }).first().isEnabled(), true);
  assert.equal(await page.locator("[data-notebook-title]").count(), 0);

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    instantCreate: true,
    defaultsVerified: true,
    autosaveVerified: true,
    sourceAttachAndRemove: true,
    librarySelectionCreate: true,
    publishValidation: true,
    failureRecovery: true,
    mobileOverflow: false,
    errors,
  }, null, 2));
} finally {
  for (const id of createdNotebookIds) await archiveNotebook(id).catch(() => {});
  await browser.close();
}
