const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:8112";
const evidenceDir = path.join(__dirname, "evidence");
const screenshotDir = path.join(evidenceDir, "screenshots");

async function enterCaseFact(page, fact) {
  const selector = `[data-case-path="${fact.case_path}"]`;
  await page.waitForFunction((casePath) => {
    const controls = [...document.querySelectorAll("[data-case-path]")];
    return controls.some((control) => control.dataset.casePath === casePath && control.getClientRects().length);
  }, fact.case_path);

  const controls = page.locator(selector);
  const control = controls.first();
  const type = await control.getAttribute("type");
  const tagName = await control.evaluate((element) => element.tagName.toLowerCase());
  if (type === "radio") {
    await page.locator(`${selector}[value="${String(fact.normalized_value).replaceAll('"', '\\"')}"]`).check();
  } else if (type === "checkbox") {
    const desired = fact.normalized_value === true || String(fact.normalized_value).toLowerCase() === "true";
    if (desired) await control.check(); else await control.uncheck();
  } else if (tagName === "select") {
    await control.selectOption({ label: String(fact.normalized_value) }).catch(() => control.selectOption(String(fact.normalized_value)));
  } else {
    await control.fill(String(fact.normalized_value));
    await control.press("Tab");
  }

  await page.waitForFunction(({ casePath, value }) => {
    const actual = BlueOriginDemoScenarios.getPath(state.caseDraft, casePath);
    return String(actual) === String(value);
  }, { casePath: fact.case_path, value: fact.normalized_value });
}

async function interviewAndEnterFacts(page) {
  await page.evaluate(() => {
    handleHumeMessage({
      type: "user_message",
      message: { content: "Hello, this is the eligibility worker calling about your application. Before we begin, I want to confirm I am speaking privately with the applicant." },
    });
  });

  const facts = await page.evaluate(() => getScenario().truthLedger);
  const factResults = [];
  for (const [factIndex, fact] of facts.entries()) {
    console.log(`[${await page.evaluate(() => getScenario().id)}] interview ${factIndex + 1}/${facts.length}: ${fact.fact_id} -> ${fact.case_path}`);
    await page.evaluate((authoredFact) => {
      handleHumeMessage({ type: "user_message", message: { content: authoredFact.learner_question_examples[0] } });
      handleHumeMessage({ type: "assistant_message", message: { content: authoredFact.natural_response } });
    }, fact);
    await page.waitForFunction((factId) => state.disclosedFacts.has(factId), fact.fact_id);
    await page.waitForFunction((casePath) => state.coachRecommendation?.action_type === "enter" && state.coachRecommendation?.target?.case_path === casePath, fact.case_path);
    let focusedBeforeEntry = false;
    if (factIndex === 0) {
      await page.waitForFunction((casePath) => [...document.querySelectorAll("[data-case-path]")].some((element) => element.dataset.casePath === casePath && (element === document.activeElement || element.classList.contains("located"))), fact.case_path);
      focusedBeforeEntry = await page.locator(`[data-case-path="${fact.case_path}"]`).first().evaluate((element) => element === document.activeElement || element.classList.contains("located"));
      assert.equal(focusedBeforeEntry, true, `${fact.fact_id}: coach did not locate the first destination field`);
    }
    await enterCaseFact(page, fact);
    const enteredValue = await page.evaluate((casePath) => BlueOriginDemoScenarios.getPath(state.caseDraft, casePath), fact.case_path);
    factResults.push({ fact_id: fact.fact_id, case_path: fact.case_path, value: enteredValue, coach_located: focusedBeforeEntry });

    await page.evaluate(() => addVoiceTurn("learner", "Thank you. Let me confirm that I understood your answer and entered it correctly."));
  }
  return factResults;
}

async function setMappedTarget(page, target) {
  const selector = `[data-target-id="${target.target_id}"]`;
  const expected = target.expected;
  const mapped = page.locator(selector).first();
  await page.evaluate((targetId) => {
    const element = document.querySelector(`[data-target-id="${CSS.escape(targetId)}"]`);
    const accordion = element?.closest("details.bc-accordion");
    if (accordion) accordion.open = true;
  }, target.target_id);
  await mapped.waitFor({ state: "visible" });
  const tagName = await mapped.evaluate((element) => element.matches("label") ? element.querySelector("input").tagName.toLowerCase() : element.tagName.toLowerCase());
  const controlType = target.control_type;
  if (controlType === "button") {
    await mapped.click();
  } else if (controlType === "checkbox") {
    const input = mapped.locator("input");
    if (expected) await input.check(); else await input.uncheck();
  } else if (tagName === "select") {
    await mapped.selectOption(String(expected));
  } else {
    const value = expected === "nonempty" ? "Interview completed; material facts confirmed, evidence reviewed, and next steps explained." : String(expected);
    await mapped.fill(value);
    await mapped.press("Tab");
  }
}

async function completeProcessingStages(page) {
  const stages = ["intake", "household", "programs", "financial", "nonfinancial", "evidence", "eligibility", "notices", "authorization"];
  const stageResults = [];
  for (const stage of stages) {
    await page.evaluate((stageId) => navigateWorkflowScreen(stageId, "full journey QA"), stage);
    const targets = await page.evaluate((stageId) => scenarioTargetsForStage(stageId).map((target) => ({
      target_id: target.target_id,
      control_type: target.control_type,
      expected: expectedTargetValue(target),
    })), stage);
    for (const target of targets) await setMappedTarget(page, target);
    if (stage === "eligibility") {
      await page.locator('[data-case-action="run-mock-eligibility"]').click();
      await page.waitForFunction(() => state.mockEligibility.status === "final");
      const banner = await page.locator(".bc-authored-banner").innerText();
      assert.match(banner, /Illustrative authored result/i);
      assert.match(await page.locator(".bc-expanded-workspace").innerText(), /No rules engine/i);
    }
    const validation = await page.evaluate(() => validateScreen());
    assert.equal(validation.passed, true, `${stage}: ${validation.checks.filter((check) => !check.correct).map((check) => `${check.key} expected ${check.expected} got ${check.actual}`).join("; ")}`);
    if (stage === "authorization") assert.match(await page.locator('[data-section-id="authorization-checklist"] summary').innerText(), /4 of 4 complete/i);
    stageResults.push({ stage, passed: validation.passed, checks: validation.checks.length });
  }
  return stageResults;
}

