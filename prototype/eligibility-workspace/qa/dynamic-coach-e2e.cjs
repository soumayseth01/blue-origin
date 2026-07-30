const { chromium } = require("playwright");
const assert = require("node:assert/strict");

let browser;
(async () => {
  const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:8112";
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const errors = [];
  let aiRequests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !/404|favicon/i.test(message.text())) errors.push(message.text()); });
  await page.route("**/api/studio/coach/recommend", async (route) => {
    aiRequests += 1;
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...body.recommendation, title: `Grounded AI wording: ${body.recommendation.title}`, instruction: `Grounded AI wording: ${body.recommendation.instruction}`, source: "ai_grounded_wording" }),
    });
  });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  if (await page.locator('[data-view="scenario-library"]').count()) await page.evaluate(() => document.querySelector('[data-view="scenario-library"]').click());
  await page.locator('[data-action="start-assignment"][data-scenario="0"]').last().click();
  await page.evaluate(() => eval("startGuidedCall()"));
  await page.locator('[data-screen-jump="household"]').click();

  const beforeDisclosure = await page.evaluate(() => ({ recommendation: state.coachRecommendation, draft: JSON.stringify(state.caseDraft), screenValues: JSON.stringify(state.screenValues) }));
  assert.equal(beforeDisclosure.recommendation.action_type, "ask");
  assert.equal(beforeDisclosure.recommendation.information.value, null);
  assert.ok(beforeDisclosure.recommendation.information.question);

  await page.locator("#locateTargetButton").click();
  await page.locator(`[data-target-id="${beforeDisclosure.recommendation.target.target_id}"]`).waitFor();
  assert.ok(await page.locator(`[data-target-id="${beforeDisclosure.recommendation.target.target_id}"]`).evaluate((element) => element.classList.contains("located")));
  const afterLocate = await page.evaluate(() => ({ draft: JSON.stringify(state.caseDraft), screenValues: JSON.stringify(state.screenValues) }));
  assert.equal(afterLocate.draft, beforeDisclosure.draft, "Locating a field changed the case draft");
  assert.equal(afterLocate.screenValues, beforeDisclosure.screenValues, "Locating a field changed a learner entry");

  await page.locator("#policyGuideButton").click();
  assert.ok(await page.locator("#coachPolicyCard").isVisible());
  assert.match(await page.locator("#coachPolicyCard").innerText(), /State\/customer policy supersedes/i);

  await page.evaluate(() => eval('discloseFact("household")'));
  await page.waitForFunction(() => state.coachRecommendation?.action_type === "enter");
  const disclosed = await page.evaluate(() => state.coachRecommendation);
  assert.ok(disclosed.information.disclosed);
  assert.ok(disclosed.information.value);

  for (let index = 0; index < 3; index += 1) {
    const recommendation = await page.evaluate(() => state.coachRecommendation);
    if (recommendation.action_type !== "enter" || recommendation.target.stage_id !== "household") break;
    await page.evaluate(({ targetId, value }) => {
      const control = document.querySelector(`[data-target-id="${CSS.escape(targetId)}"]`);
      const input = control?.matches("label") ? control.querySelector("input,select,textarea") : control;
      if (!input) throw new Error(`Missing coach target ${targetId}`);
      input.value = value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { targetId: recommendation.target.target_id, value: recommendation.information.value });
    await page.waitForTimeout(50);
  }
  assert.notEqual((await page.evaluate(() => state.coachRecommendation.action_type)), "ask");

  await page.waitForFunction(() => state.coachRecommendation?.source === "ai_grounded_wording", null, { timeout: 3000 });
  assert.ok(aiRequests > 0);
  assert.match(await page.locator("#coachHintLevel").innerText(), /AI phrased/i);

  await page.locator('[data-screen-jump="eligibility"]').click();
  const prerequisite = await page.evaluate(() => state.coachRecommendation);
  assert.equal(prerequisite.action_type, "review");
  assert.equal(prerequisite.target.stage_id, "evidence");
  await page.locator("#locateTargetButton").click();
  await page.waitForFunction(() => state.activeScreen === "evidence");
  assert.ok(await page.locator('[data-target-id="evidence-wage-review"]').evaluate((element) => element.classList.contains("located")));

  await page.locator('[data-target-id="evidence-wage-review"]').click();
  await page.locator('[data-target-id="evidence-wage-match"]').click();
  await page.locator('[data-screen-jump="eligibility"]').click();
  await page.selectOption('[data-target-id="eligibility-run-reason"]', "Initial application");
  await page.waitForFunction(() => state.coachRecommendation?.target?.action_id === "run-mock-eligibility");
  assert.match((await page.evaluate(() => state.coachRecommendation.instruction)), /does not calculate or change/i);
  const authoredBeforeLocate = await page.evaluate(() => JSON.stringify(state.mockEligibility));
  await page.locator("#locateTargetButton").click();
  assert.equal(await page.evaluate(() => JSON.stringify(state.mockEligibility)), authoredBeforeLocate, "Coach locator changed the authored result state");
  await page.locator('[data-case-action="run-mock-eligibility"]').click();
  assert.notEqual(await page.evaluate(() => state.mockEligibility.status), "unrun");
  await page.screenshot({ path: "/tmp/dynamic-grounded-coach-desktop.png", fullPage: true });

  await page.locator('[data-mode="assessment"]').click();
  assert.ok(await page.locator("#coachAssessmentLock").isVisible());
  assert.equal(await page.locator("#coachPracticeContent").isVisible(), false);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth }));
  assert.ok(mobile.bodyWidth <= mobile.viewportWidth);
  await page.screenshot({ path: "/tmp/dynamic-grounded-coach-mobile.png", fullPage: true });

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    askBeforeDisclosure: true,
    enterAfterDisclosure: true,
    locatorReadOnly: true,
    policyScopeVisible: true,
    aiWordingGrounded: true,
    evidencePrerequisite: true,
    authoredFixtureBoundary: true,
    assessmentLock: true,
    mobile,
    aiRequests,
    screenshots: ["/tmp/dynamic-grounded-coach-desktop.png", "/tmp/dynamic-grounded-coach-mobile.png"],
  }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  browser?.close().catch(() => {});
  process.exitCode = 1;
});
