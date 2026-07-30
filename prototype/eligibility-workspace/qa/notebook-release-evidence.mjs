import { chromium } from "playwright";
import { resolve } from "node:path";

const baseURL = process.env.QA_BASE_URL || "https://eligibility-workspace-nu.vercel.app";
const notebookId = process.env.QA_NOTEBOOK_ID;
if (!notebookId) throw new Error("QA_NOTEBOOK_ID is required");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator('[data-view="notebook"]').first().click();
  await page.locator(`[data-open-notebook-id="${notebookId}"]`).first().click();
  await page.waitForFunction((id) => {
    const record = state.artifactStudio.notebooks.find((item) => item.id === id);
    return record?.content_brief?.version === 1 && record?.source_ids?.length;
  }, notebookId);
  await page.locator('[data-nj-action="release"]').first().click();
  await page.getByRole("heading", { name: "Ready to publish", exact: true }).waitFor();
  const path = resolve("qa/evidence/notebook-approved-journey/15-release-review-publish.png");
  await page.screenshot({ path, fullPage: true });
  console.log(JSON.stringify({ notebook_id: notebookId, screenshot: path, publish_enabled: await page.locator('[data-nj-action="publish-release"]').first().isEnabled(), text: (await page.locator(".nj-release").innerText()).slice(0, 700) }, null, 2));
} finally { await browser.close(); }
