import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const port = Number(process.env.QA_PORT || 3024);
const baseURL = process.env.QA_BASE_URL || `http://127.0.0.1:${port}`;
const evidenceDir = resolve("qa/evidence/notebook-approved-journey");
await mkdir(evidenceDir, { recursive: true });

let server = null;
if (!process.env.QA_BASE_URL) {
  server = spawn(resolve("node_modules/.bin/vercel"), ["dev", "--listen", `127.0.0.1:${port}`], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  server.stdout.on("data", (chunk) => { logs += chunk; });
  server.stderr.on("data", (chunk) => { logs += chunk; });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const response = await fetch(`${baseURL}/api/studio/notebooks?page_size=1`); if (response.ok) break; } catch { /* server booting */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    if (attempt === 79) throw new Error(`Local Vercel server did not start\n${logs}`);
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
const results = { base_url: baseURL, screens: {}, downloads: {}, persistence: {}, integrations: {} };
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !/favicon|Failed to load resource/i.test(message.text())) errors.push(message.text()); });
const headers = { Origin: baseURL, "Content-Type": "application/json" };

async function json(response) {
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return JSON.parse(text);
}

async function shot(number, name, selector = ".nj-page") {
  await page.locator(selector).first().waitFor({ state: "visible" });
  const path = resolve(evidenceDir, `${String(number).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path, fullPage: true });
  results.screens[number] = { name, path, heading: await page.locator(selector).first().innerText().then((text) => text.slice(0, 180)) };
}

async function download(action, expectedSuffix) {
  const event = page.waitForEvent("download");
  await page.locator(`[data-nj-action="${action}"]`).first().click();
  const item = await event;
  const name = item.suggestedFilename();
  assert.ok(name.endsWith(expectedSuffix), `Expected ${expectedSuffix}, got ${name}`);
  const path = resolve(evidenceDir, name);
  await item.saveAs(path);
  results.downloads[expectedSuffix] = { name, path };
}

let notebookId;
let sourceId;
try {
  const stamp = Date.now();
  const source = await json(await context.request.post(`${baseURL}/api/studio/library-sources`, { headers, data: {
    type: "text",
    title: `Household Change Reporting — Demo Source ${stamp}`,
    content: "# Household change reporting\nEligibility workers must explain which household changes must be reported and the applicable reporting deadline. Workers must document the date the change was reported and the verification requested.\n\n# Verification\nWhen electronic data is incomplete, request acceptable proof and explain the available options in plain language. Record the evidence received and the reason for any approved exception.\n\n# Program differences\nProgram-specific reporting requirements must remain explicit. Do not combine different deadlines into a universal rule.\n\n# Worker checklist\nConfirm the reported change, identify the affected program, request required evidence, document the action, and notify the household of the next step.",
  } }));
  sourceId = source.id;

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator('[data-view="notebook"]').first().click();
  await page.getByRole("heading", { name: "Notebooks", exact: true }).waitFor();
  await shot(1, "notebook-library");

  await page.locator('[data-nj-action="create"]').click();
  await shot(2, "create-notebook-modal", ".nj-modal");
  await page.locator("#njCreatePrompt").fill("Help eligibility workers explain, verify, and document household changes with program differences kept explicit.");
  await page.locator("#njCreateForm").evaluate((form) => form.requestSubmit());
  await page.locator(".nj-empty").first().waitFor();
  notebookId = await page.evaluate(() => state.artifactStudio.activeNotebookId);
  assert.ok(notebookId);
  await shot(3, "empty-notebook");

  await page.locator('[data-nj-action="sources"]').first().click();
  await page.locator(`[data-nj-source="${sourceId}"]`).waitFor({ state: "attached" });
  await shot(4, "source-selection-review");
  await page.locator(`[data-nj-source="${sourceId}"]`).evaluate((input) => { input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.waitForFunction((id) => state.selectedSourceIds.has(id), sourceId);

  await page.locator('[data-nj-action="generate-summary"]').click();
  await page.getByText("Grounded in selected documents", { exact: true }).waitFor({ timeout: 90000 });
  await shot(5, "source-summary-chat");

  await page.locator('[data-nj-action="brief"]').click();
  await page.locator(".nj-point").first().waitFor();
  await shot(6, "content-brief-evidence");
  await page.locator('[data-nj-action="finalize"]').click();
  await shot(7, "finalize-brief-modal", ".nj-modal");
  await page.locator('[data-nj-action="confirm-finalize"]').click();
  await page.getByRole("heading", { name: "Create editable drafts" }).waitFor();
  await shot(8, "creation-studio");

  await page.locator('[data-nj-action="generate-drafts"]').first().click();
  await page.getByRole("heading", { name: "Creating 3 editable drafts" }).waitFor();
  await shot(9, "draft-generation-status");
  await page.locator('[data-nj-open-output="job_aid"]').waitFor();
  await page.locator('[data-nj-open-output="job_aid"]').click();
  await shot(10, "job-aid-editor");

  await download("export-job", ".docx");
  const pdfResponse = await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/exports/pdf`);
  assert.equal(pdfResponse.status(), 200); results.downloads[".pdf"] = { bytes: (await pdfResponse.body()).length };

  await page.locator('[data-nj-action="studio"]').click();
  await page.locator('[data-nj-open-output="presentation"]').click();
  await shot(11, "presentation-editor");
  await page.locator('[data-nj-action="assets"]').first().click();
  await shot(12, "image-asset-drawer", ".nj-assetdrawer");
  await page.locator('.nj-assetdrawer [data-nj-action="close-modal"]').click();
  await download("export-presentation", ".pptx");
  await page.locator('[data-nj-action="approve-presentation"]').click();
  await page.getByText(/Synced with approved deck v1/).waitFor();
  await shot(14, "presentation-derived-video-editor");

  await page.locator('[data-nj-action="studio"]').click();
  await page.locator('[data-nj-open-output="quiz"]').click();
  await shot(13, "knowledge-check-editor");
  await page.locator('[data-nj-action="approve-quiz"]').click();
  await download("export-quiz", ".html");
  const quizJson = await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/exports/quiz-json`);
  assert.equal(quizJson.status(), 200); results.downloads["quiz.json"] = { bytes: (await quizJson.body()).length };

  results.integrations = await json(await context.request.get(`${baseURL}/api/studio/integrations`));
  await page.locator('[data-nj-action="studio"]').click();
  await page.locator('[data-nj-open-output="video"]').click();
  if (results.integrations.heygen) {
    await page.locator('[data-nj-action="generate-video"]').click();
    await page.getByText(/HeyGen is rendering/).waitFor({ timeout: 30000 });
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const current = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/video`));
      const status = current.artifact_projects?.video?.status;
      if (status === "ready") { await page.reload({ waitUntil: "networkidle" }); break; }
      if (status === "failed") throw new Error(current.artifact_projects.video.error || "HeyGen failed");
      await new Promise((resolveWait) => setTimeout(resolveWait, 8000));
    }
  }

  const beforeRelease = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}`));
  if (beforeRelease.artifact_projects?.video?.status === "ready") {
    await page.locator('[data-nj-action="release"]').first().click();
    await shot(15, "release-review-publish");
    await page.locator('[data-nj-action="publish-release"]').first().click();
    await page.getByText(/Published release/).waitFor({ timeout: 30000 });
    const srt = await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/exports/srt`);
    assert.equal(srt.status(), 200); results.downloads[".srt"] = { bytes: (await srt.body()).length };
  } else results.screens[15] = { skipped: "HeyGen integration not configured" };

  const persisted = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}`));
  results.persistence = {
    notebook_id: notebookId,
    source_id: sourceId,
    title: persisted.title,
    stage: persisted.workflow_stage,
    status: persisted.status,
    brief_version: persisted.content_brief?.version,
    outputs: Object.keys(persisted.artifact_projects || {}),
    releases: persisted.artifact_releases?.length || 0,
    video_url: persisted.artifact_projects?.video?.download_url || null,
  };
  assert.equal(persisted.content_brief.status, "approved");
  assert.deepEqual(Object.keys(persisted.artifact_projects).sort(), ["job_aid", "presentation", "quiz", "video"]);
  assert.ok(results.downloads[".docx"] && results.downloads[".pptx"] && results.downloads[".html"]);
  assert.deepEqual(errors, []);
  results.errors = errors;
  results.completed_at = new Date().toISOString();
  await writeFile(resolve(evidenceDir, "evidence.json"), `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}
