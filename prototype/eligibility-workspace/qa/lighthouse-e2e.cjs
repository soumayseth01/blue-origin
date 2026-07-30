const { chromium } = require("/Users/soumayseth/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

function assert(condition, message) { if (!condition) throw new Error(message); }

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error" && !/404|favicon|Failed to load resource/.test(message.text())) errors.push(`console: ${message.text()}`); });
  await page.route("**/api/lighthouse/**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Static QA fallback" }) }));
  await page.goto(process.env.LIGHTHOUSE_BASE_URL || "http://127.0.0.1:8127/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("blueorigin:lighthouse:v1"));
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.click('[data-view="lighthouse"]');
  try {
    await page.waitForSelector(".lh-hero", { timeout: 10000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      routeLabel: document.querySelector("#scenarioTitle")?.textContent,
      screenText: document.querySelector("#screenContent")?.textContent?.slice(0, 500),
      lighthouseLoaded: Boolean(window.BlueOriginLighthouse),
      lighthouseRoutes: Array.from(window.BlueOriginLighthouse?.routes || []),
      routeSetAcceptsLighthouse: window.BlueOriginLighthouse?.routes?.has("lighthouse"),
      activeViews: Array.from(document.querySelectorAll("[data-view].active"), (node) => node.dataset.view),
    }));
    throw new Error(`Lighthouse did not mount: ${JSON.stringify({ diagnostic, errors })}\n${error.message}`);
  }
  const pathCount = await page.locator(".lh-path-card").count();
  const moduleCount = await page.locator(".lh-module-card").count();
  assert(pathCount === 5, `Expected 5 learning paths, found ${pathCount}.`);
  assert(moduleCount === 12, `Expected 12 published modules, found ${moduleCount}.`);
  assert((await page.locator(".lh-hero").textContent()).includes("Build skills. Practice decisions. Improve outcomes."), "Lighthouse hero copy is missing.");

  await page.click('[data-lh-action="open-path"][data-path="path-maintenance"]');
  await page.waitForSelector(".lh-path-hero.green");
  assert(await page.getByText("Verification and Evidence", { exact: true }).count(), "Verification module is missing from its learning path.");
  await page.click('[data-lh-action="open-player"][data-module="verification-evidence"]');
  await page.waitForSelector(".lh-player");
  assert(await page.locator(".lh-player-outline nav button").count() === 4, "Verification module should have four lessons.");
  await page.click('[data-lh-action="select-block"][data-block="verification-evidence-video"]');
  await page.click('[data-lh-action="play-video"]');
  await page.waitForFunction(() => Number.parseInt(document.querySelector('[data-lh-video-label]')?.textContent || "0", 10) >= 80, null, { timeout: 6000 });
  await page.waitForSelector(".lh-complete-label");
  await page.screenshot({ path: "/tmp/blueorigin-lighthouse-player.png", fullPage: true });

  await page.click('[data-view="lighthouse-manage"]');
  await page.waitForSelector(".lh-module-table");
  await page.click('[data-lh-action="create-module"]');
  await page.fill('[data-lh-builder-field="title"]', "Quality Review Essentials");
  await page.fill('[data-lh-builder-field="summary"]', "A concise demonstration module for quality reviewers.");
  await page.fill('[data-lh-builder-field="objectives"]', "Identify a supported review finding.\nDocument the evidence trail.");
  await page.click('[data-lh-action="builder-next"]');
  await page.click('[data-lh-action="add-block"][data-type="text"]');
  await page.click('[data-lh-action="add-block"][data-type="quiz"]');
  await page.click('[data-lh-action="add-block"][data-type="simulation"]');
  assert(await page.locator(".lh-builder-block").count() === 3, "Builder did not add all content blocks.");
  await page.click('[data-lh-action="move-block-up"][data-index="2"]');
  const secondBlockType = await page.locator(".lh-builder-block").nth(1).locator("small").textContent();
  assert(secondBlockType.includes("simulation"), "Accessible reordering did not move the simulation block.");
  await page.click('[data-lh-action="builder-next"]');
  await page.waitForSelector(".lh-review-grid");
  assert(await page.locator(".lh-check.ready").count() === 4, "Publish readiness checklist is incomplete.");
  await page.click('[data-lh-action="publish-assign"]');
  await page.waitForSelector(".lh-module-table");
  assert(await page.getByText("Quality Review Essentials", { exact: true }).count(), "Published custom module is missing from management.");

  await page.click('[data-role="learner"]');
  await page.click('[data-view="my-learning"]');
  await page.waitForSelector(".lh-module-grid");
  assert(await page.getByText("Quality Review Essentials", { exact: true }).count(), "Assigned custom module is missing from My Learning.");

  await page.click('[data-lh-action="open-player"][data-module^="module-"]');
  await page.waitForSelector(".lh-player");
  await page.click('[data-lh-action="complete-block"]');
  await page.click('[data-lh-action="next-block"]');
  assert((await page.locator(".lh-player-main > header").textContent()).includes("Combined initial application"), "Next lesson should be the reordered simulation.");
  await page.click('[data-lh-action="launch-simulation"]');
  await page.waitForFunction(() => !document.querySelector("#appShell")?.classList.contains("product-view"));
  assert((await page.locator("#scenarioTitle").textContent()).includes("Combined"), "Lighthouse did not launch the selected simulation runtime.");
  await page.evaluate(() => returnToAssignments());
  await page.waitForSelector(".lh-player");
  assert((await page.locator(".lh-player-main > header").textContent()).includes("Knowledge check"), "Simulation return should complete the practice block and advance the module.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.click(".lh-mobile-outline");
  await page.click(".lh-player-exit");
  await page.waitForSelector(".lh-hero");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.waitForTimeout(3200);
  await page.screenshot({ path: "/tmp/blueorigin-lighthouse-mobile.png", fullPage: true });
  assert(!overflow, "Lighthouse creates horizontal overflow on mobile.");
  assert(errors.length === 0, `Browser errors: ${errors.join(" | ")}`);

  console.log(JSON.stringify({ pathCount, moduleCount, builderBlocks: 3, assignedCustomModule: true, mobileOverflow: overflow, errors }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
