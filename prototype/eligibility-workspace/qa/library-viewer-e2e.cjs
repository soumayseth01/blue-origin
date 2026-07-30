const { chromium } = require("/Users/soumayseth/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseUrl = process.env.QA_BASE_URL || "https://eligibility-workspace-nu.vercel.app";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 920 } });
  const page = await context.newPage();
  const downloads = [];
  const errors = [];
  let temporarySourceId = null;
  page.on("download", (download) => downloads.push(download.suggestedFilename()));
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    const title = `Viewer retry QA ${Date.now()}`;
    const createResponse = await context.request.post(`${baseUrl}/api/studio/library-sources`, {
      headers: { Origin: baseUrl, "Content-Type": "application/json" },
      data: { type: "text", title, content: "RETRY ORIGINAL BYTES" },
    });
    if (!createResponse.ok()) throw new Error(`Could not create QA source: ${createResponse.status()} ${await createResponse.text()}`);
    const created = await createResponse.json();
    temporarySourceId = created.id || created.source?.id;
    if (!temporarySourceId) throw new Error("QA source response did not include an id");

    let failOnce = true;
    await page.route("**/api/studio/library-sources/**/document", async (route) => {
      if (failOnce && decodeURIComponent(route.request().url()).includes(temporarySourceId)) {
        failOnce = false;
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Simulated viewer failure" }) });
        return;
      }
      await route.continue();
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.click('[data-view="library"]');
    await page.waitForSelector(".library-drive-shell");

    const textRow = page.locator("[data-library-row]", { hasText: title });
    await textRow.locator("[data-library-open-document]").first().click();
    await page.waitForSelector(".library-viewer-error");
    await page.click("[data-retry-library-viewer]");
    await page.waitForSelector(".library-text-original");
    const retryRecoveredOriginal = (await page.locator(".library-text-original").textContent()) === "RETRY ORIGINAL BYTES";
    await page.keyboard.press("Escape");
    await page.waitForSelector("[data-library-viewer]", { state: "detached" });

    await page.setViewportSize({ width: 390, height: 844 });
    const docxRow = page.locator("[data-library-row]", { hasText: "RI_SNAP_noTOC_1-3_v2" });
    await docxRow.locator("[data-library-open-document]").first().click();
    await page.waitForSelector(".library-docx-host .library-docx-wrapper", { timeout: 30000 });
    const overlayBounds = await page.locator("[data-library-viewer]").evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      return { width: Math.round(bounds.width), height: Math.round(bounds.height) };
    });
    const noPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth === window.innerWidth);
    const closeFocusedAfterRender = await page.locator("[data-close-library-viewer]").evaluate((node) => document.activeElement === node);
    await page.keyboard.press("Escape");
    await page.waitForSelector("[data-library-viewer]", { state: "detached" });

    const result = {
      retryRecoveredOriginal,
      escapeClosedAfterRetry: true,
      mobileDocxRendered: true,
      overlayBounds,
      noPageOverflow,
      closeFocusedAfterRender,
      downloads,
      errors,
    };
    console.log(JSON.stringify(result, null, 2));
    if (!retryRecoveredOriginal || overlayBounds.width !== 390 || overlayBounds.height !== 844 || !noPageOverflow || downloads.length || errors.length) {
      process.exitCode = 1;
    }
  } finally {
    if (temporarySourceId) {
      await context.request.delete(`${baseUrl}/api/studio/library-sources/${encodeURIComponent(temporarySourceId)}`, {
        headers: { Origin: baseUrl },
      }).catch(() => {});
    }
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
