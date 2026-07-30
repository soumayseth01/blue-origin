const { chromium } = require("/Users/soumayseth/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const blank = "";
const application = {
  type: "Initial application", channel: "Online application", receivedDate: "2026-07-29", receivedTime: "09:15",
  preferredLanguage: "English", interpreterNeeded: "No", accessibilityNeed: "None reported", contactMethod: "Phone",
  phone: "(555) 010-1212", email: "case@example.invalid", bestContactTime: "Afternoons", residentialAddress: "12 Training Way",
  cityStateZip: "Example City, RI 00000", mailingAddressSame: "Yes", mailingAddress: blank, authorizedRepresentative: "No",
  representativeName: blank, urgentNeed: "No", urgentNeedType: blank, interviewMode: "Phone", interviewStatus: "Scheduled",
};
const person = {
  personId: "person-01", name: "Avery Mercer", dateOfBirth: "1990-05-10", relationship: "Self", livesAtCaseAddress: "Yes",
  alternateAddress: blank, temporaryAbsent: "No", absenceReason: blank, expectedReturnDate: blank, sharedCustody: "No shared custody",
  custodySchedule: blank, maritalStatus: "Never married", taxFilingStatus: "Files taxes", claimedAsDependent: "No", pregnant: "No",
  dueDate: blank, snapFoodTogether: "Yes", tanfRole: "Parent/caretaker", medicaidParticipation: "Applying",
  snapParticipation: "Applying", tanfParticipation: "Applying",
};
const generated = {
  suggested_title: "Reduced hours combined application", short_title: "Reduced hours", description: "A combined-program synthetic case with a recent reduction in work hours.",
  persona: { name: "Avery Mercer", initials: "AM", description: "Parent of two · English", preferred_language: "English" },
  opening: "I am working fewer hours and need help keeping up with food, rent, and health coverage.",
  facts: [
    { id: "hours", case_path: "incomeSources", label: "Reduced hours", question: "Have your work hours changed?", caption: "My weekly hours dropped from 36 to 20 this month." },
    { id: "rent", case_path: "expenses", label: "Shelter", question: "What do you pay for housing?", caption: "My rent is $1,150 and I pay electricity separately." },
  ],
  case_data: {
    schemaVersion: "2.0.0-demo", application, people: [person],
    incomeSources: [{ incomeId: "income-01", person: "Avery Mercer", category: "Employment", type: "Wages", employer: "Example Market", employmentStatus: "Active", payBasis: "Hourly", hourlyRate: "18.00", hoursPerWeek: "20", grossAmount: "720", frequency: "Monthly", paymentDate: "2026-07-25", expectedChange: "Reduction in hours", changeDate: "2026-07-01", selfEmploymentBusiness: blank, grossReceipts: blank, businessExpenses: blank }],
    expenses: { shelter: { type: "Rent", amount: "1150", frequency: "Monthly", shared: "No", subsidized: "No", subsidyType: blank, subsidyAmount: blank }, utilitiesStatus: "One or more", utilities: [{ type: "Electricity", arrangement: "Paid separately", amount: "120", frequency: "Monthly", shared: "No" }], dependentCareStatus: "None", dependentCare: [], supportStatus: "None", medicalStatus: "None", medical: [] },
    resources: [{ resourceId: "resource-01", owner: "Avery Mercer", type: "Checking account", institution: "Example Credit Union", value: "180", jointlyOwned: "No", incomeProducing: "No", vehicleDescription: blank, vehicleUse: blank }],
    nonfinancial: { identityStatus: "Verified", residency: "Resident", citizenship: "Verified citizen", immigrationDocument: blank, sponsorStatus: "No", sponsorName: blank, ssnStatus: "Matched", studentStatus: "No", disabilityClaimed: "No", disabilityDetails: blank, blindnessStatus: "No", pregnancyStatus: "No", caretakerStatus: "Parent/caretaker", healthCoverage: "No other coverage", workParticipation: "Screening required", absentParentStatus: "Information pending", priorBenefitHistory: "No", disqualificationHistory: "No" },
    evidence: [{ evidenceId: "evidence-wage", type: "Document", title: "Current pay statement", person: "Avery Mercer", program: "All requested programs", fact: "Current wages", receivedDate: "2026-07-29", status: "Review required", discrepancy: "Quarterly match reflects prior hours" }],
    outcomes: ["Medicaid", "SNAP", "TANF"].map((program) => ({ program, person: program === "Medicaid" ? "Avery Mercer" : "Case household", month: "Aug 2026", status: "Approved — illustrative", benefit: program === "Medicaid" ? "Coverage" : "$400", reason: "Illustrative training fixture" })),
    notices: ["Medicaid", "SNAP", "TANF"].map((program) => ({ program, type: "Approval and pending verification", effectiveDate: "2026-08-01", delivery: "Mail + portal", language: "English", verificationDueDate: "2026-08-08", appealRights: "Included" })),
    authorizations: ["Medicaid", "SNAP", "TANF"].map((program) => ({ program, action: "Hold for final review", effectiveDate: "2026-08-01" })),
  },
  behavior: { profile_id: "benefits-anxious", intensity: "moderate", voice_key: "voice-warm-american-female" },
  expected_actions: ["Confirm household composition", "Resolve wage discrepancy", "Explain next steps"],
  training_objectives: ["Practice a combined-program interview", "Request only relevant verification"],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  const errors = [];
  const failedResponses = [];
  let generationRequests = 0;
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
  await page.route("**/api/studio/simulations/generate", async (route) => { generationRequests += 1; await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(generated) }); });
  await page.goto("http://127.0.0.1:8107/", { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.removeItem("blueorigin-simulation-authoring"); state.simulationAuthoring = null; setProductView("simulation-builder"); });

  const initialMethods = await page.locator("[data-sim-method]").count();
  const initialStepper = await page.locator(".simulation-authoring-stepper").count();
  assert(initialMethods === 2 && initialStepper === 0, "The authoring flow must start with two method cards and no stepper.");

  await page.click('[data-sim-method="prompt"]');
  assert(await page.locator('.simulation-method-strip').getByText("Start with a prompt", { exact: true }).count(), "Prompt method indicator did not collapse correctly.");
  const promptIdeas = {};
  for (const id of ["reduced-hours", "household-job-change", "combined-renewal", "magi-disability", "snap-expedited", "tanf-work"]) {
    await page.click(`[data-sim-idea="${id}"]`);
    promptIdeas[id] = {
      programs: await page.locator('[data-sim-program]:checked').evaluateAll((items) => items.map((item) => item.dataset.simProgram)),
      caseType: await page.locator('[data-sim-setup="caseType"]').inputValue(),
      focus: await page.locator('[data-sim-focus].selected').evaluateAll((items) => items.map((item) => item.dataset.simFocus)),
      promptLength: (await page.locator("#simulationPrompt").inputValue()).length,
    };
  }
  await page.click('[data-sim-idea="reduced-hours"]');
  await page.click('[data-sim-action="generate"]');
  const validationText = await page.locator(".simulation-error").textContent();
  const validationFocus = await page.evaluate(() => ({ field: document.activeElement?.dataset?.simSetup || document.activeElement?.id, invalid: document.activeElement?.getAttribute("aria-invalid") }));
  assert(generationRequests === 0, "Invalid prompt setup should not call generation.");
  await page.selectOption('[data-sim-setup="jurisdiction"]', { label: "Rhode Island" });
  await page.screenshot({ path: "/tmp/simulation-authoring-prompt.png", fullPage: true });
  await page.click('[data-sim-action="generate"]');
  await page.waitForSelector(".simulation-stage-review");
  assert(generationRequests === 1, "Prompt generation should call the AI endpoint exactly once.");

  const stageVersions = {};
  for (const stage of ["intake", "household", "programs", "financial", "nonfinancial", "evidence", "eligibility", "notices", "authorization"]) {
    await page.click(`[data-sim-step="${stage}"]`);
    stageVersions[stage] = await page.locator(".bc-expanded-workspace").getAttribute("data-integrated-case-version");
  }
  await page.click('[data-sim-step="behavior"]');
  const callerBriefPreview = {
    status: await page.locator(".simulation-caller-brief .status-chip").textContent(),
    stats: await page.locator(".simulation-caller-brief-stats").textContent(),
    mappings: await page.locator(".simulation-caller-corrections select").count(),
  };
  await page.screenshot({ path: "/tmp/simulation-authoring-caller-brief.png", fullPage: true });
  const factCountBefore = await page.locator("[data-sim-fact$='.label']").count();
  await page.click("[data-sim-fact-add]");
  const factCountAdded = await page.locator("[data-sim-fact$='.label']").count();
  await page.click(`[data-sim-fact-remove="${factCountAdded - 1}"]`);
  const factCountAfter = await page.locator("[data-sim-fact$='.label']").count();
  await page.click('[data-sim-step="preview"]');
  const promptReady = (await page.locator(".simulation-readiness h3").textContent()).includes("Ready to test");
  await page.screenshot({ path: "/tmp/simulation-authoring-prompt-preview.png", fullPage: true });
  await page.click('[data-sim-action="preview"]');
  await page.waitForFunction(() => document.querySelector(".app-shell")?.dataset.productView === "simulations");
  const previewScenario = await page.locator("#scenarioTitle").textContent();
  await page.evaluate(() => saveAndExitAttempt());
  await page.waitForFunction(() => document.querySelector(".app-shell")?.dataset.productView === "simulation-builder");
  page.once("dialog", (dialog) => dialog.accept());
  await page.click('[data-sim-action="publish"]');
  await page.waitForFunction(() => document.querySelector(".app-shell")?.dataset.productView === "scenario-library");
  const publishedVisible = await page.locator(".scenario-product-grid").getByText("Reduced hours", { exact: true }).count();

  await page.evaluate(() => { localStorage.removeItem("blueorigin-simulation-authoring"); state.simulationAuthoring = null; setProductView("simulation-builder"); });
  await page.click('[data-sim-method="manual"]');
  const manualMethod = await page.locator(".simulation-method-strip").textContent();
  const manualStep = await page.locator('[data-sim-step="intake"]').getAttribute("aria-current");
  const placeholders = {
    phone: await page.locator('[data-case-path="application.phone"]').inputValue(),
    email: await page.locator('[data-case-path="application.email"]').inputValue(),
    address: await page.locator('[data-case-path="application.cityStateZip"]').inputValue(),
    name: await page.evaluate(() => state.simulationAuthoring.caseDraft.people[0].name),
    evidence: await page.evaluate(() => state.simulationAuthoring.caseDraft.evidence.length),
    outcomes: await page.evaluate(() => state.simulationAuthoring.caseDraft.authoredOutcomes.final.length),
  };
  assert(generationRequests === 1, "Manual creation must not call the AI endpoint.");
  assert(manualStep === "step" && manualMethod.includes("Build it yourself"), "Manual selection should open Intake immediately.");

  await page.selectOption('[data-sim-manual-setup="jurisdiction"]', { label: "Rhode Island" });
  await page.check('[data-sim-manual-program="SNAP"]');
  await page.click('[data-sim-step="programs"]');
  await page.fill('[data-case-path="programUnits.snap.foodUnit"]', "Synthetic Applicant");
  await page.locator('[data-case-path="programUnits.snap.foodUnit"]').dispatchEvent("change");
  await page.selectOption('[data-case-path="programUnits.snap.purchasePrepare"]', "Separately");
  await page.click('[data-sim-step="intake"]');
  page.once("dialog", (dialog) => dialog.accept());
  await page.uncheck('[data-sim-manual-program="SNAP"]');
  const clearedProgram = await page.evaluate(() => ({ programs: state.simulationAuthoring.setup.programs, foodUnit: state.simulationAuthoring.caseDraft.programUnits.snap.foodUnit, notice: state.simulationAuthoring.caseDraft.notices.SNAP, authorization: state.simulationAuthoring.caseDraft.authorization.SNAP }));

  await page.click('[data-sim-step="preview"]');
  await page.click('[data-sim-action="preview"]');
  const readinessBlock = {
    step: await page.locator('.simulation-authoring-stepper [data-sim-step="intake"]').getAttribute("aria-current"),
    errors: await page.locator(".simulation-error.readiness li").count(),
    text: await page.locator(".simulation-error.readiness").textContent(),
  };
  assert(readinessBlock.step === "step" && readinessBlock.errors > 0, "Incomplete manual cases must focus the first incomplete stage and show a summary.");

  await page.click('[data-sim-action="save"]');
  await page.evaluate(() => { state.simulationAuthoring = null; renderProductView(); });
  const restoredMethod = await page.locator(".simulation-method-strip").textContent();
  assert(restoredMethod.includes("Build it yourself"), "Manual draft restoration lost the creation method.");

  await page.evaluate(() => {
    const sim = state.simulationAuthoring;
    const draft = sim.caseDraft;
    sim.setup.title = "Manual SNAP interview";
    sim.setup.jurisdiction = "Rhode Island";
    sim.setup.programs = ["SNAP"];
    sim.setup.trainingObjective = "Practice a complete SNAP intake and explain the authored outcome.";
    sim.generatedScenario.programs = ["SNAP"];
    sim.generatedScenario.opening = "I would like help completing my food assistance application.";
    sim.generatedScenario.facts = [{ id: "manual-fact", case_path: "people", label: "Household", question: "Who purchases and prepares food with you?", caption: "I purchase and prepare food by myself." }];
    Object.assign(draft.application, { type: "Initial application", receivedDate: "2026-07-29", preferredLanguage: "English", contactMethod: "Phone" });
    Object.assign(draft.people[0], { dateOfBirth: "1990-01-01", livesAtCaseAddress: "Yes", programParticipation: { SNAP: "Applying" } });
    draft.programRequests.SNAP = { requested: true, requestStatus: "Requested", applicationDate: "2026-07-29" };
    Object.assign(draft.programUnits.snap, { foodUnit: "Synthetic Applicant", purchasePrepare: "Separately", priorBenefits: "No" });
    draft.incomeStatus = "None";
    Object.assign(draft.expenses.shelter, { type: "Rent", amount: "900", frequency: "Monthly" });
    draft.resourcesStatus = "None";
    Object.assign(draft.nonfinancial, { identityStatus: "Verified", residency: "Resident", citizenship: "Verified citizen", ssnStatus: "Matched" });
    draft.evidence = [{ evidenceId: "manual-app", type: "Application", title: "Synthetic application", person: "Synthetic Applicant", program: "SNAP", fact: "Application facts", receivedDate: "2026-07-29", status: "Received", discrepancy: "None" }];
    const outcome = { program: "SNAP", person: "Case household", month: "Aug 2026", status: "Approved — illustrative", benefit: "$300", reason: "Authored training fixture" };
    draft.authoredOutcomes = { pending: [{ ...outcome, status: "Pending verification", benefit: "—" }], final: [outcome] };
    draft.notices.SNAP = { type: "Approval", effectiveDate: "2026-08-01", delivery: "Mail", language: "English", verificationDueDate: "", appealRights: "Included" };
    draft.authorization.SNAP = { action: "Authorize illustrative action", effectiveDate: "2026-08-01" };
    sim.step = "preview";
    renderProductView();
  });
  const manualReady = (await page.locator(".simulation-readiness h3").textContent()).includes("Ready to test");
  await page.click('[data-sim-action="preview"]');
  await page.waitForFunction(() => document.querySelector(".app-shell")?.dataset.productView === "simulations");
  const manualPreviewScenario = await page.locator("#scenarioTitle").textContent();
  await page.evaluate(() => saveAndExitAttempt());
  await page.waitForFunction(() => document.querySelector(".app-shell")?.dataset.productView === "simulation-builder");
  page.once("dialog", (dialog) => dialog.accept());
  await page.click('[data-sim-action="publish"]');
  await page.waitForFunction(() => document.querySelector(".app-shell")?.dataset.productView === "scenario-library");
  const manualPublishedVisible = await page.locator(".scenario-product-grid").getByText("Manual SNAP interview", { exact: true }).count();
  await page.evaluate(() => setProductView("simulation-builder"));
  assert(manualReady && manualPreviewScenario.includes("Manual SNAP interview") && manualPublishedVisible === 1, "A complete manual case did not preview and publish through the learner runtime.");

  page.once("dialog", (dialog) => dialog.accept());
  await page.click("[data-sim-change-method]");
  const resetMethods = await page.locator("[data-sim-method]").count();
  assert(resetMethods === 2, "Changing methods should reset the branch and return to the chooser.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-sim-method="manual"]');
  const mobile = await page.evaluate(() => {
    const stepper = document.querySelector(".simulation-authoring-stepper");
    const footer = document.querySelector(".simulation-authoring-footer");
    return { pageOverflow: document.documentElement.scrollWidth > window.innerWidth, stepperOverflows: stepper.scrollWidth > stepper.clientWidth, footerPosition: getComputedStyle(footer).position };
  });
  await page.screenshot({ path: "/tmp/simulation-authoring-manual-mobile.png", fullPage: true });

  assert(!errors.some((error) => error.startsWith("page:")), `Page errors: ${errors.join(" | ")}`);
  assert(!failedResponses.some((response) => response.includes("/api/studio/simulations/generate")), `Generation response failed: ${failedResponses.join(" | ")}`);
  assert(Object.values(stageVersions).every((version) => version === "2.0.0-demo"), "Not every author stage reused the integrated case schema.");
  assert(factCountBefore === factCountAfter && factCountAdded === factCountBefore + 1, "Disclosure fact add/remove controls failed.");
  assert(callerBriefPreview.status.includes("Validated") && callerBriefPreview.stats.includes("Serialized size") && callerBriefPreview.stats.includes("Included facts") && callerBriefPreview.mappings === generated.facts.length, "Caller brief preview or correction mapping controls are incomplete.");
  assert(promptReady, "A complete generated prompt case should be preview-ready.");
  assert(!mobile.pageOverflow && mobile.stepperOverflows && mobile.footerPosition === "sticky", "Mobile overflow or sticky footer behavior regressed.");

  console.log(JSON.stringify({
    initialMethods, initialStepper, promptIdeas, validationText, validationFocus, generationRequests, stageVersions,
    factControls: { before: factCountBefore, added: factCountAdded, after: factCountAfter }, callerBriefPreview, promptReady,
    previewScenario, publishedVisible, manualMethod, manualStep, placeholders, clearedProgram, readinessBlock,
    restoredMethod, manualReady, manualPreviewScenario, manualPublishedVisible, resetMethods, mobile, errors, failedResponses,
    screenshots: ["/tmp/simulation-authoring-prompt.png", "/tmp/simulation-authoring-caller-brief.png", "/tmp/simulation-authoring-prompt-preview.png", "/tmp/simulation-authoring-manual-mobile.png"],
  }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
