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
  await page.waitForFunction((id) => state.artifactStudio.notebooks.find((item) => item.id === id)?.content_brief?.version === 1, notebookId);
  await page.locator('[data-nj-open-output="video"]').click();
  await page.getByRole("button", { name: "HeyGen unavailable", exact: true }).waitFor();
  const button = page.getByRole("button", { name: "HeyGen unavailable", exact: true });
  const path = resolve("qa/evidence/notebook-approved-journey/14b-video-integration-health.png");
  await page.screenshot({ path, fullPage: true });
  console.log(JSON.stringify({ screenshot: path, button_disabled: await button.isDisabled(), health_message: await page.locator(".nj-callout.nj-error").innerText() }, null, 2));
} finally { await browser.close(); }
