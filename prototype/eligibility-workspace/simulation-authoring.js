/* Dual-path simulation authoring. Prompt and manual cases share the same
   BenefitConnectIntegrated application model and learner runtime. */
(function () {
  "use strict";

  const CASE_STEPS = workflow.map((item) => [item.id, item.label]);
  const SHARED_STEPS = [...CASE_STEPS, ["behavior", "AI behavior"], ["preview", "Preview"]];
  const PROGRAMS = ["Medicaid", "SNAP", "TANF"];
  const STORAGE_KEY = "blueorigin-simulation-authoring";

  const FOCUS_OPTIONS = [
    "Variable income", "Recent job change", "Self-employment", "Shared custody",
    "Student household member", "Elderly or disabled member", "Medical expenses",
    "Housing subsidy", "Prior benefits in another state", "Group-living arrangement",
    "Immigration circumstances", "Resource transfer",
  ];

  const JURISDICTIONS = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming",
  ];

  const PROMPT_IDEAS = [
    {
      id: "reduced-hours", title: "Reduced-hours initial application",
      description: "A parent applies after work hours fall and needs help with health, food, and cash assistance.",
      programs: ["Medicaid", "SNAP", "TANF"], caseType: "Initial application",
      focus: ["Variable income", "Recent job change", "Housing subsidy"],
      prompt: "Create a combined Medicaid, SNAP, and TANF initial-application case for a parent with two children whose retail work hours recently decreased. Include changing wages, rent and utilities, childcare costs, pregnancy, current wage evidence, and a data-match discrepancy that the learner must resolve.",
    },
    {
      id: "household-job-change", title: "Household member and job change",
      description: "Process a newly added household member, new wages, and updated shelter costs.",
      programs: ["Medicaid", "SNAP", "TANF"], caseType: "Reported change", focus: ["Recent job change"],
      prompt: "Create a reported-change case where an adult child returns to the household while the primary applicant starts a warehouse job. Include new earned income, a rent increase, household-composition questions, and evidence that conflicts with older wage data.",
    },
    {
      id: "combined-renewal", title: "Combined renewal with data matches",
      description: "Reconcile renewal responses with conflicting electronic evidence.",
      programs: ["Medicaid", "SNAP", "TANF"], caseType: "Renewal", focus: ["Variable income"],
      prompt: "Create a combined-program renewal case with a completed renewal form, an electronic wage match, and one unresolved discrepancy. The learner should request only necessary verification and complete program-specific notices.",
    },
    {
      id: "magi-disability", title: "MAGI and disability pathways",
      description: "Preserve both tax-household and disability-related screening paths.",
      programs: ["Medicaid"], caseType: "Initial application", focus: ["Elderly or disabled member", "Medical expenses"],
      prompt: "Create a Medicaid application involving a married household with a disability claim and recurring medical expenses. Require the learner to build the MAGI tax household and preserve a non-MAGI disability pathway screen.",
    },
    {
      id: "snap-expedited", title: "SNAP expedited service",
      description: "Assess liquid resources, shelter costs, and the expedited-service clock.",
      programs: ["SNAP"], caseType: "Initial application", focus: ["Variable income", "Housing subsidy"],
      prompt: "Create a SNAP application for a Spanish-speaking applicant with very low current income, limited liquid resources, and shelter costs that may qualify for expedited service. Include interpreter needs and a seven-day processing objective.",
    },
    {
      id: "tanf-work", title: "TANF cash assistance",
      description: "Build the assistance unit and review resources and work participation.",
      programs: ["TANF"], caseType: "Initial application", focus: ["Recent job change", "Resource transfer"],
      prompt: "Create a TANF cash-assistance case for a parent and children. Include reduced earnings, a vehicle and checking account, work-participation facts, an absent-parent information issue, and an authorization outcome requiring final review.",
    },
  ];

  function createSimulationAuthoringState() {
    return {
      creationMethod: null,
      step: "method",
      setup: {
        title: "",
        simulationId: `SIM-${Date.now().toString(36).toUpperCase()}`,
        jurisdiction: "",
        programs: [],
        caseType: "Initial application",
        caseStage: "Interview",
        difficulty: "Intermediate",
        interviewChannel: "Phone",
        trainingObjective: "",
      },
      prompt: "",
      focusTags: [],
      generatedScenario: null,
      caseDraft: null,
      behavior: { profileId: "benefits-anxious", intensity: "moderate", voiceKey: "voice-warm-american-female" },
      expectedActions: [],
      trainingObjectives: [],
      completedSteps: new Set(),
      reviewWarnings: {},
      readinessErrors: [],
      openSections: {},
      mockEligibility: { status: "unrun", variant: null, lastRunAt: null },
      generationStatus: "idle",
      error: null,
      errorType: null,
      errorField: null,
      dirty: false,
      previewing: false,
      published: false,
      scenarioIndex: null,
    };
  }

  function restoreSimulationAuthoring() {
    let snapshot;
    try { snapshot = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { snapshot = null; }
    if (!snapshot) return createSimulationAuthoringState();
    const restored = createSimulationAuthoringState();
    restored.creationMethod = snapshot.creationMethod || "prompt";
    restored.step = snapshot.step || (snapshot.generatedScenario ? "intake" : "setup");
    restored.setup = { ...restored.setup, ...(snapshot.setup || {}) };
    restored.prompt = snapshot.prompt || "";
    restored.focusTags = snapshot.focusTags || [];
    restored.generatedScenario = snapshot.generatedScenario || null;
    restored.caseDraft = snapshot.caseDraft || null;
    restored.behavior = { ...restored.behavior, ...(snapshot.behavior || {}) };
    restored.expectedActions = snapshot.expectedActions || [];
    restored.trainingObjectives = snapshot.trainingObjectives || [];
    restored.completedSteps = new Set(snapshot.completedSteps || []);
    restored.generationStatus = restored.creationMethod === "prompt" && restored.generatedScenario ? "ready" : "idle";
    return restored;
  }

  function authoring() {
    if (!state.simulationAuthoring) state.simulationAuthoring = restoreSimulationAuthoring();
    return state.simulationAuthoring;
  }

  function ensureAuthorContactSequence(sim = authoring()) {
    if (!sim.generatedScenario || !sim.caseDraft) return null;
    const scenario = { ...sim.generatedScenario, integratedCase: sim.caseDraft };
    const defaults = createDefaultContactSequence(scenario, sim.behavior);
    const existing = sim.behavior.contactSequence;
    if (!existing?.contacts?.length) sim.behavior.contactSequence = defaults;
    else {
      const existingById = new Map(existing.contacts.map((contact) => [contact.contact_id, contact]));
      existing.contacts = defaults.contacts.map((contact) => ({ ...contact, ...(existingById.get(contact.contact_id) || {}) }));
      if (!existing.contacts.some((contact) => contact.contact_id === existing.intended_contact_id)) existing.intended_contact_id = existing.contacts[0]?.contact_id;
      if (!existing.contacts.some((contact) => contact.contact_id === existing.answering_contact_id)) existing.answering_contact_id = existing.contacts[0]?.contact_id;
      sim.behavior.contactSequence = { ...defaults, ...existing, contacts: existing.contacts };
    }
    const sequence = sim.behavior.contactSequence;
    if (sequence.mode === "direct") sequence.answering_contact_id = sequence.intended_contact_id;
    return sequence;
  }

  function authorContactLabel(contact) {
    return `${contact.name} · ${contact.role.replaceAll("_", " ")}`;
  }

  function authoringSteps(sim = authoring()) {
    if (sim.creationMethod === "prompt") return [["setup", "Prompt"], ...SHARED_STEPS];
    if (sim.creationMethod === "manual") return SHARED_STEPS;
    return [];
  }

  function stageIndex(id) {
    return authoringSteps().findIndex(([step]) => step === id);
  }

  function isCaseStage(id) {
    return workflow.some((item) => item.id === id);
  }

  function empty(value) {
    return value === "" || value === null || value === undefined || (Array.isArray(value) && !value.length);
  }

  function pathsMissing(draft, paths) {
    return paths.filter((path) => empty(BenefitConnectIntegrated.getPath(draft, path)));
  }

  function stageReviewWarning(step) {
    const sim = authoring();
    const draft = sim.caseDraft;
    if (!draft) return sim.creationMethod === "manual" ? "Start the application before reviewing this stage." : "Generate the synthetic case before reviewing this stage.";
    if (step === "intake") {
      if (!sim.setup.jurisdiction || !sim.setup.programs.length) return "Choose a jurisdiction and at least one requested program.";
      const missing = pathsMissing(draft, ["application.type", "application.receivedDate", "application.preferredLanguage", "application.contactMethod"]);
      if (missing.length) return `${missing.length} required intake ${missing.length === 1 ? "field needs" : "fields need"} author review.`;
    }
    if (step === "household") {
      const missing = pathsMissing(draft, ["people.0.name", "people.0.dateOfBirth", "people.0.relationship", "people.0.livesAtCaseAddress"]);
      if (missing.length) return `${missing.length} required household ${missing.length === 1 ? "field needs" : "fields need"} author review.`;
    }
    if (step === "programs") {
      if (!sim.setup.programs.length) return "Select at least one requested program in Intake.";
      if (draft.people.some((person) => sim.setup.programs.some((program) => !person.programParticipation?.[program]))) return "Complete program participation for every household member.";
      const programRequirements = {
        Medicaid: ["programUnits.medicaid.householdType", "programUnits.medicaid.pathwayScreen"],
        SNAP: ["programUnits.snap.foodUnit", "programUnits.snap.purchasePrepare"],
        TANF: ["programUnits.tanf.assistanceUnit", "programUnits.tanf.caretaker"],
      };
      if (sim.setup.programs.some((program) => pathsMissing(draft, programRequirements[program]).length)) return "Complete the required unit details for every requested program.";
    }
    if (step === "financial") {
      const missing = pathsMissing(draft, ["incomeStatus", "expenses.shelter.type", "expenses.shelter.amount", "expenses.shelter.frequency", "resourcesStatus"]);
      if (missing.length) return `${missing.length} required financial ${missing.length === 1 ? "field needs" : "fields need"} author review.`;
      if (draft.incomeStatus === "One or more" && (!draft.incomeSources.length || draft.incomeSources.some((row) => [row.person, row.category, row.type, row.grossAmount, row.frequency].some(empty)))) return "Complete each reported income source.";
      if (draft.resourcesStatus === "One or more" && (!draft.resources.length || draft.resources.some((row) => [row.owner, row.type, row.value].some(empty)))) return "Complete each reported resource.";
    }
    if (step === "nonfinancial") {
      const missing = pathsMissing(draft, ["nonfinancial.identityStatus", "nonfinancial.residency", "nonfinancial.citizenship", "nonfinancial.ssnStatus"]);
      if (missing.length) return `${missing.length} required non-financial ${missing.length === 1 ? "field needs" : "fields need"} author review.`;
    }
    if (step === "evidence") {
      if (!draft.evidence?.length) return "Add at least one evidence record.";
      if (draft.evidence.some((row) => [row.title, row.type, row.person, row.program, row.fact, row.status].some(empty))) return "Complete every evidence record.";
    }
    if (step === "eligibility") {
      if (sim.setup.programs.some((program) => !draft.authoredOutcomes?.final?.some((row) => row.program === program && [row.person, row.month, row.status, row.reason].every((value) => !empty(value))))) return "Add a complete illustrative outcome for every selected program.";
    }
    if (step === "notices") {
      const required = ["type", "effectiveDate", "delivery", "language", "appealRights"];
      if (sim.setup.programs.some((program) => required.some((key) => empty(draft.notices?.[program]?.[key])))) return "Complete a notice for every selected program.";
    }
    if (step === "authorization") {
      if (sim.setup.programs.some((program) => [draft.authorization?.[program]?.action, draft.authorization?.[program]?.effectiveDate].some(empty))) return "Complete an authorization action for every selected program.";
    }
    if (step === "behavior") {
      if (!sim.setup.difficulty || !sim.setup.interviewChannel || !sim.setup.trainingObjective.trim()) return "Complete difficulty, interview channel, and training objective.";
      if (!sim.behavior.profileId || !sim.behavior.intensity || !sim.behavior.voiceKey) return "Complete the applicant behavior and voice.";
      const sequence = ensureAuthorContactSequence(sim);
      const answering = sequence?.contacts.find((contact) => contact.contact_id === sequence.answering_contact_id);
      const intended = sequence?.contacts.find((contact) => contact.contact_id === sequence.intended_contact_id);
      if (!answering || !intended) return "Select valid answering and intended contacts.";
      if (sequence.mode === "screened" && answering.contact_id === intended.contact_id) return "A screened call requires different answering and intended contacts.";
      if (sequence.mode === "authorized_contact" && answering.contact_id === intended.contact_id) return "An authorized-contact call requires a separate answering representative and intended applicant.";
      if (sequence.mode === "authorized_contact" && answering.role !== "authorized_representative" && answering.disclosure_authority !== "authorized") return "Mark the answering contact as an authorized representative or give that contact authorized disclosure authority.";
      if (!answering.voice_key || !answering.greeting?.trim()) return "Configure the answering contact voice and greeting.";
      if (sequence.mode === "screened" && sequence.intended_contact_availability === "available_handoff" && !intended.voice_key) return "Configure the intended contact voice before allowing a handoff.";
      if (["temporarily_unavailable", "not_at_location", "declines_call"].includes(sequence.intended_contact_availability) && answering.message_authority === "none" && !sequence.callback_window?.trim()) return "Choose a message option or add an authored callback window for the unavailable-contact branch.";
      if (!sim.generatedScenario?.facts?.length || sim.generatedScenario.facts.some((fact) => [fact.label, fact.question, fact.caption].some(empty))) return "Add at least one complete disclosure-gated fact.";
      const callerBrief = buildDemoCallerBriefPreview(sim.generatedScenario, sim.caseDraft, sequence);
      if (!callerBrief.validation.valid) return callerBrief.validation.errors[0] || "Complete the demo caller brief.";
    }
    return "";
  }

  function readinessIssues() {
    return [...CASE_STEPS.map(([step, label]) => ({ step, label, message: stageReviewWarning(step) })), { step: "behavior", label: "AI behavior", message: stageReviewWarning("behavior") }].filter((item) => item.message);
  }

  function simulationStepStatus(id) {
    const sim = authoring();
    if (id === sim.step) return "active";
    const warning = id === "setup" ? "" : stageReviewWarning(id);
    if (!warning && sim.completedSteps.has(id)) return "complete";
    if (warning || sim.reviewWarnings[id]) return "needs-review";
    return "available";
  }

  function renderSimulationStepper() {
    const sim = authoring();
    const steps = authoringSteps(sim);
    if (!steps.length) return "";
    return `<nav class="simulation-authoring-stepper" aria-label="Simulation authoring steps">${steps.map(([id, label], index) => {
      const status = simulationStepStatus(id);
      const disabled = sim.generationStatus === "loading" || (sim.creationMethod === "prompt" && id !== "setup" && !sim.generatedScenario);
      return `<button type="button" class="${status}" data-sim-step="${id}" ${disabled ? "disabled" : ""} aria-current="${status === "active" ? "step" : "false"}"><span>${status === "complete" ? materialIcon("check") : index + 1}</span><strong>${escapeHTML(label)}</strong></button>`;
    }).join("")}</nav>`;
  }

  function renderMethodChooser() {
    return `<section class="simulation-method-choice"><div><span class="page-kicker">Choose a creation method</span><h3>How would you like to create this simulation?</h3><p>Both paths use the same eligibility application and learner preview.</p></div><div class="simulation-method-grid"><button type="button" data-sim-method="prompt"><span>${materialIcon("auto_awesome")}</span><strong>Start with a prompt</strong><p>Choose a scenario pattern, refine the prompt, and let AI create a synthetic application for review.</p><em>Scenario patterns + AI generation ${materialIcon("arrow_forward")}</em></button><button type="button" data-sim-method="manual"><span>${materialIcon("edit_document")}</span><strong>Build it yourself</strong><p>Open a blank synthetic application and manually complete every eligibility stage.</p><em>Full application authoring ${materialIcon("arrow_forward")}</em></button></div></section>`;
  }

  function renderMethodIndicator() {
    const sim = authoring();
    if (!sim.creationMethod) return "";
    const prompt = sim.creationMethod === "prompt";
    return `<div class="simulation-method-strip"><span>${materialIcon(prompt ? "auto_awesome" : "edit_document")}</span><div><small>Creation method</small><strong>${prompt ? "Start with a prompt" : "Build it yourself"}</strong></div><button type="button" data-sim-change-method>Change method</button></div>`;
  }

  function renderProgramPicker(attribute, selected) {
    return `<fieldset class="simulation-program-picker"><legend>Programs <b>Choose one or more</b></legend><div>${PROGRAMS.map((program) => `<label><input type="checkbox" ${attribute}="${program}" ${selected.includes(program) ? "checked" : ""}/><span>${program}</span></label>`).join("")}</div></fieldset>`;
  }

  function renderSimulationSetup() {
    const sim = authoring();
    const setup = sim.setup;
    return `<div class="simulation-setup-wrap"><section class="simulation-setup-card"><div class="simulation-section-title"><div><span class="page-kicker">Prompt context</span><h3>Set the case direction</h3><p>Give AI only the context it needs; every generated application field remains editable.</p></div><span class="simulation-synthetic-badge">Synthetic data only</span></div><div class="simulation-setup-grid compact"><label>Simulation title <small>Optional</small><input data-sim-setup="title" value="${escapeHTML(setup.title)}" placeholder="AI will suggest one if left blank" /></label><label>State / jurisdiction <b>Required</b><select data-sim-setup="jurisdiction"><option value="">Select a state</option>${JURISDICTIONS.map((value) => `<option ${setup.jurisdiction === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>${renderProgramPicker("data-sim-program", setup.programs)}<label>Case type<select data-sim-setup="caseType">${["Initial application", "Reported change", "Renewal"].map((value) => `<option ${setup.caseType === value ? "selected" : ""}>${value}</option>`).join("")}</select></label></div></section><section class="simulation-prompt-section"><div class="simulation-section-title"><div><span class="page-kicker">Scenario patterns</span><h3>Start with a proven case pattern</h3><p>Selecting a pattern prefills the context and editable prompt. It will not generate automatically.</p></div></div><div class="simulation-prompt-ideas">${PROMPT_IDEAS.map((idea) => `<button type="button" data-sim-idea="${idea.id}"><span>${materialIcon(idea.programs.length > 1 ? "account_tree" : idea.programs[0] === "SNAP" ? "bolt" : idea.programs[0] === "TANF" ? "family_restroom" : "health_and_safety")}</span><strong>${escapeHTML(idea.title)}</strong><p>${escapeHTML(idea.description)}</p><small>${idea.programs.join(" · ")}</small></button>`).join("")}</div></section><section class="simulation-prompt-card"><div class="simulation-section-title"><div><span class="page-kicker">Create from prompt</span><h3>Describe the case you want to create</h3><p>Include the household, income, expenses, resources, evidence, and special circumstances.</p></div></div><div class="simulation-focus-label">Optional scenario focus</div><div class="simulation-focus-chips">${FOCUS_OPTIONS.map((focus) => `<button type="button" class="${sim.focusTags.includes(focus) ? "selected" : ""}" data-sim-focus="${escapeHTML(focus)}" aria-pressed="${sim.focusTags.includes(focus)}">${escapeHTML(focus)}</button>`).join("")}</div><label class="simulation-prompt-input"><span>Case description</span><textarea id="simulationPrompt" maxlength="3000" rows="8" placeholder="Describe a synthetic eligibility case…">${escapeHTML(sim.prompt)}</textarea><small><span>Do not enter real names, SSNs, or other PII.</span><span id="simulationPromptCount">${sim.prompt.length} / 3,000</span></small></label><aside class="simulation-ai-summary"><strong>AI creates a complete synthetic draft</strong><div>${["Applicant and household records", "Income, expenses, and resources", "Evidence and discrepancies", "Illustrative program outcomes", "Applicant behavior suggestion"].map((item) => `<span>${materialIcon("check")} ${item}</span>`).join("")}</div><p>Review and edit the application before previewing or publishing.</p></aside></section></div>`;
  }

  function renderManualIntakeSetup() {
    const sim = authoring();
    const setup = sim.setup;
    return `<section class="simulation-manual-intake"><div class="simulation-section-title"><div><span class="page-kicker">Simulation and program request</span><h3>Case details</h3><p>Choose the requested programs here. Their application sections appear throughout the workflow.</p></div><span class="simulation-synthetic-badge">Author-built</span></div><div class="simulation-setup-grid"><label>Simulation title <small>Optional</small><input data-sim-manual-setup="title" value="${escapeHTML(setup.title)}" placeholder="Untitled simulation" /></label><label>Simulation ID <small>Generated</small><input value="${escapeHTML(setup.simulationId)}" readonly /></label><label>State / jurisdiction <b>Required</b><select data-sim-manual-setup="jurisdiction"><option value="">Select a state</option>${JURISDICTIONS.map((value) => `<option ${setup.jurisdiction === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Case type<select data-sim-manual-setup="caseType">${["Initial application", "Reported change", "Renewal"].map((value) => `<option ${setup.caseType === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>${renderProgramPicker("data-sim-manual-program", setup.programs)}</div></section>`;
  }

  function authorTargetMarkup(targetId, label, helper = "") {
    return `<div class="simulation-training-target"><span>${materialIcon("target")}</span><div><strong>${escapeHTML(label)}</strong><small>${escapeHTML(helper || "Learner action evaluated in this stage")}</small></div><em>${escapeHTML(targetId)}</em></div>`;
  }

  function renderEvidenceSupplement() {
    const sim = authoring();
    const evidence = sim.caseDraft.evidence || [];
    return `<section class="simulation-author-supplement"><div class="panel-title"><div><span>Author controls</span><h3>Evidence records</h3></div><button type="button" class="button button-secondary" data-sim-repeat-add="evidence">${materialIcon("add")} Add evidence</button></div>${evidence.length ? `<div class="simulation-record-editor">${evidence.map((record, index) => `<article><label>Title<input data-sim-record="evidence.${index}.title" value="${escapeHTML(record.title)}" /></label><label>Type<input data-sim-record="evidence.${index}.type" value="${escapeHTML(record.type)}" /></label><label>Person<input data-sim-record="evidence.${index}.person" value="${escapeHTML(record.person)}" /></label><label>Program<input data-sim-record="evidence.${index}.program" value="${escapeHTML(record.program)}" /></label><label class="wide">Fact supported<input data-sim-record="evidence.${index}.fact" value="${escapeHTML(record.fact)}" /></label><label>Received date<input type="date" data-sim-record="evidence.${index}.receivedDate" value="${escapeHTML(record.receivedDate)}" /></label><label>Status<input data-sim-record="evidence.${index}.status" value="${escapeHTML(record.status)}" /></label><label class="wide">Discrepancy<input data-sim-record="evidence.${index}.discrepancy" value="${escapeHTML(record.discrepancy)}" /></label><button type="button" data-sim-repeat-remove="evidence" data-index="${index}" aria-label="Remove ${escapeHTML(record.title)}">${materialIcon("delete")}</button></article>`).join("")}</div>` : `<div class="simulation-author-empty">${materialIcon("description")}<strong>No evidence records yet</strong><p>Add every document or data match the learner should review.</p></div>`}</section>`;
  }

  function renderOutcomeSupplement() {
    const sim = authoring();
    const outcomes = sim.caseDraft.authoredOutcomes?.final || [];
    return `<section class="simulation-author-supplement"><div class="panel-title"><div><span>Author controls</span><h3>Illustrative outcomes</h3></div><button type="button" class="button button-secondary" data-sim-repeat-add="outcomes" ${sim.setup.programs.length ? "" : "disabled"}>${materialIcon("add")} Add outcome</button></div>${outcomes.length ? `<div class="simulation-record-editor outcomes">${outcomes.map((record, index) => `<article><label>Program<select data-sim-record="authoredOutcomes.final.${index}.program">${sim.setup.programs.map((program) => `<option ${record.program === program ? "selected" : ""}>${program}</option>`).join("")}</select></label><label>Person<input data-sim-record="authoredOutcomes.final.${index}.person" value="${escapeHTML(record.person)}" /></label><label>Month<input data-sim-record="authoredOutcomes.final.${index}.month" value="${escapeHTML(record.month)}" placeholder="Aug 2026" /></label><label>Status<input data-sim-record="authoredOutcomes.final.${index}.status" value="${escapeHTML(record.status)}" /></label><label>Benefit<input data-sim-record="authoredOutcomes.final.${index}.benefit" value="${escapeHTML(record.benefit)}" /></label><label class="wide">Reason<input data-sim-record="authoredOutcomes.final.${index}.reason" value="${escapeHTML(record.reason)}" /></label><button type="button" data-sim-repeat-remove="outcomes" data-index="${index}" aria-label="Remove ${escapeHTML(record.program)} outcome">${materialIcon("delete")}</button></article>`).join("")}</div>` : `<div class="simulation-author-empty">${materialIcon("rule")}<strong>No illustrative outcomes yet</strong><p>Add one authored training outcome for each requested program.</p></div>`}<div class="simulation-boundary-note">${materialIcon("info")} Outcomes are training fixtures, not official eligibility determinations.</div></section>`;
  }

  function renderHouseholdSupplement() {
    const sim = authoring();
    return `<section class="simulation-author-supplement"><div class="panel-title"><div><span>Author controls</span><h3>Household identity records</h3></div></div><div class="simulation-record-editor household">${sim.caseDraft.people.map((person, index) => `<article><label>Synthetic name<input data-sim-record="people.${index}.name" value="${escapeHTML(person.name)}" /></label><label>Date of birth<input type="date" data-sim-record="people.${index}.dateOfBirth" value="${escapeHTML(person.dateOfBirth)}" /></label><label>Relationship<input data-sim-record="people.${index}.relationship" value="${escapeHTML(person.relationship)}" /></label><label>Person ID<input value="${escapeHTML(person.personId)}" readonly /></label></article>`).join("")}</div></section>`;
  }

  function renderNonfinancialSupplement() {
    const residency = authoring().caseDraft.nonfinancial.residency;
    return `<section class="simulation-author-supplement"><div class="panel-title"><div><span>Author controls</span><h3>Residency record</h3></div></div><div class="simulation-expense-status"><label>State residency<select data-sim-record="nonfinancial.residency">${["", "Resident", "Nonresident", "Temporary absence", "Pending"].map((value) => `<option value="${value}" ${residency === value ? "selected" : ""}>${value || "Select"}</option>`).join("")}</select></label></div></section>`;
  }

  function expenseEditor(title, key, fields) {
    const records = authoring().caseDraft.expenses[key] || [];
    return `<article class="simulation-expense-group"><header><div><strong>${escapeHTML(title)}</strong><small>${records.length} ${records.length === 1 ? "record" : "records"}</small></div><button type="button" data-sim-expense-add="${key}">${materialIcon("add")} Add</button></header>${records.map((record, index) => `<div class="simulation-expense-row">${fields.map(([field, label]) => `<label>${escapeHTML(label)}<input data-sim-record="expenses.${key}.${index}.${field}" value="${escapeHTML(record[field])}" /></label>`).join("")}<button type="button" data-sim-expense-remove="${key}" data-index="${index}" aria-label="Remove ${escapeHTML(title)} record">${materialIcon("delete")}</button></div>`).join("")}</article>`;
  }

  function renderFinancialSupplement() {
    const draft = authoring().caseDraft;
    return `<section class="simulation-author-supplement simulation-expense-editor"><div class="panel-title"><div><span>Author controls</span><h3>Financial record status and repeatable expenses</h3></div></div><div class="simulation-expense-status"><label>Income status<select data-sim-record="incomeStatus">${["", "None", "One or more"].map((value) => `<option value="${value}" ${draft.incomeStatus === value ? "selected" : ""}>${value || "Select"}</option>`).join("")}</select></label><label>Resources status<select data-sim-record="resourcesStatus">${["", "None", "One or more"].map((value) => `<option value="${value}" ${draft.resourcesStatus === value ? "selected" : ""}>${value || "Select"}</option>`).join("")}</select></label><label>Utilities status<select data-sim-record="expenses.utilitiesStatus">${["", "None", "One or more"].map((value) => `<option value="${value}" ${draft.expenses.utilitiesStatus === value ? "selected" : ""}>${value || "Select"}</option>`).join("")}</select></label><label>Dependent-care status<select data-sim-record="expenses.dependentCareStatus">${["", "None", "One or more"].map((value) => `<option value="${value}" ${draft.expenses.dependentCareStatus === value ? "selected" : ""}>${value || "Select"}</option>`).join("")}</select></label><label>Medical-expense status<select data-sim-record="expenses.medicalStatus">${["", "None", "One or more"].map((value) => `<option value="${value}" ${draft.expenses.medicalStatus === value ? "selected" : ""}>${value || "Select"}</option>`).join("")}</select></label></div>${expenseEditor("Utilities", "utilities", [["type", "Type"], ["arrangement", "Arrangement"], ["amount", "Amount"], ["frequency", "Frequency"]])}${expenseEditor("Dependent care", "dependentCare", [["person", "Person"], ["reason", "Reason"], ["provider", "Synthetic provider"], ["amount", "Amount"]])}${expenseEditor("Medical expenses", "medical", [["person", "Person"], ["type", "Type"], ["amount", "Amount"], ["frequency", "Frequency"]])}</section>`;
  }

  function renderSimulationCaseStage(stage) {
    const sim = authoring();
    const stageLabel = workflow.find((item) => item.id === stage)?.label || stage;
    const stageMarkup = BenefitConnectIntegrated.renderStage({
      stage, scenario: sim.generatedScenario, draft: sim.caseDraft, mockEligibility: sim.mockEligibility,
      closure: { discrepancies: true, factsConfirmed: true, nextSteps: true, closingSummary: true },
      callEnded: true, openSections: sim.openSections[stage] || null, mapped: authorTargetMarkup, authorMode: true,
    });
    const beforeStage = stage === "intake" && sim.creationMethod === "manual" ? renderManualIntakeSetup() : "";
    const afterStage = [
      stage === "household" ? renderHouseholdSupplement() : "",
      stage === "financial" ? renderFinancialSupplement() : "",
      stage === "nonfinancial" ? renderNonfinancialSupplement() : "",
      stage === "evidence" ? renderEvidenceSupplement() : "",
      stage === "eligibility" ? renderOutcomeSupplement() : "",
    ].join("");
    const warning = stageReviewWarning(stage);
    return `<section class="simulation-stage-review"><header><div><span class="page-kicker">${sim.creationMethod === "manual" ? "Author-built application" : "Generated case review"}</span><h3>${escapeHTML(stageLabel)}</h3><p>${sim.creationMethod === "manual" ? "Complete the synthetic application in the same structure the learner will use." : "Edit the synthetic case in the same structure the learner will use."}</p></div><span class="simulation-review-state ${warning ? "warning" : "complete"}">${warning ? materialIcon("warning") + " Needs review" : materialIcon("check_circle") + " Complete"}</span></header>${beforeStage}<div class="simulation-stage-screen">${stageMarkup}</div>${afterStage}</section>`;
  }

  function renderCallerBriefReadOnlyPreview(scenario, draft, sequence) {
    const preview = buildDemoCallerBriefPreview(scenario, draft, sequence);
    const brief = preview.caller_brief;
    return `<section class="simulation-caller-brief"><div class="panel-title"><div><span>Exact Hume context</span><h3>Demo caller brief</h3></div><span class="status-chip ${preview.validation.valid ? "" : "warning"}">${preview.validation.valid ? "Validated" : "Needs review"}</span></div><p class="simulation-caller-summary">${escapeHTML(brief.summary)}</p><div class="simulation-caller-brief-stats"><article><span>Serialized size</span><strong>${preview.validation.size_bytes.toLocaleString()} B</strong><small>8,192 B maximum</small></article><article><span>Included facts</span><strong>${preview.validation.fact_count}</strong><small>Submitted values</small></article><article><span>Gated facts</span><strong>${preview.validation.gated_fact_count}</strong><small>Tool-authorized</small></article><article><span>Excluded</span><strong>${preview.validation.excluded_sections.length}</strong><small>Worker-only sections</small></article></div><details class="simulation-caller-brief-detail"><summary>Review exact submitted facts</summary><div>${brief.facts.map((fact) => `<article><span>${escapeHTML(fact.topic)}</span><strong>${escapeHTML(fact.value)}</strong><code>${escapeHTML(fact.case_path)}</code></article>`).join("")}</div></details><div class="simulation-caller-brief-exclusions"><strong>Never sent to Hume</strong><span>${preview.validation.excluded_sections.map((item) => escapeHTML(item)).join(" · ")}</span></div>${preview.validation.errors.length ? `<ul class="simulation-caller-brief-errors">${preview.validation.errors.map((error) => `<li>${escapeHTML(error)}</li>`).join("")}</ul>` : ""}</section>`;
  }

  function renderCallerBriefPreview(scenario, draft, sequence) {
    const pathOptions = [
      ["people", "Household and relationships"], ["incomeSources", "Employment and income"], ["expenses", "Shelter and expenses"], ["resources", "Accounts and vehicles"],
      ["nonfinancial.pregnancyStatus", "Pregnancy"], ["nonfinancial.disabilityClaimed", "Disability"], ["nonfinancial.healthCoverage", "Health coverage"], ["nonfinancial.workParticipation", "TANF participation"],
      ["application", "Application and contact facts"],
    ];
    const mappings = `<section class="simulation-caller-corrections"><div class="panel-title"><div><span>Deterministic correction sources</span><h3>Gated fact mappings</h3></div></div><p>Each correction or dispute must point to the submitted application value it changes.</p><div>${(scenario.facts || []).map((fact, index) => { const inferred = fact.case_path || ({ household: "people", income: "incomeSources", pregnancy: "nonfinancial.pregnancyStatus", expenses: "expenses" })[fact.id] || ""; return `<label><span>${escapeHTML(fact.label || `Fact ${index + 1}`)}</span><select data-sim-fact="${index}.case_path"><option value="">Select submitted case fact</option>${pathOptions.map(([value, label]) => `<option value="${value}" ${inferred === value ? "selected" : ""}>${escapeHTML(label)}</option>`).join("")}</select><code>${escapeHTML(inferred || "No case path selected")}</code></label>`; }).join("")}</div></section>`;
    return renderCallerBriefReadOnlyPreview(scenario, draft, sequence) + mappings;
  }

  function renderSimulationBehavior() {
    const sim = authoring();
    const scenario = sim.generatedScenario;
    const sequence = ensureAuthorContactSequence(sim);
    const contactCards = sequence.contacts.map((contact, index) => `<article class="simulation-contact-card"><header><span class="profile-avatar">${escapeHTML(contact.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</span><div><small>${escapeHTML(contact.role.replaceAll("_", " "))}</small><strong>${escapeHTML(contact.name)}</strong><span>${escapeHTML(contact.relationship || "Contact")}</span></div></header><div class="simulation-behavior-grid"><label>Voice<select data-sim-contact="${index}.voice_key">${callerVoices.map((voice) => `<option value="${voice.voice_key}" ${contact.voice_key === voice.voice_key ? "selected" : ""}>${escapeHTML(voice.label)} · ${escapeHTML(voice.presentation)}</option>`).join("")}</select></label><label>Disposition<select data-sim-contact="${index}.profile_id">${callerProfiles.map((profile) => `<option value="${profile.profile_id}" ${contact.profile_id === profile.profile_id ? "selected" : ""}>${escapeHTML(profile.label)}</option>`).join("")}</select></label><label>Intensity<select data-sim-contact="${index}.intensity">${Object.keys(callerIntensity).map((key) => `<option value="${key}" ${contact.intensity === key ? "selected" : ""}>${escapeHTML(callerIntensity[key].label)}</option>`).join("")}</select></label><label>Greeting mode<select data-sim-contact="${index}.greeting_mode">${[["neutral","Neutral"],["name_only","Name only"],["callback_aware","Callback aware"],["alternate_answerer","Alternate answerer"]].map(([value,label]) => `<option value="${value}" ${contact.greeting_mode === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="wide">Greeting<input data-sim-contact="${index}.greeting" value="${escapeHTML(contact.greeting || "Hello?")}" /></label><label>Knowledge scope<select data-sim-contact="${index}.knowledge_scope">${[["full_application","Full application"],["authorized_application","Authorized application"],["self_and_contact","Self and contact only"],["message_only","Message only"]].map(([value,label]) => `<option value="${value}" ${contact.knowledge_scope === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label>Disclosure<select data-sim-contact="${index}.disclosure_authority">${[["full","Full"],["authorized","Authorized"],["limited","Limited"],["none","None"]].map(([value,label]) => `<option value="${value}" ${contact.disclosure_authority === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label>Message authority<select data-sim-contact="${index}.message_authority">${[["full","Full"],["limited","Limited callback only"],["none","Declines message"]].map(([value,label]) => `<option value="${value}" ${contact.message_authority === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label>Language<input data-sim-contact="${index}.preferred_language" value="${escapeHTML(contact.preferred_language || "English")}" /></label></div></article>`).join("");
    return `<div class="simulation-behavior-layout"><section class="simulation-behavior-card"><div class="simulation-section-title"><div><span class="page-kicker">Training configuration</span><h3>AI behavior</h3><p>Define the learner objective and each caller's authored starting state. Hume adapts naturally after the call begins.</p></div></div><div class="simulation-behavior-grid"><label>Difficulty<select data-sim-setup="difficulty">${["Foundational", "Intermediate", "Advanced"].map((value) => `<option ${sim.setup.difficulty === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Interview channel<select data-sim-setup="interviewChannel">${["Phone", "Video", "In person", "Portal follow-up"].map((value) => `<option ${sim.setup.interviewChannel === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="wide">Training objective<input data-sim-setup="trainingObjective" value="${escapeHTML(sim.setup.trainingObjective)}" placeholder="What should the learner practice?" /></label></div></section><section class="simulation-participant-editor"><div class="panel-title"><div><span>Sequential speakers</span><h3>Call participants</h3></div><span class="status-chip">${sequence.contacts.length} configured</span></div><div class="simulation-behavior-grid"><label>Call path<select data-sim-contact-sequence="mode">${[["direct","Applicant answers"],["screened","Another person answers first"],["authorized_contact","Authorized contact continues"]].map(([value,label]) => `<option value="${value}" ${sequence.mode === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label>Intended contact<select data-sim-contact-sequence="intended_contact_id">${sequence.contacts.map((contact) => `<option value="${escapeHTML(contact.contact_id)}" ${sequence.intended_contact_id === contact.contact_id ? "selected" : ""}>${escapeHTML(authorContactLabel(contact))}</option>`).join("")}</select></label><label>Answers first<select data-sim-contact-sequence="answering_contact_id" ${sequence.mode === "direct" ? "disabled" : ""}>${sequence.contacts.map((contact) => `<option value="${escapeHTML(contact.contact_id)}" ${sequence.answering_contact_id === contact.contact_id ? "selected" : ""}>${escapeHTML(authorContactLabel(contact))}</option>`).join("")}</select></label><label>Intended-contact availability<select data-sim-contact-sequence="intended_contact_availability">${[["available_handoff","Available and accepts handoff"],["temporarily_unavailable","Temporarily unavailable"],["not_at_location","Not at this location"],["declines_call","Declines the call"],["answerer_authorized","Answerer is authorized to continue"]].map(([value,label]) => `<option value="${value}" ${sequence.intended_contact_availability === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="wide">Authored callback window<input data-sim-contact-sequence="callback_window" value="${escapeHTML(sequence.callback_window || "")}" placeholder="For example, weekdays after 3 PM" /></label></div><div class="simulation-contact-flow-preview"><strong>Preview</strong><span>${escapeHTML(sequence.contacts.find((contact) => contact.contact_id === sequence.answering_contact_id)?.name || "Answering contact")}</span>${sequence.answering_contact_id !== sequence.intended_contact_id ? `${materialIcon("arrow_forward")}<span>${escapeHTML(sequence.contacts.find((contact) => contact.contact_id === sequence.intended_contact_id)?.name || "Intended contact")}</span>` : ""}</div><div class="simulation-contact-list">${contactCards}</div></section><section class="simulation-fact-editor"><div class="panel-title"><div><span>Disclosure gates</span><h3>Interview facts</h3></div><button type="button" class="button button-secondary" data-sim-fact-add>${materialIcon("add")} Add fact</button></div>${scenario.facts.length ? scenario.facts.map((fact, index) => `<article><span>${index + 1}</span><div><label>Topic<input data-sim-fact="${index}.label" value="${escapeHTML(fact.label)}" /></label><label>Appropriate learner question<input data-sim-fact="${index}.question" value="${escapeHTML(fact.question)}" /></label><label>Authorized applicant response<textarea data-sim-fact="${index}.caption" rows="2">${escapeHTML(fact.caption)}</textarea></label></div><button type="button" data-sim-fact-remove="${index}" aria-label="Remove fact">${materialIcon("delete")}</button></article>`).join("") : `<div class="simulation-author-empty">${materialIcon("forum")}<strong>No disclosure facts yet</strong><p>Add facts the applicant may reveal after an appropriate learner question.</p></div>`}</section><aside class="simulation-boundary-card">${materialIcon("shield")}<div><strong>Deterministic disclosure boundary</strong><p>Only the active caller speaks. Knowledge, handoffs, case facts, and callback-message permissions are authorized by the server.</p></div></aside></div>`;
  }

  function renderSimulationPreview() {
    const sim = authoring();
    const scenario = sim.generatedScenario;
    const issues = readinessIssues();
    return `<div class="simulation-preview-layout"><section class="simulation-preview-hero"><span class="simulation-preview-icon">${materialIcon("play_circle")}</span><div><span class="page-kicker">Learner preview</span><h3>${escapeHTML(scenario.title)}</h3><p>${escapeHTML(scenario.description)}</p><div class="program-tags">${scenario.programs.map((program) => `<span>${escapeHTML(program)}</span>`).join("")}</div></div></section><section class="simulation-readiness"><div class="panel-title"><div><span>Completion summary</span><h3>${issues.length ? "Complete the application before previewing" : "Ready to test"}</h3></div><strong>${10 - issues.length} of 10 stages complete</strong></div><div class="simulation-readiness-grid">${[...CASE_STEPS, ["behavior", "AI behavior"]].map(([id, label]) => { const warning = stageReviewWarning(id); return `<button type="button" data-sim-step="${id}" class="${warning ? "warning" : "complete"}">${materialIcon(warning ? "error" : "check_circle")}<span><strong>${escapeHTML(label)}</strong><small>${warning ? escapeHTML(warning) : "Complete"}</small></span></button>`; }).join("")}</div></section><section class="simulation-preview-details"><article><span>Jurisdiction</span><strong>${escapeHTML(sim.setup.jurisdiction || "Not set")}</strong></article><article><span>Case type</span><strong>${escapeHTML(sim.setup.caseType)}</strong></article><article><span>Difficulty</span><strong>${escapeHTML(sim.setup.difficulty)}</strong></article><article><span>Applicant</span><strong>${escapeHTML(scenario.persona.name)}</strong></article><article><span>Caller behavior</span><strong>${escapeHTML(callerProfiles.find((item) => item.profile_id === sim.behavior.profileId)?.label || "Configured")}</strong></article><article><span>Sources</span><strong>None · ${sim.creationMethod === "manual" ? "Author-built" : "AI-generated"}</strong></article></section><div class="simulation-preview-actions"><button type="button" class="button button-secondary" data-sim-action="save">Save draft</button><button type="button" class="button button-secondary" data-sim-action="preview">${materialIcon("play_arrow")} Preview simulation</button><button type="button" class="button button-primary" data-sim-action="publish">Publish simulation</button></div><div class="simulation-boundary-note">${materialIcon("info")} Preview uses the real learner screens. Publishing freezes the current synthetic case as a training package.</div></div>`;
  }

  function renderSimulationError() {
    const sim = authoring();
    if (!sim.error) return "";
    const title = sim.errorType === "readiness" ? "Complete the application before previewing" : sim.errorType === "validation" ? "Complete the required case details" : "Case generation failed";
    const list = sim.errorType === "readiness" && sim.readinessErrors.length ? `<ul>${sim.readinessErrors.map((item) => `<li><button type="button" data-sim-step="${item.step}"><strong>${escapeHTML(item.label)}:</strong> ${escapeHTML(item.message)}</button></li>`).join("")}</ul>` : "";
    const retry = sim.errorType === "generation" ? `<button type="button" data-sim-action="generate">Retry generation</button>` : "";
    return `<div class="simulation-error ${sim.errorType === "readiness" ? "readiness" : ""}" role="alert">${materialIcon("error")}<div><strong>${title}</strong><p>${escapeHTML(sim.error)}</p>${list}</div>${retry}</div>`;
  }

  function renderSimulationReviewMessage() {
    const sim = authoring();
    const message = sim.reviewWarnings[sim.step];
    const callerBrief = sim.step === "behavior" && sim.generatedScenario && sim.caseDraft ? renderCallerBriefPreview(sim.generatedScenario, sim.caseDraft, ensureAuthorContactSequence(sim)) : "";
    if (!message || sim.error) return callerBrief;
    return `${callerBrief}<div class="simulation-review-warning" role="status">${materialIcon("warning")}<div><strong>Stage saved with items to review</strong><p>${escapeHTML(message)} You can continue and return before previewing.</p></div></div>`;
  }

  function renderSimulationFooter() {
    const sim = authoring();
    const steps = authoringSteps(sim);
    const index = stageIndex(sim.step);
    const loading = sim.generationStatus === "loading";
    const isSetup = sim.step === "setup";
    const isPreview = sim.step === "preview";
    const primaryLabel = isSetup ? (loading ? "Generating synthetic case…" : sim.generatedScenario ? "Regenerate case" : "Generate case") : sim.step === "behavior" ? "Save & review preview" : isPreview || sim.step === "method" ? "" : "Save & continue";
    const status = loading ? "AI generation can take a moment" : sim.dirty ? "Unsaved changes" : sim.generatedScenario ? "Draft saved locally" : sim.creationMethod ? "No application generated yet" : "Choose a creation method to begin";
    return `<footer class="simulation-authoring-footer"><button type="button" class="simulation-discard" data-sim-action="discard" ${loading ? "disabled" : ""}>${sim.creationMethod ? "Discard" : "Cancel"}</button><div><span>${status}</span>${index > 0 ? `<button type="button" class="button button-secondary" data-sim-action="back" ${loading ? "disabled" : ""}>Back</button>` : ""}${sim.generatedScenario && !isPreview ? `<button type="button" class="button button-secondary" data-sim-action="save" ${loading ? "disabled" : ""}>Save draft</button>` : ""}${primaryLabel ? `<button type="button" class="button button-primary" data-sim-action="${isSetup ? "generate" : "next"}" ${loading ? "disabled" : ""}>${isSetup && !loading ? materialIcon("auto_awesome") : ""}${primaryLabel}</button>` : ""}</div></footer>`;
  }

  window.renderSimulationAuthoring = function renderSimulationAuthoring() {
    const sim = authoring();
    let body = renderMethodChooser();
    if (sim.creationMethod === "prompt" && sim.step === "setup") body = renderSimulationSetup();
    if (isCaseStage(sim.step) && sim.caseDraft) body = renderSimulationCaseStage(sim.step);
    if (sim.step === "behavior" && sim.generatedScenario) body = renderSimulationBehavior();
    if (sim.step === "preview" && sim.generatedScenario) body = renderSimulationPreview();
    const provenance = sim.creationMethod ? `<span class="simulation-authoring-label">${sim.creationMethod === "manual" ? "Author-built · synthetic training data" : sim.generatedScenario ? "AI-generated · author review required" : "Prompt-assisted · synthetic training data"}</span>` : "";
    return `<div class="product-page simulation-authoring-page"><header class="simulation-authoring-header"><div><button type="button" class="simulation-mobile-menu" data-sim-open-nav aria-label="Open navigation">${materialIcon("menu")}</button><button type="button" data-view-link="scenario-library">Training</button><span>/</span><button type="button" data-view-link="scenario-library">Simulations</button><span>/</span><strong>Create new</strong><h2>Create simulation</h2></div>${provenance}</header>${renderSimulationStepper()}<main class="simulation-authoring-body">${renderMethodIndicator()}${body}</main>${renderSimulationError()}${renderSimulationReviewMessage()}${renderSimulationFooter()}</div>`;
  };

  function validateSimulationSetup() {
    const sim = authoring();
    if (!sim.setup.jurisdiction) return { message: "Select a state or jurisdiction.", selector: '[data-sim-setup="jurisdiction"]' };
    if (!sim.setup.programs.length) return { message: "Choose at least one program.", selector: '[data-sim-program="Medicaid"]' };
    if (sim.prompt.trim().length < 30) return { message: "Describe the case in at least 30 characters.", selector: "#simulationPrompt" };
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(sim.prompt)) return { message: "Remove Social Security numbers or other real identifying information.", selector: "#simulationPrompt" };
    return null;
  }

  function createManualScenario(sim) {
    const scenario = {
      id: sim.setup.simulationId,
      number: String(scenarios.length + 1).padStart(2, "0"),
      title: sim.setup.title.trim() || "Untitled simulation",
      shortTitle: sim.setup.title.trim() || "Untitled simulation",
      type: sim.setup.caseType,
      programs: [],
      caseId: `CASE-${sim.setup.simulationId}`,
      persona: { name: "Synthetic Applicant", initials: "SA", description: "Synthetic applicant" },
      description: "Author-built synthetic eligibility training case.",
      expected: { relationship: "Self", income: "" },
      facts: [],
      opening: "",
      completed: [],
      coachPolicyPack: stateNeutralCoachPolicyPack,
      coachActionGraphVersion: "grounded-coach-v1",
      authoring: { jurisdiction: "", caseStage: "Interview", difficulty: sim.setup.difficulty, interviewChannel: sim.setup.interviewChannel, trainingObjective: "", focusTags: [], generatedByAI: false, creationMethod: "manual", sourceIds: [] },
    };
    scenario.integratedCase = BenefitConnectIntegrated.createBlankCase(scenario);
    scenario.authoredOutcomeVariants = scenario.integratedCase.authoredOutcomes;
    return scenario;
  }

  function createDraftRecord(sim) {
    state.creationDrafts.simulation = {
      creation_id: `creation:simulation-${Date.now()}`,
      simulation_draft_id: `draft:${sim.setup.simulationId.toLowerCase()}`,
      type: "simulation", title: sim.generatedScenario?.title || "Untitled simulation", status: "draft",
      source_ids: [], specification_note_ids: [], screens: workflow.map((item) => item.id),
      creation_method: sim.creationMethod, provenance: sim.creationMethod === "manual" ? "Author-built · synthetic training data" : "AI-generated · author review required",
      generated_scenario: sim.generatedScenario, case_data: sim.caseDraft, coach_policy_pack: sim.generatedScenario?.coachPolicyPack || stateNeutralCoachPolicyPack,
    };
  }

  function selectCreationMethod(method) {
    const sim = authoring();
    sim.creationMethod = method;
    sim.error = null;
    sim.errorType = null;
    if (method === "prompt") {
      sim.step = "setup";
    } else {
      sim.generatedScenario = createManualScenario(sim);
      sim.caseDraft = BenefitConnectIntegrated.clone(sim.generatedScenario.integratedCase);
      sim.step = "intake";
      sim.dirty = true;
      createDraftRecord(sim);
    }
    renderProductView();
  }

  function resetCreationMethod() {
    const sim = authoring();
    if (!window.confirm("Change the creation method? This clears the current method-specific draft and cannot be undone.")) return;
    state.simulationAuthoring = createSimulationAuthoringState();
    state.creationDrafts.simulation = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* local persistence is optional */ }
    renderProductView();
  }

  function normalizeGeneratedSimulation(payload) {
    const sim = authoring();
    const setup = sim.setup;
    const persona = payload.persona || {};
    const title = setup.title.trim() || payload.suggested_title || "Synthetic eligibility simulation";
    const scenario = {
      id: setup.simulationId, number: String(scenarios.length + 1).padStart(2, "0"), title,
      shortTitle: payload.short_title || title, type: setup.caseType, programs: [...setup.programs],
      caseId: `CASE-${setup.simulationId}`,
      persona: { name: persona.name || "Synthetic Applicant", initials: persona.initials || "SA", description: persona.description || `Applicant · ${persona.preferred_language || "English"}` },
      description: payload.description || sim.prompt.trim().slice(0, 220),
      expected: { relationship: "Self", income: String(payload.case_data?.incomeSources?.[0]?.grossAmount || "0") },
      facts: (payload.facts || []).map((fact, index) => ({ id: fact.id || `fact-${index + 1}`, case_path: fact.case_path || "", label: fact.label, question: fact.question, caption: fact.caption })),
      opening: payload.opening || "“Hello, I need help with my benefits application.”",
      completed: [],
      coachPolicyPack: stateNeutralCoachPolicyPack,
      coachActionGraphVersion: "grounded-coach-v1",
      authoring: { jurisdiction: setup.jurisdiction, caseStage: setup.caseStage, difficulty: setup.difficulty, interviewChannel: setup.interviewChannel, trainingObjective: setup.trainingObjective, focusTags: [...sim.focusTags], generatedByAI: true, creationMethod: "prompt", sourceIds: [] },
    };
    if (!scenario.facts.length) scenario.facts = [{ id: "case-context", case_path: "people", label: "Case context", question: "What changed in your household?", caption: "“I need help reviewing the information on my application.”" }];
    const base = BenefitConnectIntegrated.createCase(scenario);
    const generated = payload.case_data || {};
    if (generated.application) Object.assign(base.application, generated.application);
    if (generated.people?.length) base.people = generated.people.map((person) => ({ ...person, programParticipation: Object.fromEntries(setup.programs.map((program) => [program, person[`${program.toLowerCase()}Participation`] || person.programParticipation?.[program] || "Applying"])) }));
    if (generated.incomeSources?.length) { base.incomeSources = generated.incomeSources; base.incomeStatus = "One or more"; }
    if (generated.expenses) base.expenses = { ...base.expenses, ...generated.expenses };
    if (generated.resources?.length) { base.resources = generated.resources; base.resourcesStatus = "One or more"; }
    if (generated.nonfinancial) base.nonfinancial = { ...base.nonfinancial, ...generated.nonfinancial };
    if (generated.evidence?.length) base.evidence = generated.evidence;
    if (generated.outcomes?.length) {
      base.authoredOutcomes.final = generated.outcomes;
      base.authoredOutcomes.pending = generated.outcomes.map((item) => ({ ...item, status: "Pending verification", benefit: "—", reason: item.pendingReason || "Required evidence remains under review" }));
    }
    if (generated.notices?.length) Object.assign(base.notices, Object.fromEntries(generated.notices.map((item) => [item.program, { type: item.type, effectiveDate: item.effectiveDate, delivery: item.delivery, language: item.language, verificationDueDate: item.verificationDueDate, appealRights: item.appealRights }])));
    if (generated.authorizations?.length) Object.assign(base.authorization, Object.fromEntries(generated.authorizations.map((item) => [item.program, { action: item.action, effectiveDate: item.effectiveDate }])));
    base.schemaVersion = "2.0.0-demo";
    scenario.integratedCase = base;
    scenario.authoredOutcomeVariants = base.authoredOutcomes;
    return { scenario, caseDraft: BenefitConnectIntegrated.clone(base) };
  }

  async function generateSimulationFromPrompt() {
    const sim = authoring();
    if (sim.creationMethod !== "prompt") return;
    const validationError = validateSimulationSetup();
    if (validationError) {
      sim.error = validationError.message;
      sim.errorType = "validation";
      sim.errorField = validationError.selector;
      renderProductView();
      requestAnimationFrame(() => { const invalid = dom.screenContent.querySelector(validationError.selector); invalid?.setAttribute("aria-invalid", "true"); invalid?.focus({ preventScroll: false }); });
      return;
    }
    sim.generationStatus = "loading";
    sim.error = null;
    sim.errorType = null;
    sim.errorField = null;
    renderProductView();
    try {
      const payload = await studioJSON("/api/studio/simulations/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setup: sim.setup, focus_tags: sim.focusTags, prompt: sim.prompt.trim() }) });
      const normalized = normalizeGeneratedSimulation(payload);
      sim.generatedScenario = normalized.scenario;
      sim.caseDraft = normalized.caseDraft;
      sim.behavior = { profileId: payload.behavior?.profile_id || "benefits-anxious", intensity: payload.behavior?.intensity || "moderate", voiceKey: payload.behavior?.voice_key || "voice-warm-american-female" };
      sim.expectedActions = payload.expected_actions || [];
      sim.trainingObjectives = payload.training_objectives || [];
      if (!sim.setup.trainingObjective) sim.setup.trainingObjective = sim.trainingObjectives[0] || "Practice a complete eligibility interview and resolve all required evidence.";
      sim.completedSteps = new Set(["setup"]);
      sim.step = "intake";
      sim.dirty = true;
      sim.generationStatus = "ready";
      createDraftRecord(sim);
      showToast("Synthetic case generated", "Review each eligibility stage before previewing the learner experience.");
    } catch (error) {
      sim.generationStatus = "error";
      sim.error = error.message || "The AI service could not generate this case.";
      sim.errorType = "generation";
      sim.errorField = null;
    }
    renderProductView();
  }

  function syncManualScenario() {
    const sim = authoring();
    if (sim.creationMethod !== "manual" || !sim.generatedScenario || !sim.caseDraft) return;
    const scenario = sim.generatedScenario;
    scenario.title = sim.setup.title.trim() || "Untitled simulation";
    scenario.shortTitle = scenario.title;
    scenario.type = sim.setup.caseType;
    scenario.programs = [...sim.setup.programs];
    scenario.persona.name = sim.caseDraft.people[0]?.name || "Synthetic Applicant";
    scenario.persona.initials = scenario.persona.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SA";
    scenario.description = sim.setup.trainingObjective.trim() || "Author-built synthetic eligibility training case.";
    scenario.authoring = { ...scenario.authoring, jurisdiction: sim.setup.jurisdiction, difficulty: sim.setup.difficulty, interviewChannel: sim.setup.interviewChannel, trainingObjective: sim.setup.trainingObjective, creationMethod: "manual", generatedByAI: false, sourceIds: [] };
    sim.caseDraft.application.type = sim.setup.caseType;
  }

  function hasProgramSpecificData(program) {
    const sim = authoring();
    const draft = sim.caseDraft;
    const unitKey = program.toLowerCase();
    const unit = draft.programUnits?.[unitKey] || {};
    return Object.values(unit).some((value) => !empty(value))
      || draft.authoredOutcomes?.final?.some((row) => row.program === program)
      || Boolean(draft.notices?.[program] && Object.values(draft.notices[program]).some((value) => !empty(value)))
      || Boolean(draft.authorization?.[program] && Object.values(draft.authorization[program]).some((value) => !empty(value)))
      || draft.people.some((person) => !empty(person.programParticipation?.[program]) && person.programParticipation[program] !== "Applying");
  }

  function syncManualProgram(program, selected) {
    const sim = authoring();
    const draft = sim.caseDraft;
    if (!selected && hasProgramSpecificData(program) && !window.confirm(`Remove ${program}? Its memberships, outcomes, notices, authorization, and program-specific application data will be cleared.`)) {
      renderProductView();
      return;
    }
    if (selected) {
      sim.setup.programs = [...new Set([...sim.setup.programs, program])];
      draft.programRequests[program] = { requested: true, requestStatus: "Requested", applicationDate: draft.application.receivedDate || "" };
      draft.people.forEach((person) => { person.programParticipation ||= {}; person.programParticipation[program] ||= "Applying"; });
      draft.notices[program] ||= { type: "", effectiveDate: "", delivery: "", language: "", verificationDueDate: "", appealRights: "" };
      draft.authorization[program] ||= { action: "", effectiveDate: "" };
    } else {
      sim.setup.programs = sim.setup.programs.filter((item) => item !== program);
      draft.programRequests[program] = { requested: false, requestStatus: "Not requested", applicationDate: "" };
      draft.people.forEach((person) => { delete person.programParticipation?.[program]; });
      const unitKey = program.toLowerCase();
      Object.keys(draft.programUnits[unitKey] || {}).forEach((key) => { draft.programUnits[unitKey][key] = ""; });
      draft.authoredOutcomes.final = draft.authoredOutcomes.final.filter((row) => row.program !== program);
      draft.authoredOutcomes.pending = draft.authoredOutcomes.pending.filter((row) => row.program !== program);
      delete draft.notices[program];
      delete draft.authorization[program];
    }
    syncManualScenario();
    sim.dirty = true;
    sim.error = null;
    renderProductView();
  }

  function setSimulationStep(next) {
    const sim = authoring();
    if (!authoringSteps(sim).some(([id]) => id === next)) return;
    if (sim.creationMethod === "prompt" && next !== "setup" && !sim.generatedScenario) return;
    sim.step = next;
    sim.error = null;
    sim.errorType = null;
    sim.readinessErrors = [];
    renderProductView();
    dom.screenContent.scrollTop = 0;
  }

  function nextSimulationStep() {
    const sim = authoring();
    const warning = stageReviewWarning(sim.step);
    if (warning) { sim.completedSteps.delete(sim.step); sim.reviewWarnings[sim.step] = warning; }
    else { sim.completedSteps.add(sim.step); delete sim.reviewWarnings[sim.step]; }
    sim.dirty = true;
    const steps = authoringSteps(sim);
    setSimulationStep(steps[stageIndex(sim.step) + 1]?.[0] || "preview");
  }

  function saveSimulationDraft() {
    const sim = authoring();
    syncManualScenario();
    const snapshot = { version: 2, creationMethod: sim.creationMethod, step: sim.step, setup: sim.setup, prompt: sim.prompt, focusTags: sim.focusTags, generatedScenario: sim.generatedScenario, caseDraft: sim.caseDraft, behavior: sim.behavior, expectedActions: sim.expectedActions, trainingObjectives: sim.trainingObjectives, completedSteps: [...sim.completedSteps], savedAt: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* local persistence is optional */ }
    sim.dirty = false;
    createDraftRecord(sim);
    showToast("Simulation draft saved", `${sim.creationMethod === "manual" ? "The author-built application" : "The prompt, generated case"}, and your edits are saved locally.`);
    renderProductView();
  }

  function requireCompleteAuthoring() {
    const sim = authoring();
    const issues = readinessIssues();
    if (!issues.length) return true;
    sim.readinessErrors = issues;
    sim.errorType = "readiness";
    sim.error = `${issues.length} ${issues.length === 1 ? "stage is" : "stages are"} incomplete. The first stage needing attention is open.`;
    sim.step = issues[0].step;
    sim.reviewWarnings = Object.fromEntries(issues.map((item) => [item.step, item.message]));
    renderProductView();
    requestAnimationFrame(() => dom.screenContent.querySelector(`[data-sim-step="${issues[0].step}"]`)?.focus());
    return false;
  }

  function ensureScenarioInLibrary(publishing = false) {
    const sim = authoring();
    syncManualScenario();
    sim.generatedScenario.integratedCase = BenefitConnectIntegrated.clone(sim.caseDraft);
    sim.generatedScenario.authoredOutcomeVariants = sim.generatedScenario.integratedCase.authoredOutcomes;
    sim.generatedScenario.contactSequence = BenefitConnectIntegrated.clone(ensureAuthorContactSequence(sim));
    sim.generatedScenario.callerBrief = buildDemoCallerBriefDefinition(sim.generatedScenario, sim.generatedScenario.integratedCase);
    sim.generatedScenario.authoring.previewOnly = !publishing;
    sim.generatedScenario.authoring.creationMethod = sim.creationMethod;
    sim.generatedScenario.authoring.sourceIds = [];
    const answeringContact = sim.generatedScenario.contactSequence.contacts.find((contact) => contact.contact_id === sim.generatedScenario.contactSequence.answering_contact_id) || sim.generatedScenario.contactSequence.contacts[0];
    scenarioCallerAssignments[sim.generatedScenario.id] = {
      default_profile_id: answeringContact?.profile_id || sim.behavior.profileId,
      primary_voice_presentation: answeringContact?.voice_presentation || callerVoices.find((voice) => voice.voice_key === sim.behavior.voiceKey)?.presentation || "Female",
      default_voice_key: answeringContact?.voice_key || sim.behavior.voiceKey,
      default_intensity: answeringContact?.intensity || sim.behavior.intensity,
      allowed_profile_ids: callerProfiles.map((profile) => profile.profile_id),
      allowed_voice_keys: callerVoices.map((voice) => voice.voice_key),
      learner_override_allowed: true,
      assessment_override_allowed: false,
    };
    if (Number.isInteger(sim.scenarioIndex) && scenarios[sim.scenarioIndex]) scenarios[sim.scenarioIndex] = sim.generatedScenario;
    else { scenarios.push(sim.generatedScenario); sim.scenarioIndex = scenarios.length - 1; }
    renderScenarioLibrary();
    return sim.scenarioIndex;
  }

  function previewSimulationDraft() {
    if (!requireCompleteAuthoring()) return;
    const sim = authoring();
    const index = ensureScenarioInLibrary(false);
    sim.previewing = true;
    state.previewScenarioIndex = index;
    selectScenario(index);
    state.selectedCallerProfileId = sim.behavior.profileId;
    state.selectedCallerIntensity = sim.behavior.intensity;
    state.selectedCallerVoiceKey = sim.behavior.voiceKey;
    setProductView("simulations");
  }

  function publishSimulationDraft() {
    if (!requireCompleteAuthoring()) return;
    const sim = authoring();
    if (!window.confirm("Publish this synthetic case to the Scenario Library? The current version will be frozen for learner use.")) return;
    const index = ensureScenarioInLibrary(true);
    sim.published = true;
    sim.dirty = false;
    sim.completedSteps.add("preview");
    if (!state.creationDrafts.simulation) createDraftRecord(sim);
    const draft = state.creationDrafts.simulation;
    Object.assign(draft, { status: "published", creation_method: sim.creationMethod, simulation_package_id: `package:${sim.setup.simulationId.toLowerCase()}`, simulation_package_version: "v0.1", generated_scenario: sim.generatedScenario, case_data: sim.caseDraft, source_ids: [] });
    state.draft = { ...draft, status: "frozen" };
    state.scenarioIndex = index;
    setProductView("scenario-library");
    showToast("Simulation published", `${sim.generatedScenario.title} is now available in the Scenario Library.`);
  }

  function applyPromptIdea(id) {
    const sim = authoring();
    const idea = PROMPT_IDEAS.find((item) => item.id === id);
    if (!idea) return;
    sim.setup.programs = [...idea.programs];
    sim.setup.caseType = idea.caseType;
    sim.focusTags = [...idea.focus];
    sim.prompt = idea.prompt;
    sim.dirty = true;
    sim.error = null;
    sim.errorType = null;
    renderProductView();
  }

  function addExpenseRecord(type) {
    const sim = authoring();
    const defaults = {
      utilities: { type: "", arrangement: "", amount: "", frequency: "", shared: "" },
      dependentCare: { person: sim.caseDraft.people[0]?.name || "Synthetic Applicant", reason: "", provider: "", amount: "", frequency: "", subsidized: "" },
      medical: { person: sim.caseDraft.people[0]?.name || "Synthetic Applicant", type: "", amount: "", frequency: "", reimbursement: "" },
    };
    sim.caseDraft.expenses[type].push(defaults[type]);
    sim.caseDraft.expenses[`${type}Status`] = "One or more";
    sim.dirty = true;
    renderProductView();
  }

  function bindCaseStage() {
    const sim = authoring();
    const root = dom.screenContent.querySelector(".bc-expanded-workspace");
    if (!root || !isCaseStage(sim.step)) return;
    BenefitConnectIntegrated.bind(root, {
      draft: sim.caseDraft,
      onToggle: (id, open) => { sim.openSections[sim.step] ||= new Set(); open ? sim.openSections[sim.step].add(id) : sim.openSections[sim.step].delete(id); },
      onChange: ({ rerender }) => { syncManualScenario(); sim.dirty = true; if (rerender) renderProductView(); },
      onRepeat: ({ type, action }) => {
        if (type === "people") sim.caseDraft.people.forEach((person) => sim.setup.programs.forEach((program) => { person.programParticipation ||= {}; person.programParticipation[program] ||= "Applying"; }));
        if (type === "incomeSources") sim.caseDraft.incomeStatus = sim.caseDraft.incomeSources.length ? "One or more" : "None";
        if (type === "resources") sim.caseDraft.resourcesStatus = sim.caseDraft.resources.length ? "One or more" : "None";
        if (action === "remove") syncManualScenario();
        sim.dirty = true;
        renderProductView();
      },
      onAction: (action) => { if (action === "run-mock-eligibility") sim.mockEligibility = { status: "final", variant: "final", lastRunAt: new Date().toISOString() }; renderProductView(); },
    });
  }

  window.bindSimulationAuthoringEvents = function bindSimulationAuthoringEvents() {
    const sim = authoring();
    const authoredSequence = sim.step === "behavior" ? ensureAuthorContactSequence(sim) : null;
    const duplicatedVoice = authoredSequence?.contacts.find((contact, index, contacts) => contacts.some((other, otherIndex) => otherIndex !== index && other.voice_key === contact.voice_key));
    if (duplicatedVoice) dom.screenContent.querySelector(".simulation-contact-list")?.insertAdjacentHTML("afterbegin", `<aside class="simulation-voice-warning">${materialIcon("hearing")}<div><strong>Similar voices selected</strong><p>Two contacts use ${escapeHTML(duplicatedVoice.voice_label || "the same Hume voice")}. This is allowed, but a more distinct voice will make the handoff easier to follow.</p></div></aside>`);
    dom.screenContent.querySelector("[data-sim-open-nav]")?.addEventListener("click", () => document.querySelector("#studioSidebar")?.classList.add("open"));
    dom.screenContent.querySelectorAll("[data-view-link]").forEach((button) => button.addEventListener("click", () => setProductView(button.dataset.viewLink)));
    dom.screenContent.querySelectorAll("[data-sim-method]").forEach((button) => button.addEventListener("click", () => selectCreationMethod(button.dataset.simMethod)));
    dom.screenContent.querySelector("[data-sim-change-method]")?.addEventListener("click", resetCreationMethod);
    dom.screenContent.querySelectorAll("[data-sim-step]").forEach((button) => button.addEventListener("click", () => setSimulationStep(button.dataset.simStep)));
    dom.screenContent.querySelectorAll("[data-sim-setup]").forEach((control) => control.addEventListener("change", () => { sim.setup[control.dataset.simSetup] = control.value; sim.dirty = true; }));
    dom.screenContent.querySelectorAll("[data-sim-manual-setup]").forEach((control) => control.addEventListener("change", () => { sim.setup[control.dataset.simManualSetup] = control.value; syncManualScenario(); sim.dirty = true; renderProductView(); }));
    dom.screenContent.querySelectorAll("[data-sim-program]").forEach((control) => control.addEventListener("change", () => { control.checked ? sim.setup.programs.push(control.dataset.simProgram) : sim.setup.programs = sim.setup.programs.filter((item) => item !== control.dataset.simProgram); sim.setup.programs = [...new Set(sim.setup.programs)]; sim.dirty = true; }));
    dom.screenContent.querySelectorAll("[data-sim-manual-program]").forEach((control) => control.addEventListener("change", () => syncManualProgram(control.dataset.simManualProgram, control.checked)));
    dom.screenContent.querySelectorAll("[data-sim-idea]").forEach((button) => button.addEventListener("click", () => applyPromptIdea(button.dataset.simIdea)));
    dom.screenContent.querySelectorAll("[data-sim-focus]").forEach((button) => button.addEventListener("click", () => { const focus = button.dataset.simFocus; sim.focusTags = sim.focusTags.includes(focus) ? sim.focusTags.filter((item) => item !== focus) : [...sim.focusTags, focus]; sim.dirty = true; renderProductView(); }));
    const prompt = document.querySelector("#simulationPrompt");
    prompt?.addEventListener("input", () => { sim.prompt = prompt.value; sim.dirty = true; document.querySelector("#simulationPromptCount").textContent = `${prompt.value.length} / 3,000`; });
    dom.screenContent.querySelectorAll("[data-sim-behavior]").forEach((control) => control.addEventListener("change", () => { sim.behavior[control.dataset.simBehavior] = control.value; sim.dirty = true; }));
    dom.screenContent.querySelectorAll("[data-sim-contact-sequence]").forEach((control) => control.addEventListener("change", () => {
      const sequence = ensureAuthorContactSequence(sim);
      sequence[control.dataset.simContactSequence] = control.value;
      if (sequence.mode === "direct") sequence.answering_contact_id = sequence.intended_contact_id;
      if (sequence.mode === "authorized_contact") sequence.intended_contact_availability = "answerer_authorized";
      sim.dirty = true;
      renderProductView();
    }));
    dom.screenContent.querySelectorAll("[data-sim-contact]").forEach((control) => control.addEventListener("change", () => {
      const sequence = ensureAuthorContactSequence(sim);
      const [index, key] = control.dataset.simContact.split(".");
      const contact = sequence.contacts[Number(index)];
      if (!contact) return;
      contact[key] = control.value;
      if (key === "voice_key") {
        const voice = callerVoices.find((item) => item.voice_key === control.value);
        Object.assign(contact, { voice_id: voice?.voice_id || "", voice_label: voice?.label || "", voice_presentation: voice?.presentation || "" });
      }
      sim.dirty = true;
      if (key === "voice_key") renderProductView();
    }));
    dom.screenContent.querySelectorAll("[data-sim-scenario]").forEach((control) => control.addEventListener("change", () => { sim.generatedScenario[control.dataset.simScenario] = control.value; sim.dirty = true; }));
    dom.screenContent.querySelectorAll("[data-sim-fact]").forEach((control) => control.addEventListener("change", () => { const [index, key] = control.dataset.simFact.split("."); sim.generatedScenario.facts[Number(index)][key] = control.value; sim.dirty = true; if (key === "case_path") renderProductView(); }));
    dom.screenContent.querySelector("[data-sim-fact-add]")?.addEventListener("click", () => { sim.generatedScenario.facts.push({ id: `fact-${Date.now()}`, case_path: "", label: "", question: "", caption: "" }); sim.dirty = true; renderProductView(); });
    dom.screenContent.querySelectorAll("[data-sim-fact-remove]").forEach((button) => button.addEventListener("click", () => { sim.generatedScenario.facts.splice(Number(button.dataset.simFactRemove), 1); sim.dirty = true; renderProductView(); }));
    dom.screenContent.querySelectorAll("[data-sim-record]").forEach((control) => control.addEventListener("change", () => { BenefitConnectIntegrated.setPath(sim.caseDraft, control.dataset.simRecord, control.value); syncManualScenario(); sim.dirty = true; }));
    dom.screenContent.querySelectorAll("[data-sim-repeat-add]").forEach((button) => button.addEventListener("click", () => {
      if (button.dataset.simRepeatAdd === "evidence") sim.caseDraft.evidence.push({ evidenceId: `evidence-author-${Date.now()}`, type: "", title: "", person: sim.caseDraft.people[0]?.name || "Synthetic Applicant", program: sim.setup.programs[0] || "", fact: "", receivedDate: "", status: "", discrepancy: "" });
      else if (sim.setup.programs.length) sim.caseDraft.authoredOutcomes.final.push({ program: sim.setup.programs[0], person: sim.caseDraft.people[0]?.name || "Synthetic Applicant", month: "", status: "", benefit: "", reason: "" });
      sim.dirty = true;
      renderProductView();
    }));
    dom.screenContent.querySelectorAll("[data-sim-repeat-remove]").forEach((button) => button.addEventListener("click", () => { const collection = button.dataset.simRepeatRemove === "evidence" ? sim.caseDraft.evidence : sim.caseDraft.authoredOutcomes.final; collection.splice(Number(button.dataset.index), 1); sim.dirty = true; renderProductView(); }));
    dom.screenContent.querySelectorAll("[data-sim-expense-add]").forEach((button) => button.addEventListener("click", () => addExpenseRecord(button.dataset.simExpenseAdd)));
    dom.screenContent.querySelectorAll("[data-sim-expense-remove]").forEach((button) => button.addEventListener("click", () => { const type = button.dataset.simExpenseRemove; sim.caseDraft.expenses[type].splice(Number(button.dataset.index), 1); if (!sim.caseDraft.expenses[type].length) sim.caseDraft.expenses[`${type}Status`] = "None"; sim.dirty = true; renderProductView(); }));
    dom.screenContent.querySelectorAll("[data-sim-action]").forEach((button) => button.addEventListener("click", async () => {
      const action = button.dataset.simAction;
      if (action === "generate") return generateSimulationFromPrompt();
      if (action === "next") return nextSimulationStep();
      if (action === "back") { const steps = authoringSteps(sim); return setSimulationStep(steps[Math.max(0, stageIndex(sim.step) - 1)][0]); }
      if (action === "save") return saveSimulationDraft();
      if (action === "preview") return previewSimulationDraft();
      if (action === "publish") return publishSimulationDraft();
      if (action === "discard") {
        if ((sim.dirty || sim.generatedScenario) && !window.confirm("Discard this simulation draft and all case details?")) return;
        state.simulationAuthoring = createSimulationAuthoringState();
        state.creationDrafts.simulation = null;
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* local persistence is optional */ }
        setProductView("scenario-library");
      }
    }));
    bindCaseStage();
  };
})();
