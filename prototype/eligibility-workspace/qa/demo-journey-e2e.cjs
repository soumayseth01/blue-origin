const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

let browser;
(async () => {
  const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:8112";
  const evidenceDir = new URL("./evidence/", `file://${__dirname}/`).pathname;
  const screenshotDir = `${evidenceDir}screenshots`;
  fs.mkdirSync(screenshotDir, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !/404|favicon|not implemented/i.test(message.text())) errors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const results = [];
  for (let index = 0; index < 6; index += 1) {
    await page.evaluate((scenarioIndex) => selectScenario(scenarioIndex), index);
    const preflight = await page.locator(".contact-sequence-summary").innerText();
    const scenario = await page.evaluate(() => {
      const preview = buildDemoCallerBriefPreview(getScenario());
      return { id: getScenario().id, route: getScenario().contactSequence, validation: getScenario().demoCaseValidation, callerBriefValidation: preview.validation };
    });
    assert.equal(scenario.validation.valid, true, `${scenario.id} bundle validation failed`);
    assert.equal(scenario.callerBriefValidation.valid, true, `${scenario.id} caller brief failed: ${scenario.callerBriefValidation.errors.join("; ")}`);
    assert.ok(scenario.callerBriefValidation.size_bytes < 8192);
    assert.match(await page.locator(".profile-assignment").innerText(), /Scenario assigned/);
    await page.evaluate(() => startGuidedCall());
    await page.waitForFunction(() => state.callPhase === "live");
    const initialCoach = await page.evaluate(() => state.coachRecommendation);

    const result = {
      scenario_id: scenario.id,
      route_id: scenario.route.route_id,
      route_mode: scenario.route.mode,
      expected_terminal_state: scenario.route.expected_terminal_state,
      preflight_summary: preflight.replace(/\s+/g, " ").trim(),
      initial_coach_action: initialCoach.action_type,
      initial_coach_title: initialCoach.title,
      validation_passed: scenario.validation.valid,
      caller_brief_size_bytes: scenario.callerBriefValidation.size_bytes,
    };

    if (index < 2) {
      const firstFact = await page.evaluate(() => getScenario().truthLedger[0]);
      assert.equal(await page.evaluate((path) => BlueOriginDemoScenarios.meaningful(BlueOriginDemoScenarios.getPath(state.caseDraft, path)), firstFact.case_path), false);
      assert.equal(initialCoach.action_type, "ask");
      await page.evaluate((fact) => {
        handleHumeMessage({ type: "user_message", message: { content: fact.learner_question_examples[0] } });
        handleHumeMessage({ type: "assistant_message", message: { content: fact.natural_response } });
      }, firstFact);
      await page.waitForFunction((path) => state.activeScreen === "household" && Boolean(document.querySelector(`[data-case-path="${CSS.escape(path)}"]`)), firstFact.case_path);
      await page.waitForTimeout(250);
      const located = await page.locator(`[data-case-path="${firstFact.case_path}"]`).evaluate((element) => element.classList.contains("located") && document.activeElement === element);
      const enterCoach = await page.evaluate(() => state.coachRecommendation);
      assert.equal(located, true, `${scenario.id} did not proactively focus the answer destination`);
      assert.equal(enterCoach.action_type, "enter");
      assert.equal(enterCoach.target.case_path, firstFact.case_path);
      assert.ok(await page.evaluate((factId) => state.voiceTurns.some((turn) => turn.speaker === "client" && turn.disclosed_fact_ids.includes(factId)), firstFact.fact_id));
      result.first_fact = firstFact.fact_id;
      result.coach_auto_focused = located;
      result.enter_destination = enterCoach.target.case_path;
    } else if (index < 4) {
      assert.equal(initialCoach.action_type, "handoff");
      const transition = scenario.route.allowed_handoffs[0];
      assert.ok(transition);
      const voices = scenario.route.contacts.map((contact) => contact.voice_id);
      assert.notEqual(voices[0], voices[1]);
      await page.evaluate(() => {
        state.handoffAttempted = true;
        state.handoffCompleted = true;
        state.humeSession.activeContactId = getScenario().contactSequence.intended_contact_id;
        renderCoachGuidance();
      });
      const afterHandoff = await page.evaluate(() => state.coachRecommendation);
      assert.equal(afterHandoff.action_type, "ask");
      result.handoff_voice_changed = true;
      result.post_handoff_coach_action = afterHandoff.action_type;
    } else {
      assert.equal(initialCoach.action_type, "handoff");
      await page.evaluate(() => {
        state.handoffAttempted = true;
        renderCoachGuidance();
      });
      const unavailableCoach = await page.evaluate(() => state.coachRecommendation);
      assert.equal(unavailableCoach.action_type, "callback");
      const terminalEvaluation = await page.evaluate((neutralMessageRequired) => {
        state.callbackDisposition = neutralMessageRequired ? "callback_message_recorded" : null;
        state.callEnded = true;
        state.voiceTurns = [
          { speaker: "learner", transcript: "Thank you, I understand. I will call back at that time.", time: "00:20" },
          { speaker: "learner", transcript: "Hello, this is Soumay calling from County Services. May I speak with the intended contact?", time: "00:02" },
        ];
        return evaluatePostCall();
      }, scenario.route.message_policy === "neutral_callback_only");
      assert.equal(terminalEvaluation.terminal_route, scenario.route.expected_terminal_state);
      assert.equal(terminalEvaluation.field_evaluations.length, 4, "Unavailable calls must not be scored against the full BenefitConnect application");
      assert.equal(terminalEvaluation.passed, true);
      result.unavailable_policy = scenario.route.message_policy;
      result.callback_window = scenario.route.callback_window;
      result.post_unavailable_coach_action = unavailableCoach.action_type;
      result.route_aware_evaluation_score = terminalEvaluation.overall_score;
    }

    const screenshot = `${screenshotDir}/${scenario.id.toLowerCase()}-journey.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    result.screenshot = screenshot;
    results.push(result);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => selectScenario(0));
  const mobile = await page.evaluate(() => ({ body_width: document.body.scrollWidth, viewport_width: window.innerWidth }));
  assert.ok(mobile.body_width <= mobile.viewport_width, `Mobile overflow: ${JSON.stringify(mobile)}`);
  await page.goto(`${baseURL}?humeChatQA=1`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#humeChatQaPanel").getAttribute("hidden"), null, "Developer text-QA mode did not expose the Hume chat panel");
  assert.deepEqual(errors, []);

  const evidence = {
    generated_at: new Date().toISOString(),
    base_url: baseURL,
    browser: "Chromium headless",
    route_distribution: { direct: 2, successful_handoff: 2, unavailable: 2 },
    mobile,
    hume_text_qa_panel: true,
    console_errors: errors,
    scenarios: results,
  };
  fs.writeFileSync(`${evidenceDir}demo-journey-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  browser?.close().catch(() => {});
  process.exitCode = 1;
});