async function runScenario(page, index) {
  await page.evaluate((scenarioIndex) => selectScenario(scenarioIndex), index);
  const scenario = await page.evaluate(() => ({ id: getScenario().id, case_id: getScenario().caseId, facts: getScenario().truthLedger.length }));
  assert.ok(["BO-001", "BO-002"].includes(scenario.id));
  await page.evaluate(() => startGuidedCall());
  await page.waitForFunction(() => state.callPhase === "live");

  const factResults = await interviewAndEnterFacts(page);
  assert.equal(factResults.length, scenario.facts);
  const stageResults = await completeProcessingStages(page);

  await page.evaluate(() => {
    addVoiceTurn("learner", "To summarize, I confirmed the household, income, expenses, resources, and health coverage. Thank you for your time. I explained the next steps and what happens after review.");
  });
  const beforeScreenshot = path.join(screenshotDir, `${scenario.id.toLowerCase()}-full-authorization.png`);
  await page.screenshot({ path: beforeScreenshot, fullPage: true });
  await page.evaluate(() => endLiveCall({ submit: true }));
  await page.waitForFunction(() => Boolean(state.latestAttempt) && state.submitted && state.callEnded);
  await page.locator("#feedbackView").waitFor({ state: "visible" });

  const attempt = await page.evaluate(() => ({
    attempt_id: state.latestAttempt.attempt_id,
    scenario_id: state.latestAttempt.scenario_id,
    score: state.latestAttempt.score,
    processing_score: state.latestAttempt.processing_score,
    interview_score: state.latestAttempt.interview_score,
    passed: state.latestAttempt.passed,
    critical_errors: state.latestAttempt.critical_errors,
    unresolved_case_risks: state.latestAttempt.post_call_evaluation.unresolved_case_risks,
    validated_screens: [...state.validatedScreens],
    authored_result_status: state.mockEligibility.status,
    disclosed_fact_count: state.disclosedFacts.size,
    event_count: state.latestAttempt.events.length,
    voice_turn_count: state.latestAttempt.voice_turns.length,
    completion_state: state.latestAttempt.attempt_exit.completion_state,
    sync_payload_bytes: {
      metadata: new Blob([JSON.stringify(attemptMetadata(state.latestAttempt))]).size,
      transcript: new Blob([JSON.stringify(state.latestAttempt.voice_turns || [])]).size,
      replay: new Blob([JSON.stringify({ events: state.latestAttempt.events || [], observations: state.latestAttempt.affect_observations || [] })]).size,
      screenshots: attemptArtifactSnapshots(state.latestAttempt).map((snapshot) => dataURLToBlob(snapshot.image_ref).size),
    },
  }));
  assert.equal(attempt.scenario_id, scenario.id);
  assert.equal(attempt.processing_score, 60);
  assert.equal(attempt.critical_errors, 0);
  assert.deepEqual(attempt.unresolved_case_risks, []);
  assert.equal(attempt.authored_result_status, "final");
  assert.equal(attempt.disclosed_fact_count, scenario.facts);
  assert.equal(attempt.completion_state, "complete");
  assert.equal(attempt.passed, true);
  assert.ok(attempt.sync_payload_bytes.metadata < 3_500_000, `Attempt metadata exceeds safe serverless request size: ${attempt.sync_payload_bytes.metadata}`);
  assert.ok(attempt.sync_payload_bytes.screenshots.length <= 9, `Expected at most one final screenshot per stage, received ${attempt.sync_payload_bytes.screenshots.length}`);
  console.log(`[${scenario.id}] sync payload bytes`, JSON.stringify(attempt.sync_payload_bytes));

  const feedbackScreenshot = path.join(screenshotDir, `${scenario.id.toLowerCase()}-full-results.png`);
  await page.screenshot({ path: feedbackScreenshot, fullPage: true });
  return { ...scenario, fact_results: factResults, stage_results: stageResults, attempt, screenshots: [beforeScreenshot, feedbackScreenshot] };
}

(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const errors = [];
  const failedResponses = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/404|favicon|not implemented|501 \(Unsupported method \('POST'\)\)/i.test(message.text())) errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
  });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const scenarios = [];
  for (const index of [0, 1]) {
    scenarios.push(await runScenario(page, index));
    await page.evaluate(() => hideFeedbackView());
  }
  if (errors.length) console.error("Browser console errors:", errors, "Failed responses:", failedResponses);
  assert.deepEqual(errors, []);
  const evidence = {
    generated_at: new Date().toISOString(),
    base_url: baseURL,
    browser: "Chromium headless",
    passed: true,
    console_errors: errors,
    failed_responses: failedResponses,
    scenarios,
  };
  const evidencePath = path.join(evidenceDir, "demo-full-case-e2e.json");
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ evidence: evidencePath, scenarios: scenarios.map(({ id, facts, attempt }) => ({ id, facts, score: attempt.score, processing_score: attempt.processing_score, interview_score: attempt.interview_score, passed: attempt.passed })) }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
