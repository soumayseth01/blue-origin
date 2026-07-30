import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:8106";
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (message) => { if (message.type() === "error" && !/404 \(File not found\)/.test(message.text())) errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });

  await page.evaluate(() => eval('selectScenario(0); setProductView("simulations")'));
  await page.waitForSelector(".preflight-config-workspace");
  assert.match(await page.locator(".contact-sequence-summary").innerText(), /Direct applicant call/);
  assert.match(await page.locator(".contact-sequence-flow").innerText(), /answers first/i);
  assert.equal((await page.locator("#clientCaption").innerText()).trim(), "Hello?");
  assert.equal(await page.locator("#pauseCallerButton").isVisible(), false);
  const envelope = await page.evaluate(() => eval("buildApplicationContextEnvelope()"));
  assert.ok(envelope.applicant_case_view.application);
  assert.ok(envelope.applicant_case_view.people.length);
  assert.ok("incomeSources" in envelope.applicant_case_view);
  assert.ok("expenses" in envelope.applicant_case_view);
  assert.ok("resources" in envelope.applicant_case_view);
  assert.ok("nonfinancial" in envelope.applicant_case_view);
  assert.equal("evidence" in envelope.applicant_case_view, false);
  assert.equal("authoredOutcomes" in envelope.applicant_case_view, false);
  assert.equal("notices" in envelope.applicant_case_view, false);
  assert.equal("authorization" in envelope.applicant_case_view, false);
  assert.equal("evidence_references" in envelope, false);
  const playbackContract = await page.evaluate(() => ({
    sdk: typeof window.BlueOriginHumeSDK?.HumeClient === "function" && typeof window.BlueOriginHumeSDK?.EVIWebAudioPlayer === "function",
    runtime: typeof window.BlueOriginHumeRuntime?.HumeBrowserClient === "function",
    legacyManager: eval("typeof HumeAudioPlaybackManager"),
  }));
  assert.deepEqual(playbackContract, { sdk: true, runtime: true, legacyManager: "undefined" });
  const scenarioCoverage = await page.evaluate(() => eval("scenarios.slice(0, 6).map((scenario) => ({ id: scenario.id, mode: scenario.contactSequence.mode, contacts: scenario.contactSequence.contacts.length, programs: scenario.programs.length, people: buildApplicantCaseView(scenario).people.length }))"));
  assert.equal(scenarioCoverage.length, 6);
  assert.ok(scenarioCoverage.every((item) => item.mode === "direct" && item.contacts >= 1 && item.programs >= 1 && item.people >= 1));
  await page.evaluate(() => eval("startGuidedCall()"));
  for (const stage of ["intake", "household", "programs", "financial", "nonfinancial", "evidence", "eligibility", "notices", "authorization"]) {
    await page.evaluate((stageId) => eval(`navigateWorkflowScreen(${JSON.stringify(stageId)}, "qa")`), stage);
    await page.waitForSelector(`.bc-expanded-workspace[data-stage="${stage}"]`);
  }

  await page.evaluate(() => eval(`(() => { const scenario = scenarios[0]; const sequence = createDefaultContactSequence(scenario); sequence.mode = "screened"; sequence.answering_contact_id = sequence.contacts[1].contact_id; sequence.intended_contact_id = sequence.contacts[0].contact_id; sequence.active_contact_id = sequence.answering_contact_id; sequence.intended_contact_availability = "available_handoff"; scenario.contactSequence = sequence; selectScenario(0); })()`));
  await page.waitForSelector(".contact-sequence-summary");
  const screenedText = await page.locator(".contact-sequence-summary").innerText();
  assert.match(screenedText, /Screened call with controlled handoff/);
  assert.match(screenedText, /2 sequential callers/i);
  assert.equal((await page.locator("#clientCaption").innerText()).trim(), "Hello?");

  await page.evaluate(() => eval('setProductView("simulation-builder")'));
  await page.click("[data-sim-method='manual']");
  await page.click("[data-sim-step='household']");
  await page.click("[data-repeat-add='people']");
  await page.click("[data-sim-step='behavior']");
  await page.waitForSelector(".simulation-participant-editor");
  assert.equal(await page.locator("[data-sim-contact-sequence='mode']").inputValue(), "direct");
  assert.ok(await page.locator(".simulation-contact-card").count() >= 2);
  await page.selectOption("[data-sim-contact-sequence='mode']", "screened");
  const intended = await page.locator("[data-sim-contact-sequence='intended_contact_id']").inputValue();
  const answerOptions = await page.locator("[data-sim-contact-sequence='answering_contact_id'] option").evaluateAll((options) => options.map((option) => option.value));
  const alternate = answerOptions.find((value) => value !== intended);
  assert.ok(alternate);
  await page.selectOption("[data-sim-contact-sequence='answering_contact_id']", alternate);
  assert.match(await page.locator(".simulation-contact-flow-preview").innerText(), /preview/i);
  await page.selectOption("[data-sim-contact-sequence='intended_contact_availability']", "not_at_location");
  assert.equal(await page.locator("[data-sim-contact-sequence='intended_contact_availability']").inputValue(), "not_at_location");

  const voices = page.locator("[data-sim-contact$='.voice_key']");
  const firstVoice = await voices.nth(0).inputValue();
  await voices.nth(1).selectOption(firstVoice);
  await page.waitForSelector(".simulation-voice-warning");
  assert.match(await page.locator(".simulation-voice-warning").innerText(), /Similar voices selected/);
  await page.screenshot({ path: "/tmp/blueorigin-hume-authoring-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(`mobile: ${error.message}`));
  await mobile.goto(baseURL, { waitUntil: "networkidle" });
  await mobile.evaluate(() => eval('selectScenario(0); setProductView("simulations")'));
  await mobile.waitForSelector(".contact-sequence-summary");
  const overflow = await mobile.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }));
  assert.ok(overflow.documentWidth <= overflow.viewportWidth + 1, JSON.stringify(overflow));
  await mobile.screenshot({ path: "/tmp/blueorigin-hume-preflight-mobile.png", fullPage: true });

  assert.deepEqual(errors, []);
  process.stdout.write(JSON.stringify({ ok: true, facts: envelope.facts.length, contacts: await page.locator(".simulation-contact-card").count(), screenshots: ["/tmp/blueorigin-hume-authoring-desktop.png", "/tmp/blueorigin-hume-preflight-mobile.png"] }, null, 2));
} finally {
  await browser.close();
}
