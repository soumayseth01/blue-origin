const { chromium } = require("playwright");

async function openScenario(page, index) {
  const libraryButton = page.locator('[data-view="scenario-library"]');
  if (await libraryButton.count()) await page.evaluate(() => document.querySelector('[data-view="scenario-library"]').click());
  await page.locator(`[data-action="start-assignment"][data-scenario="${index}"]`).last().click();
  await page.evaluate(() => eval("startGuidedCall()"));
  await page.locator(".bc-expanded-workspace").waitFor();
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const errors = [];
  desktop.on("console", (message) => { if (message.type() === "error" && !/404 \(File not found\)/.test(message.text())) errors.push(message.text()); });
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto("http://127.0.0.1:8104/", { waitUntil: "networkidle" });
  await openScenario(desktop, 0);

  const intakeAccordions = await desktop.locator(".bc-accordion").count();
  await desktop.locator('[data-section-id="intake-address"] > summary').click();
  await desktop.selectOption('[data-case-path="application.mailingAddressSame"]', "No");
  await desktop.locator('[data-case-path="application.mailingAddress"]').fill("PO Box 44, Riverton, ST 00000");

  await desktop.locator('[data-screen-jump="household"]').click();
  await desktop.locator('[data-repeat-add="people"]').click();
  const peopleRows = await desktop.locator(".bc-table tbody tr").count();

  await desktop.locator('[data-screen-jump="financial"]').click();
  await desktop.selectOption('[data-case-path="incomeSources.0.category"]', "Self-employment");
  const selfEmploymentVisible = await desktop.locator('[data-case-path="incomeSources.0.selfEmploymentBusiness"]').isVisible();

  await desktop.locator('[data-screen-jump="eligibility"]').click();
  await desktop.selectOption('[data-target-id="eligibility-run-reason"]', "Initial application");
  await desktop.locator('[data-case-action="run-mock-eligibility"]').click();
  const pendingText = await desktop.locator(".bc-expanded-workspace").innerText();
  await desktop.locator('[data-section-id="eligibility-review"] > summary').click();
  await desktop.selectOption('[data-case-path="application.interviewStatus"]', "Completed");
  const staleText = await desktop.locator(".bc-authored-banner").innerText();

  await desktop.locator('[data-screen-jump="evidence"]').click();
  await desktop.locator('[data-target-id="evidence-wage-review"]').click();
  await desktop.locator('[data-screen-jump="eligibility"]').click();
  await desktop.locator('[data-case-action="run-mock-eligibility"]').click();
  const finalText = await desktop.locator(".bc-expanded-workspace").innerText();
  const stageAccordionChecks = {};
  for (const stage of ["intake", "household", "programs", "financial", "nonfinancial", "evidence", "eligibility", "notices", "authorization"]) {
    await desktop.locator(`[data-screen-jump="${stage}"]`).click();
    stageAccordionChecks[stage] = await desktop.locator(".bc-accordion").count();
  }
  await desktop.locator('[data-screen-jump="eligibility"]').click();
  await desktop.screenshot({ path: "qa/integrated-eligibility-desktop-1440x920.png", fullPage: true });

  const singleProgramChecks = [];
  for (const [index, expected, excluded] of [[3, "MEDICAID", "SNAP"], [4, "SNAP", "TANF"], [5, "TANF", "MEDICAID"]]) {
    await desktop.evaluate(() => document.querySelector("#openScenarioLibrary").click());
    await desktop.locator(`.scenario-card[data-scenario="${index}"]`).click();
    await desktop.evaluate(() => eval("startGuidedCall()"));
    await desktop.locator('[data-screen-jump="programs"]').click();
    const text = await desktop.locator(".bc-expanded-workspace").innerText();
    singleProgramChecks.push({ index, includesExpected: text.includes(expected), excludesOther: !text.includes(excluded) });
  }

  const combinedScenarioChecks = [];
  for (const index of [1, 2]) {
    await desktop.evaluate(() => document.querySelector("#openScenarioLibrary").click());
    await desktop.locator(`.scenario-card[data-scenario="${index}"]`).click();
    await desktop.evaluate(() => eval("startGuidedCall()"));
    await desktop.locator('[data-screen-jump="programs"]').click();
    const text = await desktop.locator(".bc-expanded-workspace").innerText();
    combinedScenarioChecks.push({ index, hasMedicaid: text.includes("MEDICAID"), hasSnap: text.includes("SNAP"), hasTanf: text.includes("TANF") });
  }
  await desktop.locator('[data-mode="assessment"]').click();
  const assessmentLockVisible = await desktop.locator("#coachAssessmentLock").isVisible();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("console", (message) => { if (message.type() === "error" && !/404 \(File not found\)/.test(message.text())) errors.push(`mobile: ${message.text()}`); });
  mobile.on("pageerror", (error) => errors.push(`mobile: ${error.message}`));
  await mobile.goto("http://127.0.0.1:8104/", { waitUntil: "networkidle" });
  await openScenario(mobile, 0);
  const mobileMetrics = await mobile.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    accordionCount: document.querySelectorAll(".bc-accordion").length,
    labels: [...document.querySelectorAll(".bc-accordion summary strong")].map((node) => node.textContent),
  }));
  await mobile.screenshot({ path: "qa/integrated-eligibility-mobile-390x844.png", fullPage: true });

  const result = {
    errors,
    intakeAccordions,
    peopleRows,
    selfEmploymentVisible,
    pendingFixture: pendingText.includes("Pending verification") && pendingText.includes("Illustrative authored result"),
    staleAfterEdit: staleText.includes("stale"),
    finalFixture: finalText.includes("Approved — illustrative") && finalText.includes("No rules engine"),
    stageAccordionChecks,
    singleProgramChecks,
    combinedScenarioChecks,
    assessmentLockVisible,
    mobileMetrics,
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (errors.length || !result.pendingFixture || !result.staleAfterEdit || !result.finalFixture || !selfEmploymentVisible || Object.values(stageAccordionChecks).some((count) => count < 1) || singleProgramChecks.some((item) => !item.includesExpected || !item.excludesOther) || combinedScenarioChecks.some((item) => !item.hasMedicaid || !item.hasSnap || !item.hasTanf) || !assessmentLockVisible || mobileMetrics.bodyWidth > mobileMetrics.viewportWidth) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
