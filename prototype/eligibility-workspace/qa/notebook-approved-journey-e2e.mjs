import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";

const port = Number(process.env.QA_PORT || 3024);
const baseURL = process.env.QA_BASE_URL || `http://127.0.0.1:${port}`;
const evidenceDir = resolve("qa/evidence/notebook-approved-journey");
await mkdir(evidenceDir, { recursive: true });
const imagePath = resolve(evidenceDir, "notebook-qa-image.png");
const imageCanvas = createCanvas(960, 540);
const imageContext = imageCanvas.getContext("2d");
imageContext.fillStyle = "#17343c"; imageContext.fillRect(0, 0, 960, 540);
imageContext.fillStyle = "#ff5d27"; imageContext.fillRect(520, 0, 440, 540);
imageContext.fillStyle = "#ffffff"; imageContext.font = "bold 54px sans-serif"; imageContext.fillText("Grounded guidance", 60, 260);
await writeFile(imagePath, imageCanvas.toBuffer("image/png"));

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

async function downloadMany(action, expectedSuffixes) {
  const items = [];
  const collect = (item) => items.push(item);
  page.on("download", collect);
  await page.locator(`[data-nj-action="${action}"]`).first().click();
  for (let attempt = 0; attempt < 120 && items.length < expectedSuffixes.length; attempt += 1) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  page.off("download", collect);
  assert.equal(items.length, expectedSuffixes.length, `Expected ${expectedSuffixes.length} downloads, received ${items.length}`);
  for (const expectedSuffix of expectedSuffixes) {
    const item = items.find((candidate) => candidate.suggestedFilename().endsWith(expectedSuffix));
    assert.ok(item, `Missing ${expectedSuffix}; received ${items.map((candidate) => candidate.suggestedFilename()).join(", ")}`);
    const name = item.suggestedFilename();
    const path = resolve(evidenceDir, name);
    await item.saveAs(path);
    results.downloads[expectedSuffix] = { name, path };
  }
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
  await page.locator("#njCreatePrompt").fill("");
  assert.equal(await page.locator("#njCreateForm .nj-btn.primary").isDisabled(), true, "Create must remain disabled until the prompt is valid");
  await page.locator("#njCreatePrompt").fill("Help eligibility workers explain, verify, and document household changes with program differences kept explicit.");
  assert.equal(await page.locator("#njCreatePromptCount").textContent(), "112 of 500 characters");
  assert.equal(await page.locator("#njCreateForm .nj-btn.primary").isEnabled(), true, "Arbitrary valid text must enable notebook creation");
  assert.equal(await page.locator(".nj-error").count(), 0, "Typing a valid prompt must not render an error state");
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
  let chatError = "Notebook chat did not return a supported answer";
  for (let attempt = 1; attempt <= 3 && !(await page.locator('[data-nj-action^="add-chat-point:"]').count()); attempt += 1) {
    await page.locator("#njChatInput").fill("What should an eligibility worker document after a household reports a change?");
    try {
      const responsePromise = page.waitForResponse(
        (response) => response.request().method() === "POST" && response.url().endsWith(`/api/studio/notebooks/${notebookId}/chat`),
        { timeout: 120000 },
      );
      await page.locator("#njChatForm").evaluate((form) => form.requestSubmit());
      const response = await responsePromise;
      if (!response.ok()) chatError = `Notebook chat attempt ${attempt} failed (${response.status()}): ${(await response.text()).slice(0, 500)}`;
      await page.locator('[data-nj-action^="add-chat-point:"]').waitFor({ timeout: 15000 }).catch(() => {});
    } catch (error) {
      chatError = `Notebook chat attempt ${attempt} timed out: ${error.message}`;
    }
  }
  assert.ok(await page.locator('[data-nj-action^="add-chat-point:"]').count(), chatError);
  await page.locator('[data-nj-action^="add-chat-point:"]').click();
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

  const initialSections = await page.locator(".nj-outlineitem").count();
  await page.locator('[data-nj-action="add-section"]').click();
  await page.waitForFunction((count) => document.querySelectorAll(".nj-outlineitem").length === count + 1, initialSections);
  await page.locator('.nj-outlineitem.on [data-nj-item-op="duplicate"]').click();
  await page.waitForFunction((count) => document.querySelectorAll(".nj-outlineitem").length === count + 2, initialSections);
  await page.locator('.nj-outlineitem.on [data-nj-item-op="up"]').click();
  await page.locator('.nj-outlineitem.on [data-nj-item-op="down"]').click();
  await page.locator('.nj-outlineitem.on [data-nj-item-op="delete"]').click();
  await page.waitForFunction(() => state.notebookJourney.saveStatus === "saved");
  const afterSectionCrud = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}`));
  assert.equal(afterSectionCrud.artifact_projects.job_aid.sections.length, initialSections + 1);

  await download("export-job", ".docx");
  const pdfResponse = await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/exports/pdf`);
  assert.equal(pdfResponse.status(), 200); results.downloads[".pdf"] = { bytes: (await pdfResponse.body()).length };

  await page.locator('[data-nj-action="studio"]').click();
  await page.locator('[data-nj-open-output="presentation"]').click();
  await shot(11, "presentation-editor");
  await page.locator('[data-nj-action="assets"]').first().click();
  await page.locator("[data-nj-upload]").setInputFiles(imagePath);
  await page.locator('.nj-assetgrid [data-nj-asset-id]').waitFor();
  await page.locator("#njAssetCaption").fill("Worker-facing grounded guidance visual.");
  await page.locator("#njAssetAlt").fill("Blue and orange graphic labeled Grounded guidance.");
  await page.locator('[data-nj-crop="zoom"]').evaluate((input) => { input.value = "1.4"; input.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.locator('[data-nj-crop="x"]').evaluate((input) => { input.value = "70"; input.dispatchEvent(new Event("input", { bubbles: true })); });
  await shot(12, "image-asset-drawer", ".nj-assetdrawer");
  await page.locator('[data-nj-action^="use-asset:presentation:"]').click();
  await page.locator(".nj-assetdrawer").waitFor({ state: "detached" });
  const afterImageUse = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}`));
  const imageSlide = afterImageUse.artifact_projects.presentation.slides.find((slide) => slide.image);
  assert.equal(imageSlide.image.crop.zoom, 1.4);
  assert.equal(imageSlide.image.crop.x, 70);
  await page.reload({ waitUntil: "networkidle" });
  if (await page.locator('[data-nj-open-output="presentation"]').count()) await page.locator('[data-nj-open-output="presentation"]').click();
  if (!(await page.locator(".nj-slideimage img").count())) {
    await page.locator('[data-view="notebook"]').first().click();
    await page.locator(`[data-open-notebook-id="${notebookId}"]`).first().click();
    if (await page.locator('[data-nj-open-output="presentation"]').count()) await page.locator('[data-nj-open-output="presentation"]').click();
  }
  await page.locator(".nj-slideimage img").waitFor();
  const persistedImage = await page.locator(".nj-slideimage img").getAttribute("style");
  assert.match(persistedImage, /scale\(1\.4\)/);
  await download("export-presentation", ".pptx");
  await page.locator('[data-nj-action="approve-presentation"]').click();
  await page.getByText(/Synced with approved deck v1/).waitFor();
  await shot(14, "presentation-derived-video-editor");

  await page.locator('[data-nj-action="studio"]').click();
  await page.locator('[data-nj-open-output="quiz"]').click();
  await shot(13, "knowledge-check-editor");
  await page.locator('[data-nj-action="approve-quiz"]').click();
  await page.getByText(/All changes saved|Ready to approve/).first().waitFor().catch(()=>{});
  await downloadMany("export-quiz", [".html", ".json"]);
  const quizJson = await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/exports/quiz-json`);
  assert.equal(quizJson.status(), 200); results.downloads["quiz.json"] = { bytes: (await quizJson.body()).length };

  results.integrations = await json(await context.request.get(`${baseURL}/api/studio/integrations`));
  await page.locator('[data-nj-action="studio"]').click();
  await page.locator('[data-nj-open-output="video"]').click();
  if (results.integrations.heygen) {
    await page.locator('[data-nj-action="generate-video"]').click();
    await page.getByText(/HeyGen is rendering/).first().waitFor({ timeout: 30000 });
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
    await page.locator("#njReviewDate").fill(new Date(Date.now()+210*86400000).toISOString().slice(0,10));
    await page.locator('[data-nj-action="schedule-review"]').click();
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
    review_due_at: persisted.review_due_at,
    editor_crud: true,
    image_crop_reload: true,
  };
  assert.equal(persisted.content_brief.status, "approved");
  assert.deepEqual(Object.keys(persisted.artifact_projects).sort(), ["job_aid", "presentation", "quiz", "video"]);
  assert.ok(results.downloads[".docx"] && results.downloads[".pptx"] && results.downloads[".html"]);
  assert.ok(persisted.review_due_at, "Review schedule should persist");
  assert.deepEqual(errors, []);
  results.errors = errors;
  results.completed_at = new Date().toISOString();
  await writeFile(resolve(evidenceDir, "evidence.json"), `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}
