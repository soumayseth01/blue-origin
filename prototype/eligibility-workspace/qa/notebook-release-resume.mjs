import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.QA_BASE_URL || "https://eligibility-workspace-nu.vercel.app";
const notebookId = process.env.QA_NOTEBOOK_ID;
assert.ok(notebookId, "QA_NOTEBOOK_ID is required");
const evidenceDir = resolve("qa/evidence/notebook-approved-journey");
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();

async function json(response) {
  const text = await response.text();
  if (!response.ok()) throw new Error(`${response.status()} ${text}`);
  return JSON.parse(text);
}

try {
  let notebook;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    notebook = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/video`));
    const video = notebook.artifact_projects?.video;
    console.log(JSON.stringify({ attempt: attempt + 1, status: video?.status, heygen_status: video?.heygen?.status }));
    if (video?.status === "ready") break;
    if (video?.status === "failed") throw new Error(video.error || "HeyGen render failed");
    await new Promise((resolveWait) => setTimeout(resolveWait, 8000));
  }

  assert.equal(notebook.artifact_projects?.video?.status, "ready", "HeyGen render did not complete within the polling window");
  assert.ok(notebook.artifact_projects.video.download_url, "Ready video must have an archived MP4 URL");

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator('[data-view="notebook"]').first().click();
  await page.locator(`[data-open-notebook-id="${notebookId}"]`).first().click();
  await page.locator('[data-nj-action="release"]').first().click();
  await page.getByRole("heading", { name: "Ready to publish" }).waitFor();
  assert.equal(await page.locator(".nj-checkrow .ok").count(), 6, "Every release check must pass");
  await page.screenshot({ path: resolve(evidenceDir, "15-release-review-publish.png"), fullPage: true });

  const reviewDate = new Date(Date.now() + 210 * 86400000).toISOString().slice(0, 10);
  await page.locator("#njReviewDate").fill(reviewDate);
  await page.locator('[data-nj-action="publish-release"]').first().click();
  await page.getByRole("heading", { name: "Published release" }).waitFor({ timeout: 30000 });
  await page.screenshot({ path: resolve(evidenceDir, "15b-published-release.png"), fullPage: true });

  const persisted = await json(await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}`));
  assert.equal(persisted.status, "published");
  assert.equal(persisted.workflow_stage, "published");
  assert.equal(persisted.artifact_projects.video.status, "ready");
  assert.equal(persisted.artifact_projects.video.derived_from.version, persisted.artifact_projects.presentation.version);
  assert.ok(persisted.artifact_releases.length >= 1);
  assert.equal(persisted.review_due_at.slice(0, 10), reviewDate);

  const srt = await context.request.get(`${baseURL}/api/studio/notebooks/${notebookId}/exports/srt`);
  assert.equal(srt.status(), 200);
  const videoHead = await context.request.head(persisted.artifact_projects.video.download_url);
  assert.equal(videoHead.status(), 200);

  const evidence = {
    base_url: baseURL,
    notebook_id: notebookId,
    status: persisted.status,
    workflow_stage: persisted.workflow_stage,
    published_version: persisted.published_version,
    brief_version: persisted.content_brief.version,
    presentation_version: persisted.artifact_projects.presentation.version,
    video_derived_from_version: persisted.artifact_projects.video.derived_from.version,
    video_status: persisted.artifact_projects.video.status,
    heygen_video_id: persisted.artifact_projects.video.heygen.video_id,
    video_url: persisted.artifact_projects.video.download_url,
    review_due_at: persisted.review_due_at,
    release_count: persisted.artifact_releases.length,
    source_count: persisted.sources.length,
    output_formats: Object.keys(persisted.artifact_projects),
    release_checks_passed: 6,
    mp4_head_status: videoHead.status(),
    mp4_content_type: videoHead.headers()["content-type"] || null,
    srt_bytes: (await srt.body()).length,
    verified_at: new Date().toISOString(),
  };
  await writeFile(resolve(evidenceDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
