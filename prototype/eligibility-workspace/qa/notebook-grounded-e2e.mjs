import { chromium } from "playwright";
import { strict as assert } from "node:assert";

const baseURL = process.env.QA_BASE_URL || "https://eligibility-workspace-nu.vercel.app";
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const context = await browser.newContext({ viewport: { width: 1440, height: 920 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const errors = [];
let notebookId = null;
let sourceId = null;
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("favicon") && !message.text().includes("Failed to load resource")) errors.push(message.text());
});

const mutationHeaders = { Origin: baseURL, "Content-Type": "application/json" };
async function json(response) {
  if (!response.ok()) throw new Error(`${response.status()} ${await response.text()}`);
  return response.json();
}

try {
  const stamp = Date.now();
  const source = await json(await context.request.post(`${baseURL}/api/studio/library-sources`, {
    headers: mutationHeaders,
    data: {
      type: "text",
      title: `Grounded notebook QA source ${stamp}`,
      content: "# Verification requirements\nWorkers must request proof of earned income when electronic data is incomplete.\n\n# Documentation\nThe case record must describe the verification requested, the response received, and the reason for any exception.\n\n# Applicant support\nWorkers should explain acceptable verification options in plain language and offer language assistance when requested.",
    },
  }));
  sourceId = source.id;
  const notebook = await json(await context.request.post(`${baseURL}/api/studio/notebooks`, {
    headers: mutationHeaders,
    data: { title: `Grounded notebook QA ${stamp}`, purpose: "Create a concise source-grounded verification job aid." },
  }));
  notebookId = notebook.id;
  await json(await context.request.post(`${baseURL}/api/studio/notebooks/${encodeURIComponent(notebookId)}/sources`, {
    headers: mutationHeaders,
    data: { source_id: sourceId },
  }));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator('[data-view="notebook"]').first().click();
  await page.getByRole("heading", { name: "Notebooks", exact: true }).waitFor();
  await page.waitForFunction(() => !document.body.textContent.includes("Loading workspace…"));
  await page.locator(`[data-open-notebook-id="${notebookId}"]`).click();
  await page.locator(".notebook-desk-page.grounded").waitFor();
  assert.equal(await page.locator(".artifact-stepper").count(), 0);
  await page.waitForFunction(() => document.querySelector(".notebook-summary-card.current,.notebook-summary-card.error"), null, { timeout: 70000 });
  const analysisState = await page.locator(".notebook-summary-card").getAttribute("class");
  if (!analysisState.includes("current")) throw new Error(`Automatic analysis failed: ${await page.locator(".notebook-summary-card").textContent()}`);
  assert.ok((await page.locator(".notebook-summary-card").textContent()).includes("Grounded in selected documents"));
  const initialPoints = await page.locator(".notebook-key-point").count();
  assert.ok(initialPoints > 0, "Automatic source analysis should create candidate key points");

  await page.locator('[data-notebook-output="job_aid"]').click();
  await page.locator('[data-notebook-output="job_aid"].selected').waitFor();
  await page.locator("#notebookChatInput").fill("What documentation should the worker retain in the case record?");
  await page.locator("#notebookChatForm").evaluate((form) => form.requestSubmit());
  await page.locator(".notebook-message.assistant").waitFor({ timeout: 60000 });
  const answer = await page.locator(".notebook-message.assistant").last().textContent();
  assert.match(answer, /verification|case record|response/i);
  assert.ok(await page.locator(".notebook-message.assistant .notebook-grounded-citations button").count());

  await page.locator("[data-copy-notebook-message]").last().click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(clipboard.length > 10);
  await page.locator("[data-add-message-point]").last().click();
  await page.waitForFunction((count) => document.querySelectorAll(".notebook-key-point").length > count, initialPoints);

  await page.locator(".notebook-summary-card .notebook-grounded-citations button").first().click();
  await page.locator(".notebook-citation-body pre").waitFor();
  assert.ok((await page.locator(".notebook-citation-body pre").textContent()).length > 10);
  await page.getByRole("button", { name: "Close citation" }).click();

  await page.getByRole("button", { name: /Finalize key points/ }).click();
  await page.waitForFunction(() => document.body.textContent.includes("Content finalized · v1"));
  assert.ok(await page.getByRole("button", { name: /Continue to Job aid/i }).count());

  const persisted = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${encodeURIComponent(notebookId)}`));
  assert.equal(persisted.source_summary.status, "current");
  assert.equal(persisted.content_brief.status, "approved");
  assert.equal(persisted.selected_output, "job_aid");
  assert.equal(persisted.chat_messages.length, 2);
  assert.ok(persisted.content_brief.points.length > initialPoints);

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);

  const stale = await json(await context.request.delete(`${baseURL}/api/studio/notebooks/${encodeURIComponent(notebookId)}/sources`, {
    headers: mutationHeaders,
    data: { source_id: sourceId },
  }));
  assert.equal(stale.source_summary.status, "stale");
  assert.ok(stale.content_brief.points.some((point) => point.review_status === "needs_review"));
  console.log(JSON.stringify({
    automaticSummary: true,
    candidateKeyPoints: initialPoints,
    citedChat: true,
    copyAndAdd: true,
    citationDrawer: true,
    persisted: true,
    outputGating: true,
    sourceStaleness: true,
    workflowStripRemoved: true,
    mobileOverflow: false,
    errors,
  }, null, 2));
  assert.deepEqual(errors, []);
} finally {
  if (notebookId && sourceId) {
    await context.request.delete(`${baseURL}/api/studio/notebooks/${encodeURIComponent(notebookId)}/sources`, { headers: mutationHeaders, data: { source_id: sourceId } }).catch(() => {});
  }
  if (notebookId) await context.request.post(`${baseURL}/api/studio/notebooks/${encodeURIComponent(notebookId)}/archive`, { headers: { Origin: baseURL } }).catch(() => {});
  if (sourceId) await context.request.delete(`${baseURL}/api/studio/library-sources/${encodeURIComponent(sourceId)}`, { headers: { Origin: baseURL } }).catch(() => {});
  await browser.close();
}
