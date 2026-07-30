(function initializeDemoScenarioSystem(global) {
  "use strict";

  const VERSION = "demo-case-bundle-v2";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pathParts(path) {
    return String(path || "").split(".").filter(Boolean).map((part) => /^\d+$/.test(part) ? Number(part) : part);
  }

  function getPath(value, path) {
    return pathParts(path).reduce((current, part) => current == null ? undefined : current[part], value);
  }

  function setPath(value, path, next) {
    const parts = pathParts(path);
    const last = parts.pop();
    const parent = parts.reduce((current, part, index) => {
      if (current[part] == null) current[part] = typeof parts[index + 1] === "number" ? [] : {};
      return current[part];
    }, value);
    parent[last] = next;
  }

  function meaningful(value) {
    return value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
  }

  function interviewFact(fact_id, case_path, label, normalized_value, natural_response, options = {}) {
    return {
      fact_id,
      case_path,
      label,
      topic: options.topic || label,
      normalized_value,
      natural_response,
      optional_follow_up_context: options.follow_up || "",
      learner_question_examples: options.questions || [],
      fact_state: options.fact_state || "interview_only",
      sensitivity: options.sensitivity || "standard",
      evidence_required: Boolean(options.evidence_required),
      destination_stage: options.stage || (case_path.startsWith("people.") ? "household" : case_path.startsWith("incomeSources.") || case_path.startsWith("expenses.") || case_path.startsWith("resources") ? "financial" : case_path.startsWith("nonfinancial.") ? "nonfinancial" : "intake"),
      destination_section: options.section || "",
      required: options.required !== false,
    };
  }

  const BO001_FACTS = [
    interviewFact("bo001-marital", "people.0.maritalStatus", "Marital status", "Separated", "I’m separated. My husband does not live with us right now.", { questions: ["Are you married?", "What is your current marital status?"] }),
    interviewFact("bo001-tax", "people.0.taxFilingStatus", "Tax filing status", "Files taxes", "Yes, I file taxes and claim both of my children.", { questions: ["Do you file taxes?"] }),
    interviewFact("bo001-dependent", "people.0.claimedAsDependent", "Claimed as a dependent", "No", "No, nobody else claims me as a tax dependent.", { questions: ["Does anyone claim you as a dependent?"] }),
    interviewFact("bo001-leo-dob", "people.1.dateOfBirth", "Leo's date of birth", "2018-11-03", "Leo was born November 3, 2018. He’s seven now.", { questions: ["What is Leo's date of birth?"] }),
    interviewFact("bo001-sofia-dob", "people.2.dateOfBirth", "Sofia's date of birth", "2022-09-14", "Sofia’s birthday is September 14, 2022. She’s three.", { questions: ["What is Sofia's date of birth?"] }),
    interviewFact("bo001-food", "people.0.snapFoodTogether", "Food-purchase relationship", "Yes", "Yes, I buy and prepare food for myself and both children together.", { questions: ["Who buys and prepares food together?"] }),
    interviewFact("bo001-due-date", "people.0.dueDate", "Pregnancy due date", "2027-02-18", "My due date is February 18, 2027. That’s the date my clinic gave me.", { questions: ["What is your due date?"] }),
    interviewFact("bo001-hours", "incomeSources.0.hoursPerWeek", "Average weekly hours", "24", "I’m getting about 24 hours a week now. Before the change I was closer to 35.", { questions: ["How many hours are you working now?"], evidence_required: true }),
    interviewFact("bo001-frequency", "incomeSources.0.frequency", "Pay frequency", "Twice monthly", "I’m paid twice a month, usually around the middle and the end of the month.", { questions: ["How often are you paid?"] }),
    interviewFact("bo001-gross", "incomeSources.0.grossAmount", "Gross pay", "910", "My gross pay is about $910 each paycheck, before taxes come out.", { questions: ["What is your gross pay?"], evidence_required: true }),
    interviewFact("bo001-change-date", "incomeSources.0.changeDate", "Work-change date", "2026-06-15", "The reduced schedule started June 15. That was the first week they cut my hours.", { questions: ["When did your hours change?"] }),
    interviewFact("bo001-rent", "expenses.shelter.amount", "Monthly rent", "1275", "My full monthly rent is $1,275. I do receive help through a housing voucher.", { questions: ["How much is your rent?"] }),
    interviewFact("bo001-utility-status", "expenses.utilitiesStatus", "Utility responsibility", "One or more", "I pay the electric bill separately from rent. Heat is included.", { questions: ["Which utilities do you pay?"] }),
    interviewFact("bo001-electric", "expenses.utilities.0.amount", "Monthly electric expense", "145", "The electric bill is usually around $145 a month.", { questions: ["How much is the electric bill?"] }),
    interviewFact("bo001-care", "expenses.dependentCare.0.amount", "Monthly childcare", "320", "I pay $320 a month for childcare so I can work.", { questions: ["Do you pay for childcare?"] }),
    interviewFact("bo001-resources", "resourcesStatus", "Resource status", "One or more", "I have one checking account. I don’t have cash set aside anywhere else.", { questions: ["Do you have any bank accounts or cash?"] }),
    interviewFact("bo001-checking", "resources.0.value", "Checking-account balance", "210", "There’s about $210 in my checking account right now.", { questions: ["What is the current checking balance?"] }),
    interviewFact("bo001-coverage", "nonfinancial.healthCoverage", "Other health coverage", "No other coverage", "No, I don’t have any other health insurance right now.", { questions: ["Do you have other health coverage?"] }),
  ];

  const BO002_FACTS = [
    interviewFact("bo002-marital", "people.0.maritalStatus", "Marital status", "Divorced", "I’m divorced. Nia’s mother and I do not live together.", { questions: ["Are you married?", "What is your marital status?"] }),
    interviewFact("bo002-nia-dob", "people.1.dateOfBirth", "Nia's date of birth", "2010-03-22", "Nia was born March 22, 2010. She’s sixteen.", { questions: ["What is Nia's date of birth?"] }),
    interviewFact("bo002-move-date", "people.1.moveInDate", "Nia's move-in date", "2026-07-01", "She moved back in on July 1. She has been here full time since then.", { questions: ["When did Nia move in?"] }),
    interviewFact("bo002-custody", "people.1.sharedCustody", "Custody arrangement", "Primary residence here", "Her primary home is with me now. She visits her mother on some weekends.", { questions: ["What is the custody arrangement?"] }),
    interviewFact("bo002-food", "people.0.snapFoodTogether", "Food-purchase relationship", "Yes", "Nia and I buy and prepare our meals together.", { questions: ["Do you buy and prepare food together?"] }),
    interviewFact("bo002-dependent", "people.1.claimedAsDependent", "Nia's tax dependency", "Yes", "Yes, I expect to claim Nia on my taxes this year.", { questions: ["Will you claim Nia as a dependent?"] }),
    interviewFact("bo002-rate", "incomeSources.0.hourlyRate", "Hourly rate", "15", "The warehouse pays me $15 an hour.", { questions: ["What is your hourly wage?"], evidence_required: true }),
    interviewFact("bo002-hours", "incomeSources.0.hoursPerWeek", "Average weekly hours", "38", "I’m averaging about 38 hours each week.", { questions: ["How many hours do you work each week?"], evidence_required: true }),
    interviewFact("bo002-frequency", "incomeSources.0.frequency", "Pay frequency", "Every two weeks", "I’m paid every two weeks.", { questions: ["How often are you paid?"] }),
    interviewFact("bo002-gross", "incomeSources.0.grossAmount", "Gross pay", "1140", "A normal gross paycheck is about $1,140 before taxes.", { questions: ["What is the gross amount of a normal check?"], evidence_required: true }),
    interviewFact("bo002-start", "incomeSources.0.changeDate", "Job start date", "2026-07-08", "I started the new job on July 8.", { questions: ["When did the job start?"] }),
    interviewFact("bo002-rent", "expenses.shelter.amount", "New monthly rent", "1440", "The rent is $1,440 now. The increase began this month.", { questions: ["What is your current rent?"] }),
    interviewFact("bo002-utility-status", "expenses.utilitiesStatus", "Utility responsibility", "One or more", "I pay the heating bill separately from rent.", { questions: ["Which utilities do you pay?"] }),
    interviewFact("bo002-heating", "expenses.utilities.0.amount", "Monthly heating expense", "165", "The heating bill is averaging about $165 a month.", { questions: ["How much is the heating bill?"] }),
    interviewFact("bo002-coverage", "nonfinancial.healthCoverage", "Other health coverage", "No other coverage", "No, neither Nia nor I have other health coverage.", { questions: ["Does anyone have other health coverage?"] }),
  ];

  const ROUTES = Object.freeze({
    "BO-001": { mode: "direct", answerer: "primary", availability: "available_handoff", expected_terminal_state: "interview_complete" },
    "BO-002": { mode: "direct", answerer: "primary", availability: "available_handoff", expected_terminal_state: "interview_complete" },
    "BO-003": { mode: "screened", answerer: { id: "contact:kendra-reed", name: "Kendra Reed", relationship: "Sister visiting", voice_key: "voice-caring-mother", profile_id: "benefits-calm", message_authority: "limited" }, availability: "available_handoff", expected_handoff: true, expected_terminal_state: "interview_complete" },
    "BO-004": { mode: "screened", answerer: { id: "contact:mei-chen", name: "Mei Chen", relationship: "Spouse", person_id: "person-02", voice_key: "voice-charming-cowgirl", profile_id: "benefits-calm", message_authority: "limited" }, availability: "available_handoff", expected_handoff: true, expected_terminal_state: "interview_complete" },
    "BO-005": { mode: "screened", answerer: { id: "contact:carlos-vega", name: "Carlos Vega", relationship: "Brother and alternate phone contact", voice_key: "voice-colton-rivers", profile_id: "benefits-calm", message_authority: "limited" }, availability: "not_at_location", callback_window: "Today between 4 PM and 6 PM", message_policy: "neutral_callback_only", expected_terminal_state: "callback_message_recorded" },
    "BO-006": { mode: "screened", answerer: { id: "contact:denise-green", name: "Denise Green", relationship: "Mother and alternate phone contact", voice_key: "voice-imani-carter", profile_id: "benefits-calm", message_authority: "none" }, availability: "temporarily_unavailable", callback_window: "Tomorrow after 10 AM", message_policy: "decline_message_offer_callback_window", expected_terminal_state: "call_later" },
  });

  function blank(value, paths) {
    for (const path of paths) setPath(value, path, "");
  }

  function child(personId, name, programs) {
    return {
      personId, name, dateOfBirth: "", moveInDate: "", relationship: "Child", livesAtCaseAddress: "Yes", alternateAddress: "", temporaryAbsent: "No", absenceReason: "", expectedReturnDate: "", sharedCustody: "No shared custody", custodySchedule: "", maritalStatus: "Not applicable", taxFilingStatus: "Non-filer", claimedAsDependent: "", pregnant: "No", dueDate: "", snapFoodTogether: "", tanfRole: programs.includes("TANF") ? "Dependent child" : "Not applicable", programParticipation: Object.fromEntries(programs.map((program) => [program, "Applying"])),
    };
  }

  function applyApplicationOverrides(scenario, draft) {
    if (!draft || !scenario) return draft;
    draft.people.forEach((person) => { if (!("moveInDate" in person)) person.moveInDate = ""; });
    const route = ROUTES[scenario.id];
    draft.application.phoneContactName = route?.answerer === "primary" ? scenario.persona.name : route?.answerer?.name || scenario.persona.name;
    draft.application.phoneContactRelationship = route?.answerer === "primary" ? "Self" : route?.answerer?.relationship || "Self";
    if (scenario.id === "BO-001") {
      draft.application.receivedDate = "2026-07-29";
      draft.people = [draft.people[0], child("person-02", "Leo Ortiz", scenario.programs), child("person-03", "Sofia Ortiz", scenario.programs)];
      draft.people[0].name = "Maya Ortiz";
      draft.people[0].dateOfBirth = "1993-09-14";
      draft.people[0].pregnant = "Yes";
      blank(draft, ["people.0.maritalStatus", "people.0.taxFilingStatus", "people.0.claimedAsDependent", "people.0.dueDate", "people.0.snapFoodTogether", "people.1.dateOfBirth", "people.1.claimedAsDependent", "people.1.snapFoodTogether", "people.2.dateOfBirth", "people.2.claimedAsDependent", "people.2.snapFoodTogether", "programUnits.snap.foodUnit", "programUnits.snap.purchasePrepare", "incomeSources.0.hoursPerWeek", "incomeSources.0.grossAmount", "incomeSources.0.frequency", "incomeSources.0.changeDate", "expenses.shelter.amount", "expenses.utilitiesStatus", "expenses.dependentCareStatus", "resourcesStatus", "nonfinancial.healthCoverage"]);
      draft.incomeSources[0].employer = "Northline Market";
      draft.incomeSources[0].expectedChange = "Reduction in hours";
      draft.expenses.utilities = [{ type: "Electricity", arrangement: "Paid separately", amount: "", frequency: "Monthly", shared: "No" }];
      draft.expenses.dependentCare = [{ person: "Sofia Ortiz", reason: "Employment", provider: "Bright Start Center", amount: "", frequency: "Monthly", subsidized: "No" }];
      draft.resources = [{ resourceId: "resource-01", owner: "Maya Ortiz", type: "Checking account", institution: "Community Bank", value: "", jointlyOwned: "No", incomeProducing: "No", vehicleDescription: "", vehicleUse: "" }];
      draft.programUnits.tanf.assistanceUnit = "";
      draft.programUnits.tanf.caretaker = "";
    }
    if (scenario.id === "BO-002") {
      draft.application.receivedDate = "2026-07-29";
      draft.people[0].name = "Andre Bell";
      draft.people[1] = child("person-02", "Nia Bell", scenario.programs);
      draft.people[1].relationship = "Child";
      blank(draft, ["people.0.maritalStatus", "people.0.snapFoodTogether", "people.1.dateOfBirth", "people.1.moveInDate", "people.1.sharedCustody", "people.1.custodySchedule", "people.1.claimedAsDependent", "people.1.snapFoodTogether", "programUnits.snap.foodUnit", "programUnits.snap.purchasePrepare", "incomeSources.0.hourlyRate", "incomeSources.0.hoursPerWeek", "incomeSources.0.grossAmount", "incomeSources.0.frequency", "incomeSources.0.changeDate", "expenses.shelter.amount", "expenses.utilitiesStatus", "nonfinancial.healthCoverage"]);
      draft.incomeSources[0].employer = "Riverton Distribution Center";
      draft.incomeSources[0].expectedChange = "New income";
      draft.expenses.utilities = [{ type: "Heating fuel", arrangement: "Paid separately", amount: "", frequency: "Monthly", shared: "No" }];
      draft.programUnits.tanf.assistanceUnit = "";
      draft.programUnits.tanf.caretaker = "";
    }
    if (scenario.id === "BO-004" && draft.people[1]) {
      draft.people[1].name = "Mei Chen";
      draft.people[1].relationship = "Spouse";
    }
    return draft;
  }

  function voice(voices, key, fallback) {
    return (voices || []).find((item) => item.voice_key === key) || fallback || voices?.[0] || {};
  }

  function primaryContact(scenario, draft, voices, assignment) {
    const selected = voice(voices, assignment?.default_voice_key, voices?.[0]);
    return {
      contact_id: `contact:${draft.people[0]?.personId || "person-01"}`,
      person_id: draft.people[0]?.personId || "person-01",
      name: scenario.persona.name,
      role: "applicant",
      relationship: "Self",
      preferred_language: draft.application.preferredLanguage || "English",
      interpreter_needed: draft.application.interpreterNeeded || "No",
      profile_id: assignment?.default_profile_id || "benefits-calm",
      intensity: assignment?.default_intensity || "moderate",
      voice_key: selected.voice_key,
      voice_id: selected.voice_id,
      voice_label: selected.label,
      voice_presentation: selected.presentation,
      greeting_mode: "name_only",
      greeting: `Hi, this is ${scenario.persona.name.split(/\s+/)[0]}.`,
      knowledge_scope: "full_application",
      disclosure_authority: "full",
      message_authority: "full",
    };
  }

  function answeringContact(config, draft, voices) {
    const selected = voice(voices, config.voice_key, voices?.[0]);
    return {
      contact_id: config.id,
      person_id: config.person_id || "",
      name: config.name,
      role: "answering_contact",
      relationship: config.relationship,
      preferred_language: draft.application.preferredLanguage || "English",
      interpreter_needed: draft.application.interpreterNeeded || "No",
      profile_id: config.profile_id || "benefits-calm",
      intensity: "low",
      voice_key: selected.voice_key,
      voice_id: selected.voice_id,
      voice_label: selected.label,
      voice_presentation: selected.presentation,
      greeting_mode: "alternate_answerer",
      greeting: "Hello?",
      knowledge_scope: "contact_only",
      disclosure_authority: "limited",
      message_authority: config.message_authority || "limited",
    };
  }

  function buildContactSequence(scenario, draft, voices, assignment) {
    const config = ROUTES[scenario.id] || ROUTES["BO-001"];
    const intended = primaryContact(scenario, draft, voices, assignment);
    if (config.mode === "direct") return {
      route_id: `route:${scenario.id}:direct`, route_locked: true, mode: "direct", contacts: [intended], answering_contact_id: intended.contact_id, intended_contact_id: intended.contact_id, active_contact_id: intended.contact_id, intended_contact_availability: "available_handoff", callback_window: draft.application.bestContactTime || "", allowed_handoffs: [], expected_terminal_state: config.expected_terminal_state,
    };
    const answerer = answeringContact(config.answerer, draft, voices);
    return {
      route_id: `route:${scenario.id}:${config.expected_handoff ? "handoff" : "unavailable"}`,
      route_locked: true,
      mode: "screened",
      contacts: [answerer, intended],
      answering_contact_id: answerer.contact_id,
      intended_contact_id: intended.contact_id,
      active_contact_id: answerer.contact_id,
      intended_contact_availability: config.availability,
      callback_window: config.callback_window || draft.application.bestContactTime || "",
      allowed_handoffs: config.expected_handoff ? [{ from_contact_id: answerer.contact_id, to_contact_id: intended.contact_id }] : [],
      message_policy: config.message_policy || "neutral_callback_only",
      expected_handoff: Boolean(config.expected_handoff),
      expected_terminal_state: config.expected_terminal_state,
    };
  }

  function factsForScenario(scenario) {
    if (scenario.id === "BO-001") return clone(BO001_FACTS);
    if (scenario.id === "BO-002") return clone(BO002_FACTS);
    return (scenario.facts || []).map((fact) => interviewFact(`${scenario.id.toLowerCase()}-${fact.id}`, fact.case_path || ({ household: "people", income: "incomeSources", pregnancy: "nonfinancial", expenses: "expenses" }[fact.id]), fact.label, fact.normalized_value || "", String(fact.caption || "").replaceAll("“", "").replaceAll("”", ""), { questions: [fact.question], fact_state: "conversation_topic", required: true }));
  }

  function buildTruthLedger(scenario, draft, sequence) {
    const interviewFacts = factsForScenario(scenario);
    const intendedId = sequence.intended_contact_id;
    return interviewFacts.map((fact) => ({
      ...fact,
      submitted_value: getPath(draft, fact.case_path),
      provenance: fact.fact_state === "interview_only" ? "Caller statement" : "Authored conversation fact",
      submitted_to_agency: fact.fact_state !== "interview_only" && meaningful(getPath(draft, fact.case_path)),
      known_by_contact_ids: [intendedId],
      disclosure_trigger: "appropriate_learner_question",
      destination_field: fact.case_path,
    }));
  }

  function buildJourney(scenario, ledger, route) {
    const tasks = [{ task_id: "establish-contact", action_type: route.mode === "direct" ? "introduce" : "request_contact", label: route.mode === "direct" ? "Introduce yourself and explain the call" : `Ask to speak with ${scenario.persona.name}`, required: true }];
    if (route.expected_handoff) tasks.push({ task_id: "complete-handoff", action_type: "handoff", label: `Complete the handoff to ${scenario.persona.name}`, required: true });
    if (!route.expected_handoff && route.mode === "screened") {
      tasks.push({ task_id: "handle-unavailable", action_type: route.message_policy === "neutral_callback_only" ? "callback" : "call_later", label: route.message_policy === "neutral_callback_only" ? "Leave a neutral callback message" : `Confirm the callback window: ${route.callback_window}`, required: true });
      return tasks;
    }
    ledger.filter((fact) => fact.required).forEach((fact) => {
      tasks.push({ task_id: `ask:${fact.fact_id}`, action_type: "ask", fact_id: fact.fact_id, case_path: fact.case_path, label: `Ask about ${fact.label.toLowerCase()}`, question: fact.learner_question_examples[0] || `Ask about ${fact.label.toLowerCase()}`, destination_stage: fact.destination_stage, destination_section: fact.destination_section, required: true });
      if (fact.fact_state === "conversation_topic") return;
      tasks.push({ task_id: `enter:${fact.fact_id}`, action_type: "enter", fact_id: fact.fact_id, case_path: fact.case_path, label: `Enter ${fact.label}`, expected_value: fact.normalized_value, destination_stage: fact.destination_stage, destination_section: fact.destination_section, required: true });
    });
    return tasks;
  }

  function validateBundle(scenario, draft, route, ledger, journey) {
    const errors = [];
    const warnings = [];
    if (!["direct", "screened"].includes(route.mode)) errors.push("Unsupported route mode");
    if (!route.contacts.some((item) => item.contact_id === route.answering_contact_id)) errors.push("Answering contact is missing");
    if (!route.contacts.some((item) => item.contact_id === route.intended_contact_id)) errors.push("Intended contact is missing");
    if (route.expected_handoff) {
      const from = route.contacts.find((item) => item.contact_id === route.answering_contact_id);
      const to = route.contacts.find((item) => item.contact_id === route.intended_contact_id);
      if (!from?.voice_id || !to?.voice_id || from.voice_id === to.voice_id) errors.push("Handoff contacts require distinct voice IDs");
    }
    const seen = new Set();
    ledger.forEach((fact) => {
      if (!fact.fact_id || seen.has(fact.fact_id)) errors.push(`Duplicate or missing fact ID: ${fact.fact_id || "blank"}`);
      seen.add(fact.fact_id);
      if (!fact.case_path) errors.push(`Missing case path for ${fact.fact_id}`);
      if (fact.fact_state === "interview_only" && meaningful(getPath(draft, fact.case_path))) errors.push(`Interview-only field is already populated: ${fact.case_path}`);
      if ((fact.fact_state !== "conversation_topic" && !meaningful(fact.normalized_value)) || !fact.natural_response) errors.push(`Incomplete interview fact: ${fact.fact_id}`);
    });
    if (!journey.length) errors.push("Journey is empty");
    const submittedLeafCount = (function count(value) { if (Array.isArray(value)) return value.reduce((sum, item) => sum + count(item), 0); if (value && typeof value === "object") return Object.values(value).reduce((sum, item) => sum + count(item), 0); return meaningful(value) ? 1 : 0; })(draft);
    const blankInterviewCount = ledger.filter((fact) => fact.fact_state === "interview_only").length;
    if (["BO-001", "BO-002"].includes(scenario.id) && blankInterviewCount < 12) errors.push("Rich interview cases require at least 12 blank interview facts");
    return { valid: errors.length === 0, errors, warnings, submitted_leaf_count: submittedLeafCount, interview_fact_count: ledger.length, blank_interview_fact_count: blankInterviewCount };
  }

  function compileScenario(scenario, draft, voices, assignment) {
    const caseDraft = applyApplicationOverrides(scenario, clone(draft));
    const contactSequence = buildContactSequence(scenario, caseDraft, voices, assignment);
    const truthLedger = buildTruthLedger(scenario, caseDraft, contactSequence);
    const journey = buildJourney(scenario, truthLedger, contactSequence);
    const validation = validateBundle(scenario, caseDraft, contactSequence, truthLedger, journey);
    return { version: VERSION, integratedCase: caseDraft, contactSequence, truthLedger, interviewFacts: factsForScenario(scenario), coachJourney: journey, validation };
  }

  global.BlueOriginDemoScenarios = { VERSION, ROUTES, getPath, setPath, meaningful, applyApplicationOverrides, buildContactSequence, buildTruthLedger, buildJourney, validateBundle, compileScenario, factsForScenario };
})(typeof window !== "undefined" ? window : globalThis);
