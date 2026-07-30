const NOTEBOOK_ID = "notebook:xqrdbt77uo7bbnf11fjl";
const SPEC_NOTE_ID = "note:cg8bg1ic7zhxrb5ttugs";

const sourceIds = {
  medicaid: "source:flrb31r574hwjcv5rxqs",
  snap: "source:gp30wqteo90ovah51mel",
  tanf: "source:costenggz9yw7lmgwo74",
  qc: "source:0ksit6sieoou6o1segr2",
};

const DEMO_CALLER_BRIEF_VERSION = "demo-caller-brief-v2";
const DEMO_CALLER_BRIEF_MAX_BYTES = 8192;

const productRoutes = {
  home: { label: "Home", title: "Product Studio" },
  library: { label: "Knowledge", title: "Library" },
  notebook: { label: "Knowledge", title: "Notebook" },
  sources: { label: "Knowledge", title: "Sources" },
  notebooks: { label: "Knowledge", title: "Notebooks" },
  search: { label: "Knowledge", title: "Ask & Search" },
  lighthouse: { label: "Learn", title: "Lighthouse" },
  "lighthouse-path": { label: "Learn", title: "Learning Path" },
  "lighthouse-player": { label: "Learn", title: "Module Player" },
  "lighthouse-builder": { label: "Learn", title: "Module Builder" },
  "lighthouse-manage": { label: "Learn", title: "Manage Modules" },
  "my-learning": { label: "Learn", title: "My Learning" },
  video: { label: "Create", title: "Create video" },
  quiz: { label: "Create", title: "Create quiz" },
  "simulation-builder": { label: "Create", title: "Create simulation" },
  "scenario-library": { label: "Simulate", title: "Scenario Library" },
  assignments: { label: "Simulate", title: "Assignments" },
  attempts: { label: "Simulate", title: "Attempts & Results" },
  templates: { label: "Manage", title: "Templates" },
  settings: { label: "Manage", title: "Settings" },
};

const workflow = [
  { id: "intake", label: "Intake & requests" },
  { id: "household", label: "Household" },
  { id: "programs", label: "Programs" },
  { id: "financial", label: "Financial" },
  { id: "nonfinancial", label: "Non-financial" },
  { id: "evidence", label: "Evidence" },
  { id: "eligibility", label: "Eligibility" },
  { id: "notices", label: "Notices" },
  { id: "authorization", label: "Authorization" },
];

const scenarios = [
  {
    id: "BO-001",
    number: "01",
    title: "Combined Medicaid, SNAP & TANF initial application",
    shortTitle: "Combined initial application",
    type: "Initial application",
    programs: ["Medicaid", "SNAP", "TANF"],
    caseId: "CASE-BO-2401",
    persona: { name: "Maya Ortiz", initials: "MO", description: "Applicant · English" },
    description: "Build the household, verify reduced wages, evaluate three programs, and select the correct notices.",
    expected: { relationship: "Self", income: "1820", evidence: true },
    facts: [
      { id: "household", label: "Household", question: "Who lives with you?", caption: "“It’s me and my two children, Leo who is seven and Sofia who is three.”" },
      { id: "income", label: "Income change", question: "What changed at work?", caption: "“My hours dropped last month. I now earn about $910 twice a month before taxes.”" },
      { id: "pregnancy", label: "Pregnancy", question: "Is anyone pregnant?", caption: "“Yes, I’m pregnant. My due date is February 18.”" },
      { id: "expenses", label: "Expenses", question: "What do you pay monthly?", caption: "“Rent is $1,275, utilities are separate, and childcare is $320 a month.”" },
    ],
    opening: "“Hi, I’m applying because my hours changed and I need help with medical coverage, food, and cash assistance.”",
    completed: ["intake"],
  },
  {
    id: "BO-002",
    number: "02",
    title: "Combined income and household change",
    shortTitle: "Income & household change",
    type: "Reported change",
    programs: ["Medicaid", "SNAP", "TANF"],
    caseId: "CASE-BO-2402",
    persona: { name: "Andre Bell", initials: "AB", description: "Case participant · English" },
    description: "Process a new household member and earned-income change across an active combined case.",
    expected: { relationship: "Self", income: "2460", evidence: true },
    facts: [
      { id: "household", label: "New member", question: "Who joined the home?", caption: "“My daughter Nia moved back in on the first of this month.”" },
      { id: "income", label: "New wages", question: "What are your current wages?", caption: "“I started a warehouse job at $15 an hour, about 38 hours each week.”" },
      { id: "pregnancy", label: "Medical facts", question: "Any medical-status changes?", caption: "“No pregnancy or disability changes for anyone in the home.”" },
      { id: "expenses", label: "Shelter", question: "Did expenses change?", caption: "“Rent increased to $1,440, and I still pay the heating bill.”" },
    ],
    opening: "“I need to report that my daughter moved in and I started a new job.”",
    completed: ["intake"],
  },
  {
    id: "BO-003",
    number: "03",
    title: "Combined Medicaid, SNAP & TANF renewal",
    shortTitle: "Combined renewal",
    type: "Renewal",
    programs: ["Medicaid", "SNAP", "TANF"],
    caseId: "CASE-BO-2403",
    persona: { name: "Danielle Reed", initials: "DR", description: "Head of household · English" },
    description: "Reconcile electronic data, request only missing verification, and complete a combined renewal.",
    expected: { relationship: "Self", income: "1590", evidence: true },
    facts: [
      { id: "household", label: "Household", question: "Is everyone still at home?", caption: "“Yes, it’s still me and my son. No one moved in or out.”" },
      { id: "income", label: "Current wages", question: "Are wages unchanged?", caption: "“I’m still at the school cafeteria. My gross pay averages $1,590 a month.”" },
      { id: "pregnancy", label: "Coverage", question: "Any coverage changes?", caption: "“No, neither of us has other health coverage.”" },
      { id: "expenses", label: "Expenses", question: "Are deductions current?", caption: "“My rent is still $980 and after-school care is now $180.”" },
    ],
    opening: "“I’m calling to finish my renewal. Most things are the same.”",
    completed: ["intake"],
  },
  {
    id: "BO-004",
    number: "04",
    title: "Medicaid MAGI with non-MAGI screening",
    shortTitle: "MAGI & non-MAGI screen",
    type: "Initial application",
    programs: ["Medicaid"],
    caseId: "CASE-BO-2404",
    persona: { name: "Robert Chen", initials: "RC", description: "Applicant · English" },
    description: "Build tax households, evaluate MAGI, and preserve the required disability-based non-MAGI screen.",
    expected: { relationship: "Self", income: "2140", evidence: true },
    facts: [
      { id: "household", label: "Tax household", question: "Who is on your tax return?", caption: "“I file jointly with my wife and claim our son.”" },
      { id: "income", label: "MAGI income", question: "What is monthly income?", caption: "“Our expected taxable income works out to about $2,140 each month.”" },
      { id: "pregnancy", label: "Disability screen", question: "Does anyone have a disability?", caption: "“I receive dialysis and applied for disability benefits last month.”" },
      { id: "expenses", label: "Coverage", question: "Any other coverage?", caption: "“My old employer coverage ended two months ago.”" },
    ],
    opening: "“I need medical coverage and want to know which pathway applies to me.”",
    completed: ["intake"],
  },
  {
    id: "BO-005",
    number: "05",
    title: "SNAP expedited-service case",
    shortTitle: "SNAP expedited service",
    type: "Initial application",
    programs: ["SNAP"],
    caseId: "CASE-BO-2405",
    persona: { name: "Elena Vega", initials: "EV", description: "Applicant · Spanish captions" },
    description: "Identify expedited criteria, capture liquid resources and shelter costs, and preserve the seven-day clock.",
    expected: { relationship: "Self", income: "125", evidence: true },
    facts: [
      { id: "household", label: "Household", question: "Who buys food together?", caption: "“My baby and I buy and prepare our food together.”" },
      { id: "income", label: "Income", question: "What income is available?", caption: "“I only have $125 in income expected this month.”" },
      { id: "pregnancy", label: "Resources", question: "How much cash is available?", caption: "“I have $32 in my checking account and no cash.”" },
      { id: "expenses", label: "Shelter", question: "What are shelter costs?", caption: "“Rent and utilities together are $860 this month.”" },
    ],
    opening: "“I have almost no food or money left and need to apply today.”",
    completed: ["intake"],
  },
  {
    id: "BO-006",
    number: "06",
    title: "TANF cash-assistance case",
    shortTitle: "TANF cash assistance",
    type: "Initial application",
    programs: ["TANF"],
    caseId: "CASE-BO-2406",
    persona: { name: "Tasha Green", initials: "TG", description: "Applicant · English" },
    description: "Establish the assistance unit, review resources, capture work participation facts, and determine cash eligibility.",
    expected: { relationship: "Self", income: "640", evidence: true },
    facts: [
      { id: "household", label: "Assistance unit", question: "Who is requesting cash?", caption: "“I’m applying for myself and my four-year-old son.”" },
      { id: "income", label: "Income", question: "Do you have earnings?", caption: "“I make about $640 monthly from weekend shifts.”" },
      { id: "pregnancy", label: "Resources", question: "What resources do you own?", caption: "“I have $210 in the bank and a 2011 car I use for work.”" },
      { id: "expenses", label: "Participation", question: "Can you participate in work activities?", caption: "“Yes, if the schedule works with my son’s childcare.”" },
    ],
    opening: "“I’m working limited hours but still can’t cover basic needs for my son.”",
    completed: ["intake"],
  },
];

const callerProfiles = [
  { profile_id: "benefits-calm", label: "Calm", category: "human-services", hume_expression: "calmness", voice_id: null, prompt_instructions: "Speak calmly and cooperatively, with measured pacing.", baseline_intensity: 1, cooperation_style: "open", disclosure_resistance: "low", allowed_transitions: ["calm", "concerned", "confused"] },
  { profile_id: "benefits-anxious", label: "Anxious", category: "human-services", hume_expression: "anxiety", voice_id: null, prompt_instructions: "Sound worried about benefits and deadlines. Ask for reassurance without becoming theatrical.", baseline_intensity: 2, cooperation_style: "needs-reassurance", disclosure_resistance: "moderate", allowed_transitions: ["anxious", "calm", "distressed", "guarded"] },
  { profile_id: "benefits-frustrated", label: "Frustrated", category: "human-services", hume_expression: "frustration", voice_id: null, prompt_instructions: "Sound frustrated by repeated paperwork and delays, but remain realistic and responsive to respectful help.", baseline_intensity: 2, cooperation_style: "conditional", disclosure_resistance: "moderate", allowed_transitions: ["frustrated", "guarded", "calm", "angry"] },
  { profile_id: "benefits-angry", label: "Angry", category: "human-services", hume_expression: "anger", voice_id: null, prompt_instructions: "Speak with controlled anger about the situation. Do not threaten, insult, or become abusive.", baseline_intensity: 3, cooperation_style: "challenging", disclosure_resistance: "high", allowed_transitions: ["angry", "frustrated", "guarded"] },
  { profile_id: "benefits-guarded", label: "Guarded", category: "human-services", hume_expression: "doubt", voice_id: null, prompt_instructions: "Be cautious about sensitive questions and ask why information is needed before answering.", baseline_intensity: 2, cooperation_style: "cautious", disclosure_resistance: "high", allowed_transitions: ["guarded", "reluctant", "calm", "frustrated"] },
  { profile_id: "benefits-reluctant", label: "Reluctant", category: "human-services", hume_expression: "resignation", voice_id: null, prompt_instructions: "Give short answers and require patient, plain-language follow-up before sharing private facts.", baseline_intensity: 2, cooperation_style: "minimal", disclosure_resistance: "high", allowed_transitions: ["reluctant", "guarded", "calm"] },
  { profile_id: "benefits-sad", label: "Sad", category: "human-services", hume_expression: "sadness", voice_id: null, prompt_instructions: "Sound discouraged and low-energy. Respond better to acknowledgment and patient pacing.", baseline_intensity: 2, cooperation_style: "low-energy", disclosure_resistance: "moderate", allowed_transitions: ["sad", "calm", "distressed", "guarded"] },
  { profile_id: "benefits-confused", label: "Confused", category: "human-services", hume_expression: "confusion", voice_id: null, prompt_instructions: "Be uncertain about terminology and dates. Ask for plain-language clarification when jargon is used.", baseline_intensity: 2, cooperation_style: "needs-clarity", disclosure_resistance: "moderate", allowed_transitions: ["confused", "calm", "frustrated"] },
  { profile_id: "benefits-distressed", label: "Distressed", category: "human-services", hume_expression: "distress", voice_id: null, prompt_instructions: "Sound overwhelmed by immediate needs while remaining able to answer one clear question at a time.", baseline_intensity: 3, cooperation_style: "overwhelmed", disclosure_resistance: "moderate", allowed_transitions: ["distressed", "anxious", "sad"] },
  ...[
    ["disgust", "Disgust"], ["anger", "Anger"], ["sarcasm", "Sarcasm"], ["grief", "Grief"],
    ["embarrassment", "Embarrassment"], ["fear", "Fear"], ["disappointment", "Disappointment"],
    ["resignation", "Resignation"], ["savoring", "Savoring"], ["contemplation", "Contemplation"],
    ["awe", "Awe"], ["joy", "Joy"], ["envy", "Envy"], ["horror", "Horror"],
  ].map(([expression, label]) => ({
    profile_id: `expression-${expression}`,
    label,
    category: "all-expressions",
    hume_expression: expression,
    voice_id: null,
    prompt_instructions: `Use a restrained, realistic ${label.toLowerCase()}-influenced delivery appropriate to a benefits application call. Never perform a caricature.`,
    baseline_intensity: 2,
    cooperation_style: ["anger", "disgust", "sarcasm", "envy"].includes(expression) ? "challenging" : "conditional",
    disclosure_resistance: ["anger", "disgust", "sarcasm", "embarrassment", "fear"].includes(expression) ? "high" : "moderate",
    allowed_transitions: [expression, "guarded", "calm"],
  })),
];

const callerIntensity = {
  low: { value: 1, label: "Low", prompt: "Keep the expression subtle and easy to de-escalate." },
  moderate: { value: 2, label: "Moderate", prompt: "Make the expression clearly perceptible but realistic." },
  high: { value: 3, label: "High", prompt: "Make the expression strong while staying safe, coherent, and non-abusive." },
};

const callerVoices = [
  { voice_key: "voice-warm-american-female", voice_id: "8a7dd58c-0cda-4073-9ce6-654184695e99", label: "Warm American Female", presentation: "Female", language: "English", accent: "American", age: "Young" },
  { voice_key: "voice-imani-carter", voice_id: "96ee3964-5f3f-4a5a-be09-393e833aaf0e", label: "Imani Carter", presentation: "Female", language: "English", accent: "Black American", age: "Middle-aged" },
  { voice_key: "voice-caring-mother", voice_id: "97fe9008-8584-4d56-8453-bd8c7ead3663", label: "Caring Mother", presentation: "Female", language: "English", accent: "Midwest", age: "Middle-aged" },
  { voice_key: "voice-charming-cowgirl", voice_id: "3f636d17-44c7-4872-93d1-0c8f51c916a3", label: "Charming Cowgirl", presentation: "Female", language: "English", accent: "Texas", age: "Young" },
  { voice_key: "voice-warm-female-assistant", voice_id: "a623d3ed-612c-413b-b09f-e0a379a317f0", label: "Warm Female Assistant", presentation: "Female", language: "English", accent: "American", age: "Middle-aged" },
  { voice_key: "voice-soft-american-male", voice_id: "b152864b-6720-496a-9d18-eaadb31516ee", label: "Soft Male Conversationalist", presentation: "Male", language: "English", accent: "American", age: "Young" },
  { voice_key: "voice-terrence-bentley", voice_id: "7f633ac4-8181-4e0d-99e1-11a4ef033691", label: "Terrence Bentley", presentation: "Male", language: "English", accent: "Black American", age: "Middle-aged" },
  { voice_key: "voice-colton-rivers", voice_id: "d8ab67c6-953d-4bd8-9370-8fa53a0f1453", label: "Colton Rivers", presentation: "Male", language: "English", accent: "Texas", age: "Middle-aged" },
  { voice_key: "voice-grizzled-new-yorker", voice_id: "9388af0d-4d33-4cdf-8b0a-f003b6cf9455", label: "Grizzled New Yorker", presentation: "Male", language: "English", accent: "New York", age: "Middle-aged" },
  { voice_key: "voice-spanish-instructor", voice_id: "5ac595dd-26ce-4898-961a-b19efa9cd491", label: "Spanish Instructor", presentation: "Male", language: "Spanish", accent: "Mexican", age: "Middle-aged" },
];

const scenarioCallerAssignments = Object.fromEntries(scenarios.map((scenario, index) => [scenario.id, {
  default_profile_id: ["benefits-anxious", "benefits-frustrated", "benefits-calm", "benefits-guarded", "benefits-distressed", "benefits-reluctant"][index] || "benefits-anxious",
  primary_voice_presentation: ["BO-002", "BO-004"].includes(scenario.id) ? "Male" : "Female",
  default_voice_key: ["BO-002", "BO-004"].includes(scenario.id) ? "voice-soft-american-male" : "voice-warm-american-female",
  default_intensity: "moderate",
  allowed_profile_ids: callerProfiles.map((profile) => profile.profile_id),
  allowed_voice_keys: callerVoices.map((voice) => voice.voice_key),
  learner_override_allowed: true,
  assessment_override_allowed: false,
}]));

const HUME_TURN_POLICY = Object.freeze({
  end_of_turn_silence_ms: 2000,
  min_interruption_ms: 1200,
  speech_detection_threshold: 0.5,
  prefix_padding_ms: 300,
  silence_checkin_ms: 20000,
});

function createDefaultContactSequence(scenario, behavior = {}) {
  const application = scenario.integratedCase?.application || {};
  const people = scenario.integratedCase?.people || [];
  const assignment = scenarioCallerAssignments[scenario.id] || {};
  const primaryVoiceKey = behavior.voiceKey || assignment.default_voice_key || "voice-warm-american-female";
  const primaryVoice = callerVoices.find((voice) => voice.voice_key === primaryVoiceKey) || callerVoices[0];
  const primaryProfileId = behavior.profileId || assignment.default_profile_id || "benefits-anxious";
  const intensity = behavior.intensity || "moderate";
  const contacts = people.map((person, index) => {
    const isPrimary = index === 0;
    const alternateVoice = callerVoices.find((voice) => voice.voice_key !== primaryVoiceKey && voice.presentation !== primaryVoice.presentation) || callerVoices.find((voice) => voice.voice_key !== primaryVoiceKey) || primaryVoice;
    const voice = isPrimary ? primaryVoice : alternateVoice;
    return {
      contact_id: `contact:${person.personId || `person-${index + 1}`}`,
      person_id: person.personId || `person-${index + 1}`,
      name: person.name || (isPrimary ? scenario.persona.name : `Household contact ${index + 1}`),
      role: isPrimary ? "applicant" : "household_contact",
      relationship: person.relationship || (isPrimary ? "Self" : "Household member"),
      preferred_language: application.preferredLanguage || "English",
      interpreter_needed: application.interpreterNeeded || "No",
      profile_id: isPrimary ? primaryProfileId : "benefits-calm",
      intensity: isPrimary ? intensity : "low",
      voice_key: voice.voice_key,
      voice_id: voice.voice_id,
      voice_label: voice.label,
      voice_presentation: voice.presentation,
      greeting_mode: isPrimary ? "neutral" : "alternate_answerer",
      greeting: "Hello?",
      knowledge_scope: isPrimary ? "full_application" : "self_and_contact",
      disclosure_authority: isPrimary ? "full" : "limited",
      message_authority: isPrimary ? "full" : "limited",
    };
  });
  if (application.authorizedRepresentative === "Yes" && application.representativeName) {
    const representativeVoice = callerVoices.find((voice) => voice.voice_key !== primaryVoiceKey) || primaryVoice;
    contacts.push({
      contact_id: "contact:authorized-representative",
      person_id: "",
      name: application.representativeName,
      role: "authorized_representative",
      relationship: "Authorized representative",
      preferred_language: application.preferredLanguage || "English",
      interpreter_needed: application.interpreterNeeded || "No",
      profile_id: "benefits-calm",
      intensity: "low",
      voice_key: representativeVoice.voice_key,
      voice_id: representativeVoice.voice_id,
      voice_label: representativeVoice.label,
      voice_presentation: representativeVoice.presentation,
      greeting_mode: "name_only",
      greeting: `Hello, this is ${application.representativeName.split(/\s+/)[0]}.`,
      knowledge_scope: "authorized_application",
      disclosure_authority: "authorized",
      message_authority: "full",
    });
  }
  if (!contacts.length) contacts.push({
    contact_id: "contact:primary",
    person_id: "person-01",
    name: scenario.persona.name,
    role: "applicant",
    relationship: "Self",
    preferred_language: application.preferredLanguage || "English",
    interpreter_needed: application.interpreterNeeded || "No",
    profile_id: primaryProfileId,
    intensity,
    voice_key: primaryVoice.voice_key,
    voice_id: primaryVoice.voice_id,
    voice_label: primaryVoice.label,
    voice_presentation: primaryVoice.presentation,
    greeting_mode: "neutral",
    greeting: "Hello?",
    knowledge_scope: "full_application",
    disclosure_authority: "full",
    message_authority: "full",
  });
  return {
    mode: "direct",
    contacts,
    answering_contact_id: contacts[0].contact_id,
    intended_contact_id: contacts[0].contact_id,
    intended_contact_availability: "available_handoff",
    callback_window: application.bestContactTime || "",
  };
}

function activeSimulationContact(sequence = state.humeSession.contactSequence) {
  return sequence?.contacts?.find((contact) => contact.contact_id === (state.humeSession.activeContactId || sequence.active_contact_id || sequence.answering_contact_id)) || sequence?.contacts?.[0] || null;
}

const attemptVisibilityPolicies = {
  practice: {
    coach: true,
    target_highlights: "on_request",
    policy_help: true,
    correctness_before_submission: true,
    answer_revealing_validation: true,
  },
  assessment: {
    coach: false,
    target_highlights: false,
    policy_help: false,
    correctness_before_submission: false,
    answer_revealing_validation: false,
  },
};

const midsceneTargets = {
  intake: { stable_target_id: "intake-request-summary", semantic_description: "Application request and processing clock", fallback_selector: ".task-list", focus: [9, 23, 55, 42] },
  household: { stable_target_id: "household-relationship", semantic_description: "Relationship to primary applicant field", fallback_selector: "#relationship", focus: [38, 43, 28, 15] },
  programs: { stable_target_id: "program-assistance-units", semantic_description: "Program assistance-unit table", fallback_selector: ".result-matrix", focus: [19, 35, 59, 30] },
  financial: { stable_target_id: "financial-income-calculation", semantic_description: "Income and deduction calculation", fallback_selector: ".calculation-card", focus: [14, 31, 64, 29] },
  nonfinancial: { stable_target_id: "nonfinancial-factor-review", semantic_description: "Nonfinancial eligibility factors", fallback_selector: ".form-panel", focus: [18, 35, 62, 34] },
  evidence: { stable_target_id: "evidence-review-queue", semantic_description: "Evidence and verification review queue", fallback_selector: ".task-list", focus: [17, 32, 64, 36] },
  eligibility: { stable_target_id: "eligibility-result-grid", semantic_description: "Program, person, and month result grid", fallback_selector: ".calculation-card", focus: [14, 33, 66, 30] },
  notices: { stable_target_id: "notice-selection", semantic_description: "Notice and case-comment controls", fallback_selector: ".form-panel", focus: [17, 36, 62, 34] },
  authorization: { stable_target_id: "final-authorization", semantic_description: "Final authorization and call closure", fallback_selector: ".closure-panel", focus: [18, 34, 62, 39] },
};

const coachGuidance = {
  intake: { objective: "Confirm the application type, requested programs, and processing clock.", procedure: "Complete intake before building program-specific units.", policy: "Application dates and expedited indicators control downstream processing deadlines.", citation: `${SPEC_NOTE_ID} · Intake and processing model` },
  household: { objective: "Confirm who lives together and each person’s relationship to the primary applicant.", procedure: "Build the case household before constructing program assistance units.", policy: "Case household, Medicaid tax household, SNAP food unit, and TANF assistance unit can differ.", citation: `${SPEC_NOTE_ID} · Household and assistance-unit model` },
  programs: { objective: "Confirm which people request each program and construct the appropriate units.", procedure: "Use the verified household and program requests to create program-specific membership.", policy: "Program membership must be evaluated independently even when programs share a case.", citation: `${SPEC_NOTE_ID} · Program-unit model` },
  financial: { objective: "Establish gross income, frequency, deductions, expenses, and resources.", procedure: "Review supporting evidence before committing converted monthly values.", policy: "Formal calculations use deterministic package rules; the coach cannot override them.", citation: `${sourceIds.qc} · Financial verification procedure` },
  nonfinancial: { objective: "Confirm residency, citizenship, pregnancy, disability, coverage, and other pathway facts.", procedure: "Ask only the questions needed for the requested programs and required screens.", policy: "A MAGI determination does not remove a required non-MAGI screen when disability facts are present.", citation: `${sourceIds.medicaid} · Pathway screening` },
  evidence: { objective: "Resolve outstanding verification and data-match discrepancies.", procedure: "Open each evidence item, connect it to a case fact, and document unresolved conflicts.", policy: "A value is not considered verified merely because a document is attached.", citation: `${sourceIds.qc} · Verification requirement` },
  eligibility: { objective: "Interpret the program, person, and month results before taking final action.", procedure: "Resolve critical errors and pending verification before authorizing a result.", policy: "AI commentary cannot change a deterministic eligibility or benefit result.", citation: `${SPEC_NOTE_ID} · Deterministic evaluation model` },
  notices: { objective: "Select the cited notice and document the reason for the action.", procedure: "Match the notice to the program result, effective period, and unresolved requirements.", policy: "The final communication must accurately reflect each program’s disposition.", citation: `${SPEC_NOTE_ID} · Notice and communication model` },
  authorization: { objective: "Confirm material facts, explain next steps, close the call, and authorize the prototype result.", procedure: "All critical prerequisites and call-closure steps must be complete first.", policy: "Authorization is program-scoped and does not write to an official case system.", citation: `${SPEC_NOTE_ID} · Authorization boundary` },
};

const stateNeutralCoachPolicyPack = Object.freeze({
  version: "state-neutral-coach-v1",
  jurisdiction: "State-neutral synthetic demonstration",
  supersession_notice: "State/customer policy supersedes this state-neutral demonstration guidance.",
  cards: Object.freeze(Object.fromEntries(Object.entries(coachGuidance).map(([stageId, guidance]) => [stageId, Object.freeze({
    stage_id: stageId,
    summary: guidance.policy,
    scope: ["financial", "evidence"].includes(stageId) ? "Federal baseline / demonstration procedure" : "Demonstration procedure",
    citation: guidance.citation,
    citations: Object.freeze([{ source_id: guidance.citation.split(" · ")[0], label: guidance.citation }]),
  })]))),
});

const coachTargetMetadata = Object.freeze({
  "household-relationship": { fact_id: "household" },
  "household-food-unit": { fact_id: "household" },
  "financial-pay-frequency": { fact_id: "income" },
  "financial-gross-amount": { fact_id: "income" },
  "financial-monthly-income": { fact_id: "income" },
  "nonfinancial-residency": { fact_id: "household" },
  "nonfinancial-citizenship": { safe_to_reveal: false },
  "evidence-wage-review": { safe_to_reveal: true },
  "evidence-wage-match": { safe_to_reveal: true },
  "eligibility-run-reason": { safe_to_reveal: true },
  "eligibility-result-reviewed": { safe_to_reveal: true },
  "notice-type": { safe_to_reveal: true },
  "notice-comments": { safe_to_reveal: false },
  "authorization-facts": { safe_to_reveal: true },
  "authorization-evidence": { safe_to_reveal: true },
  "authorization-next-steps": { safe_to_reveal: true },
  "authorization-summary": { safe_to_reveal: true },
});

scenarios.forEach((scenario) => {
  scenario.coachPolicyPack ||= stateNeutralCoachPolicyPack;
  scenario.coachActionGraphVersion ||= "grounded-coach-v1";
});

productRoutes["screen-packs"] = { label: "Simulate", title: "Screen Packs" };

const demoTargetMap = {
  intake: [
    { target_id: "intake-interview-required", semantic_description: "Interview required", control_type: "select", normalized_bounds: [0.793, 0.415, 0.177, 0.045], options: ["", "Yes", "No"], expected_value_rule: "Yes", provenance: "Procedure", validation_rule_id: "intake-interview" },
    { target_id: "intake-interview-date", semantic_description: "Interview date", control_type: "date", normalized_bounds: [0.793, 0.519, 0.177, 0.045], expected_value_rule: "2026-07-29", provenance: "System", validation_rule_id: "intake-date" },
  ],
  household: [
    { target_id: "household-relationship", semantic_description: "Maya Ortiz relationship", control_type: "select", normalized_bounds: [0.505, 0.433, 0.147, 0.038], options: ["", "Self", "Spouse", "Parent", "Child"], binding: "relationship", expected_value_rule: "scenario.expected.relationship", provenance: "Client statement", validation_rule_id: "household-relationship" },
    { target_id: "household-food-unit", semantic_description: "Purchases and prepares food together", control_type: "select", normalized_bounds: [0.204, 0.647, 0.177, 0.045], options: ["", "Yes", "No"], expected_value_rule: "Yes", provenance: "Client statement", validation_rule_id: "household-food-unit" },
  ],
  programs: [
    { target_id: "program-food-group", semantic_description: "Food assistance group", control_type: "select", normalized_bounds: [0.204, 0.7, 0.177, 0.045], options: ["", "Maya and Elena", "Maya only", "Elena only"], expected_value_rule: "Maya and Elena", provenance: "Worker entry", validation_rule_id: "program-unit" },
    { target_id: "program-expedited", semantic_description: "Expedited screening", control_type: "select", normalized_bounds: [0.393, 0.783, 0.177, 0.045], options: ["", "Screened — no", "Screened — yes"], expected_value_rule: "Screened — no", provenance: "Procedure", validation_rule_id: "program-expedited" },
  ],
  financial: [
    { target_id: "financial-pay-frequency", semantic_description: "Pay frequency", control_type: "select", normalized_bounds: [0.204, 0.499, 0.177, 0.045], options: ["", "Weekly", "Every two weeks", "Twice monthly", "Monthly"], expected_value_rule: "Twice monthly", provenance: "Client statement", validation_rule_id: "financial-frequency" },
    { target_id: "financial-gross-amount", semantic_description: "Gross amount per pay", control_type: "currency", normalized_bounds: [0.393, 0.499, 0.177, 0.045], binding: "incomePerPay", expected_value_rule: "910", provenance: "Document", validation_rule_id: "financial-pay" },
    { target_id: "financial-monthly-income", semantic_description: "Monthly converted income", control_type: "currency", normalized_bounds: [0.204, 0.601, 0.177, 0.045], binding: "income", expected_value_rule: "scenario.expected.income", provenance: "Calculation", validation_rule_id: "financial-monthly" },
  ],
  nonfinancial: [
    { target_id: "nonfinancial-residency", semantic_description: "State residency", control_type: "select", normalized_bounds: [0.393, 0.415, 0.177, 0.045], options: ["", "Resident", "Not resident", "Pending"], expected_value_rule: "Resident", provenance: "Client statement", validation_rule_id: "nonfinancial-residency" },
    { target_id: "nonfinancial-citizenship", semantic_description: "Citizenship status", control_type: "select", normalized_bounds: [0.204, 0.499, 0.177, 0.045], options: ["", "Verified citizen", "Qualified noncitizen", "Pending"], expected_value_rule: "Verified citizen", provenance: "Client statement", validation_rule_id: "nonfinancial-citizenship" },
  ],
  evidence: [
    { target_id: "evidence-wage-review", semantic_description: "Current wage statement", control_type: "button", normalized_bounds: [0.538, 0.468, 0.034, 0.028], label: "Review", expected_value_rule: "reviewed", provenance: "Document", validation_rule_id: "evidence-wage" },
    { target_id: "evidence-wage-match", semantic_description: "Quarterly wage match discrepancy", control_type: "button", normalized_bounds: [0.935, 0.396, 0.037, 0.028], label: "Resolve", expected_value_rule: "resolved", provenance: "Data match", validation_rule_id: "evidence-match" },
  ],
  eligibility: [
    { target_id: "eligibility-run-reason", semantic_description: "Eligibility run reason", control_type: "select", normalized_bounds: [0.393, 0.7, 0.177, 0.045], options: ["", "Initial application", "Reported change", "Renewal"], expected_value_rule: "scenario.type", provenance: "Procedure", validation_rule_id: "eligibility-run-reason" },
    { target_id: "eligibility-result-reviewed", semantic_description: "Result reviewed", control_type: "select", normalized_bounds: [0.604, 0.7, 0.177, 0.045], options: ["", "Yes", "No"], expected_value_rule: "Yes", provenance: "Worker attestation", validation_rule_id: "eligibility-reviewed" },
  ],
  notices: [
    { target_id: "notice-type", semantic_description: "Notice type", control_type: "select", normalized_bounds: [0.204, 0.415, 0.177, 0.045], options: ["", "Approval and pending verification", "Denial", "Request for verification"], expected_value_rule: "Approval and pending verification", provenance: "Procedure", validation_rule_id: "notice-type" },
    { target_id: "notice-comments", semantic_description: "Processing summary", control_type: "textarea", normalized_bounds: [0.604, 0.415, 0.366, 0.125], binding: "notes", expected_value_rule: "nonempty", provenance: "Worker entry", validation_rule_id: "notice-comment" },
  ],
  authorization: [
    { target_id: "authorization-facts", semantic_description: "Material facts confirmed", control_type: "checkbox", normalized_bounds: [0.203, 0.371, 0.36, 0.045], binding: "factsConfirmed", expected_value_rule: "true", provenance: "Worker attestation", validation_rule_id: "closure-facts" },
    { target_id: "authorization-evidence", semantic_description: "Evidence discrepancies resolved", control_type: "checkbox", normalized_bounds: [0.203, 0.44, 0.36, 0.045], binding: "discrepancies", expected_value_rule: "true", provenance: "Worker attestation", validation_rule_id: "closure-evidence" },
    { target_id: "authorization-next-steps", semantic_description: "Next steps explained", control_type: "checkbox", normalized_bounds: [0.203, 0.592, 0.36, 0.045], binding: "nextSteps", expected_value_rule: "true", provenance: "Worker attestation", validation_rule_id: "closure-next" },
    { target_id: "authorization-summary", semantic_description: "Closing summary provided", control_type: "select", normalized_bounds: [0.604, 0.753, 0.177, 0.045], options: ["", "Yes", "No"], binding: "closingSummary", expected_value_rule: "Yes", provenance: "Client communication", validation_rule_id: "closure-summary" },
  ],
};

function scenarioTargetsForStage(stageId, scenario = getScenario()) {
  const targets = (demoTargetMap[stageId] || []).filter((target) => {
    if (["household-food-unit", "program-food-group", "program-expedited"].includes(target.target_id)) return scenario.programs.includes("SNAP");
    return true;
  });
  const people = scenario.integratedCase?.people || [];
  const foodUnit = people.map((person) => person.name).filter(Boolean).join(people.length > 2 ? ", " : " and ").replace(/, ([^,]+)$/, ", and $1");
  const ledgerValue = (path) => scenario.truthLedger?.find((fact) => fact.case_path === path)?.normalized_value;
  const overrides = {
    "intake-interview-date": { expected_value_rule: scenario.integratedCase?.application?.receivedDate || "2026-07-29" },
    "household-relationship": { semantic_description: `${scenario.persona.name} relationship`, expected_value_rule: "Self" },
    "program-food-group": { semantic_description: "Food assistance group", expected_value_rule: foodUnit, options: ["", foodUnit, ...people.map((person) => `${person.name} only`)] },
    "program-expedited": { expected_value_rule: scenario.id === "BO-005" ? "Screened — yes" : "Screened — no" },
    "financial-pay-frequency": { expected_value_rule: ledgerValue("incomeSources.0.frequency") || scenario.integratedCase?.incomeSources?.[0]?.frequency || "Monthly" },
    "financial-gross-amount": { expected_value_rule: ledgerValue("incomeSources.0.grossAmount") || scenario.integratedCase?.incomeSources?.[0]?.grossAmount || scenario.expected.income },
  };
  return targets.map((target) => ({ ...target, ...(overrides[target.target_id] || {}) }));
}

const eligibilitySystemDefinition = {
  system_id: "eligibility-system:benefitconnect-demo",
  version: "v3.0-integrated-demo",
  status: "frozen",
  label: "BenefitConnect",
  description: "Synthetic eligibility workspace",
  utilities: ["Documents", "Case notes", "Help"],
  stages: workflow.map((item, index) => ({ stage_id: item.id, label: item.label, order: index + 1 })),
  targets: Object.entries(demoTargetMap).flatMap(([stageId, targets]) => targets.map((target) => ({
    ...target,
    stage_id: stageId,
    dom_selector: `[data-target-id="${target.target_id}"]`,
  }))),
};

const federalFeedbackRubric = {
  rubric_id: "rubric:blueorigin-federal-benefits-v1",
  version: "2026.07-provisional",
  effective_date: "2026-07-29",
  jurisdiction: "Federal baseline; state and customer policy supersede",
  processing_weight: 60,
  interview_weight: 40,
  sources: [
    { program: "SNAP", label: "FNS Handbook 310", url: "https://snapqcs.fns.usda.gov/Welcome/Doc/FNS310Handbook.pdf", note_id: sourceIds.qc },
    { program: "SNAP", label: "USDA SNAP Interview Toolkit", url: "https://www.fns.usda.gov/snap/state/interview-toolkit", note_id: sourceIds.snap },
    { program: "SNAP", label: "Exploring household circumstances", url: "https://www.fns.usda.gov/snap/state/interview-toolkit/conducting/exploring", note_id: sourceIds.snap },
    { program: "SNAP", label: "Concluding interviews", url: "https://www.fns.usda.gov/snap/state/interview-toolkit/concluding", note_id: sourceIds.snap },
    { program: "Medicaid", label: "CMS eligibility verification policies", url: "https://www.medicaid.gov/medicaid/national-medicaid-chip-program-information/eligibility-verification-policies", note_id: sourceIds.medicaid },
    { program: "Medicaid", label: "CMS renewal strategies and tools", url: "https://www.medicaid.gov/resources-for-states/eligibility-enrollment-and-renewal-tools-and-resources/renewal-strategies-and-tools", note_id: sourceIds.medicaid },
    { program: "TANF", label: "Federal integrity baseline + scenario state sources", url: "https://www.acf.hhs.gov/ofa/programs/tanf", note_id: sourceIds.tanf, provisional: true },
  ],
  critical_errors: ["incorrect_authorization", "required_verification_unresolved", "materially_incorrect_notice", "critical_discrepancy_unresolved"],
};

scenarios.forEach((scenario) => {
  const baseCase = BenefitConnectIntegrated.createCase(scenario);
  const bundle = window.BlueOriginDemoScenarios?.compileScenario?.(
    scenario,
    baseCase,
    callerVoices,
    scenarioCallerAssignments[scenario.id],
  );
  scenario.integratedCase = bundle?.integratedCase || baseCase;
  scenario.contactSequence = bundle?.contactSequence || createDefaultContactSequence(scenario);
  scenario.truthLedger = bundle?.truthLedger || [];
  scenario.interviewFacts = bundle?.interviewFacts || [];
  scenario.coachJourney = bundle?.coachJourney || [];
  scenario.demoCaseValidation = bundle?.validation || { valid: true, errors: [] };
  scenario.demoCaseBundleVersion = bundle?.version || "legacy-demo-case";
  scenario.callerBrief = buildDemoCallerBriefDefinition(scenario, scenario.integratedCase);
  scenario.trainingTargets = workflow.flatMap(({ id: stageId }) => scenarioTargetsForStage(stageId, scenario).map((target) => ({ ...target, stageId })));
  scenario.authoredOutcomeVariants = scenario.integratedCase.authoredOutcomes;
});

function createDemoScreenPack() {
  const now = "2026-07-29T10:00:00-07:00";
  return {
    screen_pack_id: "screen-pack:blueorigin-demo-v1",
    customer_label: "BlueOrigin eligibility demonstration",
    version: "v1.0",
    status: "frozen",
    source_system_label: "BenefitConnect synthetic eligibility workspace",
    design_reference: "Public-benefits case-management patterns informed by MI Bridges; not a Michigan or customer system",
    sanitization_attestation: true,
    created_at: now,
    screens: workflow.map((item) => ({
      screen_id: `screen:${item.id}`,
      workflow_stage_id: item.id,
      state_id: `${item.id}:default`,
      image_reference: `assets/demo-screen-pack/${item.id}.png`,
      original_width: 1280,
      original_height: 720,
      accessible_name: `${item.label} synthetic eligibility-system screen`,
      variant_of: null,
      required_targets: (demoTargetMap[item.id] || []).map((target) => target.target_id),
    })),
    interaction_targets: Object.values(demoTargetMap).flat().map((target) => ({ ...target, screen_id: `screen:${Object.entries(demoTargetMap).find(([, targets]) => targets.includes(target))[0]}`, editable: true, midscene_fallback_description: target.semantic_description, approved: true })),
    transitions: workflow.slice(0, -1).map((item, index) => ({ transition_id: `transition:${item.id}-${workflow[index + 1].id}`, from_screen_id: `screen:${item.id}`, to_screen_id: `screen:${workflow[index + 1].id}`, trigger: "validated_continue" })),
    required_scenario_paths: workflow.map((item) => item.id),
  };
}

function buildCaseStartingState(scenario) {
  const isInitial = scenario.type === "Initial application";
  const isRenewal = scenario.type === "Renewal";
  const application = scenario.integratedCase?.application || {};
  const primaryApplicant = scenario.integratedCase?.people?.[0] || {};
  const receivedDate = application.receivedDate || "2026-07-29";
  return {
    scenario_id: scenario.id,
    application_type: scenario.type,
    existing_case: !isInitial,
    initial_screen: "household",
    application_received_at: `${receivedDate}T08:12:00-07:00`,
    prefilled_fields: {
      fullName: { value: primaryApplicant.name || scenario.persona.name, provenance: isInitial ? "Application" : "Existing case", verification_status: "verified", editable: false },
      dateOfBirth: { value: primaryApplicant.dateOfBirth || "", provenance: isInitial ? "Application" : "Existing case", verification_status: primaryApplicant.dateOfBirth ? "verified" : "missing", editable: false },
      programs: { value: scenario.programs.join(", "), provenance: isInitial ? "Application" : "Existing case", verification_status: "confirmed", editable: false },
      relationship: { value: isInitial ? "" : "Self", provenance: isInitial ? "Client statement" : "Existing case", verification_status: isInitial ? "missing" : "requires confirmation", editable: true },
      income: { value: "", provenance: isRenewal ? "Existing case" : isInitial ? "Document" : "Reported change", verification_status: "requires review", editable: true },
    },
    reported_changes: scenario.type === "Reported change" ? ["Household member added", "New earned income", "Shelter cost changed"] : isRenewal ? ["Renewal response received", "Electronic wage match available"] : ["Reduced work hours reported", "Pregnancy reported"],
    evidence: [
      { evidence_id: `evidence:${scenario.id.toLowerCase()}-application`, title: isInitial ? "Submitted application" : isRenewal ? "Renewal form" : "Reported-change form", provenance: "Application", status: "available" },
      { evidence_id: `evidence:${scenario.id.toLowerCase()}-wage`, title: "Current wage statement.pdf", provenance: "Document", status: "review required" },
      { evidence_id: `evidence:${scenario.id.toLowerCase()}-match`, title: "Electronic wage match", provenance: "Data match", status: "review required" },
    ],
  };
}

const state = {
  route: "home",
  role: "author",
  openNotebook: { notebook: null, sources: [], notes: [], loading: true, error: null, live: false },
  selectedSourceIds: new Set(),
  selectedNoteIds: new Set(),
  creationDrafts: { video: null, quiz: null, simulation: null },
  creatorStep: { video: 1, quiz: 1, simulation: 1 },
  simulationAuthoring: null,
  previewScenarioIndex: null,
  quizAnswers: {},
  quizSubmitted: false,
  assignments: [
    { id: "assignment:bo-001", title: "Combined Medicaid, SNAP & TANF initial application", due: "Aug 2", status: "In progress", package: "BO-001 · v0.1" },
    { id: "assignment:bo-005", title: "SNAP expedited-service case", due: "Aug 6", status: "Not started", package: "BO-005 · v0.1" },
  ],
  searchQuery: "",
  draft: null,
  latestAttempt: null,
  repositoryHistory: [],
  learnerProfile: { skills: [], recommendations: [], trend: [], strengths: [], gaps: [] },
  performanceLoading: false,
  performanceError: null,
  lighthouseReturn: null,
  attemptSyncStatus: "idle",
  writeMode: "source",
  pendingPublishType: null,
  scenarioIndex: 0,
  activeScreen: "household",
  mode: "practice",
  visibilityPolicy: attemptVisibilityPolicies.practice,
  caseStartingState: null,
  evidenceReviewed: false,
  caseDraft: BenefitConnectIntegrated.clone(scenarios[0].integratedCase),
  mockEligibility: { status: "unrun", variant: null, lastRunAt: null },
  openCaseSections: null,
  disclosedFacts: new Set(),
  conversationFactEvents: [],
  pendingLearnerQuestion: "",
  handoffCompleted: false,
  handoffAttempted: false,
  callbackDisposition: null,
  guidedFollow: true,
  elapsed: 0,
  validated: false,
  assessmentRecorded: false,
  householdComplete: false,
  submitted: false,
  callEnded: false,
  presenterMode: false,
  coachTab: "client",
  hintLevel: 0,
  highlightedTargetId: null,
  events: [],
  voiceTurns: [],
  screenSnapshots: [],
  observationEvents: [],
  closure: { discrepancies: false, factsConfirmed: false, nextSteps: false, closingSummary: false },
  form: { relationship: "", income: "", notes: "" },
  screenPack: null,
  selectedPackScreen: "household",
  uploadedScreenPack: null,
  screenValues: {},
  validatedScreens: new Set(),
  screenZoom: 1,
  coachCollapsed: false,
  coachPanelWidth: 380,
  systemNavigationOpen: false,
  callPhase: "preflight",
  callConnected: false,
  humeSession: { status: "preflight", connectionPhase: "idle", connectionAttemptId: null, firstAudioReceived: false, runtimeError: null, client: null, socket: null, recorder: null, stream: null, playback: null, configured: false, sessionId: null, sessionProof: null, serverSelection: null, volume: 0.8, muted: false, paused: false, activeContactId: null, contactSequence: null, contextRevision: 0, silenceTimer: null, silenceCheckinSent: false, lastActivityAt: 0, interruptedResponseIds: new Set(), currentResponseId: null, handoffInProgress: false, pendingFactIds: [] },
  selectedCallerProfileId: "benefits-anxious",
  selectedCallerIntensity: "moderate",
  selectedCallerVoiceKey: "voice-warm-american-female",
  voicePreviewAudio: null,
  callerProfileCategory: "human-services",
  callerProfileSearch: "",
  callerAffectTimeline: [],
  learnerAffect: { state: "neutral", label: "Listening", trend: "steady", confidence: 0 },
  callerAffect: { state: "anxious", label: "Concern present", trend: "steady", confidence: 0.68 },
  affectObservations: [],
  applicationContextEnvelope: null,
  coachRecommendation: null,
  coachRecommendationCache: new Map(),
  coachRequestController: null,
  coachRequestTimer: null,
  lastValidation: null,
  compositeSnapshots: [],
  feedbackFilter: "all",
  feedbackSelectedEventId: null,
  pendingExitIntent: null,
  savedIncompleteAttempt: null,
};

const dom = {
  appShell: document.querySelector("#appShell"),
  workflowNav: document.querySelector("#workflowNav"),
  screenContent: document.querySelector("#screenContent"),
  programStrip: document.querySelector("#programStrip"),
  scenarioTitle: document.querySelector("#scenarioTitle"),
  sidebarScenarioTitle: document.querySelector("#sidebarScenarioTitle"),
  scenarioNumber: document.querySelector("#scenarioNumber"),
  caseId: document.querySelector("#caseId"),
  packageVersion: document.querySelector("#packageVersion"),
  clientName: document.querySelector("#clientName"),
  clientDescription: document.querySelector("#clientDescription"),
  clientPortrait: document.querySelector("#clientPortrait"),
  clientCaption: document.querySelector("#clientCaption"),
  disclosureLabel: document.querySelector("#disclosureLabel"),
  disclosureTime: document.querySelector("#disclosureTime"),
  promptGrid: document.querySelector("#promptGrid"),
  factsRevealed: document.querySelector("#factsRevealed"),
  evaluationEmpty: document.querySelector("#evaluationEmpty"),
  evaluationResult: document.querySelector("#evaluationResult"),
  evaluationModeLabel: document.querySelector("#evaluationModeLabel"),
  primaryActionButton: document.querySelector("#primaryActionButton"),
  reviewEvidenceButton: document.querySelector("#reviewEvidenceButton"),
  eventTrace: document.querySelector("#eventTrace"),
  eventCount: document.querySelector("#eventCount"),
  eventTraceToggle: document.querySelector("#eventTraceToggle"),
  presenterToggle: document.querySelector("#presenterToggle"),
  midscenePresenter: document.querySelector("#midscenePresenter"),
  midsceneStatus: document.querySelector("#midsceneStatus"),
  midsceneTarget: document.querySelector("#midsceneTarget"),
  midsceneConfidence: document.querySelector("#midsceneConfidence"),
  midsceneFocus: document.querySelector("#midsceneFocus"),
  midsceneFrameLabel: document.querySelector("#midsceneFrameLabel"),
  activitySnapshotCount: document.querySelector("#activitySnapshotCount"),
  coachHintLevel: document.querySelector("#coachHintLevel"),
  coachHintPanel: document.querySelector("#coachHintPanel"),
  coachActionType: document.querySelector("#coachActionType"),
  coachActionTitle: document.querySelector("#coachActionTitle"),
  coachInstruction: document.querySelector("#coachInstruction"),
  coachInformation: document.querySelector("#coachInformation"),
  coachProvenance: document.querySelector("#coachProvenance"),
  coachDestination: document.querySelector("#coachDestination"),
  coachDestinationDetail: document.querySelector("#coachDestinationDetail"),
  coachPolicyCard: document.querySelector("#coachPolicyCard"),
  coachPolicyScope: document.querySelector("#coachPolicyScope"),
  coachPolicySummary: document.querySelector("#coachPolicySummary"),
  coachCitation: document.querySelector("#coachCitation"),
  coachAssessmentLock: document.querySelector("#coachAssessmentLock"),
  coachPracticeContent: document.querySelector("#coachPracticeContent"),
  requestHintButton: document.querySelector("#requestHintButton"),
  policyGuideButton: document.querySelector("#policyGuideButton"),
  locateTargetButton: document.querySelector("#locateTargetButton"),
  scenarioDialog: document.querySelector("#scenarioDialog"),
  scenarioGrid: document.querySelector("#scenarioGrid"),
  feedbackView: document.querySelector("#feedbackView"),
  feedbackBody: document.querySelector("#feedbackBody"),
  callExitDialog: document.querySelector("#callExitDialog"),
  confirmCallExit: document.querySelector("#confirmCallExit"),
  backFromCall: document.querySelector("#backFromCall"),
  workflowProgress: document.querySelector("#workflowProgress"),
  workflowSidebar: document.querySelector("#workflowSidebar"),
  coachPanel: document.querySelector("#coachPanel"),
  timer: document.querySelector("#timer"),
  toastRegion: document.querySelector("#toastRegion"),
  writeDialog: document.querySelector("#writeDialog"),
  writeForm: document.querySelector("#writeForm"),
  workflowCollapseButton: document.querySelector("#workflowCollapseButton"),
  previousScreenButton: document.querySelector("#previousScreenButton"),
  endCallTop: document.querySelector("#endCallTop"),
  audioButton: document.querySelector("#audioButton"),
  pauseCallerButton: document.querySelector("#pauseCallerButton"),
  humeConnection: document.querySelector("#humeConnection"),
  humeConnectionLabel: document.querySelector("#humeConnectionLabel"),
  callStateLabel: document.querySelector("#callStateLabel"),
  callerSignalTitle: document.querySelector("#callerSignalTitle"),
  callerSignalTrend: document.querySelector("#callerSignalTrend"),
  callerProfileSummary: document.querySelector("#callerProfileSummary"),
  callerProfileDetail: document.querySelector("#callerProfileDetail"),
  callerStateDetail: document.querySelector("#callerStateDetail"),
  learnerAffectDetail: document.querySelector("#learnerAffectDetail"),
  callerTriggerHistory: document.querySelector("#callerTriggerHistory"),
  humeExpressionScores: document.querySelector("#humeExpressionScores"),
  liveChecklist: document.querySelector("#liveChecklist"),
  liveTranscript: document.querySelector("#liveTranscript"),
  midsceneImage: document.querySelector("#midsceneImage"),
};

function getScenario() {
  return scenarios[state.scenarioIndex];
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function captureEventSnapshot(event, reason = event.action, options = {}) {
  const stageId = options.stageId || state.activeScreen;
  const snapshot = {
    snapshot_id: `snapshot:bo-${Date.now()}-${state.screenSnapshots.length + 1}`,
    event_id: event.event_id,
    attempt_id: event.attempt_id,
    captured_at: event.timestamp,
    time: event.time,
    screen: stageId,
    target: event.target,
    reason,
    image_ref: "",
    eligibility_system_id: eligibilitySystemDefinition.system_id,
    eligibility_system_version: eligibilitySystemDefinition.version,
    screen_pack_id: null,
    screen_id: `stage:${stageId}`,
    screen_state_id: `${stageId}:html-default`,
    target_id: event.target || null,
    composite_snapshot_id: `composite:bo-${Date.now()}-${state.compositeSnapshots.length + 1}`,
    call_turn_id: state.voiceTurns[0]?.voice_turn_id || null,
    coach_recommendation_id: state.coachRecommendation?.recommendation_id || state.coachRecommendation?.coach_recommendation_id || null,
    visible_state: {
      relationship: state.form.relationship || "blank",
      income: state.form.income || "blank",
      evidence_reviewed: state.evidenceReviewed,
      disclosed_fact_ids: [...state.disclosedFacts],
      mode: state.mode,
      unvisited: Boolean(options.unvisited),
    },
  };
  state.screenSnapshots.unshift(snapshot);
  state.compositeSnapshots.unshift({
    composite_snapshot_id: snapshot.composite_snapshot_id,
    eligibility_system_id: snapshot.eligibility_system_id,
    eligibility_system_version: snapshot.eligibility_system_version,
    screen_pack_id: null,
    screen_id: snapshot.screen_id,
    image_reference: snapshot.image_ref,
    overlay_values: { ...(state.screenValues[state.activeScreen] || {}) },
    coach_recommendation_id: snapshot.coach_recommendation_id,
    captured_at: snapshot.captured_at,
  });
  state.observationEvents.unshift({
    observation_event_id: `observation:bo-${Date.now()}-${state.observationEvents.length + 1}`,
    capture_event_id: event.event_id,
    snapshot_id: snapshot.snapshot_id,
    source: "midscene-html-workspace-adapter",
    authority: "guide_and_observe_only",
    semantic_target_id: snapshot.target_id || demoTargetMap[state.activeScreen]?.[0]?.target_id || state.activeScreen,
    confidence: state.highlightedTargetId ? "dom_target_observed" : "stable_dom_target",
  });
  const sourceElement = options.element || document.querySelector(".eligibility-system");
  if (sourceElement && window.html2canvas) {
    window.html2canvas(sourceElement, {
      backgroundColor: "#eef3f5",
      scale: Math.min(1.5, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: sourceElement.scrollWidth,
      windowHeight: sourceElement.scrollHeight,
    }).then((canvas) => {
      snapshot.image_ref = canvas.toDataURL("image/png", 0.9);
      const composite = state.compositeSnapshots.find((item) => item.composite_snapshot_id === snapshot.composite_snapshot_id);
      if (composite) composite.image_reference = snapshot.image_ref;
      renderMidscenePresenter(snapshot);
    }).catch(() => {
      snapshot.capture_error = "Rendered DOM capture unavailable";
    });
  }
  renderMidscenePresenter(snapshot);
  return snapshot;
}

async function waitForSnapshot(snapshot, timeout = 1800) {
  const started = Date.now();
  while (!snapshot.image_ref && Date.now() - started < timeout) await new Promise((resolve) => window.setTimeout(resolve, 30));
  return snapshot;
}

async function captureFinalStageSnapshots(attemptId) {
  const previousStage = state.activeScreen;
  const previousSections = state.openCaseSections;
  const visitedStages = new Set(state.events.filter((event) => event.screen).map((event) => event.screen));
  const host = document.createElement("div");
  host.className = "feedback-capture-host";
  document.body.append(host);
  for (const stage of workflow) {
    state.activeScreen = stage.id;
    state.openCaseSections = null;
    host.innerHTML = renderEligibilityWorkspace();
    const event = {
      event_id: `capture:final-${stage.id}-${Date.now()}`,
      attempt_id: attemptId,
      timestamp: new Date().toISOString(),
      time: formatTime(state.elapsed),
      action: "final_stage_reconstruction",
      label: `${stage.label} final case state`,
      target: `screen:${stage.id}`,
    };
    const snapshot = captureEventSnapshot(event, "final_stage_reconstruction", { stageId: stage.id, element: host.querySelector(".eligibility-system"), unvisited: !visitedStages.has(stage.id) });
    snapshot.final_reconstruction = true;
    await waitForSnapshot(snapshot);
  }
  host.remove();
  state.activeScreen = previousStage;
  state.openCaseSections = previousSections;
}

function renderMidscenePresenter(snapshot = state.screenSnapshots[0]) {
  if (!dom.midscenePresenter) return;
  dom.midscenePresenter.hidden = !state.presenterMode;
  dom.presenterToggle?.setAttribute("aria-pressed", state.presenterMode.toString());
  dom.presenterToggle?.classList.toggle("active", state.presenterMode);
  if (dom.activitySnapshotCount) dom.activitySnapshotCount.textContent = `${state.screenSnapshots.length} snapshot${state.screenSnapshots.length === 1 ? "" : "s"}`;
  const target = midsceneTargets[state.activeScreen];
  if (dom.midsceneTarget) dom.midsceneTarget.textContent = target?.semantic_description || "Current eligibility screen";
  if (dom.midsceneConfidence) dom.midsceneConfidence.textContent = state.highlightedTargetId ? "DOM target located" : "Stable DOM target";
  if (dom.midsceneStatus) dom.midsceneStatus.textContent = state.presenterMode ? "Midscene observing" : "Observation active";
  if (dom.midsceneFrameLabel) dom.midsceneFrameLabel.textContent = snapshot ? `${snapshot.time} · ${workflow.find((item) => item.id === snapshot.screen)?.label || snapshot.screen} · ${snapshot.reason.replaceAll("_", " ")}` : "Waiting for a meaningful event";
  if (dom.midsceneImage && snapshot?.image_ref) dom.midsceneImage.src = snapshot.image_ref;
  if (dom.midsceneFocus) dom.midsceneFocus.hidden = true;
}

function clearMidsceneHighlight() {
  document.querySelectorAll(".midscene-target-highlight").forEach((element) => element.classList.remove("midscene-target-highlight"));
  state.highlightedTargetId = null;
  if (dom.midsceneFocus) dom.midsceneFocus.hidden = true;
}

function locateCurrentTarget() {
  if (!state.visibilityPolicy.target_highlights) return;
  const recommendation = state.coachRecommendation;
  const target = recommendation?.target;
  if (!target) return showToast("No field to locate", "Complete or select the next workflow action shown in the coach.", "•");
  const locate = () => {
    clearMidsceneHighlight();
    const selector = target.target_id ? `[data-target-id="${CSS.escape(target.target_id)}"]`
      : target.case_path ? `[data-case-path="${CSS.escape(target.case_path)}"]`
        : target.action_id === "validate-screen" ? "#primaryActionButton"
          : target.action_id === "end-call" ? "#endCallTop"
            : target.action_id === "submit-attempt" ? "#primaryActionButton"
              : target.action_id ? `[data-case-action="${CSS.escape(target.action_id)}"]` : null;
    const element = selector ? document.querySelector(selector) : null;
    if (!element) return showToast("Target unavailable", "The recommendation changed before the field could be located. Refresh the guidance and try again.", "!");
    const accordion = element.closest("details.bc-accordion");
    if (accordion && !accordion.open) accordion.open = true;
    state.highlightedTargetId = target.target_id || target.case_path || target.action_id;
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const focusable = element.matches("label") ? element.querySelector("input,select,textarea,button") : element;
    focusable?.focus({ preventScroll: true });
    element.classList.add("located");
    addEvent("midscene", `Located ${target.label}`, { target: state.highlightedTargetId, after: "stable_dom_target", sequenceStatus: "hint_requested", citation: recommendation.policy?.citation });
    renderMidscenePresenter();
    window.setTimeout(() => {
      element.classList.remove("located");
      state.highlightedTargetId = null;
      renderMidscenePresenter();
    }, 5200);
  };
  if (target.stage_id && target.stage_id !== state.activeScreen) {
    navigateWorkflowScreen(target.stage_id, "AI coach field locator");
    window.requestAnimationFrame(() => window.requestAnimationFrame(locate));
  } else locate();
}

function focusConversationFactDestination(factEvent) {
  if (!factEvent?.case_path || state.mode !== "practice" || !state.guidedFollow) return;
  const stage = factEvent.destination_stage || (factEvent.case_path.startsWith("people.") ? "household" : factEvent.case_path.startsWith("incomeSources.") || factEvent.case_path.startsWith("expenses.") || factEvent.case_path.startsWith("resources") ? "financial" : factEvent.case_path.startsWith("nonfinancial.") ? "nonfinancial" : "intake");
  const locate = () => {
    const element = document.querySelector(`[data-case-path="${CSS.escape(factEvent.case_path)}"]`);
    if (!element) return;
    const accordion = element.closest("details.bc-accordion");
    if (accordion) accordion.open = true;
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    element.focus({ preventScroll: true });
    element.classList.add("located");
    state.highlightedTargetId = factEvent.case_path;
    addEvent("midscene", `Coach opened ${factEvent.label}`, { target: `case:${factEvent.case_path}`, after: "guided_follow", sequenceStatus: "caller_fact_destination", citation: `${SPEC_NOTE_ID} · Conversation fact mapping` });
    window.setTimeout(() => {
      element.classList.remove("located");
      if (state.highlightedTargetId === factEvent.case_path) state.highlightedTargetId = null;
    }, 5200);
  };
  if (stage && stage !== state.activeScreen) {
    navigateWorkflowScreen(stage, "proactive coach");
    window.requestAnimationFrame(() => window.requestAnimationFrame(locate));
  } else window.requestAnimationFrame(locate);
}

function setCoachTab(tab) {
  state.coachTab = tab;
  document.querySelectorAll("[data-coach-tab]").forEach((button) => {
    const active = button.dataset.coachTab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active.toString());
  });
  document.querySelectorAll("[data-coach-view]").forEach((view) => {
    const active = view.dataset.coachView === tab;
    view.classList.toggle("active", active);
    view.hidden = !active;
  });
  if (tab === "activity") {
    document.querySelector(".presenter-disclosure")?.setAttribute("open", "");
    renderMidscenePresenter();
  }
}

function coachValueFor(stageId, target) {
  if (target.binding && target.binding in state.closure) return state.closure[target.binding];
  if (target.binding && target.binding in state.form) return state.form[target.binding];
  return state.screenValues[stageId]?.[target.target_id] ?? "";
}

function mappedCoachTarget(stageId, target) {
  const metadata = coachTargetMetadata[target.target_id] || {};
  const fact = metadata.fact_id ? getScenario().facts.find((item) => item.id === metadata.fact_id) : null;
  return {
    target_id: target.target_id,
    case_path: target.case_path || null,
    label: target.semantic_description,
    stage_id: stageId,
    value: coachValueFor(stageId, target),
    expected_value: expectedTargetValue(target),
    provenance: target.provenance || "Demonstration procedure",
    fact_id: fact?.id || null,
    fact_disclosed: fact ? state.disclosedFacts.has(fact.id) : false,
    question: fact?.question || null,
    safe_to_reveal: Boolean(metadata.safe_to_reveal),
  };
}

function collectVisibleCoachFields() {
  return [...document.querySelectorAll(".eligibility-system [data-target-id],.eligibility-system [data-case-path]")].filter((element) => element.getClientRects().length).map((element) => ({
    target_id: element.dataset.targetId || null,
    case_path: element.dataset.casePath || null,
    label: element.dataset.caseLabel || element.getAttribute("aria-label") || element.closest(".bc-field")?.querySelector(":scope > span")?.childNodes?.[0]?.textContent?.trim() || "Eligibility field",
    control_type: element.matches("select") ? "select" : element.matches("textarea") ? "textarea" : element.getAttribute("type") || element.tagName.toLowerCase(),
    value_present: element.matches('input[type="checkbox"]') ? element.checked : Boolean(element.value),
  })).slice(0, 80);
}

function buildCoachContext() {
  const activeIndex = workflow.findIndex((item) => item.id === state.activeScreen);
  const nextStage = workflow[activeIndex + 1] || null;
  const validationFailures = state.lastValidation?.stage_id === state.activeScreen ? state.lastValidation.checks.filter((check) => !check.correct).map((check) => ({ target_id: check.key, label: check.title, stage_id: state.activeScreen })) : [];
  const visibleTargetIds = new Set([...document.querySelectorAll(".eligibility-system [data-target-id]")].filter((element) => element.getClientRects().length).map((element) => element.dataset.targetId));
  return {
    scenarioId: getScenario().id,
    stageId: state.activeScreen,
    stageLabel: workflow[activeIndex]?.label || state.activeScreen,
    mode: state.mode,
    targets: scenarioTargetsForStage(state.activeScreen).filter((target) => visibleTargetIds.has(target.target_id)).map((target) => mappedCoachTarget(state.activeScreen, target)),
    visibleFields: collectVisibleCoachFields(),
    evidenceReviewed: state.evidenceReviewed,
    evidenceTarget: mappedCoachTarget("evidence", demoTargetMap.evidence[0]),
    mockEligibilityStatus: state.mockEligibility.status,
    currentStageValidated: state.validatedScreens.has(state.activeScreen),
    validatedScreens: [...state.validatedScreens],
    validationFailures,
    callEnded: state.callEnded,
    nextStage,
    nextStageTarget: nextStage && scenarioTargetsForStage(nextStage.id)[0] ? mappedCoachTarget(nextStage.id, scenarioTargetsForStage(nextStage.id)[0]) : null,
    policyPack: getScenario().coachPolicyPack || stateNeutralCoachPolicyPack,
  };
}

function renderCoachRecommendation(recommendation, enhanced = false) {
  if (!recommendation) return;
  state.coachRecommendation = recommendation;
  const stageLabel = workflow.find((item) => item.id === recommendation.target?.stage_id)?.label || recommendation.target?.stage_id || "Current workflow";
  const information = recommendation.information?.value != null ? recommendation.information.value
    : recommendation.action_type === "ask" ? recommendation.information?.question || "Ask the caller for the missing fact"
      : recommendation.action_type === "review" ? "Review the linked evidence"
        : recommendation.action_type === "navigate" ? "Current screen complete"
          : "Use the supported case information";
  const destination = recommendation.target?.label ? `${stageLabel} → ${recommendation.target.label}` : stageLabel;
  if (dom.coachHintLevel) dom.coachHintLevel.textContent = enhanced ? "AI phrased · grounded" : "Grounded";
  if (dom.coachActionType) dom.coachActionType.textContent = recommendation.action_label || recommendation.action_type;
  if (dom.coachActionTitle) dom.coachActionTitle.textContent = recommendation.title;
  if (dom.coachInstruction) dom.coachInstruction.textContent = recommendation.instruction;
  if (dom.coachInformation) dom.coachInformation.textContent = information;
  if (dom.coachProvenance) dom.coachProvenance.textContent = recommendation.information?.disclosed ? `${recommendation.information.provenance} · disclosed` : recommendation.information?.provenance || "Approved workflow source";
  if (dom.coachDestination) dom.coachDestination.textContent = destination;
  if (dom.coachDestinationDetail) dom.coachDestinationDetail.textContent = recommendation.target?.target_id || recommendation.target?.case_path || recommendation.target?.action_id || "Workflow action";
  if (dom.coachPolicyScope) dom.coachPolicyScope.textContent = recommendation.policy?.scope || "Demonstration procedure";
  if (dom.coachPolicySummary) dom.coachPolicySummary.textContent = recommendation.policy?.summary || "Follow the approved demonstration workflow.";
  if (dom.coachCitation) dom.coachCitation.textContent = recommendation.policy?.citation || "Integrated eligibility specification";
  if (dom.coachPolicyCard) dom.coachPolicyCard.hidden = state.hintLevel < 3;
  dom.policyGuideButton?.setAttribute("aria-expanded", String(state.hintLevel >= 3));
  if (dom.policyGuideButton) dom.policyGuideButton.lastChild.textContent = state.hintLevel >= 3 ? "Hide policy" : "Show policy";
}

function sameCoachTarget(left, right) {
  return ["target_id", "case_path", "action_id", "stage_id"].every((key) => (left?.[key] || null) === (right?.[key] || null));
}

function validEnhancedCoachResponse(response, deterministic) {
  if (!response || !sameCoachTarget(response.target, deterministic.target)) return false;
  if (response.action_type !== deterministic.action_type) return false;
  if (JSON.stringify(response.policy) !== JSON.stringify(deterministic.policy)) return false;
  if (JSON.stringify(response.information) !== JSON.stringify(deterministic.information)) return false;
  const target = response.target || {};
  if (target.target_id && !Object.values(demoTargetMap).flat().some((item) => item.target_id === target.target_id)) return false;
  return Boolean(String(response.title || "").trim() && String(response.instruction || "").trim());
}

function scheduleCoachEnhancement(context, deterministic) {
  if (state.mode !== "practice" || state.callPhase !== "live" || !state.visibilityPolicy.coach) return;
  const key = window.BenefitConnectCoach.cacheKey(context);
  const cached = state.coachRecommendationCache.get(key);
  if (cached) return renderCoachRecommendation(cached, true);
  window.clearTimeout(state.coachRequestTimer);
  state.coachRequestController?.abort();
  const controller = new AbortController();
  state.coachRequestController = controller;
  state.coachRequestTimer = window.setTimeout(async () => {
    try {
      const response = await fetch("/api/studio/coach/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          recommendation: deterministic,
          context: { scenario_id: context.scenarioId, stage_id: context.stageId, mode: context.mode, visible_fields: context.visibleFields },
        }),
      });
      if (!response.ok) throw new Error(`Coach wording unavailable (${response.status})`);
      const enhanced = await response.json();
      const currentContext = buildCoachContext();
      if (window.BenefitConnectCoach.cacheKey(currentContext) !== key || !validEnhancedCoachResponse(enhanced, deterministic)) return;
      enhanced.source = "ai_grounded_wording";
      state.coachRecommendationCache.set(key, enhanced);
      renderCoachRecommendation(enhanced, true);
    } catch (error) {
      if (error.name !== "AbortError") state.coachRecommendationCache.set(key, deterministic);
    }
  }, 350);
}

function currentCasePathValue(path) {
  return window.BlueOriginDemoScenarios?.getPath?.(state.caseDraft, path);
}

function normalizedCaseValue(value) {
  if (value === true) return "true";
  if (value === false) return "false";
  return String(value ?? "").trim().toLowerCase().replace(/[$,]/g, "");
}

function journeyPolicy(stageId) {
  const card = getScenario().coachPolicyPack?.cards?.[stageId] || getScenario().coachPolicyPack?.cards?.default || stateNeutralCoachPolicyPack.cards[stageId] || stateNeutralCoachPolicyPack.cards.default;
  return { summary: card?.summary || "Use the caller’s confirmed answer and preserve its source.", scope: card?.scope || "Demonstration procedure", citation: card?.citation || `${SPEC_NOTE_ID} · Guided interview workflow`, citations: card?.citations || [] };
}

function buildJourneyRecommendation() {
  const scenario = getScenario();
  const route = state.humeSession.contactSequence || scenario.contactSequence;
  if (!route || state.mode !== "practice" || state.callPhase !== "live") return null;
  const activeId = state.humeSession.activeContactId || route.active_contact_id || route.answering_contact_id;
  const intended = route.contacts?.find((contact) => contact.contact_id === route.intended_contact_id);
  const active = route.contacts?.find((contact) => contact.contact_id === activeId) || route.contacts?.[0];
  const make = (actionType, title, instruction, target, information = {}) => ({
    recommendation_id: `journey:${scenario.id}:${actionType}:${target?.case_path || target?.action_id || target?.contact_id || "current"}`,
    action_type: actionType,
    action_label: actionType === "ask" ? "Ask the caller" : actionType === "enter" ? "Enter the answer" : actionType === "handoff" ? "Establish the contact" : actionType === "callback" ? "Close the callback" : "Next best action",
    title,
    instruction,
    target: { stage_id: target?.stage_id || state.activeScreen, label: target?.label || "Current call", target_id: null, case_path: target?.case_path || null, action_id: target?.action_id || null, contact_id: target?.contact_id || null },
    information: { value: information.value ?? null, provenance: information.provenance || "Caller statement", disclosed: Boolean(information.disclosed), question: information.question || null },
    policy: journeyPolicy(target?.stage_id || state.activeScreen),
    source: "deterministic_journey",
  });

  if (route.mode === "screened" && activeId !== route.intended_contact_id) {
    if (!state.handoffAttempted) return make("handoff", `Ask to speak with ${intended?.name || scenario.persona.name}`, `Introduce yourself without discussing the case, then ask whether ${intended?.name || scenario.persona.name} is available.`, { action_id: "request-intended-contact", contact_id: intended?.contact_id, label: `Request ${intended?.name || scenario.persona.name}` }, { provenance: "Authored call route" });
    if (route.intended_contact_availability !== "available_handoff") {
      if (route.message_policy === "decline_message_offer_callback_window") return make("callback", `Confirm when to call ${intended?.name || scenario.persona.name} back`, `Do not leave case details. Thank ${active?.name || "the answerer"}, confirm ${route.callback_window || "the callback window"}, and end the call.`, { action_id: "end-unavailable-call", label: "Call later" }, { value: route.callback_window, provenance: "Authored contact availability", disclosed: true });
      if (state.callbackDisposition === "callback_message_recorded") return make("callback", "Close the call professionally", "Thank the answering contact, repeat only the neutral callback request, and end the call.", { action_id: "end-unavailable-call", label: "End unavailable-contact call" }, { value: "Neutral callback message recorded", provenance: "Server-validated message", disclosed: true });
      return make("callback", "Leave a neutral callback message", "Give only your name, agency, callback number, and a request to return the call. Do not mention a program, application, evidence, or case status.", { action_id: "record-callback-message", label: "Neutral callback message" }, { provenance: "Contact privacy rule" });
    }
  }

  const ledger = scenario.truthLedger || [];
  for (const fact of ledger) {
    if (!fact.required) continue;
    const disclosed = state.disclosedFacts.has(fact.fact_id);
    if (!disclosed) return make("ask", `Ask about ${fact.label.toLowerCase()}`, fact.learner_question_examples?.[0] || `Ask one clear question about ${fact.label.toLowerCase()}.`, { case_path: fact.case_path, stage_id: fact.destination_stage, label: fact.label }, { question: fact.learner_question_examples?.[0] || null, provenance: "Not yet disclosed" });
    if (fact.fact_state === "conversation_topic") continue;
    const entered = currentCasePathValue(fact.case_path);
    if (normalizedCaseValue(entered) !== normalizedCaseValue(fact.normalized_value)) {
      return make("enter", `Enter ${fact.label.toLowerCase()}`, `The caller answered ${JSON.stringify(fact.natural_response)} Record the supported value in the mapped BenefitConnect field.`, { case_path: fact.case_path, stage_id: fact.destination_stage, label: fact.label }, { value: fact.normalized_value, provenance: fact.provenance || "Caller statement", disclosed: true });
    }
  }
  return null;
}

function renderCoachGuidance() {
  if (dom.coachAssessmentLock) dom.coachAssessmentLock.hidden = state.visibilityPolicy.coach;
  if (dom.coachPracticeContent) dom.coachPracticeContent.hidden = !state.visibilityPolicy.coach;
  if (state.visibilityPolicy.coach && window.BenefitConnectCoach) {
    const context = buildCoachContext();
    const deterministic = buildJourneyRecommendation() || window.BenefitConnectCoach.recommend(context);
    renderCoachRecommendation(deterministic, false);
    if (deterministic.source !== "deterministic_journey") scheduleCoachEnhancement(context, deterministic);
  }
  renderCallerSignal();
  renderLiveChecklist();
}

function requestCoachHint(kind = "next") {
  if (!state.visibilityPolicy.coach) return showToast("Assessment mode", "Coaching and answer-revealing guidance are unavailable until submission.", "•");
  if (kind === "policy") state.hintLevel = state.hintLevel >= 3 ? 0 : 3;
  else state.hintLevel = Math.min(3, Math.max(1, state.hintLevel + 1));
  renderCoachGuidance();
  addEvent("hint", `${kind === "policy" ? "Policy guidance" : "Coach hint"} requested`, { target: `coach:${state.activeScreen}`, after: state.hintLevel >= 3 ? "policy_open" : "policy_closed", citation: state.coachRecommendation?.policy?.citation });
  showToast(state.hintLevel >= 3 ? "Policy grounding shown" : "Policy grounding hidden", state.hintLevel >= 3 ? "The recommendation is connected to its approved source and scope." : "The next action remains visible.");
}

function addEvent(type, label, details = {}) {
  const event = {
    event_id: `event:bo-${Date.now()}-${state.events.length + 1}`,
    attempt_id: state.latestAttempt?.attempt_id || `attempt:active-${getScenario().id.toLowerCase()}`,
    timestamp: new Date().toISOString(),
    time: formatTime(state.elapsed),
    channel: type === "voice" ? "voice" : type === "evaluation" ? "evaluator" : type === "midscene" ? "observation" : type === "submission" ? "system" : "screen",
    action: type,
    target: details.target || state.activeScreen,
    before: details.before ?? null,
    after: details.after ?? null,
    expected: details.expected ?? null,
    correct: details.correct ?? null,
    sequence_status: details.sequenceStatus || "recorded",
    citation: details.citation || null,
    screen: state.activeScreen,
    label,
  };
  state.events.unshift(event);
  if (["navigation", "field", "voice", "evidence", "evaluation", "submission", "hint", "midscene", "authorization", "attempt"].includes(type)) captureEventSnapshot(event, type);
  renderEvents();
}

function renderEvents() {
  dom.eventCount.textContent = state.events.length;
  dom.eventTrace.innerHTML = state.events
    .map((event) => `<li class="event-item ${event.correct === false ? "needs-review" : ""}"><span class="event-time">${event.time}</span><span><strong>${escapeHTML(event.channel)}</strong>${escapeHTML(event.label)}<small>${escapeHTML(event.target || "system")} · ${escapeHTML(event.sequence_status)}</small></span></li>`)
    .join("");
  renderMidscenePresenter();
}

function showToast(title, message, icon = "✓") {
  while (dom.toastRegion.children.length >= 2) dom.toastRegion.firstElementChild?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<div class="toast-icon">${escapeHTML(icon)}</div><div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span></div>`;
  dom.toastRegion.append(toast);
  window.setTimeout(() => toast.classList.add("exiting"), 2800);
  window.setTimeout(() => toast.remove(), 3050);
}

function renderCallerSignal() {
  const signal = state.callerAffect;
  const profile = getCallerProfile();
  if (dom.callerSignalTitle) dom.callerSignalTitle.textContent = signal.label;
  if (dom.callerSignalTrend) dom.callerSignalTrend.textContent = signal.trend === "rising" ? "↗" : signal.trend === "falling" ? "↘" : "→";
  if (dom.callerProfileSummary) dom.callerProfileSummary.textContent = `${profile.label} · ${callerIntensity[state.selectedCallerIntensity].label} · ${getCallerVoice().presentation} ${getCallerVoice().label}`;
  if (dom.callerProfileDetail) dom.callerProfileDetail.textContent = `${profile.label} · ${profile.cooperation_style.replaceAll("-", " ")}`;
  if (dom.callerStateDetail) dom.callerStateDetail.textContent = `${signal.label} · ${signal.intensity || callerIntensity[state.selectedCallerIntensity].value}/3`;
  if (dom.learnerAffectDetail) dom.learnerAffectDetail.textContent = state.learnerAffect.confidence ? `${state.learnerAffect.label} · ${Math.round(state.learnerAffect.confidence * 100)}% confidence` : "Waiting for speech";
  if (dom.callerTriggerHistory) dom.callerTriggerHistory.innerHTML = state.callerAffectTimeline.slice(-4).reverse().map((entry) => `<li><span>${escapeHTML(entry.state)}</span>${escapeHTML(String(entry.trigger).replaceAll("_", " "))}<small>${escapeHTML(entry.intensity)}/3</small></li>`).join("") || "<li>Profile selected</li>";
  const observations = state.affectObservations.filter((item) => item.speaker === "learner").slice(0, 3);
  if (dom.humeExpressionScores) dom.humeExpressionScores.innerHTML = observations.length ? observations.map((item) => `<span>${escapeHTML(item.top_expression)} <b>${Math.round(item.confidence * 100)}%</b></span>`).join("") : "No observations yet";
}

function setCallerAffect(next, label, trend = "steady", confidence = 0.7, details = {}) {
  state.callerAffect = { ...state.callerAffect, state: next, label, trend, confidence, ...details };
  state.callerAffectTimeline.push({ caller_affect_state_id: `caller-state:${Date.now()}-${state.callerAffectTimeline.length + 1}`, profile_id: getCallerProfile().profile_id, state: next, intensity: state.callerAffect.intensity || 2, cooperation: state.callerAffect.cooperation, trigger: details.trigger || "state_update", timestamp: new Date().toISOString() });
  renderCallerSignal();
}

function renderLiveChecklist() {
  if (!dom.liveChecklist) return;
  const route = state.humeSession.contactSequence || getScenario().contactSequence;
  if (route?.mode === "screened" && route.intended_contact_availability !== "available_handoff") {
    const neutralMessageRequired = route.message_policy === "neutral_callback_only";
    const items = [
      { label: `Ask for ${getScenario().persona.name} without sharing case details`, done: state.handoffAttempted },
      { label: neutralMessageRequired ? "Leave only an approved neutral callback message" : `Confirm ${route.callback_window || "when to call back"}`, done: neutralMessageRequired ? state.callbackDisposition === "callback_message_recorded" : state.handoffAttempted },
      { label: "Close the unavailable-contact call", done: state.callEnded },
    ];
    dom.liveChecklist.innerHTML = items.map((item, index) => `<li class="${item.done ? "complete" : index === items.findIndex((entry) => !entry.done) ? "active" : ""}"><span></span>${escapeHTML(item.label)}</li>`).join("");
    return;
  }
  const targets = scenarioTargetsForStage(state.activeScreen);
  const values = state.screenValues[state.activeScreen] || {};
  const items = [
    { label: `Confirm ${workflow.find((item) => item.id === state.activeScreen)?.label.toLowerCase()} facts`, done: state.disclosedFacts.size > 0 },
    { label: targets.length ? `Complete ${targets.length} mapped action${targets.length === 1 ? "" : "s"}` : "Review the visible screen", done: targets.every((target) => {
      const value = target.binding ? (target.binding in state.closure ? state.closure[target.binding] : state.form[target.binding]) : values[target.target_id];
      return value !== "" && value !== null && value !== undefined && value !== false;
    }) },
    { label: state.activeScreen === "authorization" ? "Close the call and submit" : "Validate and continue", done: state.validated },
  ];
  dom.liveChecklist.innerHTML = items.map((item, index) => `<li class="${item.done ? "complete" : index === items.findIndex((entry) => !entry.done) ? "active" : ""}"><span></span>${escapeHTML(item.label)}</li>`).join("");
}

function renderLiveTranscript() {
  if (!dom.liveTranscript) return;
  dom.liveTranscript.innerHTML = [...state.voiceTurns].reverse().map((turn) => `<li><strong>${escapeHTML(turn.speaker === "client" ? turn.contact_name || getScenario().persona.name : "Learner")} · ${escapeHTML(turn.time)}</strong>${turn.speaker === "client" && turn.contact_role ? `<small>${escapeHTML(turn.contact_role.replaceAll("_", " "))}</small>` : ""}${escapeHTML(turn.transcript.replaceAll("“", "").replaceAll("”", ""))}</li>`).join("") || "<li><strong>Call not connected</strong>The live transcript will appear here.</li>";
}

function currentScreenAsset() {
  return state.screenPack?.screens.find((screen) => screen.workflow_stage_id === state.activeScreen);
}

function targetValue(target) {
  if (target.binding && target.binding in state.closure) return target.binding === "closingSummary" ? (state.closure[target.binding] ? "Yes" : "") : state.closure[target.binding];
  if (target.binding && target.binding in state.form) return state.form[target.binding];
  return state.screenValues[state.activeScreen]?.[target.target_id] ?? "";
}

function expectedTargetValue(target) {
  if (target.expected_value_rule === "scenario.expected.relationship") return getScenario().expected.relationship;
  if (target.expected_value_rule === "scenario.expected.income") return getScenario().expected.income;
  if (target.expected_value_rule === "scenario.type") return getScenario().type;
  if (target.expected_value_rule === "nonempty") return "nonempty";
  if (target.expected_value_rule === "true") return true;
  return target.expected_value_rule;
}

function systemTarget(targetId) {
  return scenarioTargetsForStage(state.activeScreen).find((target) => target.target_id === targetId);
}

function renderSystemControl(targetId, label, helper = "") {
  const target = systemTarget(targetId);
  if (!target) return "";
  const value = targetValue(target);
  const common = `class="bc-control mapped-control" data-target-id="${escapeHTML(target.target_id)}" aria-label="${escapeHTML(target.semantic_description)}"`;
  let control = "";
  if (target.control_type === "select") control = `<select ${common}>${(target.options || [""]).map((option) => `<option value="${escapeHTML(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHTML(option || "Select")}</option>`).join("")}</select>`;
  else if (target.control_type === "button") control = `<button ${common} type="button">${escapeHTML(value || target.label || "Review")}</button>`;
  else if (target.control_type === "checkbox") control = `<label class="bc-check mapped-control" data-target-id="${escapeHTML(target.target_id)}"><input aria-label="${escapeHTML(target.semantic_description)}" type="checkbox" ${value ? "checked" : ""}/><span>${escapeHTML(label)}</span></label>`;
  else if (target.control_type === "textarea") control = `<textarea ${common}>${escapeHTML(value)}</textarea>`;
  else control = `<input ${common} type="${target.control_type === "date" ? "date" : "text"}" inputmode="${target.control_type === "currency" ? "decimal" : "text"}" value="${escapeHTML(value)}"/>`;
  if (target.control_type === "checkbox") return `${control}${helper ? `<small>${escapeHTML(helper)}</small>` : ""}`;
  return `<label class="bc-field"><span>${escapeHTML(label)}</span>${control}<small>${escapeHTML(helper || target.provenance)}</small></label>`;
}

function bcReadOnly(label, value, provenance = "Application") {
  return `<label class="bc-field"><span>${escapeHTML(label)}</span><input value="${escapeHTML(value)}" readonly/><small>${escapeHTML(provenance)}</small></label>`;
}

function renderEligibilityStageBody() {
  const scenario = getScenario();
  const stage = state.activeScreen;
  return BenefitConnectIntegrated.renderStage({
    stage,
    scenario,
    draft: state.caseDraft,
    mapped: renderSystemControl,
    evidenceReviewed: state.evidenceReviewed,
    mockEligibility: state.mockEligibility,
    closure: state.closure,
    callEnded: state.callEnded,
    openSections: state.openCaseSections,
  });

  // Legacy compact stage markup is retained below as a rollback reference; the
  // integrated renderer above is the active BenefitConnect implementation.
  if (stage === "intake") return `<div class="bc-grid"><section class="bc-card"><header>Applicant information <span>Application</span></header><div class="bc-fields">${bcReadOnly("Applicant name", scenario.persona.name)}${bcReadOnly("Preferred language", "English")}${bcReadOnly("Phone number", "(555) 010-2401")}${bcReadOnly("Best contact time", "Weekdays after 3 PM", "Client preference")}</div></section><section class="bc-card"><header>Request details <span>Requires confirmation</span></header><div class="bc-fields">${bcReadOnly("Application type", scenario.type)}${renderSystemControl("intake-interview-required", "Interview required")}${bcReadOnly("Urgent need reported", "No", "Application")}${renderSystemControl("intake-interview-date", "Interview date")}</div></section></div><div class="bc-status-bar"><strong>Intake status</strong><span>Application loaded · interview pending</span><button type="button" data-system-utility="save-intake">Save intake</button></div>`;
  if (stage === "household") return `<div class="bc-grid"><section class="bc-card bc-full"><header>People in the home <span>2 listed on application</span></header><div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Name</th><th>Date of birth</th><th>Relationship</th><th>Lives in home</th><th>Included</th></tr></thead><tbody><tr><td><strong>${escapeHTML(scenario.persona.name)}</strong></td><td>04/17/1993</td><td>${renderSystemControl("household-relationship", "Relationship")}</td><td><select aria-label="Maya lives in home"><option>Yes</option><option>No</option></select></td><td><label class="bc-inline-check"><input type="checkbox" checked/>Applicant</label></td></tr><tr><td><strong>Elena Ortiz</strong></td><td>10/06/2017</td><td><select aria-label="Elena relationship"><option>Child</option><option>Other</option></select></td><td><select aria-label="Elena lives in home"><option>Yes</option><option>No</option></select></td><td><label class="bc-inline-check"><input type="checkbox" checked/>Child</label></td></tr></tbody></table></div></section><section class="bc-card"><header>Household details <span>Client statement</span></header><div class="bc-fields">${renderSystemControl("household-food-unit", "Purchases and prepares food together")}${bcReadOnly("Temporarily absent members", "None reported", "Client statement")}${bcReadOnly("Pregnancy reported", "Yes", "Application · verify")}${bcReadOnly("Expected due date", "12/18/2026", "Client statement")}</div></section><section class="bc-card"><header>Address <span>Application</span></header><div class="bc-fields">${bcReadOnly("Residential address", "410 Cedar Avenue")}${bcReadOnly("City, state, ZIP", "Lansing, MI 48910")}${bcReadOnly("Housing arrangement", "Rents apartment")}${bcReadOnly("Mailing address same", "Yes")}</div></section></div>`;
  if (stage === "programs") return `<div class="bc-grid"><section class="bc-card bc-full"><header>Requested assistance <span>Application</span></header><div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Program</th><th>Maya Ortiz</th><th>Elena Ortiz</th><th>Request status</th><th>Interview</th></tr></thead><tbody>${["Medical assistance","Food assistance","Cash assistance"].map((name) => `<tr><td><strong>${name}</strong></td><td><input aria-label="${name} Maya" type="checkbox" checked/></td><td><input aria-label="${name} Elena" type="checkbox" ${name === "Cash assistance" ? "" : "checked"}/></td><td>Requested</td><td>${name === "Medical assistance" ? "Confirm" : "Required"}</td></tr>`).join("")}</tbody></table></div></section><section class="bc-card"><header>Assistance group <span>Worker entry</span></header><div class="bc-fields">${renderSystemControl("program-food-group", "Food group")}${bcReadOnly("Cash group", "Maya and Elena", "Worker entry")}${bcReadOnly("Medical household", "Maya and Elena", "Worker entry")}${renderSystemControl("program-expedited", "Expedited screening")}</div></section><section class="bc-card"><header>Program dates <span>System</span></header><div class="bc-fields">${bcReadOnly("Application date", "07/28/2026", "System")}${bcReadOnly("Benefit month", "08/2026", "System")}${bcReadOnly("Requested retro coverage", "No")}${bcReadOnly("Priority", "Standard", "System")}</div></section></div>`;
  if (stage === "financial") return `<div class="bc-grid"><section class="bc-card"><header>Earned income <span>Document required</span></header><div class="bc-fields">${bcReadOnly("Employer", "Northline Market")}${bcReadOnly("Employment status", "Active")}${renderSystemControl("financial-pay-frequency", "Pay frequency")}${renderSystemControl("financial-gross-amount", "Gross amount per pay", "Enter from current wage evidence")}${renderSystemControl("financial-monthly-income", "Monthly converted amount", "Deterministic calculation")}${bcReadOnly("Hours per week", "24", "Client statement")}</div></section><section class="bc-card"><header>Shelter and dependent care <span>Application</span></header><div class="bc-fields">${bcReadOnly("Monthly rent", "$1,025.00")}${bcReadOnly("Utilities", "Heat included")}${bcReadOnly("Dependent care", "$180.00")}${bcReadOnly("Child support paid", "$0.00")}</div></section></div><div class="bc-status-bar"><strong>Income total</strong><span>${state.screenValues.financial?.["financial-monthly-income"] ? `$${escapeHTML(state.screenValues.financial["financial-monthly-income"])} monthly` : "Not calculated · current earnings incomplete"}</span><button type="button" data-system-utility="calculate-income">Calculate income</button></div>`;
  if (stage === "nonfinancial") return `<div class="bc-grid"><section class="bc-card"><header>Identity and residency <span>Application + data match</span></header><div class="bc-fields">${bcReadOnly("Identity verified", "Data match pending", "Data match")}${renderSystemControl("nonfinancial-residency", "State residency")}${renderSystemControl("nonfinancial-citizenship", "Citizenship status")}${bcReadOnly("SSN verification", "Matched", "Data match")}</div></section><section class="bc-card"><header>Program factors <span>Client confirmation</span></header><div class="bc-fields">${bcReadOnly("Student status", "Not a student", "Client statement")}${bcReadOnly("Disability claimed", "No", "Application")}${bcReadOnly("Work requirement status", "Exempt — child under 6", "Procedure")}${bcReadOnly("Absent parent information", "Not provided", "Application")}</div></section></div><div class="bc-status-bar"><strong>Outstanding factors</strong><span>2 required confirmations</span><button type="button" data-system-utility="save-factors">Save factors</button></div>`;
  if (stage === "evidence") return `<div class="bc-grid"><section class="bc-card"><header>Case documents <span>3 available</span></header><div class="bc-doc-list"><article><i>AP</i><div><strong>Submitted application</strong><small>Received Jul 28 · 12 pages</small></div><button type="button" data-system-utility="application-document">Open</button></article><article><i>WS</i><div><strong>Current wage statement</strong><small>Pay period ending Jul 24</small></div>${renderSystemControl("evidence-wage-review", "Current wage statement")}</article><article><i>ID</i><div><strong>Identity document</strong><small>Uploaded by applicant</small></div><button type="button" data-system-utility="identity-document">Open</button></article></div></section><section class="bc-card"><header>Electronic matches <span>System</span></header><div class="bc-doc-list"><article><i>$</i><div><strong>Quarterly wage match</strong><small>Amount differs from reported current hours</small></div>${renderSystemControl("evidence-wage-match", "Quarterly wage match")}</article><article><i>✓</i><div><strong>SSN match</strong><small>Name and date of birth matched</small></div><span class="bc-status success">Clear</span></article><article><i>?</i><div><strong>State residency</strong><small>No electronic result</small></div><span class="bc-status">Pending</span></article></div></section></div><div class="bc-status-bar"><strong>Verification summary</strong><span>${state.evidenceReviewed ? "Current wage evidence reviewed" : "Required evidence remains unresolved"}</span><button type="button" data-system-utility="review-selected">Review selected</button></div>`;
  if (stage === "eligibility") return `<div class="bc-grid"><section class="bc-card bc-full"><header>Program results <span>Benefit month 08/2026</span></header><div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Program</th><th>Person</th><th>Status</th><th>Benefit</th><th>Outstanding action</th></tr></thead><tbody><tr><td><strong>Medical assistance</strong></td><td>Maya Ortiz</td><td><span class="bc-status">Pending</span></td><td>Coverage</td><td>Confirm residency</td></tr><tr><td><strong>Food assistance</strong></td><td>Household</td><td>Ready to run</td><td>—</td><td>Review income</td></tr><tr><td><strong>Cash assistance</strong></td><td>Household</td><td>Ready to run</td><td>—</td><td>Review nonfinancial factors</td></tr></tbody></table></div></section><section class="bc-card"><header>Calculation controls <span>Worker action</span></header><div class="bc-fields">${bcReadOnly("Benefit month", "08/2026", "System")}${renderSystemControl("eligibility-run-reason", "Run reason")}${bcReadOnly("Include pending evidence", "No", "Procedure")}${bcReadOnly("Calculation date", "07/29/2026", "System")}</div></section><section class="bc-card"><header>Interpretation <span>Required</span></header><div class="bc-fields">${renderSystemControl("eligibility-result-reviewed", "Result reviewed")}${bcReadOnly("Discrepancies resolved", state.evidenceReviewed ? "Yes" : "No", "Worker action")}${bcReadOnly("Supervisor review", "Not required", "Procedure")}${bcReadOnly("Next action", "Prepare notices", "System")}</div></section></div>`;
  if (stage === "notices") return `<div class="bc-grid"><section class="bc-card"><header>Notice selection <span>Worker action</span></header><div class="bc-fields">${renderSystemControl("notice-type", "Notice type")}${bcReadOnly("Notice language", "English")}${bcReadOnly("Effective date", "08/01/2026", "System")}${bcReadOnly("Delivery method", "Mail + portal", "Client preference")}</div></section><section class="bc-card"><header>Case comment <span>Required</span></header><div class="bc-fields bc-fields-single">${renderSystemControl("notice-comments", "Processing summary", "Document facts, evidence, discrepancies, and action taken")}</div></section></div><div class="bc-status-bar"><strong>Notice status</strong><span>No notice issued until validation is complete</span><button type="button" data-system-utility="preview-notice">Preview notice</button></div>`;
  return `<div class="bc-grid"><section class="bc-card bc-full"><header>Final review <span>${Object.values(state.closure).filter(Boolean).length} of 4 complete</span></header><div class="bc-authorization-list">${renderSystemControl("authorization-facts", "All material facts confirmed with applicant")}${renderSystemControl("authorization-evidence", "Evidence and data-match discrepancies resolved")}${renderSystemControl("authorization-next-steps", "Next steps explained to applicant")}</div></section><section class="bc-card"><header>Disposition <span>Worker action</span></header><div class="bc-fields">${bcReadOnly("Medical assistance", "Pending verification", "Deterministic result")}${bcReadOnly("Food assistance", "Eligible", "Deterministic result")}${bcReadOnly("Cash assistance", "Pending", "Deterministic result")}${bcReadOnly("Authorization date", "07/29/2026", "System")}</div></section><section class="bc-card"><header>Call closure <span>Client communication</span></header><div class="bc-fields">${renderSystemControl("authorization-summary", "Closing summary provided")}${bcReadOnly("Pending items explained", state.closure.nextSteps ? "Yes" : "Not confirmed", "Client communication")}${bcReadOnly("Questions offered", "Yes", "Client communication")}${bcReadOnly("Call end reason", state.callEnded ? "Completed" : "Call active", "System")}</div></section></div>`;
}

function renderContactSequenceSummary(sequence = getScenario().contactSequence || createDefaultContactSequence(getScenario())) {
  const answering = sequence.contacts.find((contact) => contact.contact_id === sequence.answering_contact_id) || sequence.contacts[0];
  const intended = sequence.contacts.find((contact) => contact.contact_id === sequence.intended_contact_id) || answering;
  const screened = sequence.mode === "screened" && answering.contact_id !== intended.contact_id;
  const handoffAvailable = screened && sequence.intended_contact_availability === "available_handoff";
  const title = !screened
    ? sequence.mode === "authorized_contact" ? "Authorized contact call" : "Direct applicant call"
    : handoffAvailable ? "Alternate answerer, then live handoff" : "Applicant unavailable — callback handling";
  const routeLabel = !screened ? "1 caller" : handoffAvailable ? "2 sequential callers" : "1 answerer · no handoff";
  const terminalLabel = handoffAvailable
    ? "Available for handoff"
    : sequence.callback_window ? `Unavailable · ${sequence.callback_window}` : sequence.intended_contact_availability.replaceAll("_", " ");
  return `<section class="contact-sequence-summary" aria-label="Call participants"><header><div><span class="page-kicker">Call participants</span><h3>${escapeHTML(title)}</h3></div><span>${escapeHTML(routeLabel)}</span></header><div class="contact-sequence-flow"><article><span class="profile-avatar">${escapeHTML(answering.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</span><div><small>Answers first</small><strong>${escapeHTML(answering.name)}</strong><em>${escapeHTML(answering.role.replaceAll("_", " "))} · ${escapeHTML(answering.greeting || "Hello?")}</em></div></article>${screened ? `<span class="material-symbols-rounded" aria-hidden="true">${handoffAvailable ? "arrow_forward" : "phone_callback"}</span><article><span class="profile-avatar">${escapeHTML(intended.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</span><div><small>${handoffAvailable ? "Takes the phone" : "Intended contact"}</small><strong>${escapeHTML(intended.name)}</strong><em>${escapeHTML(terminalLabel)}</em></div></article>` : ""}</div></section>`;
}

const humePhaseLabels = {
  request_microphone: "Requesting microphone",
  prepare_audio: "Preparing caller audio",
  create_session: "Creating secure session",
  connect_hume: "Connecting to Hume",
  confirm_session: "Confirming caller session",
  connected: "Hume live",
  failed: "Connection failed",
};

function humeRuntimeErrorCopy(error) {
  const copy = {
    microphone_denied: ["Microphone access is blocked", "Allow microphone access for this site in your browser settings, then retry the live call."],
    microphone_timeout: ["Microphone permission timed out", "Choose Allow in the browser microphone prompt, or check the site microphone setting before retrying."],
    microphone_unavailable: ["No microphone is available", "Connect or enable one microphone, then retry the live call."],
    microphone_lost: ["The microphone disconnected", "Reconnect the input device and retry the live call."],
    audio_activation: ["Caller audio needs permission", "Select Enable caller audio to activate Safari or Chrome audio before connecting."],
    unsupported_media: ["Live audio is not supported", "Use a current Safari or Chrome browser with microphone recording enabled."],
    session_timeout: ["Secure session timed out", "The Hume session service did not respond in time. Retry the live call."],
    session_error: ["Secure session could not be created", "Hume configuration could not be validated for this call. Retry or ask an administrator to check service health."],
    session_temporarily_unavailable: ["Hume session service was temporarily unavailable", "The application retried the secure session but the service did not recover. Wait a moment, then retry the live call."],
    session_rate_limited: ["Too many live-call requests", "Wait about one minute, then retry the live call."],
    hume_session_error: ["Hume rejected the caller session", "The live voice configuration was not accepted. Retry once; if it persists, ask an administrator to check the Hume language-model configuration."],
    socket_timeout: ["Hume connection timed out", "The browser could not establish the live voice connection. Check the network and retry."],
    socket_close: ["Hume disconnected", "The live voice connection closed. Your case entries are safe; retry the live call."],
    metadata_timeout: ["Caller session was not confirmed", "Hume connected but did not confirm the conversation. Retry the live call."],
    response_timeout: ["No caller audio was received", "The session connected without audible caller output. Check browser output and retry."],
    playback_error: ["Caller audio could not play", "Check the selected output device and volume, then retry the live call."],
  };
  const [title, detail] = copy[error?.code] || ["Live call could not connect", error?.message || "Retry the live call."];
  return { title, detail };
}

function renderHumeRuntimeError() {
  const error = state.humeSession.runtimeError;
  if (!error) return "";
  const copy = humeRuntimeErrorCopy(error);
  const closeCode = Number.isInteger(error.closeCode) ? ` · socket ${error.closeCode}` : "";
  const technicalDetail = error.code === "hume_session_error" && error.message ? `<small>Hume detail: ${escapeHTML(String(error.message).slice(0, 320))}</small>` : "";
  return `<section class="hume-runtime-error" role="alert"><span class="material-symbols-rounded" aria-hidden="true">error</span><div><strong>${escapeHTML(copy.title)}</strong><p>${escapeHTML(copy.detail)}</p><small>Failed phase: ${escapeHTML(humePhaseLabels[error.phase] || error.phase || "Live connection")}${escapeHTML(closeCode)}</small>${technicalDetail}</div></section>`;
}

function renderPreflight() {
  const scenario = getScenario();
  const profile = getCallerProfile();
  const voice = getCallerVoice();
  const humeReady = state.humeSession.configured;
  const assignment = scenarioCallerAssignments[scenario.id];
  return `<section class="case-preflight">
    <main class="case-preflight-main preflight-config-workspace">
      <header class="preflight-config-header">
        <div><span class="page-kicker">Simulation setup</span><h2>Configure applicant call</h2><p>${escapeHTML(scenario.shortTitle)} · ${escapeHTML(scenario.caseId)}</p></div>
        <div class="preflight-header-actions"><span class="connection-readiness ${humeReady ? "ready" : ""}"><i></i>${humeReady ? "Hume ready" : "Hume required"}</span>${humeReady ? `<button class="button button-primary" id="startLiveCall">${state.humeSession.runtimeError?.code === "audio_activation" ? "Enable caller audio" : state.humeSession.runtimeError ? "Retry live call" : "Start live call"}</button>` : '<button class="button button-primary" id="openHumeConfig">Configure Hume</button>'}</div>
      </header>
      ${renderHumeRuntimeError()}
      ${renderCallerProfilePicker()}
      ${renderContactSequenceSummary(scenario.contactSequence)}
      <section class="preflight-audio-row" aria-label="Audio readiness">
        <div><span class="material-symbols-rounded">mic</span><span><strong>Microphone and captions</strong><small>Echo cancellation, noise suppression and automatic gain control start with the call.</small></span></div>
        <label for="outputVolume">Output <output>${Math.round(state.humeSession.volume * 100)}%</output><input id="outputVolume" type="range" min="0" max="1" step="0.05" value="${state.humeSession.volume}"/></label>
        <button class="button button-secondary" id="testAudioOutput"><span class="material-symbols-rounded">play_circle</span>Test selected voice</button>
      </section>
      <p class="preflight-trust-note"><span class="material-symbols-rounded">verified_user</span>Voice descriptions reflect Hume Voice Library metadata. Caller behavior is a separate simulation setting and can evolve during the interview.</p>
    </main>
  </section>`;
}

function syncCoachPanelWidth() {
  dom.appShell.style.setProperty("--coach-panel-width", `${state.coachPanelWidth}px`);
  const handle = dom.coachPanel?.querySelector("[data-coach-resize]");
  handle?.setAttribute("aria-valuenow", String(Math.round(state.coachPanelWidth)));
}

function setCoachPanelWidth(width) {
  const viewportMaximum = Math.max(420, Math.min(640, window.innerWidth * 0.48));
  state.coachPanelWidth = Math.max(360, Math.min(viewportMaximum, Number(width) || 380));
  syncCoachPanelWidth();
}

function beginCoachPanelResize(event) {
  if (window.innerWidth <= 900) return;
  event.preventDefault();
  const handle = event.currentTarget;
  const startingX = event.clientX;
  const startingWidth = state.coachPanelWidth;
  dom.appShell.classList.add("coach-resizing");
  handle.setPointerCapture?.(event.pointerId);
  const move = (moveEvent) => setCoachPanelWidth(startingWidth + startingX - moveEvent.clientX);
  const finish = () => {
    dom.appShell.classList.remove("coach-resizing");
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", finish);
    handle.removeEventListener("pointercancel", finish);
  };
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", finish);
}

function renderPreflightCaseBrief() {
  const scenario = getScenario();
  const startingState = state.caseStartingState || buildCaseStartingState(scenario);
  const received = new Date(startingState.application_received_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const knownFacts = Object.entries(startingState.prefilled_fields || {}).filter(([, field]) => field.value).map(([key, field]) => ({ label: key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()), value: field.value, provenance: field.provenance }));
  return `<div class="case-brief-sticky-header"><div><span class="page-kicker">Case brief</span><h2>${escapeHTML(scenario.type)}</h2><p>${escapeHTML(scenario.caseId)}</p></div><span class="case-status">Interview required</span></div>
    <div class="case-brief-body">
      <section class="case-brief-applicant"><span class="profile-avatar">${escapeHTML(scenario.persona.initials)}</span><div><small>Primary applicant</small><strong>${escapeHTML(scenario.persona.name)}</strong><span>${escapeHTML(scenario.persona.description)}</span></div></section>
      <section><h3>Application</h3><dl class="case-brief-facts"><div><dt>Programs</dt><dd>${scenario.programs.map((program) => `<span class="program-chip">${escapeHTML(program)}</span>`).join("")}</dd></div><div><dt>Received</dt><dd>${escapeHTML(received)}</dd></div><div><dt>Case type</dt><dd>${escapeHTML(scenario.type)}</dd></div><div><dt>Starting stage</dt><dd>${escapeHTML(workflow.find((item) => item.id === startingState.initial_screen)?.label || "Intake")}</dd></div></dl></section>
      <section><h3>Processing objective</h3><p class="case-brief-reason">${escapeHTML(scenario.description)}</p></section>
      <section><div class="case-brief-section-heading"><h3>Submitted information</h3><span>${knownFacts.length}</span></div><ul class="case-brief-known">${knownFacts.map((fact) => `<li><span><strong>${escapeHTML(fact.label)}</strong><small>${escapeHTML(fact.provenance)}</small></span><b>${escapeHTML(fact.value)}</b></li>`).join("")}</ul></section>
      <section><div class="case-brief-section-heading"><h3>Reported changes</h3><span>${startingState.reported_changes.length}</span></div><ul class="case-brief-list">${startingState.reported_changes.map((change) => `<li><span class="material-symbols-rounded">sync_alt</span>${escapeHTML(change)}</li>`).join("")}</ul></section>
      <section><div class="case-brief-section-heading"><h3>Confirm during interview</h3><span>${scenario.facts.length}</span></div><ol class="case-brief-questions">${scenario.facts.map((fact) => `<li><span>${escapeHTML(fact.label)}</span><p>${escapeHTML(fact.question)}</p></li>`).join("")}</ol></section>
      <section><div class="case-brief-section-heading"><h3>Available evidence</h3><span>${startingState.evidence.length}</span></div><ul class="case-brief-evidence">${startingState.evidence.map((item) => `<li><span class="material-symbols-rounded">description</span><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.provenance)} · ${escapeHTML(item.status)}</small></div></li>`).join("")}</ul></section>
      <footer><span class="material-symbols-rounded">shield</span><p>Synthetic training case. Review the submitted record before asking for information already provided.</p></footer>
    </div>`;
}

function renderLegacyPreflight() {
  const humeReady = state.humeSession.configured;
  const profile = getCallerProfile();
  return `<section class="call-preflight"><div class="preflight-main"><div class="preflight-hero"><span class="page-kicker">Live eligibility simulation</span><h2>Talk with the applicant while processing the case.</h2><p>Hume acts as ${escapeHTML(getScenario().persona.name)}, the applicant who completed this frozen synthetic application. The applicant knows submitted answers and configured corrections, but never acts as a policy expert or coach.</p><div class="demo-system-preview" aria-label="BenefitConnect workspace preview"><div class="demo-preview-header"><b>BC</b><span><strong>BenefitConnect</strong><small>Synthetic eligibility workspace</small></span></div><div class="demo-preview-body"><nav>${workflow.slice(0, 6).map((item, index) => `<span class="${index === 0 ? "active" : ""}">${index + 1} ${escapeHTML(item.label)}</span>`).join("")}</nav><div><h3>Application intake</h3><p>Accessible fields, deterministic validation, and event capture.</p></div></div></div></div>${renderCallerProfilePicker()}</div><aside class="preflight-panel"><h3>Ready to connect</h3><div class="selected-profile-summary"><span class="profile-avatar">${escapeHTML(getScenario().persona.initials)}</span><div><small>Selected applicant behavior</small><strong>${escapeHTML(profile.label)} · ${escapeHTML(callerIntensity[state.selectedCallerIntensity].label)}</strong><span>${escapeHTML(profile.cooperation_style.replaceAll("-", " "))}</span></div></div><div class="preflight-check"><span class="material-symbols-rounded">mic</span><div><strong>Microphone & captions</strong><small>Mono · echo cancellation · noise suppression · automatic gain control</small></div><span>On start</span></div><div class="preflight-check"><span class="material-symbols-rounded">graphic_eq</span><div><strong>Hume EVI</strong><small>${humeReady ? "Temporary token and per-session applicant grounding" : "Live Hume must be configured before this call can start"}</small></div><span>${humeReady ? "Ready" : "Required"}</span></div><div class="audio-preflight"><div><span class="material-symbols-rounded">headphones</span><span><strong>Headphones recommended</strong><small>Use headphones if laptop speakers still feed the microphone.</small></span></div><label for="outputVolume">Output volume <output>${Math.round(state.humeSession.volume * 100)}%</output></label><input id="outputVolume" type="range" min="0" max="1" step="0.05" value="${state.humeSession.volume}"/><button class="button button-secondary" id="testAudioOutput"><span class="material-symbols-rounded">volume_up</span>Test output</button></div><p class="preflight-notice">Selected behavior is an intended simulation state. Hume expression measurements are confidence estimates, not emotional truth.</p><div class="preflight-actions">${humeReady ? '<button class="button button-primary" id="startLiveCall">Start live Hume call</button>' : '<button class="button button-primary" id="openHumeConfig">Configure Hume</button>'}</div></aside></section>`;
}

function renderEligibilityWorkspace() {
  const activeIndex = workflow.findIndex((item) => item.id === state.activeScreen);
  const headings = { intake:["Application intake","Confirm the request, contact preferences, urgency, and program routing."], household:["Household members","Capture shared case facts and separate program relationships."], programs:["Program requests","Construct Medicaid, SNAP, and TANF units without determining eligibility."], financial:["Income, expenses, and resources","Record complete financial facts and their evidence provenance."], nonfinancial:["Nonfinancial factors","Confirm identity, residency, citizenship, health, education, and family facts."], evidence:["Evidence and verification","Link documents and data matches to people, programs, and facts."], eligibility:["Illustrative eligibility results","Load and review authored training outcomes by program, person, and month."], notices:["Notices and case comments","Prepare program-scoped communications from the authored result state."], authorization:["Authorization and disposition","Complete final checks, program actions, and client call closure."] };
  const notices = { intake:"State-neutral synthetic case. Program routing and urgent-need fields are for workflow practice only.", household:"The case household, Medicaid tax household, SNAP food unit, and TANF assistance unit may differ.", programs:"Program panels appear only for requested assistance. Membership choices do not calculate eligibility.", financial:"Amounts are synthetic facts. This workspace records them but does not apply income, deduction, or resource rules.", nonfinancial:"Capture applicant facts without converting unknown or missing information into No.", evidence:"Opening a document does not make it verified. Record the person, program, fact, status, and discrepancy.", eligibility:"Run mock eligibility loads a frozen authored outcome; it never evaluates the fields entered on this case.", notices:"Notices remain synthetic and program-scoped. No communication is sent outside this prototype.", authorization:"Prototype authorization creates no official eligibility decision, issuance, notice, or case-system write." };
  return `<section class="eligibility-system" data-eligibility-system-id="${eligibilitySystemDefinition.system_id}"><header class="bc-system-header"><div class="bc-seal">BC</div><div class="bc-brand"><strong>BenefitConnect</strong><small>Synthetic eligibility workspace</small></div><div class="bc-case"><span>Case <strong>${escapeHTML(getScenario().id)}</strong></span><span>Applicant <strong>${escapeHTML(getScenario().persona.name)}</strong></span><b>TR</b></div></header><div class="bc-utility-row"><button id="eligibilityNavToggle" class="bc-menu-button" aria-expanded="${state.systemNavigationOpen}" aria-controls="benefitConnectWorkflow"><span class="material-symbols-rounded">menu</span><span>Workflow</span></button><div class="bc-breadcrumb">My work / Applications / <strong>${escapeHTML(workflow[activeIndex]?.label)}</strong></div><div class="bc-utility-actions">${eligibilitySystemDefinition.utilities.map((utility) => `<button type="button" data-system-utility="${utility.toLowerCase().replace(" ", "-")}">${escapeHTML(utility)}</button>`).join("")}</div></div><div class="bc-system-shell"><nav class="bc-workflow ${state.systemNavigationOpen ? "open" : ""}" id="benefitConnectWorkflow" aria-label="Application workflow"><p>Application workflow</p>${workflow.map((item, index) => `<button type="button" class="${item.id === state.activeScreen ? "active" : ""} ${state.validatedScreens.has(item.id) ? "complete" : ""}" data-screen-jump="${item.id}" ${item.id === state.activeScreen ? 'aria-current="step"' : ""}><span>${index + 1}</span><strong>${escapeHTML(item.label)}</strong>${state.validatedScreens.has(item.id) ? '<i class="material-symbols-rounded">check</i>' : ""}</button>`).join("")}<footer>BlueOrigin demonstration<br/>Synthetic data · not a customer system</footer></nav><main class="bc-content" tabindex="-1"><div class="bc-stage-heading"><div><h2>${escapeHTML(headings[state.activeScreen][0])}</h2><p>${escapeHTML(headings[state.activeScreen][1])}</p></div><span>DEMONSTRATION</span></div><div class="bc-notice">${escapeHTML(notices[state.activeScreen])}</div>${renderEligibilityStageBody()}<div class="bc-content-footer"><span>Application received Jul 28, 2026</span><span>Draft saved locally</span><span>Worker training environment</span></div></main></div></section>`;
}

function renderPrograms() {
  if (!state.screenPack) state.screenPack = createDemoScreenPack();
  dom.programStrip.innerHTML = "";
}

function navigateWorkflowScreen(screenId, source = "eligibility navigation") {
  const next = workflow.find((item) => item.id === screenId);
  if (!next || screenId === state.activeScreen) return;
  const previous = state.activeScreen;
  state.activeScreen = screenId;
  state.validated = state.validatedScreens.has(screenId);
  state.hintLevel = 0;
  state.systemNavigationOpen = false;
  state.openCaseSections = null;
  renderWorkflow();
  renderPrograms();
  renderScreen();
  renderCoachGuidance();
  window.requestAnimationFrame(() => document.querySelector(".bc-content")?.scrollTo({ left: 0, top: 0, behavior: "smooth" }));
  addEvent("navigation", `Opened ${next.label} from ${source}`, { target: `screen:${screenId}`, before: previous, after: screenId, sequenceStatus: "worker_navigation" });
  closeResponsivePanels();
}

function focusMappedTarget(targetId) {
  const control = document.querySelector(`[data-target-id="${CSS.escape(targetId)}"]`);
  if (!control) return;
  control.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  const focusable = control.matches("label") ? control.querySelector("input") : control;
  focusable?.focus({ preventScroll: true });
  control.classList.add("located");
  window.setTimeout(() => control.classList.remove("located"), 1800);
}

function updateScreenZoom(action) {
  const levels = [0.75, 0.9, 1, 1.15, 1.25];
  if (action === "fit") state.screenZoom = "fit";
  else {
    const current = state.screenZoom === "fit" ? 1 : Number(state.screenZoom);
    const closest = levels.reduce((best, level, index) => Math.abs(level - current) < Math.abs(levels[best] - current) ? index : best, 0);
    state.screenZoom = levels[Math.max(0, Math.min(levels.length - 1, closest + (action === "in" ? 1 : -1)))];
  }
  renderScreen();
}

function renderWorkflow() {
  const scenario = getScenario();
  const currentIndex = workflow.findIndex((item) => item.id === state.activeScreen);
  dom.workflowNav.innerHTML = workflow
    .map((item, index) => {
      const completed = scenario.completed.includes(item.id) || index < currentIndex;
      const warning = item.id === "evidence" && !state.evidenceReviewed;
      const className = ["workflow-item", state.activeScreen === item.id ? "active" : "", completed ? "completed" : "", warning ? "warning" : ""]
        .filter(Boolean)
        .join(" ");
      return `<button class="${className}" data-screen="${item.id}" ${state.activeScreen === item.id ? 'aria-current="step"' : ""}>
        <span class="workflow-index">${String(index + 1).padStart(2, "0")}</span>
        <span>${item.label}</span>
        <span class="workflow-state" aria-label="${completed ? "Complete" : warning ? "Needs review" : "Not started"}"></span>
      </button>`;
    })
    .join("");
  dom.workflowProgress.textContent = `${Math.max(1, currentIndex + 1)} of ${workflow.length}`;

  dom.workflowNav.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => navigateWorkflowScreen(button.dataset.screen, "case workflow rail"));
  });
}

function renderPrompts() {
  const scenario = getScenario();
  const liveHume = ["connected", "connecting"].includes(state.humeSession.status);
  const interviewFacts = scenario.interviewFacts?.length ? scenario.interviewFacts : scenario.facts;
  dom.promptGrid.innerHTML = interviewFacts
    .map((fact) => {
      const question = fact.learner_question_examples?.[0] || fact.question || `Can you tell me about ${String(fact.topic || fact.label).toLowerCase()}?`;
      const label = fact.label || fact.topic || "this fact";
      return `<button class="prompt-button ${state.disclosedFacts.has(fact.fact_id || fact.id) ? "revealed" : ""}" data-fact="${fact.fact_id || fact.id}" ${liveHume ? 'aria-label="Suggested topic to ask aloud"' : ""}>${escapeHTML(state.mode === "practice" ? `${liveHume ? "Ask aloud: " : ""}${question}` : `Ask about ${label.toLowerCase()}`)}</button>`;
    })
    .join("");
  dom.factsRevealed.textContent = `${Math.min(interviewFacts.length, state.disclosedFacts.size)} / ${interviewFacts.length} interview facts`;

  dom.promptGrid.querySelectorAll("[data-fact]").forEach((button) => {
    button.addEventListener("click", () => liveHume ? showToast("Ask the caller aloud", "Hume will answer from the authored caller brief. The coach will connect the supported response to its BenefitConnect field.", "•") : discloseFact(button.dataset.fact));
  });
}

function recordConversationFact(fact, response, { source = "authored_caller_brief", focus = true } = {}) {
  const factId = fact?.fact_id || fact?.id;
  if (!factId || state.disclosedFacts.has(factId)) return null;
  state.disclosedFacts.add(factId);
  const factEvent = {
    conversation_fact_event_id: `conversation-fact:${Date.now()}-${state.conversationFactEvents.length + 1}`,
    fact_id: factId,
    contact_id: state.humeSession.activeContactId,
    case_path: fact.case_path || "",
    label: fact.label || fact.topic || "Interview fact",
    normalized_value: fact.normalized_value ?? "",
    display_value: fact.normalized_value ?? "",
    provenance: fact.provenance || "Caller statement",
    destination_stage: fact.destination_stage || "",
    destination_section: fact.destination_section || "",
    disclosure_source: source,
    disclosed_at: new Date().toISOString(),
  };
  state.conversationFactEvents.unshift(factEvent);
  addEvent("voice", `Client disclosed: ${factEvent.label}`, { target: `fact:${factId}`, after: response, sequenceStatus: source, citation: `${NOTEBOOK_ID} · authored interview facts` });
  if (focus && factEvent.case_path) window.setTimeout(() => focusConversationFactDestination(factEvent), 180);
  return factEvent;
}

function synchronizeAuthoredFactsFromConversation(learnerText, callerText, turn) {
  const scenario = getScenario();
  const route = state.humeSession.contactSequence || scenario.contactSequence;
  const activeContactId = state.humeSession.activeContactId || route?.active_contact_id;
  if (!route || activeContactId !== route.intended_contact_id) return [];
  const matches = window.BlueOriginDemoScenarios?.matchConversationFacts?.({
    learner_text: learnerText,
    caller_text: callerText,
    facts: scenario.truthLedger || scenario.interviewFacts || [],
    disclosed_fact_ids: [...state.disclosedFacts],
  }) || [];
  const recorded = matches.map((fact, index) => recordConversationFact(fact, callerText, { source: "hume_authored_brief_match", focus: index === 0 })).filter(Boolean);
  if (recorded.length && turn) turn.disclosed_fact_ids = [...new Set([...(turn.disclosed_fact_ids || []), ...recorded.map((fact) => fact.fact_id)])];
  if (recorded.length) {
    renderPrompts();
    renderCoachGuidance();
  }
  return recorded;
}

function discloseFact(factId) {
  const scenario = getScenario();
  const fact = scenario.interviewFacts?.find((item) => item.fact_id === factId)
    || scenario.facts.find((item) => item.id === factId);
  if (!fact) return;
  const response = fact.natural_response || fact.authorized_response || fact.caption;
  const label = fact.label || fact.topic;
  const wasNew = !state.disclosedFacts.has(factId);
  dom.clientCaption.classList.add("transitioning");
  window.setTimeout(() => {
    dom.clientCaption.textContent = response;
    dom.disclosureLabel.textContent = label;
    dom.disclosureTime.textContent = formatTime(state.elapsed);
    dom.clientCaption.classList.remove("transitioning");
  }, 120);
  if (wasNew) {
    addVoiceTurn("client", response, [fact.fact_id || fact.id]);
    if (state.humeSession.status === "guided") speakGuidedCaller(response);
    transitionCallerAffect("deescalate", `appropriate_${fact.id}_question`);
    recordConversationFact(fact, response, { source: "guided_authored_fact" });
  }
  renderPrompts();
  renderCoachGuidance();
}

function renderHouseholdScreen() {
  const scenario = getScenario();
  const startingState = state.caseStartingState || buildCaseStartingState(scenario);
  const revealValidation = state.validated && (state.mode === "practice" || state.submitted);
  const relationshipError = revealValidation && state.form.relationship !== scenario.expected.relationship;
  const incomeError = revealValidation && state.form.income !== scenario.expected.income;
  return `<div class="screen-inner">
    <div class="section-heading">
      <div><span class="overline">Eligibility record · Household</span><h2>Build the case household.</h2></div>
      <p>Capture only facts supported by the application, client disclosure, or verified evidence.</p>
    </div>

    <section class="case-starting-banner" aria-label="Starting case state">
      <div><span class="material-symbols-rounded" aria-hidden="true">inventory_2</span><div><small>Frozen starting state</small><strong>${escapeHTML(startingState.application_type)}</strong><p>${startingState.existing_case ? "Existing case values are prefilled; reported changes and current verification remain separate." : "Submitted application facts are prefilled; missing or unverified facts remain open for the interview."}</p>${startingState.reported_changes.length ? `<div class="reported-change-line"><span class="material-symbols-rounded" aria-hidden="true">sync_alt</span><span><b>${startingState.application_type === "Initial application" ? "Intake flags" : "Reported changes"}</b> · ${startingState.reported_changes.map(escapeHTML).join(" · ")}</span></div>` : ""}</div></div>
      <dl><div><dt>Prefilled</dt><dd>${Object.values(startingState.prefilled_fields).filter((field) => field.value).length} fields</dd></div><div><dt>Evidence</dt><dd>${startingState.evidence.length} items</dd></div><div><dt>Capture</dt><dd>Event snapshots</dd></div></dl>
    </section>

    <div class="summary-grid">
      <article class="summary-card accent"><small>Primary applicant</small><strong>${escapeHTML(scenario.persona.name)}</strong><span>${escapeHTML(scenario.type)}</span></article>
      <article class="summary-card"><small>Programs requested</small><strong>${scenario.programs.length} program${scenario.programs.length === 1 ? "" : "s"}</strong><span>${scenario.programs.join(" · ")}</span></article>
      <article class="summary-card dark"><small>Evaluation state</small><strong>${state.mode === "practice" ? "Coaching active" : "Recording silently"}</strong><span>${state.mode === "practice" ? "Cited feedback and retry" : "Feedback after submission"}</span></article>
    </div>

    <section class="form-panel" aria-labelledby="applicantHeading">
      <div class="panel-heading"><div><h3 id="applicantHeading">Applicant record</h3><p>Person 01 · Requesting assistance</p></div><span class="member-badge">Household member</span></div>
      <div class="form-grid">
        <div class="form-field"><div class="field-heading"><label for="fullName">Legal name</label><span class="provenance-badge application">${escapeHTML(startingState.prefilled_fields.fullName.provenance)}</span></div><input id="fullName" value="${escapeHTML(scenario.persona.name)}" readonly /><div class="field-provenance"><span class="material-symbols-rounded" aria-hidden="true">verified</span>Verified in the frozen starting package</div></div>
        <div class="form-field ${relationshipError ? "invalid" : revealValidation ? "valid" : ""}">
          <div class="field-heading"><label for="relationship">Relationship to primary applicant</label><span class="provenance-badge ${startingState.prefilled_fields.relationship.value ? "existing" : "client"}">${escapeHTML(startingState.prefilled_fields.relationship.provenance)}</span></div>
          <select id="relationship"><option value="">Select relationship</option>${["Self", "Spouse", "Child", "Other adult"].map((value) => `<option ${state.form.relationship === value ? "selected" : ""}>${value}</option>`).join("")}</select>
          ${revealValidation ? `<div class="field-message ${relationshipError ? "" : "valid"}">${relationshipError ? "Incorrect — the primary applicant must be recorded as Self." : "Correct — relationship matches the case facts."}</div>` : `<div class="field-provenance"><span class="material-symbols-rounded" aria-hidden="true">${startingState.prefilled_fields.relationship.value ? "history" : "forum"}</span>${startingState.prefilled_fields.relationship.verification_status}</div>`}
        </div>
        <div class="form-field"><div class="field-heading"><label for="dateOfBirth">Date of birth</label><span class="provenance-badge application">${escapeHTML(startingState.prefilled_fields.dateOfBirth.provenance)}</span></div><input id="dateOfBirth" type="text" value="${escapeHTML(startingState.prefilled_fields.dateOfBirth.value)}" readonly /><div class="field-provenance"><span class="material-symbols-rounded" aria-hidden="true">lock</span>Read-only submitted value</div></div>
        <div class="form-field ${incomeError ? "invalid" : revealValidation ? "valid" : ""}">
          <div class="field-heading"><label for="monthlyIncome">Gross monthly earned income</label><span class="provenance-badge document">${escapeHTML(startingState.prefilled_fields.income.provenance)}</span></div>
          <input id="monthlyIncome" inputmode="decimal" placeholder="$0" value="${escapeHTML(state.form.income)}" aria-describedby="incomeHelp" />
          ${revealValidation ? `<div class="field-message ${incomeError ? "" : "valid"}" id="incomeHelp">${incomeError ? `Incorrect — supported gross monthly income is $${Number(scenario.expected.income).toLocaleString()}.` : "Correct — value matches the verified wage evidence."}</div>` : `<div class="field-provenance" id="incomeHelp"><span class="material-symbols-rounded" aria-hidden="true">fact_check</span>Requires client confirmation and evidence review</div>`}
        </div>
        <div class="form-field full"><div class="field-heading"><label for="caseNotes">Case comment</label><span class="required-label">Optional</span></div><textarea id="caseNotes" placeholder="Document the source and reason for any exception…">${escapeHTML(state.form.notes)}</textarea></div>
      </div>
      <div class="evidence-inline">
        <div class="evidence-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l4 4v14H7zM15 3v5h4M10 12h6M10 16h4"/></svg></div>
        <div><strong>Current wage statement.pdf</strong><span>Uploaded with application · Source supports monthly income</span></div>
        <span class="evidence-status ${state.evidenceReviewed ? "reviewed" : ""}">${state.evidenceReviewed ? "Reviewed" : "Review required"}</span>
      </div>
    </section>
  </div>`;
}

function renderIntakeScreen() {
  const scenario = getScenario();
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Eligibility record · Intake</span><h2>Confirm the request.</h2></div><p>The frozen package establishes the application date, requested programs, and processing clock.</p></div>
    <div class="task-list">
      <article class="task-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg></div><div><h3>Application received</h3><p>Online application received July 29, 2026 at 8:12 AM.</p><span class="source-line">package://${scenario.id}/application</span></div><span class="status-label">Confirmed</span></article>
      <article class="task-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg></div><div><h3>Program requests</h3><p>${scenario.programs.join(", ")} selected by the applicant.</p><span class="source-line">${NOTEBOOK_ID}</span></div><span class="status-label">Complete</span></article>
      <article class="task-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><div><h3>Processing clock</h3><p>${scenario.id === "BO-005" ? "Expedited screening required today." : "Standard demonstration processing clock is active."}</p></div><span class="status-label ${scenario.id === "BO-005" ? "critical" : "pending"}">${scenario.id === "BO-005" ? "Critical" : "Active"}</span></article>
    </div></div>`;
}

function renderProgramsScreen() {
  const scenario = getScenario();
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Eligibility record · Programs</span><h2>Define assistance units.</h2></div><p>Program membership may differ even when programs share the same case household.</p></div>
    <table class="result-matrix"><thead><tr><th>Program</th><th>Request</th><th>Unit members</th><th>Pathway</th><th>Status</th></tr></thead><tbody>${scenario.programs.map((program) => `<tr><td><strong>${program}</strong></td><td>Initial</td><td>${scenario.persona.name}${program === "SNAP" ? " + household" : " + children"}</td><td>${program === "Medicaid" ? "MAGI + screen" : program === "SNAP" ? "Food unit" : "Cash unit"}</td><td><span class="status-label pending">In progress</span></td></tr>`).join("")}</tbody></table></div>`;
}

function renderFinancialScreen() {
  const scenario = getScenario();
  const income = Number(scenario.expected.income);
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Eligibility record · Financial</span><h2>Trace every dollar.</h2></div><p>Values remain linked to evidence and the applicable program treatment.</p></div>
    <div class="calculation-card"><div class="calculation-step"><small>Reported gross</small><strong>$${income.toLocaleString()}</strong><span>Monthly earned income</span></div><div class="calculation-step"><small>Earned deduction</small><strong>− $${Math.round(income * .2).toLocaleString()}</strong><span>Demonstration calculation</span></div><div class="calculation-step"><small>Other deductions</small><strong>− $320</strong><span>Dependent care</span></div><div class="calculation-step"><small>Adjusted amount</small><strong>$${Math.max(0, Math.round(income * .8) - 320).toLocaleString()}</strong><span>Before shelter treatment</span></div></div>
    <section class="form-panel"><div class="panel-heading"><div><h3>Financial evidence</h3><p>All values are realistic and synthetic</p></div><span class="member-badge">2 records</span></div><div class="evidence-inline"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM8 10h8M8 14h4"/></svg></div><div><strong>Current wage statement</strong><span>Employer, pay frequency, gross wages, and pay date</span></div><span class="evidence-status reviewed">Matched</span></div></section></div>`;
}

function renderNonFinancialScreen() {
  const scenario = getScenario();
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Eligibility record · Non-financial</span><h2>Screen every pathway.</h2></div><p>Citizenship, residency, pregnancy, disability, coverage, and work facts are evaluated per person.</p></div>
    <div class="summary-grid"><article class="summary-card"><small>Residency</small><strong>State resident</strong><span>Attested and address matched</span></article><article class="summary-card accent"><small>Special pathway</small><strong>${scenario.id === "BO-004" ? "Non-MAGI required" : scenario.id === "BO-001" ? "Pregnancy disclosed" : "No additional screen"}</strong><span>Do not bypass required screening</span></article><article class="summary-card dark"><small>Verification</small><strong>Identity matched</strong><span>Electronic source returned</span></article></div>
    <section class="form-panel"><div class="panel-heading"><div><h3>Person-level factors</h3><p>${scenario.persona.name}</p></div><span class="member-badge">Person 01</span></div><div class="form-grid"><div class="form-field"><div class="field-heading"><label>Residency</label></div><input value="Resident" readonly /></div><div class="form-field"><div class="field-heading"><label>Citizenship/qualified status</label></div><input value="Verified" readonly /></div><div class="form-field"><div class="field-heading"><label>Pregnancy</label></div><input value="${scenario.id === "BO-001" ? "Yes — disclosed" : "No"}" readonly /></div><div class="form-field"><div class="field-heading"><label>Disability screen</label></div><input value="${scenario.id === "BO-004" ? "Potential basis — refer" : "No basis disclosed"}" readonly /></div></div></section></div>`;
}

function renderEvidenceScreen() {
  const scenario = getScenario();
  const startingState = state.caseStartingState || buildCaseStartingState(scenario);
  const sources = scenario.programs.map((program) => ({
    program,
    id: sourceIds[program.toLowerCase()],
    title: `${program} federal design reference`,
  }));
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Evidence · Source lineage</span><h2>Trust, then verify.</h2></div><p>Case evidence and design guidance remain distinguishable and traceable.</p></div>
    <div class="evidence-list">
      ${startingState.evidence.map((evidence) => `<article class="evidence-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7zM15 3v5h4M10 12h6M10 16h4"/></svg></div><div><h3>${escapeHTML(evidence.title)}</h3><p>Synthetic case evidence · <span class="provenance-badge ${evidence.provenance === "Data match" ? "match" : evidence.provenance === "Document" ? "document" : "application"}">${escapeHTML(evidence.provenance)}</span></p><span class="source-line">attempt://${scenario.id}/evidence/${escapeHTML(evidence.evidence_id.split(":").pop())}</span></div><span class="status-label ${state.evidenceReviewed ? "" : "pending"}">${state.evidenceReviewed ? "Reviewed" : escapeHTML(evidence.status)}</span></article>`).join("")}
      ${sources.map((source) => `<article class="evidence-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg></div><div><h3>${source.title}</h3><p>Federal design reference; state policy authority still required.</p><span class="source-line">${source.id}</span></div><span class="status-label">Linked</span></article>`).join("")}
      <article class="evidence-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M5 5h14v14H5zM9 9h6v6H9z"/></svg></div><div><h3>UI/UX design specification</h3><p>Sana reference translation and eligibility guardrails</p><span class="source-line">${SPEC_NOTE_ID}</span></div><span class="status-label">Approved source</span></article>
    </div></div>`;
}

function renderEligibilityScreen() {
  const scenario = getScenario();
  const rows = scenario.programs.map((program, index) => {
    const benefit = program === "SNAP" ? "$536" : program === "TANF" ? "$412" : "Coverage";
    return `<tr><td><strong>${program}</strong></td><td>${scenario.persona.name}</td><td>Aug 2026</td><td><span class="status-label">Eligible</span></td><td class="currency">${benefit}</td><td>${index === 0 ? "Pass" : "Pass with pending verification"}</td></tr>`;
  }).join("");
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Eligibility · Program/person/month</span><h2>Interpret the result.</h2></div><p>Deterministic rules own formal eligibility and critical-error classification.</p></div><table class="result-matrix"><thead><tr><th>Program</th><th>Person</th><th>Month</th><th>Result</th><th>Benefit</th><th>Rule trace</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="calculation-card"><div class="calculation-step"><small>Rules evaluated</small><strong>24</strong><span>Frozen package rules</span></div><div class="calculation-step"><small>Critical errors</small><strong>${state.validated ? "0" : "—"}</strong><span>Cannot be AI-overridden</span></div><div class="calculation-step"><small>Pending items</small><strong>1</strong><span>Verification due</span></div><div class="calculation-step"><small>Confidence</small><strong>100%</strong><span>Deterministic result</span></div></div></div>`;
}

function renderNoticesScreen() {
  const scenario = getScenario();
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Notices · Client communication</span><h2>Explain the decision.</h2></div><p>Notice selection is evaluated as a meaningful learner action.</p></div><div class="notice-list">
    ${scenario.programs.map((program) => `<article class="notice-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM4 8l8 6 8-6"/></svg></div><div><h3>${program} approval notice</h3><p>Effective month, benefit or coverage, verification duty, and appeal rights.</p><span class="source-line">package://${scenario.id}/notice/${program.toLowerCase()}</span></div><span class="status-label pending">Select</span></article>`).join("")}
    <article class="notice-card"><div class="evidence-icon"><svg viewBox="0 0 24 24"><path d="M12 4v10M12 18h.01"/></svg></div><div><h3>Pending verification notice</h3><p>Requests only the unresolved item and states the due date.</p></div><span class="status-label pending">Required</span></article></div></div>`;
}

function renderAuthorizationScreen() {
  const scenario = getScenario();
  const closureComplete = Object.values(state.closure).every(Boolean);
  const ready = state.householdComplete && state.evidenceReviewed && closureComplete && state.callEnded;
  return `<div class="screen-inner"><div class="section-heading"><div><span class="overline">Authorization · Final action</span><h2>Close the call deliberately.</h2></div><p>Authorization is explicit, program-scoped, and unavailable until critical prerequisites and client communication are complete.</p></div><div class="summary-grid"><article class="summary-card accent"><small>Programs</small><strong>${scenario.programs.join(" + ")}</strong><span>Effective August 2026</span></article><article class="summary-card"><small>Processing prerequisites</small><strong>${state.householdComplete && state.evidenceReviewed ? "Satisfied" : "Not satisfied"}</strong><span>Screen validation and evidence review</span></article><article class="summary-card dark"><small>System boundary</small><strong>Prototype only</strong><span>No official case-system write</span></article></div>
    <section class="closure-panel" aria-labelledby="closureHeading"><div class="panel-heading"><div><h3 id="closureHeading">Call closure checklist</h3><p>Confirm what the learner communicated before ending the simulated call.</p></div><span class="member-badge">${Object.values(state.closure).filter(Boolean).length} of 4</span></div><div class="closure-checklist">
      ${[["discrepancies", "Reviewed unresolved discrepancies", "Confirm that conflicting or missing information was discussed."], ["factsConfirmed", "Confirmed material facts", "Summarize the household, income, and program requests with the client."], ["nextSteps", "Explained next steps", "State any verification due date, pending action, or benefit timing."], ["closingSummary", "Provided a closing summary", "Explain the program result and invite final questions."]].map(([key, title, text]) => `<label><input type="checkbox" data-closure="${key}" ${state.closure[key] ? "checked" : ""}/><span class="material-symbols-rounded" aria-hidden="true">${state.closure[key] ? "check_circle" : "radio_button_unchecked"}</span><span><strong>${title}</strong><small>${text}</small></span></label>`).join("")}
    </div><div class="call-end-row"><div><span class="material-symbols-rounded" aria-hidden="true">${state.callEnded ? "call_end" : "call"}</span><div><strong>${state.callEnded ? "Call ended" : "Simulated call is active"}</strong><small>${state.callEnded ? "Transcript and voice-turn timing are frozen." : "End the call only after completing the client summary."}</small></div></div><button class="button button-secondary" id="endCallButton" ${closureComplete ? "" : "disabled"}>${state.callEnded ? "Call ended" : "End call"}</button></div></section>
    <section class="authorization-ready ${ready ? "ready" : ""}"><span class="material-symbols-rounded" aria-hidden="true">${ready ? "verified_user" : "pending_actions"}</span><div><strong>${ready ? "Ready to submit the prototype result" : "Complete the remaining prerequisites"}</strong><p>${ready ? "Submission freezes the attempt, reveals assessment feedback, and prepares the Open Notebook writeback." : "Validate the household, review evidence, finish the closure checklist, and end the call."}</p></div></section></div>`;
}

function getCallerProfile() {
  return callerProfiles.find((profile) => profile.profile_id === state.selectedCallerProfileId) || callerProfiles[1];
}

function getCallerVoice() {
  return callerVoices.find((voice) => voice.voice_key === state.selectedCallerVoiceKey) || callerVoices[0];
}

function buildApplicantCaseView(scenario = getScenario()) {
  const source = BenefitConnectIntegrated.clone(scenario.integratedCase || state.caseDraft || {});
  const application = source.application || {};
  const nonfinancial = source.nonfinancial || {};
  return {
    schema_version: "applicant-case-view-v2",
    case_id: scenario.caseId,
    case_type: scenario.type,
    application: {
      type: application.type,
      channel: application.channel,
      receivedDate: application.receivedDate,
      receivedTime: application.receivedTime,
      preferredLanguage: application.preferredLanguage,
      interpreterNeeded: application.interpreterNeeded,
      accessibilityNeed: application.accessibilityNeed,
      contactMethod: application.contactMethod,
      phoneContactName: application.phoneContactName,
      phoneContactRelationship: application.phoneContactRelationship,
      phone: application.phone,
      email: application.email,
      bestContactTime: application.bestContactTime,
      residentialAddress: application.residentialAddress,
      cityStateZip: application.cityStateZip,
      mailingAddressSame: application.mailingAddressSame,
      mailingAddress: application.mailingAddress,
      authorizedRepresentative: application.authorizedRepresentative,
      representativeName: application.representativeName,
      urgentNeed: application.urgentNeed,
      urgentNeedType: application.urgentNeedType,
      interviewMode: application.interviewMode,
    },
    people: source.people || [],
    programRequests: source.programRequests || {},
    incomeStatus: source.incomeStatus,
    incomeSources: source.incomeSources || [],
    expenses: source.expenses || {},
    resourcesStatus: source.resourcesStatus,
    resources: source.resources || [],
    nonfinancial: {
      residency: nonfinancial.residency,
      citizenship: nonfinancial.citizenship,
      immigrationDocument: nonfinancial.immigrationDocument,
      sponsorStatus: nonfinancial.sponsorStatus,
      sponsorName: nonfinancial.sponsorName,
      studentStatus: nonfinancial.studentStatus,
      disabilityClaimed: nonfinancial.disabilityClaimed,
      disabilityDetails: nonfinancial.disabilityDetails,
      blindnessStatus: nonfinancial.blindnessStatus,
      pregnancyStatus: nonfinancial.pregnancyStatus,
      caretakerStatus: nonfinancial.caretakerStatus,
      healthCoverage: nonfinancial.healthCoverage,
      workParticipation: nonfinancial.workParticipation,
      absentParentStatus: nonfinancial.absentParentStatus,
      priorBenefitHistory: nonfinancial.priorBenefitHistory,
      disqualificationHistory: nonfinancial.disqualificationHistory,
    },
  };
}

function callerBriefValueAtPath(value, path) {
  return String(path || "").split(".").filter(Boolean).reduce((current, part) => current == null ? undefined : current[/^\d+$/.test(part) ? Number(part) : part], value);
}

function callerBriefHasValue(value) {
  return value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length);
}

function callerBriefDisplayValue(value) {
  if (Array.isArray(value)) return value.map(callerBriefDisplayValue).filter(Boolean).join(", ").slice(0, 500);
  if (value && typeof value === "object") return Object.entries(value).filter(([, item]) => callerBriefHasValue(item)).map(([key, item]) => `${key}: ${callerBriefDisplayValue(item)}`).join("; ").slice(0, 500);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value ?? "").trim().slice(0, 500);
}

function buildDemoCallerBriefDefinition(scenario, caseDraft = scenario?.integratedCase) {
  const caseScenario = { ...scenario, integratedCase: caseDraft || scenario?.integratedCase };
  const application = buildApplicantCaseView(caseScenario);
  const candidateGroups = [
    { limit: 2, paths: [["application.type", "Application type"], ["application.receivedDate", "Application received date"], ["application.preferredLanguage", "Preferred language"], ["application.contactMethod", "Preferred contact method"], ["application.urgentNeed", "Urgent need"]] },
    { limit: 6, paths: [["people.0.name", "Primary applicant"], ["people.0.dateOfBirth", "Primary applicant date of birth"], ["people.1.name", "Second household member"], ["people.1.relationship", "Second household member relationship"], ["people.2.name", "Third household member"], ["people.2.relationship", "Third household member relationship"], ["people.0.relationship", "Primary applicant relationship"]] },
    { limit: 3, paths: [["programRequests.Medicaid.requestStatus", "Medicaid request"], ["programRequests.SNAP.requestStatus", "SNAP request"], ["programRequests.TANF.requestStatus", "TANF request"]] },
    { limit: 1, paths: [["incomeSources.0.person", "Income owner"], ["incomeSources.0.employer", "Employer"], ["incomeSources.0.grossAmount", "Gross income"], ["incomeSources.0.frequency", "Income frequency"], ["incomeSources.0.hours", "Work hours"]] },
    { limit: 0, paths: [["expenses.shelter.type", "Shelter type"], ["expenses.shelter.amount", "Shelter amount"], ["expenses.utilitiesStatus", "Utilities status"], ["expenses.dependentCare.0.amount", "Dependent-care amount"], ["expenses.medical.0.amount", "Medical-expense amount"]] },
    { limit: 0, paths: [["resources.1.vehicleDescription", "Vehicle"], ["resources.1.type", "Additional resource type"], ["resources.1.value", "Additional resource value"], ["resources.0.type", "Resource type"], ["resources.0.value", "Resource value"], ["resourcesStatus", "Resources status"]] },
    { limit: 1, paths: [["nonfinancial.residency", "Residency"], ["nonfinancial.citizenship", "Citizenship or immigration status"], ["nonfinancial.disabilityClaimed", "Disability status"], ["nonfinancial.pregnancyStatus", "Pregnancy status"], ["nonfinancial.healthCoverage", "Other health coverage"], ["nonfinancial.workParticipation", "TANF work participation"], ["nonfinancial.caretakerStatus", "Caretaker status"]] },
  ];
  const factPaths = candidateGroups.flatMap((group) => group.paths.filter(([path]) => callerBriefHasValue(callerBriefValueAtPath(application, path))).slice(0, group.limit)).map(([case_path, topic]) => ({ fact_id: `brief:${case_path}`, case_path, topic }));
  return {
    version: DEMO_CALLER_BRIEF_VERSION,
    scenario_id: scenario.id,
    summary: `${scenario.persona.name} is the ${scenario.persona.description.toLowerCase()} for a ${scenario.type.toLowerCase()} requesting ${scenario.programs.join(", ")}. ${scenario.description}`,
    fact_paths: factPaths,
    interview_fact_ids: (scenario.truthLedger || []).filter((fact) => ["interview_only", "conversation_topic"].includes(fact.fact_state)).map((fact) => fact.fact_id),
    correction_ids: (scenario.truthLedger || []).filter((fact) => ["correction", "disputed"].includes(fact.fact_state)).map((fact) => fact.fact_id),
    known_unknowns: [
      { topic: "An exact detail the caller genuinely does not know", response: "I’m not sure of the exact detail. I would need to check and get back to you." },
      { topic: "Exact document submission time", response: "I don’t remember the exact time I submitted it." },
    ],
    improvisation_boundary: {
      allowed: ["Natural wording and pacing", "Hesitation and emotional reactions", "Small talk", "Requests for clarification", "Saying information is not remembered"],
      prohibited: ["Names or household members", "Dates, addresses, or contact details", "Programs", "Employment or income", "Expenses or resources", "Nonfinancial eligibility facts", "Documents or agency actions"],
    },
  };
}

function buildDemoCallerBriefPreview(scenario, caseDraft = scenario?.integratedCase, contactSequence = scenario?.contactSequence) {
  const caseScenario = { ...scenario, integratedCase: caseDraft || scenario.integratedCase };
  const application = buildApplicantCaseView(caseScenario);
  const definition = buildDemoCallerBriefDefinition(caseScenario, caseScenario.integratedCase);
  const sequence = contactSequence || createDefaultContactSequence(caseScenario);
  const activeId = sequence.active_contact_id || sequence.answering_contact_id;
  const active = sequence.contacts?.find((contact) => contact.contact_id === activeId) || sequence.contacts?.[0] || {};
  const errors = [];
  const facts = definition.fact_paths.map((item) => {
    const value = callerBriefValueAtPath(application, item.case_path);
    if (!callerBriefHasValue(value)) errors.push(`Missing case path: ${item.case_path}`);
    return { fact_id: item.fact_id, case_path: item.case_path, topic: item.topic, value: callerBriefDisplayValue(value), status: "submitted", provenance: "Submitted application" };
  }).filter((fact) => fact.value);
  const correctionMap = new Map((scenario.truthLedger || []).map((fact) => [fact.fact_id, fact]));
  const correctionPaths = { household: "people", income: "incomeSources", pregnancy: "nonfinancial.pregnancyStatus", expenses: "expenses" };
  const authoredInterviewFacts = (definition.interview_fact_ids || []).map((factId) => {
    const fact = correctionMap.get(factId);
    if (!fact?.label || !fact?.natural_response || !fact?.learner_question_examples?.length) errors.push(`Incomplete authored interview fact: ${factId}`);
    const casePath = fact?.case_path || correctionPaths[factId] || "";
    if (!casePath) errors.push(`Interview fact has no destination: ${factId}`);
    if (["correction", "disputed"].includes(fact?.fact_state) && !callerBriefHasValue(callerBriefValueAtPath(application, casePath))) errors.push(`Correction has no submitted value: ${factId}`);
    return fact ? { fact_id: factId, case_path: casePath, topic: fact.label, value: fact.normalized_value, response: fact.natural_response } : null;
  }).filter(Boolean);
  const gatedFacts = (definition.correction_ids || []).map((factId) => {
    const fact = correctionMap.get(factId);
    const casePath = fact?.case_path || correctionPaths[factId] || "";
    return fact ? { fact_id: factId, case_path: casePath, topic: fact.label, status: fact.fact_state || "corrected", disclosure: "request_case_response" } : null;
  }).filter(Boolean);
  const brief = {
    version: definition.version,
    scenario_id: scenario.id,
    summary: definition.summary,
    caller: { contact_id: active.contact_id || "", name: active.name || "", role: active.role || "", greeting: active.greeting || "Hello?", language: active.preferred_language || "English", behavior: active.profile_id || "" },
    facts,
    interview_facts: authoredInterviewFacts,
    known_unknowns: definition.known_unknowns,
    gated_facts: gatedFacts,
    improvisation_boundary: definition.improvisation_boundary,
    missing_fact_response: "I’m not sure of that detail. I would need to check before giving you an answer.",
  };
  const sizeBytes = new TextEncoder().encode(JSON.stringify(brief)).length;
  if (!brief.caller.contact_id || !brief.caller.name) errors.push("Caller identity and contact ID are required.");
  if (!facts.length) errors.push("At least one submitted fact is required.");
  if (sizeBytes > DEMO_CALLER_BRIEF_MAX_BYTES) errors.push(`Caller brief exceeds ${DEMO_CALLER_BRIEF_MAX_BYTES} bytes.`);
  return { definition, caller_brief: brief, validation: { valid: !errors.length, errors, size_bytes: sizeBytes, fact_count: facts.length, gated_fact_count: gatedFacts.length, interview_fact_count: authoredInterviewFacts.length, excluded_sections: ["evidence", "authoredOutcomes", "notices", "authorization", "scoring", "coaching"] } };
}

function flattenApplicantFacts(value, sequence, path = "", facts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenApplicantFacts(item, sequence, `${path}.${index}`, facts));
    return facts;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => flattenApplicantFacts(item, sequence, path ? `${path}.${key}` : key, facts));
    return facts;
  }
  if (!path || value === "" || value === undefined || value === null) return facts;
  const label = path.split(".").at(-1).replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  const intended = sequence.intended_contact_id;
  const authorized = sequence.contacts.filter((contact) => ["applicant", "authorized_representative"].includes(contact.role) || ["full", "authorized"].includes(contact.disclosure_authority)).map((contact) => contact.contact_id);
  const personMatch = path.match(/^people\.(\d+)\./);
  const personContact = personMatch ? sequence.contacts.find((contact) => contact.person_id && contact.person_id === sequence.contacts.filter((item) => item.person_id)[Number(personMatch[1])]?.person_id) : null;
  const allowed = [...new Set([intended, ...authorized, ...(personContact ? [personContact.contact_id] : [])].filter(Boolean))];
  const normalized = String(value).trim().toLowerCase();
  facts.push({
    fact_id: `application:${path}`,
    case_path: path,
    topic: label,
    submitted_value: value,
    applicant_value: value,
    status: normalized === "unknown" ? "unknown" : normalized === "not applicable" ? "not_applicable" : "submitted",
    provenance: "Submitted application",
    allowed_contact_ids: allowed,
  });
  return facts;
}

function buildApplicationContextEnvelope(scenario = getScenario()) {
  const sequence = BenefitConnectIntegrated.clone(scenario.contactSequence || createDefaultContactSequence(scenario));
  const applicantCaseView = buildApplicantCaseView(scenario);
  const facts = flattenApplicantFacts(applicantCaseView, sequence);
  const fullAccessContacts = sequence.contacts.filter((contact) => ["full", "authorized"].includes(contact.disclosure_authority)).map((contact) => contact.contact_id);
  const ledger = scenario.truthLedger || [];
  const interviewFacts = ledger.filter((fact) => ["interview_only", "conversation_topic"].includes(fact.fact_state)).map((fact) => ({
    fact_id: fact.fact_id,
    case_path: fact.case_path,
    topic: fact.label,
    applicant_value: fact.normalized_value,
    normalized_value: fact.normalized_value,
    authorized_response: fact.natural_response,
    status: fact.fact_state,
    provenance: fact.provenance || "Caller statement",
    destination_stage: fact.destination_stage,
    destination_section: fact.destination_section,
    allowed_contact_ids: fact.known_by_contact_ids?.length ? fact.known_by_contact_ids : fullAccessContacts,
  }));
  const corrections = ledger.filter((fact) => ["correction", "disputed"].includes(fact.fact_state)).map((fact) => ({
    fact_id: fact.fact_id,
    case_path: fact.case_path,
    topic: fact.label,
    applicant_value: fact.normalized_value,
    normalized_value: fact.normalized_value,
    authorized_response: fact.natural_response,
    status: fact.fact_state,
    allowed_contact_ids: fact.known_by_contact_ids?.length ? fact.known_by_contact_ids : fullAccessContacts,
  }));
  return {
    schema_version: "hume-application-context-v3",
    case_type: scenario.type,
    programs: [...scenario.programs],
    submitted_facts: {
      applicant_name: scenario.persona.name,
      requested_programs: [...scenario.programs],
      case_id: scenario.caseId,
    },
    applicant_case_view: applicantCaseView,
    facts,
    interview_facts: interviewFacts,
    private_corrections: corrections,
    missing_facts: ledger.map((fact) => ({ fact_id: fact.fact_id, topic: fact.label, case_path: fact.case_path, appropriate_question: fact.learner_question_examples?.[0] || `Ask about ${fact.label.toLowerCase()}.` })),
    disclosure_rules: ledger.map((fact) => ({ fact_id: fact.fact_id, disclose_only_after: `The learner asks an appropriate question about ${fact.label.toLowerCase()}.` })),
    call_objectives: ["Establish the purpose of the call", "Clarify submitted, missing, or changed application facts", "Respond only as the active contact", "Finish the eligibility interview naturally"],
  };
}

function callerStateLabel(stateName, trend = "steady") {
  const labels = {
    calm: "Caller steady", anxious: "Concern present", frustrated: "Frustration present", angry: "Caller becoming more upset",
    guarded: "Caller becoming more guarded", reluctant: "Caller reluctant to continue", sad: "Caller sounds discouraged",
    confused: "Clarification may help", distressed: "Caller sounds overwhelmed",
  };
  const base = labels[stateName] || `${stateName.charAt(0).toUpperCase()}${stateName.slice(1)} present`;
  return trend === "rising" && !/rising|becoming/i.test(base) ? `${base} · rising` : trend === "falling" ? `${base} · easing` : base;
}

function initializeCallerAffect(reason = "profile_selected") {
  const profile = getCallerProfile();
  const intensity = callerIntensity[state.selectedCallerIntensity]?.value || profile.baseline_intensity;
  const baseState = profile.profile_id.startsWith("benefits-") ? profile.profile_id.replace("benefits-", "") : profile.hume_expression;
  state.callerAffect = { state: baseState, label: callerStateLabel(baseState), trend: "steady", confidence: 1, intensity, cooperation: profile.cooperation_style, source: "deterministic" };
  state.callerAffectTimeline = [{ caller_affect_state_id: `caller-state:${Date.now()}`, profile_id: profile.profile_id, state: baseState, intensity, cooperation: profile.cooperation_style, trigger: reason, timestamp: new Date().toISOString() }];
}

function transitionCallerAffect(direction, trigger) {
  if (["connecting", "connected"].includes(state.humeSession.status)) {
    addEvent("voice", "Worker-screen action was not synchronized to the live caller", { target: `hume:behavior:${trigger}`, after: "Hume remains driven by the spoken conversation", sequenceStatus: "screen_state_isolated" });
    return;
  }
  const profile = getCallerProfile();
  const current = state.callerAffect;
  let intensity = current.intensity || callerIntensity[state.selectedCallerIntensity]?.value || 2;
  let next = current.state;
  let trend = "steady";
  if (direction === "escalate") {
    intensity = Math.min(3, intensity + 1);
    trend = "rising";
    if (["calm", "anxious", "confused"].includes(next)) next = profile.allowed_transitions.includes("guarded") ? "guarded" : next;
    else if (next === "frustrated" && profile.allowed_transitions.includes("angry")) next = "angry";
  } else if (direction === "deescalate") {
    intensity = Math.max(1, intensity - 1);
    trend = "falling";
    if (["angry", "guarded", "reluctant"].includes(next)) next = profile.allowed_transitions.includes("frustrated") ? "frustrated" : "calm";
    else if (["distressed", "sad"].includes(next)) next = profile.allowed_transitions.includes("anxious") ? "anxious" : "calm";
    else if (intensity === 1) next = "calm";
  }
  setCallerAffect(next, callerStateLabel(next, trend), trend, 1, { intensity, cooperation: current.cooperation, trigger, source: "deterministic" });
  sendCallerContextUpdate(trigger);
}

function prepareContactSequenceForCall(scenario = getScenario()) {
  const sequence = BenefitConnectIntegrated.clone(scenario.contactSequence || createDefaultContactSequence(scenario));
  const activeId = sequence.answering_contact_id || sequence.intended_contact_id;
  const active = sequence.contacts.find((contact) => contact.contact_id === activeId) || sequence.contacts[0];
  if (active && !sequence.route_locked) {
    const selectedVoice = getCallerVoice();
    active.profile_id = state.selectedCallerProfileId;
    active.intensity = state.selectedCallerIntensity;
    active.voice_key = selectedVoice.voice_key;
    active.voice_id = selectedVoice.voice_id;
    active.voice_label = selectedVoice.label;
    active.voice_presentation = selectedVoice.presentation;
  }
  sequence.active_contact_id = active?.contact_id || activeId;
  return sequence;
}

function cancelSilenceCheckin() {
  if (state.humeSession.silenceTimer) window.clearTimeout(state.humeSession.silenceTimer);
  state.humeSession.silenceTimer = null;
}

function markHumeActivity({ resetCheckin = true } = {}) {
  state.humeSession.lastActivityAt = Date.now();
  cancelSilenceCheckin();
  if (resetCheckin) state.humeSession.silenceCheckinSent = false;
}

function scheduleSilenceCheckin() {
  cancelSilenceCheckin();
  const session = state.humeSession;
  if (session.status !== "connected" || session.paused || session.handoffInProgress || session.silenceCheckinSent || !session.socket || session.socket.readyState !== WebSocket.OPEN) return;
  const delay = Number(session.turnPolicy?.silence_checkin_ms || HUME_TURN_POLICY.silence_checkin_ms);
  session.silenceTimer = window.setTimeout(() => {
    session.silenceTimer = null;
    if (session.status !== "connected" || session.paused || session.handoffInProgress || session.silenceCheckinSent || session.socket?.readyState !== WebSocket.OPEN) return;
    session.silenceCheckinSent = true;
    session.socket.send(JSON.stringify({ type: "assistant_input", text: "Hello—are you still there?" }));
    addEvent("voice", "Caller checked in after sustained silence", { target: `contact:${session.activeContactId || "active"}`, after: "20-second silence check-in", sequenceStatus: "natural_turn_taking" });
  }, delay);
}

async function toggleHumePause(forcePaused) {
  const session = state.humeSession;
  const socket = session.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN || session.status !== "connected") return;
  const paused = typeof forcePaused === "boolean" ? forcePaused : !session.paused;
  session.paused = paused;
  markHumeActivity();
  socket.send(JSON.stringify({ type: paused ? "pause_assistant_message" : "resume_assistant_message" }));
  if (paused) session.client?.stopPlayback();
  const button = document.querySelector("#pauseCallerButton");
  if (button) {
    button.setAttribute("aria-pressed", String(paused));
    button.classList.toggle("active", paused);
    button.querySelector("span")?.replaceChildren(paused ? "play_arrow" : "pause");
    button.setAttribute("aria-label", paused ? "Resume caller responses" : "Pause caller responses");
  }
  if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = paused ? "Caller paused" : "Hume live";
  addEvent("voice", paused ? "Learner paused caller responses" : "Learner resumed caller responses", { target: "call:pause", after: paused, sequenceStatus: "learner_control" });
  if (!paused) scheduleSilenceCheckin();
}

async function sendCallerContextUpdate(trigger) {
  const socket = state.humeSession.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN || !state.humeSession.sessionProof) return;
  try {
    const response = await fetch("/api/hume/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "context_update", session_proof: state.humeSession.sessionProof, context_revision: state.humeSession.contextRevision, trigger, observed_behavior: state.callerAffect.source === "hume_observation" ? { expression: state.callerAffect.state, confidence: state.callerAffect.confidence } : undefined }),
    });
    if (!response.ok) throw new Error("Caller context update was rejected");
    const result = await response.json();
    state.humeSession.sessionProof = result.session_proof || state.humeSession.sessionProof;
    state.humeSession.contextRevision = Number(result.context?.context_revision || state.humeSession.contextRevision);
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "session_settings", context: { text: JSON.stringify(result.context), type: "persistent" } }));
  } catch (error) {
    addEvent("system", "Hume caller context update failed", { target: "hume:context", after: error.message, sequenceStatus: "live_session_preserved" });
  }
}

function previewCallerProfile(profileId) {
  const profile = callerProfiles.find((item) => item.profile_id === profileId);
  if (!profile || !("speechSynthesis" in window)) return showToast("Preview unavailable", "The selected Hume profile will be applied when the live call connects.", "•");
  window.speechSynthesis.cancel();
  const previewGreeting = activeSimulationContact(getScenario().contactSequence || createDefaultContactSequence(getScenario()))?.greeting || "Hello?";
  const utterance = new SpeechSynthesisUtterance(`${previewGreeting.replaceAll("“", "").replaceAll("”", "")} ${profile.label} profile preview.`);
  utterance.rate = profile.category === "human-services" && ["sad", "reluctant", "distressed"].some((value) => profile.profile_id.includes(value)) ? 0.88 : 1;
  utterance.volume = state.humeSession.volume;
  window.speechSynthesis.speak(utterance);
  showToast("Local preview", "This checks browser output only; Hume applies the selected behavior when the call starts.", "♪");
}

async function previewCallerVoice(voiceId, button) {
  const voice = callerVoices.find((item) => item.voice_id === voiceId) || getCallerVoice();
  const original = button?.innerHTML;
  try {
    state.voicePreviewAudio?.pause();
    state.voicePreviewAudio = null;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="material-symbols-rounded">progress_activity</span>Loading';
    }
    const profile = getCallerProfile();
    const intensity = callerIntensity[state.selectedCallerIntensity] || callerIntensity.moderate;
    const response = await fetch("/api/hume/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "voice_preview",
        voice_id: voice.voice_id,
        text: (activeSimulationContact(getScenario().contactSequence || createDefaultContactSequence(getScenario()))?.greeting || "Hello?").replaceAll("“", "").replaceAll("”", ""),
        delivery: `${profile.prompt_instructions} ${intensity.prompt} Keep the delivery natural for a United States public-benefits phone interview.`,
      }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || "Hume preview failed");
    const result = await response.json();
    const audio = new Audio(`data:${result.mime_type || "audio/mpeg"};base64,${result.audio}`);
    audio.volume = state.humeSession.volume;
    state.voicePreviewAudio = audio;
    await audio.play();
    showToast("Real Hume voice preview", `${voice.label} · ${voice.presentation} · ${voice.accent}`, "♪");
  } catch (error) {
    showToast("Voice preview unavailable", error.message, "!");
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = original;
    }
  }
}

function speakGuidedCaller(text) {
  if (!text || state.humeSession.muted || !("speechSynthesis" in window)) return;
  const profile = getCallerProfile();
  const expression = profile.hume_expression;
  const utterance = new SpeechSynthesisUtterance(String(text).replaceAll("“", "").replaceAll("”", ""));
  const intensity = callerIntensity[state.selectedCallerIntensity]?.value || 2;
  utterance.volume = state.humeSession.volume;
  utterance.rate = ["sad", "grief", "resignation", "distressed", "fear"].includes(expression) ? 0.82 + intensity * 0.02 : ["anger", "frustrated", "disgust", "sarcasm"].includes(expression) ? 1.02 + intensity * 0.04 : 0.94;
  utterance.pitch = ["fear", "anxious", "horror"].includes(expression) ? 1.08 : ["sad", "grief", "resignation"].includes(expression) ? 0.92 : 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function renderCallerProfilePicker() {
  const authoredRouteLocked = Boolean(getScenario().contactSequence?.route_locked);
  const profileLocked = state.mode === "assessment" || authoredRouteLocked;
  const assignment = scenarioCallerAssignments[getScenario().id] || {};
  const activeContact = activeSimulationContact(getScenario().contactSequence || createDefaultContactSequence(getScenario()));
  return `<section class="caller-profile-picker compact-call-config">
    <header class="compact-config-heading"><div><span class="page-kicker">Applicant settings</span><h3>Voice and behavior</h3><p>${authoredRouteLocked ? "This demo route assigns each contact’s opening voice and behavior. Hume adapts naturally after the call begins." : "Choose how the applicant enters the conversation. The case facts remain unchanged."}</p></div><span class="profile-assignment">${profileLocked ? "Scenario assigned" : "Practice can override"}</span></header>
    <div class="compact-config-grid">
      <section class="config-selector-block"><div class="config-selector-label"><span class="config-icon material-symbols-rounded">mood</span><div><small>Caller behavior</small><strong>${escapeHTML(getCallerProfile().label)}</strong></div><span class="single-selection-badge">One profile</span></div><label><span>Opening behavior</span><select id="callerProfileSelect" ${profileLocked ? "disabled" : ""}><optgroup label="Realistic public-benefits callers">${callerProfiles.filter((profile) => profile.category === "human-services").map((profile) => `<option value="${profile.profile_id}" ${profile.profile_id === state.selectedCallerProfileId ? "selected" : ""}>${escapeHTML(profile.label)} — ${escapeHTML(profile.cooperation_style.replaceAll("-", " "))}</option>`).join("")}</optgroup><optgroup label="Vocal expression styles (advanced)">${callerProfiles.filter((profile) => profile.category === "all-expressions").map((profile) => `<option value="${profile.profile_id}" ${profile.profile_id === state.selectedCallerProfileId ? "selected" : ""}>${escapeHTML(profile.label)}</option>`).join("")}</optgroup></select></label><fieldset class="intensity-control" ${profileLocked ? "disabled" : ""}><legend>Intensity</legend>${Object.entries(callerIntensity).map(([key, item]) => `<label><input type="radio" name="callerIntensity" value="${key}" ${state.selectedCallerIntensity === key ? "checked" : ""}/><span>${item.label}</span></label>`).join("")}</fieldset><p>${escapeHTML(getCallerProfile().prompt_instructions)}</p><details class="behavior-help"><summary>What are these options?</summary><p><strong>Realistic callers</strong> combine tone, cooperation and disclosure resistance for benefits interviews. <strong>Vocal styles</strong> emphasize one expressive direction. Select one opening profile; the caller can escalate or de-escalate as the conversation develops.</p></details></section>
      <section class="config-selector-block"><div class="config-selector-label"><span class="config-icon material-symbols-rounded">record_voice_over</span><div><small>${escapeHTML(activeContact?.name || "Answering contact")} voice</small><strong>${escapeHTML(getCallerVoice().label)}</strong></div><span class="real-voice-badge"><i></i>Hume</span></div><label><span>Voice library</span><select id="callerVoiceSelect" ${profileLocked ? "disabled" : ""}>${["Female", "Male"].map((presentation) => `<optgroup label="${presentation} voices">${callerVoices.filter((voice) => voice.presentation === presentation).map((voice) => `<option value="${voice.voice_key}" ${voice.voice_key === state.selectedCallerVoiceKey ? "selected" : ""}>${escapeHTML(voice.label)} — ${escapeHTML(voice.language)}, ${escapeHTML(voice.accent)}</option>`).join("")}</optgroup>`).join("")}</select></label><div class="selected-voice-meta"><span>${escapeHTML(getCallerVoice().presentation)}</span><span>${escapeHTML(getCallerVoice().language)}</span><span>${escapeHTML(getCallerVoice().accent)}</span><span>${getCallerVoice().voice_key === assignment.default_voice_key ? "Authored match" : "Override"}</span></div><button type="button" class="button button-secondary voice-preview-button" data-voice-preview="${getCallerVoice().voice_id}"><span class="material-symbols-rounded">play_arrow</span>Play real voice preview</button></section>
    </div>
  </section>`;
}

function renderScreen() {
  dom.appShell.classList.remove("coach-collapsed");
  const isPreflight = state.callPhase === "preflight";
  dom.appShell.classList.toggle("preflight-view", isPreflight);
  syncCoachPanelWidth();
  if (isPreflight) {
    state.elapsed = 0;
    dom.timer.textContent = "00:00";
    if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = "Not started";
  }
  if (dom.endCallTop) dom.endCallTop.disabled = isPreflight;
  if (dom.audioButton) dom.audioButton.disabled = isPreflight;
  if (dom.pauseCallerButton) dom.pauseCallerButton.disabled = isPreflight || state.humeSession.status !== "connected";
  dom.screenContent.innerHTML = state.callPhase === "preflight" ? renderPreflight() : renderEligibilityWorkspace();
  const preflightCaseBrief = document.querySelector("#preflightCaseBrief");
  if (preflightCaseBrief) {
    preflightCaseBrief.hidden = !isPreflight;
    preflightCaseBrief.innerHTML = isPreflight ? renderPreflightCaseBrief() : "";
  }
  bindScreenFields();
  syncFooter();
}

function markAuthoredResultStale() {
  if (state.mockEligibility.status !== "unrun" && state.mockEligibility.status !== "stale") {
    state.mockEligibility.status = "stale";
  }
}

function handleIntegratedCaseChange({ path, label, before, after, material, rerender }) {
  const resultStatusBeforeEdit = state.mockEligibility.status;
  if (material) markAuthoredResultStale();
  const resultBecameStale = resultStatusBeforeEdit !== state.mockEligibility.status;
  state.validated = false;
  state.validatedScreens.delete(state.activeScreen);
  if (state.lastValidation?.stage_id === state.activeScreen) state.lastValidation = null;
  addEvent("field", `${label}: ${after === "" ? "blank" : after}`, {
    target: `case:${path}`,
    before,
    after,
    sequenceStatus: "supporting_case_fact",
    citation: `${SPEC_NOTE_ID} · Integrated eligibility field contract`,
  });
  if (rerender || resultBecameStale) {
    state.openCaseSections = new Set([...document.querySelectorAll(".bc-accordion[open]")].map((section) => section.dataset.sectionId));
    renderScreen();
    renderCoachGuidance();
  }
  else {
    syncFooter();
    renderCoachGuidance();
  }
}

function handleIntegratedRepeat({ type, action }) {
  markAuthoredResultStale();
  state.validated = false;
  state.validatedScreens.delete(state.activeScreen);
  if (state.lastValidation?.stage_id === state.activeScreen) state.lastValidation = null;
  addEvent("field", `${action === "add" ? "Added" : "Removed"} ${type} record`, {
    target: `case:${type}`,
    after: `${state.caseDraft[type].length} records`,
    sequenceStatus: "supporting_case_fact",
    citation: `${SPEC_NOTE_ID} · Integrated eligibility field contract`,
  });
  renderScreen();
  renderCoachGuidance();
}

function runMockEligibility() {
  const variant = state.evidenceReviewed ? "final" : "pending";
  state.mockEligibility = { status: variant, variant, lastRunAt: new Date().toISOString() };
  addEvent("evaluation", `Loaded ${variant} authored eligibility fixture`, {
    target: "mock-eligibility-run",
    before: "not_run_or_stale",
    after: variant,
    expected: "authored_fixture_only",
    correct: true,
    sequenceStatus: state.evidenceReviewed ? "verification_reviewed" : "verification_pending",
    citation: `${SPEC_NOTE_ID} · No-rules-engine boundary`,
  });
  renderScreen();
  renderCoachGuidance();
  showToast("Illustrative result loaded", `The ${variant} scenario fixture was loaded. No eligibility rules were calculated.`, "•");
}

function handleIntegratedAction(action, data) {
  if (action === "run-mock-eligibility") return runMockEligibility();
  if (action === "open-evidence") {
    addEvent("evidence", `Opened ${data.evidenceId}`, { target: data.evidenceId, sequenceStatus: "record_opened" });
    showToast("Evidence opened", "Synthetic record displayed for training review.");
  }
}

function bindScreenFields() {
  document.querySelector("#startLiveCall")?.addEventListener("click", startLiveCall);
  document.querySelector("#openHumeConfig")?.addEventListener("click", openHumeConfigDialog);
  document.querySelector("#startGuidedCall")?.addEventListener("click", startGuidedCall);
  document.querySelectorAll("[data-profile-category]").forEach((button) => button.addEventListener("click", () => {
    state.callerProfileCategory = button.dataset.profileCategory;
    renderScreen();
  }));
  document.querySelector("#callerProfileSearch")?.addEventListener("change", (event) => {
    state.callerProfileSearch = event.currentTarget.value;
    renderScreen();
  });
  document.querySelectorAll("[data-caller-profile]").forEach((button) => button.addEventListener("click", () => {
    if (state.mode === "assessment") return showToast("Assigned assessment profile", "Caller behavior cannot be changed during an assessment.", "•");
    state.selectedCallerProfileId = button.dataset.callerProfile;
    initializeCallerAffect("practice_profile_override");
    renderScreen();
  }));
  document.querySelector("#callerProfileSelect")?.addEventListener("change", (event) => {
    if (state.mode === "assessment") return renderScreen();
    state.selectedCallerProfileId = event.currentTarget.value;
    initializeCallerAffect("practice_profile_override");
    renderScreen();
  });
  document.querySelectorAll("[data-profile-preview]").forEach((button) => button.addEventListener("click", () => previewCallerProfile(button.dataset.profilePreview)));
  document.querySelectorAll("[data-voice-preview]").forEach((button) => button.addEventListener("click", () => previewCallerVoice(button.dataset.voicePreview, button)));
  document.querySelectorAll("input[name='callerIntensity']").forEach((input) => input.addEventListener("change", () => {
    if (state.mode === "assessment") return renderScreen();
    state.selectedCallerIntensity = input.value;
    initializeCallerAffect("intensity_override");
    renderScreen();
  }));
  document.querySelectorAll("input[name='callerVoice']").forEach((input) => input.addEventListener("change", () => {
    if (state.mode === "assessment") return renderScreen();
    state.selectedCallerVoiceKey = input.value;
    renderScreen();
  }));
  document.querySelector("#callerVoiceSelect")?.addEventListener("change", (event) => {
    if (state.mode === "assessment") return renderScreen();
    state.selectedCallerVoiceKey = event.currentTarget.value;
    renderScreen();
  });
  document.querySelector("#outputVolume")?.addEventListener("input", (event) => {
    state.humeSession.volume = Number(event.currentTarget.value);
    event.currentTarget.previousElementSibling?.querySelector("output")?.replaceChildren(`${Math.round(state.humeSession.volume * 100)}%`);
    state.humeSession.client?.setVolume(state.humeSession.volume);
  });
  document.querySelector("#testAudioOutput")?.addEventListener("click", (event) => previewCallerVoice(getCallerVoice().voice_id, event.currentTarget));
  document.querySelectorAll("[data-screen-jump]").forEach((button) => button.addEventListener("click", () => navigateWorkflowScreen(button.dataset.screenJump, "eligibility system menu")));
  document.querySelector("#eligibilityNavToggle")?.addEventListener("click", () => {
    state.systemNavigationOpen = !state.systemNavigationOpen;
    renderScreen();
  });
  document.querySelectorAll("[data-system-utility]").forEach((button) => button.addEventListener("click", () => {
    const label = button.textContent.trim() || button.dataset.systemUtility.replaceAll("-", " ");
    showToast(`${label} opened in the synthetic workspace.`);
    addEvent("system", `${label} opened`, { target: `utility:${button.dataset.systemUtility}`, sequenceStatus: "worker_action" });
  }));
  document.querySelectorAll("[data-target-id]").forEach((control) => {
    const target = scenarioTargetsForStage(state.activeScreen).find((item) => item.target_id === control.dataset.targetId);
    if (!target) return;
    const input = control.matches("label") ? control.querySelector("input") : control;
    if (!["button", "checkbox", "select"].includes(target.control_type)) {
      input.addEventListener("input", (event) => {
        let value = event.currentTarget.value;
        if (target.control_type === "currency") value = String(value).replace(/[^0-9.]/g, "");
        state.screenValues[state.activeScreen] ||= {};
        state.screenValues[state.activeScreen][target.target_id] = value;
        if (target.binding) state.form[target.binding] = value;
        state.validated = false;
        syncFooter();
      });
    }
    const eventName = target.control_type === "button" ? "click" : "change";
    input.addEventListener(eventName, (event) => {
      const before = targetValue(target);
      let after = target.control_type === "checkbox" ? event.currentTarget.checked : target.control_type === "button" ? (before === "reviewed" || before === "resolved" ? before : target.target_id.includes("match") ? "resolved" : "reviewed") : event.currentTarget.value;
      if (target.control_type === "currency") after = String(after).replace(/[^0-9.]/g, "");
      state.screenValues[state.activeScreen] ||= {};
      state.screenValues[state.activeScreen][target.target_id] = after;
      if (target.binding && target.binding in state.closure) {
        state.closure[target.binding] = target.binding === "closingSummary" ? after === "Yes" : Boolean(after);
        const completionLabel = document.querySelector('[data-section-id="authorization-checklist"] summary small');
        if (completionLabel) completionLabel.textContent = `${Object.values(state.closure).filter(Boolean).length} of 4 complete`;
      }
      else if (target.binding) state.form[target.binding] = after;
      if (target.control_type === "button") event.currentTarget.textContent = after === "resolved" ? "Resolved" : "Reviewed";
      state.validated = false;
      if (state.lastValidation?.stage_id === state.activeScreen) state.lastValidation = null;
      const expected = expectedTargetValue(target);
      const correct = expected === "nonempty" ? Boolean(String(after).trim()) : String(after) === String(expected);
      addEvent(target.control_type === "button" ? "evidence" : "field", `${target.semantic_description}: ${target.control_type === "checkbox" ? (after ? "complete" : "reopened") : after || "blank"}`, { target: target.target_id, before, after, expected, correct, sequenceStatus: state.disclosedFacts.size ? "after_client_turn" : "before_client_disclosure", citation: coachGuidance[state.activeScreen]?.citation });
      if (target.target_id === "evidence-wage-review") {
        state.evidenceReviewed = true;
        markAuthoredResultStale();
      }
      if (!correct && state.mode === "practice") transitionCallerAffect("escalate", "incorrect_screen_entry");
      else if (correct) transitionCallerAffect("deescalate", "accurate_screen_progress");
      renderCoachGuidance();
      renderLiveChecklist();
      syncFooter();
    });
  });
  if (state.callPhase === "live") {
    BenefitConnectIntegrated.bind(document.querySelector(".bc-expanded-workspace"), {
      draft: state.caseDraft,
      onChange: handleIntegratedCaseChange,
      onRepeat: handleIntegratedRepeat,
      onAction: handleIntegratedAction,
      onToggle: (sectionId, open) => {
        state.openCaseSections ||= new Set();
        if (open) state.openCaseSections.add(sectionId);
        else state.openCaseSections.delete(sectionId);
      },
    });
  }
}

function syncFooter() {
  const live = state.callPhase === "live";
  const isAuthorization = state.activeScreen === "authorization";
  const closureComplete = Object.values(state.closure).every(Boolean);
  dom.reviewEvidenceButton.hidden = !live || !["financial", "evidence"].includes(state.activeScreen);
  dom.previousScreenButton.hidden = !live;
  dom.primaryActionButton.hidden = !live;
  dom.previousScreenButton.disabled = workflow.findIndex((item) => item.id === state.activeScreen) === 0;
  dom.primaryActionButton.textContent = isAuthorization
    ? state.callEnded ? "Submit attempt" : "End call and submit"
    : state.mode === "assessment" ? "Record and continue" : "Validate & continue";
  dom.primaryActionButton.disabled = false;
}

function targetValueForStage(target, stageId) {
  if (target.binding && target.binding in state.closure) return target.binding === "closingSummary" ? (state.closure[target.binding] ? "Yes" : "") : state.closure[target.binding];
  if (target.binding && target.binding in state.form) return state.form[target.binding];
  return state.screenValues[stageId]?.[target.target_id] ?? "";
}

function evaluateField(stageId, target) {
  const entered = targetValueForStage(target, stageId);
  const expected = expectedTargetValue(target);
  const correct = expected === "nonempty" ? Boolean(String(entered || "").trim()) : String(entered) === String(expected);
  const latestSnapshot = state.screenSnapshots.find((snapshot) => snapshot.screen === stageId && snapshot.final_reconstruction)
    || state.screenSnapshots.find((snapshot) => snapshot.screen === stageId);
  let issueType = entered === "" || entered === false ? "missing_information" : "inaccurate_entry";
  let criticalError = null;
  if (stageId === "evidence" && !correct) { issueType = "insufficient_verification"; criticalError = "required_verification_unresolved"; }
  if (stageId === "notices" && target.target_id === "notice-type" && !correct) { issueType = "incorrect_interpretation"; criticalError = "materially_incorrect_notice"; }
  if (stageId === "authorization" && ["authorization-facts", "authorization-evidence"].includes(target.target_id) && !correct) { issueType = "unresolved_discrepancy"; criticalError = "critical_discrepancy_unresolved"; }
  if (stageId === "eligibility" && !correct) { issueType = "incorrect_interpretation"; criticalError = "incorrect_authorization"; }
  const relevantTurn = [...state.voiceTurns].find((turn) => turn.disclosed_fact_ids?.length) || state.voiceTurns[0] || null;
  return {
    field_evaluation_id: `field-eval:${stageId}:${target.target_id}`,
    stage: stageId,
    target: target.target_id,
    label: target.semantic_description,
    entered_value: entered === true ? "Complete" : entered || "Not entered",
    expected_value: expected === true ? "Complete" : expected === "nonempty" ? "Required narrative" : expected,
    provenance: target.provenance,
    correctness: correct,
    issue_type: correct ? null : issueType,
    critical_error: correct ? null : criticalError,
    explanation: correct ? "The final case state matches the frozen scenario rule." : `${target.semantic_description} was not supported by the final case state. Correctness comes from the normalized form state, not the screenshot.`,
    reconstruction: `Review the ${target.provenance.toLowerCase()} source, confirm the fact with the applicant when required, then record “${expected === true ? "Complete" : expected === "nonempty" ? "a complete processing narrative" : expected}” before progression.`,
    screenshot_id: latestSnapshot?.snapshot_id || null,
    annotation_bounds: target.normalized_bounds,
    transcript_turn_id: relevantTurn?.voice_turn_id || null,
    citation: coachGuidance[stageId]?.citation || SPEC_NOTE_ID,
    accepted_alternatives: stageId === "evidence" ? ["Review before entry", "Review before final validation"] : [],
    unvisited: !state.events.some((event) => event.screen === stageId),
  };
}

function weightedCriterion(id, label, weight, fieldEvaluations) {
  const correctCount = fieldEvaluations.filter((item) => item.correctness).length;
  const score = fieldEvaluations.length ? Math.round((correctCount / fieldEvaluations.length) * weight * 10) / 10 : weight;
  return { criterion_id: id, label, weight, score, field_evaluation_ids: fieldEvaluations.map((item) => item.field_evaluation_id), correct_count: correctCount, total_checks: fieldEvaluations.length };
}

function interviewCriterion(id, label, weight, ratio, evidence, recommendedAlternative) {
  const score = Math.round(Math.max(0, Math.min(1, ratio)) * weight * 10) / 10;
  return { observation_id: `interview:${id}`, criterion: id, label, weight, score, observable_behavior: evidence, recommended_alternative: recommendedAlternative, event_ids: [], transcript_range: null, hume_evidence: state.affectObservations.slice(-3), citation: id === "closure" ? "USDA SNAP Interview Toolkit · Concluding interviews" : "USDA SNAP Interview Toolkit · Conducting interviews" };
}

function evaluateUnavailableContactCall(route) {
  const chronologicalTurns = [...state.voiceTurns].reverse();
  const learnerTurns = chronologicalTurns.filter((turn) => turn.speaker === "learner");
  const learnerText = learnerTurns.map((turn) => turn.transcript).join(" ");
  const neutralMessageRequired = route.message_policy === "neutral_callback_only";
  const checks = [
    { id: "contact_request", label: "Requested the intended contact without disclosing case details", correct: state.handoffAttempted, weight: 20 },
    { id: "privacy", label: "Protected application and program information", correct: state.callbackDisposition !== "oversharing_blocked", weight: 15 },
    { id: "callback", label: neutralMessageRequired ? "Left an approved neutral callback message" : "Used the authored callback window without leaving a message", correct: neutralMessageRequired ? state.callbackDisposition === "callback_message_recorded" : state.handoffAttempted && state.callbackDisposition !== "oversharing_blocked", weight: 15 },
    { id: "disposition", label: "Recorded the correct unavailable-contact disposition", correct: state.callEnded, weight: 10 },
  ];
  const fieldEvaluations = checks.map((check) => ({
    field_evaluation_id: `field-eval:contact:${check.id}`,
    stage: "intake",
    target: check.id,
    label: check.label,
    entered_value: check.correct ? "Complete" : "Not completed",
    expected_value: "Complete",
    provenance: "Authored call route",
    correctness: check.correct,
    issue_type: check.correct ? null : "call_disposition",
    critical_error: check.id === "privacy" && !check.correct ? "protected_information_overshared" : null,
    explanation: check.correct ? "The call event record matches the authored unavailable-contact route." : "The expected unavailable-contact behavior was not observed.",
    reconstruction: check.label,
    screenshot_id: null,
    annotation_bounds: null,
    transcript_turn_id: null,
    citation: `${SPEC_NOTE_ID} · Contact privacy and callback route`,
    accepted_alternatives: [],
    unvisited: false,
  }));
  const processingCriteria = checks.map((check) => weightedCriterion(check.id, check.label, check.weight, [fieldEvaluations.find((item) => item.target === check.id)]));
  const firstTurn = learnerTurns[0]?.transcript || "";
  const openingRatio = learnerTurns.length ? ([/hello|good (morning|afternoon)/i, /my name|this is|calling from/i, /speak with|available/i].filter((pattern) => pattern.test(firstTurn)).length / 3) : 0;
  const privacyRatio = state.callbackDisposition === "oversharing_blocked" || /SNAP|TANF|Medicaid|application|eligibility|verification/i.test(learnerText) && !state.handoffCompleted ? 0 : 1;
  const empathyRatio = learnerTurns.length ? Math.min(1, learnerTurns.filter((turn) => /thank|understand|appreciate|no problem/i.test(turn.transcript)).length / Math.max(1, Math.ceil(learnerTurns.length / 2))) : 0;
  const closureRatio = state.callEnded ? 1 : 0;
  const interviewObservations = [
    interviewCriterion("opening", "Professional introduction and intended-contact request", 12, openingRatio, learnerTurns.length ? "The first worker turn was reviewed for introduction and contact request." : "No worker opening was retained.", "Give your name and agency, then ask for the intended person without describing the case."),
    interviewCriterion("confidentiality", "Confidentiality with an alternate answerer", 12, privacyRatio, state.callbackDisposition === "oversharing_blocked" ? "The server blocked a callback message containing protected case context." : "No protected case disclosure was recorded.", "Use only your name, agency, callback number, and a request to return the call."),
    interviewCriterion("empathy", "Respectful alternate-contact communication", 8, empathyRatio, `${learnerTurns.length} worker turns were available for review.`, "Acknowledge the answer, thank the contact, and keep the exchange brief."),
    interviewCriterion("closure", "Clear callback and call closure", 8, closureRatio, state.callEnded ? "The unavailable-contact call was ended intentionally." : "The call was not closed.", "Repeat the callback plan once, thank the answerer, and end the call."),
  ];
  const processingScore = Math.round(processingCriteria.reduce((sum, item) => sum + item.score, 0) * 10) / 10;
  const interviewScore = Math.round(interviewObservations.reduce((sum, item) => sum + item.score, 0) * 10) / 10;
  const criticalErrors = fieldEvaluations.map((item) => item.critical_error).filter(Boolean);
  let overallScore = Math.round((processingScore + interviewScore) * 10) / 10;
  if (criticalErrors.length) overallScore = Math.min(69, overallScore);
  return {
    evaluation_id: `post-call:${Date.now()}`,
    overall_score: overallScore,
    processing_score: processingScore,
    interview_score: interviewScore,
    proficiency: overallScore >= 90 ? "Proficient" : overallScore >= 80 ? "Meets expectations" : overallScore >= 70 ? "Developing" : "Needs coaching",
    critical_errors: criticalErrors,
    unresolved_case_risks: fieldEvaluations.filter((item) => !item.correctness).map((item) => item.label),
    strengths: [...processingCriteria, ...interviewObservations].filter((item) => item.score / item.weight >= 0.7).slice(0, 3).map((item) => item.label),
    priorities: [...processingCriteria, ...interviewObservations].filter((item) => item.score / item.weight < 0.7).slice(0, 3).map((item) => item.label),
    rubric_version: `${federalFeedbackRubric.version}:unavailable-contact-v1`,
    processing_criteria: processingCriteria,
    field_evaluations: fieldEvaluations,
    interview_observations: interviewObservations,
    passed: overallScore >= 80 && !criticalErrors.length,
    terminal_route: route.expected_terminal_state,
  };
}

function evaluatePostCall() {
  const route = state.humeSession.contactSequence || getScenario().contactSequence;
  if (route?.mode === "screened" && route.intended_contact_availability !== "available_handoff") return evaluateUnavailableContactCall(route);
  const allFields = workflow.flatMap(({ id: stageId }) => scenarioTargetsForStage(stageId).map((target) => evaluateField(stageId, target)));
  const fields = (stageId) => allFields.filter((item) => item.stage === stageId);
  const processingCriteria = [
    weightedCriterion("application_review", "Application review and discrepancy resolution", 10, fields("intake")),
    weightedCriterion("household_programs", "Household composition and program-group construction", 10, [...fields("household"), ...fields("programs")]),
    weightedCriterion("financial", "Income, resources, expenses, and deductions", 12, fields("financial")),
    weightedCriterion("nonfinancial", "Nonfinancial eligibility factors and required screening", 8, fields("nonfinancial")),
    weightedCriterion("evidence", "Evidence, data matches, and verification handling", 8, fields("evidence")),
    weightedCriterion("eligibility", "Eligibility calculation and result interpretation", 5, fields("eligibility")),
    weightedCriterion("notice_authorization", "Notices, comments, documentation, and authorization", 7, [...fields("notices"), ...fields("authorization")]),
  ];
  const chronologicalTurns = [...state.voiceTurns].reverse();
  const learnerTurns = chronologicalTurns.filter((turn) => turn.speaker === "learner");
  const learnerText = learnerTurns.map((turn) => turn.transcript).join(" ");
  const openingRatio = learnerTurns.length ? ([/hello|good (morning|afternoon)/i, /identity|name|speaking with/i, /private|confidential/i, /purpose|calling|application/i].filter((pattern) => pattern.test(learnerTurns[0]?.transcript || "")).length / 4) : 0;
  const requiredInterviewFacts = (getScenario().truthLedger || getScenario().facts).filter((fact) => fact.required !== false);
  const questionRatio = Math.min(1, requiredInterviewFacts.filter((fact) => state.disclosedFacts.has(fact.fact_id || fact.id)).length / Math.max(1, requiredInterviewFacts.length));
  const listeningRatio = learnerTurns.length ? Math.min(1, learnerTurns.filter((turn) => /confirm|understand|so you|you said|let me make sure/i.test(turn.transcript)).length / Math.max(1, Math.ceil(learnerTurns.length / 2))) : 0;
  const empathyRatio = learnerTurns.length ? Math.min(1, learnerTurns.filter((turn) => /understand|sorry|thank you|appreciate|take your time|help/i.test(turn.transcript)).length / Math.max(1, Math.ceil(learnerTurns.length / 2))) : 0;
  const plainLanguageRatio = learnerTurns.length ? (/MAGI|assistance unit|categorical eligibility|nonfinancial factor/i.test(learnerText) ? 0.45 : 1) : 0;
  const closureRatio = [state.closure.factsConfirmed, state.closure.nextSteps, state.closure.closingSummary === true || state.closure.closingSummary === "Yes", state.callEnded].filter(Boolean).length / 4;
  const interviewObservations = [
    interviewCriterion("opening", "Opening, identity, confidentiality, and purpose", 4, openingRatio, learnerTurns.length ? "Opening language was evaluated from the first learner turn." : "No observable worker opening was retained.", "Introduce yourself, verify identity, explain privacy, and state the call purpose before collecting facts."),
    interviewCriterion("questioning", "Complete, non-leading, case-relevant questioning", 10, questionRatio, `${requiredInterviewFacts.filter((fact) => state.disclosedFacts.has(fact.fact_id || fact.id)).length} of ${requiredInterviewFacts.length} authored interview facts were appropriately disclosed.`, "Use open questions first, then targeted follow-ups for every material gap or discrepancy."),
    interviewCriterion("listening", "Active listening, clarification, and accurate paraphrasing", 8, listeningRatio, `${learnerTurns.filter((turn) => /confirm|understand|so you|you said/i.test(turn.transcript)).length} observable confirmations or paraphrases.`, "Pause after the answer, paraphrase the material fact, and ask the applicant to confirm it."),
    interviewCriterion("empathy", "Respect, empathy, professionalism, and de-escalation", 7, empathyRatio, `${state.callerAffectTimeline.filter((entry) => String(entry.trigger).includes("deescalat") || String(entry.trigger).includes("appropriate")).length} supportive trajectory events; Hume observations are context only.`, "Acknowledge the concern in one sentence, then explain the next question in plain language."),
    interviewCriterion("plain_language", "Plain-language explanation of requirements and decisions", 6, plainLanguageRatio, learnerTurns.length ? "Worker wording was checked for unexplained eligibility jargon." : "No observable worker explanation was retained.", "Explain what is needed, why it matters, and what will happen next without program-system jargon."),
    interviewCriterion("closure", "Summary, verification instructions, next steps, and closure", 5, closureRatio, `${Math.round(closureRatio * 4)} of 4 closure behaviors were present.`, "Summarize confirmed facts, name pending verification, explain next steps and timing, invite questions, then close the call."),
  ];
  const processingScore = Math.round(processingCriteria.reduce((sum, item) => sum + item.score, 0) * 10) / 10;
  const interviewScore = Math.round(interviewObservations.reduce((sum, item) => sum + item.score, 0) * 10) / 10;
  const criticalErrors = [...new Set(allFields.map((item) => item.critical_error).filter(Boolean))];
  let overallScore = Math.round((processingScore + interviewScore) * 10) / 10;
  if (criticalErrors.length) overallScore = Math.min(69, overallScore);
  const proficiency = overallScore >= 90 ? "Proficient" : overallScore >= 80 ? "Meets expectations" : overallScore >= 70 ? "Developing" : "Needs coaching";
  const ranked = [...processingCriteria, ...interviewObservations].sort((a, b) => (b.score / b.weight) - (a.score / a.weight));
  const strengths = ranked.filter((item) => item.score / item.weight >= 0.7).slice(0, 3).map((item) => item.label);
  const priorities = [...ranked].reverse().slice(0, 3).map((item) => item.label);
  return {
    evaluation_id: `post-call:${Date.now()}`,
    overall_score: overallScore,
    processing_score: processingScore,
    interview_score: interviewScore,
    proficiency,
    critical_errors: criticalErrors,
    unresolved_case_risks: allFields.filter((item) => !item.correctness).map((item) => item.label),
    strengths: strengths.length ? strengths : ["Attempt evidence was preserved", "The call was ended intentionally", "Raw audio was not retained"],
    priorities,
    rubric_version: federalFeedbackRubric.version,
    processing_criteria: processingCriteria,
    field_evaluations: allFields,
    interview_observations: interviewObservations,
    passed: overallScore >= 80 && !criticalErrors.length,
  };
}

function evaluateForm() {
  const evaluation = evaluatePostCall();
  return { checks: evaluation.field_evaluations.map((item) => ({ key: item.target, title: item.label, dimension: "Case processing", severity: item.critical_error ? "critical" : "coaching", correct: item.correctness, actual: item.entered_value, expected: item.expected_value, sequence_status: item.issue_type || "complete", citation: item.citation })), passed: evaluation.passed, score: evaluation.overall_score };
}

function validateScreen() {
  const targets = scenarioTargetsForStage(state.activeScreen);
  const checks = targets.map((target) => {
    const actual = targetValue(target);
    const expected = expectedTargetValue(target);
    const correct = expected === "nonempty" ? Boolean(String(actual || "").trim()) : String(actual) === String(expected);
    return { key: target.target_id, title: target.semantic_description, dimension: target.control_type === "button" ? "Evidence and verification" : "Screen processing", severity: "critical", correct, actual: actual === true ? "Complete" : actual || "Not entered", expected: expected === true ? "Complete" : expected === "nonempty" ? "Required narrative" : expected, sequence_status: state.disclosedFacts.size ? "after_client_turn" : "before_client_disclosure", citation: coachGuidance[state.activeScreen]?.citation || SPEC_NOTE_ID };
  });
  const result = { checks, passed: checks.every((check) => check.correct), score: checks.length ? Math.round((checks.filter((check) => check.correct).length / checks.length) * 100) : 100 };
  state.lastValidation = { stage_id: state.activeScreen, checks: result.checks };
  state.validated = result.passed || state.mode === "assessment";
  state.assessmentRecorded = state.mode === "assessment";
  if (result.passed || state.mode === "assessment") state.validatedScreens.add(state.activeScreen);
  if (state.activeScreen === "household" && (result.passed || state.mode === "assessment")) state.householdComplete = true;
  addEvent("evaluation", `${workflow.find((item) => item.id === state.activeScreen)?.label} validation recorded: ${result.score}%`, { target: `screen:${state.activeScreen}`, after: `${result.score}%`, expected: "100%", correct: result.passed, sequenceStatus: state.disclosedFacts.size ? "client_context_available" : "limited_client_context", citation: `${SPEC_NOTE_ID} · Screen evaluation model` });

  if (state.mode === "assessment") {
    dom.evaluationEmpty.hidden = false;
    dom.evaluationResult.hidden = true;
    dom.evaluationEmpty.querySelector("p").textContent = "Screen recorded. Correctness remains hidden until assessment submission.";
    showToast("Screen recorded", "Assessment feedback will be revealed after submission.", "•");
    renderCoachGuidance();
    return result;
  }
  transitionCallerAffect(result.passed ? "deescalate" : "escalate", result.passed ? "screen_validated" : "validation_error");
  showEvaluation(result);
  renderCoachGuidance();
  showToast(result.passed ? "Screen validated" : "Review required", result.passed ? "The deterministic screen checks passed." : "Correct the mapped fields and retry.", result.passed ? "✓" : "!");
  return result;
}

function showEvaluation(result) {
  dom.evaluationEmpty.hidden = true;
  dom.evaluationResult.hidden = false;
  dom.evaluationResult.innerHTML = `<div class="evaluation-summary ${result.passed ? "" : "error"}"><div class="evaluation-summary-icon">${result.passed ? "✓" : "!"}</div><div><strong>${result.passed ? "Screen is correct" : "Correction required"}</strong><span>${result.passed ? "Evidence, values, and sequence satisfy the package rules." : `${result.checks.filter((check) => !check.correct).length} deterministic check${result.checks.filter((check) => !check.correct).length === 1 ? "" : "s"} did not pass.`}</span></div></div>
    <div class="evaluation-list">${result.checks.map((check) => `<div class="evaluation-item ${check.correct ? "" : "incorrect"}"><span class="state-icon">${check.correct ? "✓" : "×"}</span><div><strong>${check.title}</strong><span>${check.correct ? check.actual : `Entered: ${check.actual} · Expected: ${check.expected}`}</span><span class="evaluation-citation">${check.citation}</span></div></div>`).join("")}</div>
    ${result.passed ? "" : '<button class="retry-button" id="retryButton">Return to the screen and retry</button>'}`;
  document.querySelector("#retryButton")?.addEventListener("click", () => {
    state.validated = false;
    state.validatedScreens.delete(state.activeScreen);
    if (state.activeScreen === "household") state.householdComplete = false;
    renderWorkflow();
    renderScreen();
    setCoachTab("client");
    addEvent("retry", `Learner returned to the ${state.activeScreen} screen for another attempt`);
    showToast("Ready to retry", "Review the client facts and evidence, then check the screen again.");
  });
}

function feedbackSnapshot(attempt, screenshotId) {
  return attempt.screen_snapshots.find((snapshot) => snapshot.snapshot_id === screenshotId) || null;
}

function renderEvidenceCard(field, attempt) {
  const snapshot = feedbackSnapshot(attempt, field.screenshot_id);
  const bounds = field.annotation_bounds || [0.08, 0.12, 0.84, 0.72];
  const turn = attempt.voice_turns.find((item) => item.voice_turn_id === field.transcript_turn_id);
  return `<article class="feedback-evidence-card ${field.critical_error ? "critical" : ""}">
    <div class="evidence-image-wrap">${snapshot?.image_ref ? `<img src="${snapshot.image_ref}" alt="Final reconstructed ${escapeHTML(field.stage)} eligibility screen"/><span class="evidence-annotation" style="left:${bounds[0] * 100}%;top:${bounds[1] * 100}%;width:${bounds[2] * 100}%;height:${bounds[3] * 100}%"></span>` : '<div class="capture-missing">Rendered capture unavailable</div>'}<span class="evidence-stage">${escapeHTML(workflow.find((item) => item.id === field.stage)?.label || field.stage)}${field.unvisited ? " · Unvisited" : ""}</span></div>
    <div class="evidence-copy"><div class="evidence-title-row"><div><span>${escapeHTML(String(field.issue_type).replaceAll("_", " "))}</span><h3>${escapeHTML(field.label)}</h3></div>${field.critical_error ? '<b>Critical</b>' : '<b class="review">Review</b>'}</div>
      <dl class="value-comparison"><div><dt>Entered</dt><dd>${escapeHTML(field.entered_value)}</dd></div><div><dt>Expected</dt><dd>${escapeHTML(field.expected_value)}</dd></div><div><dt>Source</dt><dd>${escapeHTML(field.provenance)}</dd></div></dl>
      ${turn ? `<blockquote><span>${escapeHTML(turn.time)}</span> “${escapeHTML(turn.transcript)}”</blockquote>` : ""}
      <p>${escapeHTML(field.explanation)}</p><div class="reconstruction"><strong>What should have happened</strong><p>${escapeHTML(field.reconstruction)}</p></div>
      <div class="evidence-card-footer"><span>${escapeHTML(field.citation)}</span><button type="button" data-replay-target="${escapeHTML(field.target)}">Open in replay</button></div>
    </div></article>`;
}

function replayCategory(event) {
  if (event.correct === false) return "critical";
  if (event.channel === "voice") return "questions";
  if (event.action === "evidence") return "evidence";
  if (event.action === "field") return "data";
  if (event.correct === true) return "strong";
  return "all";
}

function renderReplayEvents(attempt) {
  const filtered = [...attempt.events].reverse().filter((event) => state.feedbackFilter === "all" || replayCategory(event) === state.feedbackFilter);
  return filtered.map((event) => `<button type="button" class="replay-event ${state.feedbackSelectedEventId === event.event_id ? "selected" : ""}" data-feedback-event="${escapeHTML(event.event_id)}"><time>${escapeHTML(event.time)}</time><span class="replay-track ${escapeHTML(event.channel)}">${escapeHTML(event.channel)}</span><span><strong>${escapeHTML(event.label)}</strong><small>${escapeHTML(event.target || "Case")}</small></span><b>${event.correct === false ? "−" : event.correct === true ? "+" : "•"}</b></button>`).join("") || '<div class="feedback-empty">No events match this filter.</div>';
}

function renderFeedbackView(attempt) {
  const evaluation = attempt.post_call_evaluation;
  const wrongFields = evaluation.field_evaluations.filter((item) => !item.correctness);
  const correctCriteria = evaluation.processing_criteria.filter((item) => item.score === item.weight);
  const selectedEvent = attempt.events.find((event) => event.event_id === state.feedbackSelectedEventId) || attempt.events[attempt.events.length - 1];
  const selectedSnapshot = attempt.screen_snapshots.find((snapshot) => snapshot.event_id === selectedEvent?.event_id) || attempt.screen_snapshots[0];
  const metadata = [getScenario().programs.join(" · "), getScenario().shortTitle, `${getCallerProfile().label} · ${callerIntensity[state.selectedCallerIntensity].label}`, `${getCallerVoice().presentation} ${getCallerVoice().label}`, formatTime(state.elapsed), state.mode === "assessment" ? "Assessment" : "Practice"];
  dom.feedbackBody.innerHTML = `<section class="feedback-overview" id="feedbackOverview">
    <div class="score-hero"><div class="overall-score"><span>Overall score</span><strong>${evaluation.overall_score}</strong><b>${escapeHTML(evaluation.proficiency)}</b></div><div class="score-breakdown"><article><span>Case processing</span><strong>${evaluation.processing_score}<small>/60</small></strong><div><i style="width:${evaluation.processing_score / 60 * 100}%"></i></div></article><article><span>Interview &amp; service</span><strong>${evaluation.interview_score}<small>/40</small></strong><div><i style="width:${evaluation.interview_score / 40 * 100}%"></i></div></article></div><div class="attempt-metadata">${metadata.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}<span>Rubric ${escapeHTML(evaluation.rubric_version)}</span></div></div>
    ${evaluation.critical_errors.length ? `<div class="critical-banner"><span class="material-symbols-rounded">error</span><div><strong>${evaluation.critical_errors.length} critical case risk${evaluation.critical_errors.length === 1 ? "" : "s"} capped this result at 69</strong><p>${evaluation.critical_errors.map((item) => escapeHTML(item.replaceAll("_", " "))).join(" · ")}</p></div></div>` : ""}
    <div class="feedback-summary-grid"><article><span class="material-symbols-rounded">verified</span><div><h2>Strengths</h2><ol>${evaluation.strengths.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ol></div></article><article><span class="material-symbols-rounded">priority_high</span><div><h2>Priorities</h2><ol>${evaluation.priorities.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ol></div></article></div>
    <div class="overview-actions"><button class="button button-primary" data-scroll-feedback="feedbackReplay">Review replay</button><button class="button button-secondary" data-feedback-action="retry">Retry scenario</button><button class="button button-secondary" data-feedback-action="scenario-library">Return to Scenario Library</button></div>
  </section>
  <section class="feedback-section" id="feedbackProcessing"><div class="feedback-section-heading"><div><span>60 points</span><h2>Case processing</h2><p>Final normalized case state, supported by rendered BenefitConnect evidence.</p></div><strong>${evaluation.processing_score}/60</strong></div>
    <div class="criterion-score-list">${evaluation.processing_criteria.map((criterion) => `<details ${criterion.score < criterion.weight ? "open" : ""}><summary><span>${escapeHTML(criterion.label)}</span><b>${criterion.score}/${criterion.weight}</b></summary><p>${criterion.correct_count} of ${criterion.total_checks} deterministic checks satisfied. ${criterion.score === criterion.weight ? "No issue was found in the final case state." : "Review the evidence cards below for the affected entries."}</p></details>`).join("")}</div>
    ${wrongFields.length ? `<div class="feedback-evidence-list">${wrongFields.map((field) => renderEvidenceCard(field, attempt)).join("")}</div>` : '<div class="all-correct">All deterministic case-processing checks passed.</div>'}
    ${correctCriteria.length ? `<details class="correct-stages"><summary>${correctCriteria.length} correctly completed processing categories</summary><ul>${correctCriteria.map((item) => `<li>${escapeHTML(item.label)} <b>${item.score}/${item.weight}</b></li>`).join("")}</ul></details>` : ""}
  </section>
  <section class="feedback-section" id="feedbackInterview"><div class="feedback-section-heading"><div><span>40 points</span><h2>Interview &amp; service skills</h2><p>Observable call behavior and transcript evidence. Hume signals provide context only and never independently change the score.</p></div><strong>${evaluation.interview_score}/40</strong></div>
    <div class="interview-grid">${evaluation.interview_observations.map((item) => `<article><header><div><span>${escapeHTML(item.criterion.replaceAll("_", " "))}</span><h3>${escapeHTML(item.label)}</h3></div><strong>${item.score}/${item.weight}</strong></header><p>${escapeHTML(item.observable_behavior)}</p><div class="improved-response"><b>Try this</b><p>${escapeHTML(item.recommended_alternative)}</p></div><footer><span>${escapeHTML(item.citation)}</span><span>${item.hume_evidence.length} Hume context signal${item.hume_evidence.length === 1 ? "" : "s"}</span></footer></article>`).join("")}</div>
  </section>
  <section class="feedback-section replay-section" id="feedbackReplay"><div class="feedback-section-heading"><div><span>${attempt.screen_snapshots.length} visual frames</span><h2>Synchronized replay</h2><p>Conversation, eligibility work, and evaluation aligned to one event clock.</p></div></div>
    <div class="replay-filters" role="group" aria-label="Replay filters">${[["all","All"],["critical","Critical errors"],["questions","Missed questions"],["data","Data-entry issues"],["evidence","Evidence"],["strong","Strong moments"]].map(([id,label]) => `<button type="button" class="${state.feedbackFilter === id ? "active" : ""}" data-replay-filter="${id}">${label}</button>`).join("")}</div>
    <div class="replay-workspace"><div class="replay-timeline" id="replayTimeline">${renderReplayEvents(attempt)}</div><aside class="replay-preview">${selectedSnapshot?.image_ref ? `<img src="${selectedSnapshot.image_ref}" alt="BenefitConnect replay evidence"/>` : '<div class="capture-missing">Select an event with a rendered capture.</div>'}<div><span>${escapeHTML(selectedEvent?.time || "00:00")}</span><strong>${escapeHTML(selectedEvent?.label || "Final case state")}</strong><small>${escapeHTML(selectedEvent?.citation || "Deterministic event record")}</small></div></aside></div>
  </section>
  <section class="feedback-section improvement-plan" id="feedbackPlan"><div class="feedback-section-heading"><div><span>Targeted next attempt</span><h2>Improvement plan</h2><p>Practice the highest-impact behaviors before repeating the same case with a varied caller profile.</p></div></div><div class="plan-grid"><article><span>Interview behaviors</span><ol><li>Use a complete privacy-aware opening and explain the call purpose.</li><li>Paraphrase each material fact before entering it.</li></ol></article><article><span>Processing skills</span><ol><li>Resolve evidence and data-match discrepancies before eligibility review.</li><li>Match notices and authorization to the program-specific result.</li></ol></article><article><span>Policy reading</span><ul>${federalFeedbackRubric.sources.slice(0,4).map((source) => `<li><a href="${source.url}" target="_blank" rel="noopener">${escapeHTML(source.label)}</a><small>${escapeHTML(source.program)}${source.provisional ? " · provisional" : ""}</small></li>`).join("")}</ul></article><article><span>Targeted retry</span><strong>${escapeHTML(getScenario().shortTitle)}</strong><p>Keep the frozen facts and deterministic rules; vary the applicant profile to practice adaptation.</p><button class="button button-primary" data-feedback-action="retry">Retry with another caller profile</button></article></div>
    <div class="rubric-note"><strong>Provisional federal rubric · ${escapeHTML(federalFeedbackRubric.version)}</strong><p>SNAP criteria are grounded in FNS Handbook 310 and USDA interview guidance. Medicaid uses CMS verification, renewal, and notice principles. TANF criteria are provisional because state operational rules substantially vary.</p></div>
  </section>`;
  dom.feedbackView.hidden = false;
  document.body.classList.add("showing-feedback");
  bindFeedbackEvents();
  window.scrollTo(0, 0);
}

function hideFeedbackView() {
  dom.feedbackView.hidden = true;
  document.body.classList.remove("showing-feedback");
}

function returnFromSimulation() {
  hideFeedbackView();
  if (state.lighthouseReturn) {
    const { moduleId, blockId } = state.lighthouseReturn;
    state.lighthouseReturn = null;
    window.BlueOriginLighthouse?.completeSimulation(moduleId, blockId, state.latestAttempt?.score || 100);
    return setProductView("lighthouse-player");
  }
  setProductView("scenario-library");
}

function retryLatestAttempt() {
  hideFeedbackView();
  selectScenario(state.scenarioIndex);
  setProductView("simulations");
}

function bindFeedbackEvents() {
  dom.feedbackBody.querySelectorAll("[data-scroll-feedback]").forEach((button) => button.addEventListener("click", () => document.querySelector(`#${button.dataset.scrollFeedback}`)?.scrollIntoView({ behavior: "smooth" })));
  dom.feedbackBody.querySelectorAll("[data-feedback-action='retry']").forEach((button) => button.addEventListener("click", retryLatestAttempt));
  dom.feedbackBody.querySelectorAll("[data-feedback-action='scenario-library']").forEach((button) => button.addEventListener("click", returnFromSimulation));
  dom.feedbackBody.querySelectorAll("[data-replay-filter]").forEach((button) => button.addEventListener("click", () => { state.feedbackFilter = button.dataset.replayFilter; renderFeedbackView(state.latestAttempt); document.querySelector("#feedbackReplay")?.scrollIntoView(); }));
  dom.feedbackBody.querySelectorAll("[data-feedback-event]").forEach((button) => button.addEventListener("click", () => { state.feedbackSelectedEventId = button.dataset.feedbackEvent; renderFeedbackView(state.latestAttempt); document.querySelector("#feedbackReplay")?.scrollIntoView(); }));
  dom.feedbackBody.querySelectorAll("[data-replay-target]").forEach((button) => button.addEventListener("click", () => {
    const event = state.latestAttempt.events.find((item) => item.target === button.dataset.replayTarget);
    if (event) state.feedbackSelectedEventId = event.event_id;
    state.feedbackFilter = "all";
    renderFeedbackView(state.latestAttempt);
    document.querySelector("#feedbackReplay")?.scrollIntoView({ behavior: "smooth" });
  }));
}

function openCallExitDialog(intent) {
  state.pendingExitIntent = intent;
  const isBack = intent === "back";
  document.querySelector("#callExitTitle").textContent = isBack ? "Save and leave this attempt?" : "End call and review feedback?";
  document.querySelector("#callExitMessage").textContent = isBack ? "Your entered case information will be preserved as an incomplete attempt and you will return to Scenario Library. It will not be scored." : "The live voice connection will stop, final BenefitConnect screens will be captured, and completed and incomplete work will be scored.";
  dom.confirmCallExit.textContent = isBack ? "Save & exit" : "End call & score";
  dom.confirmCallExit.classList.toggle("destructive", !isBack);
  dom.callExitDialog.showModal();
}

async function saveAndExitAttempt() {
  window.speechSynthesis?.cancel();
  await releaseHumeMedia({ closeSocket: true });
  const returningToAuthoring = Boolean(state.simulationAuthoring?.previewing);
  const exit = { reason: "save_and_exit", timestamp: new Date().toISOString(), scored: false, completion_state: "incomplete", return_destination: returningToAuthoring ? "simulation-builder" : "scenario-library" };
  state.savedIncompleteAttempt = { attempt_id: `attempt:bo-${Date.now()}`, scenario_id: getScenario().id, mode: state.mode, duration_seconds: state.elapsed, simulation_package_id: state.draft?.simulation_package_id || `package:${getScenario().id.toLowerCase()}`, simulation_package_version: state.draft?.simulation_package_version || "v0.1", caller_profile_id: getCallerProfile().profile_id, caller_profile_intensity: state.selectedCallerIntensity, caller_voice_key: getCallerVoice().voice_key, caller_voice_id: getCallerVoice().voice_id, screen_values: structuredClone(state.screenValues), form: { ...state.form }, closure: { ...state.closure }, active_screen: state.activeScreen, events: [...state.events], voice_turns: [...state.voiceTurns], screen_snapshots: [...state.screenSnapshots], attempt_exit: exit };
  queueAttemptForSync(state.savedIncompleteAttempt).then(syncAttemptOutbox).catch(() => updateAttemptSaveStatus("pending"));
  const assignment = state.assignments.find((item) => item.title === getScenario().title || item.title === getScenario().shortTitle) || state.assignments[0];
  if (assignment) assignment.status = "In progress";
  state.callConnected = false;
  state.callPhase = "preflight";
  hideFeedbackView();
  if (returningToAuthoring) {
    state.simulationAuthoring.previewing = false;
    state.simulationAuthoring.step = "preview";
    setProductView("simulation-builder");
    showToast("Preview closed", "Your generated case and author edits are unchanged.");
  } else {
    setProductView("scenario-library");
    showToast("Attempt saved", "Your incomplete work was preserved without a score. Choose a scenario when you are ready to continue.");
  }
}

async function confirmCallExitIntent() {
  const intent = state.pendingExitIntent;
  state.pendingExitIntent = null;
  dom.callExitDialog.close();
  if (intent === "back") return saveAndExitAttempt();
  return endLiveCall({ submit: true });
}

function showFeedbackLoading() {
  dom.feedbackBody.innerHTML = `<section class="feedback-loading-state" aria-live="polite">
    <span class="material-symbols-rounded" aria-hidden="true">progress_activity</span>
    <div><span>Call ended</span><h2>Building your coaching review…</h2><p>Freezing the transcript, capturing the final BenefitConnect stages, and applying the 60/40 rubric.</p></div>
  </section>`;
  dom.feedbackView.hidden = false;
  document.body.classList.add("showing-feedback", "feedback-is-loading");
  document.querySelector("#publishAttempt")?.setAttribute("disabled", "");
  document.querySelector("#retryAttempt")?.setAttribute("disabled", "");
  window.scrollTo(0, 0);
}

function finishFeedbackLoading() {
  document.body.classList.remove("feedback-is-loading");
  document.querySelector("#retryAttempt")?.removeAttribute("disabled");
}

const PERFORMANCE_DB = "blueorigin-performance-v1";
const PERFORMANCE_STORE = "attempt_outbox";

function openPerformanceDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PERFORMANCE_DB, 1);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PERFORMANCE_STORE)) db.createObjectStore(PERFORMANCE_STORE, { keyPath: "attempt_id" });
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function performanceStore(mode, operation) {
  const db = await openPerformanceDB();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(PERFORMANCE_STORE, mode);
      const request = operation(transaction.objectStore(PERFORMANCE_STORE));
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  } finally { db.close(); }
}

function updateAttemptSaveStatus(status) {
  state.attemptSyncStatus = status;
  const node = document.querySelector("#attemptSaveStatus");
  if (!node) return;
  const labels = { saving: "Saving to demo learner history…", saved: "Saved to demo learner history", pending: "Saved locally · sync pending", idle: "Not yet saved" };
  node.textContent = labels[status] || labels.idle;
  node.dataset.status = status;
}

function attemptMetadata(attempt) {
  return JSON.parse(JSON.stringify(attempt, (key, value) => key === "image_ref" && typeof value === "string" && value.startsWith("data:") ? null : value));
}

function dataURLToBlob(dataURL) {
  const [header, data] = dataURL.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "image/png";
  const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function queueAttemptForSync(attempt) {
  const record = { attempt_id: attempt.attempt_id, attempt, status: "pending", queued_at: new Date().toISOString(), attempts: 0 };
  await performanceStore("readwrite", (store) => store.put(record));
  updateAttemptSaveStatus("saving");
  return record;
}

async function uploadAttemptArtifacts(attempt) {
  const artifacts = [];
  for (const [index, snapshot] of (attempt.screen_snapshots || []).entries()) {
    if (!snapshot.image_ref?.startsWith("data:")) continue;
    artifacts.push({ type: "screenshot", name: `${String(index + 1).padStart(3, "0")}-${snapshot.snapshot_id || "capture"}.png`, body: dataURLToBlob(snapshot.image_ref) });
  }
  artifacts.push({ type: "transcript", name: "transcript.json", body: new Blob([JSON.stringify(attempt.voice_turns || [])], { type: "application/json" }) });
  artifacts.push({ type: "replay", name: "replay.json", body: new Blob([JSON.stringify({ events: attempt.events || [], observations: attempt.affect_observations || [] })], { type: "application/json" }) });
  for (const artifact of artifacts) {
    const response = await fetch(`/api/performance/attempts/${encodeURIComponent(attempt.attempt_id)}/artifacts`, { method: "POST", headers: { "Content-Type": artifact.body.type, "X-Artifact-Type": artifact.type, "X-Artifact-Name": artifact.name }, body: artifact.body });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || `Could not upload ${artifact.type}`);
  }
}

async function syncAttemptRecord(record) {
  updateAttemptSaveStatus("saving");
  const attempt = record.attempt;
  let response = await fetch("/api/performance/attempts/finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempt: attemptMetadata(attempt) }) });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || "Attempt metadata could not be saved");
  await uploadAttemptArtifacts(attempt);
  const screenshotCount = (attempt.screen_snapshots || []).filter((snapshot) => snapshot.image_ref?.startsWith("data:")).length;
  response = await fetch(`/api/performance/attempts/${encodeURIComponent(attempt.attempt_id)}/sync-complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expected_artifacts: screenshotCount + 2 }) });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || "Attempt synchronization could not be completed");
  record.status = "saved"; record.saved_at = new Date().toISOString(); record.attempts = (record.attempts || 0) + 1;
  await performanceStore("readwrite", (store) => store.put(record));
  updateAttemptSaveStatus("saved");
}

async function syncAttemptOutbox() {
  if (!navigator.onLine) return updateAttemptSaveStatus("pending");
  const records = await performanceStore("readonly", (store) => store.getAll()).catch(() => []);
  for (const record of records.filter((item) => item.status !== "saved")) {
    try { await syncAttemptRecord(record); }
    catch (error) {
      record.status = "pending"; record.last_error = error.message; record.attempts = (record.attempts || 0) + 1;
      await performanceStore("readwrite", (store) => store.put(record)).catch(() => {});
      updateAttemptSaveStatus("pending");
    }
  }
}

async function endCallAndOpenFeedback() {
  if (state.submitted || dom.endCallTop?.disabled) return;
  const button = dom.endCallTop;
  const originalHTML = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">progress_activity</span><span>Building feedback…</span>';
  }
  showToast("Ending call", "Saving the final case state and preparing coaching feedback.");
  showFeedbackLoading();
  try {
    await endLiveCall({ submit: true });
    finishFeedbackLoading();
  } catch (error) {
    state.submitted = false;
    finishFeedbackLoading();
    hideFeedbackView();
    showToast("Feedback could not be prepared", error?.message || "Please try ending the call again.", "!");
  } finally {
    if (button) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.innerHTML = originalHTML;
    }
  }
}

async function submitAttempt() {
  if (state.submitted) return;
  state.submitted = true;
  const attemptId = `attempt:bo-${Date.now()}`;
  await captureFinalStageSnapshots(attemptId);
  const evaluation = evaluatePostCall();
  addEvent("submission", `${state.mode === "assessment" ? "Assessment" : "Practice attempt"} submitted with score ${evaluation.overall_score}`, { target: "attempt:submission", after: `${evaluation.overall_score}%`, expected: "80% and no critical errors", correct: evaluation.passed, sequenceStatus: "call_closed", citation: `${federalFeedbackRubric.rubric_id} · ${federalFeedbackRubric.version}` });
  const attemptEvents = state.events.map((event) => ({ ...event, attempt_id: attemptId }));
  state.latestAttempt = {
    attempt_id: attemptId, scenario_id: getScenario().id,
    simulation_package_id: state.draft?.simulation_package_id || `package:${getScenario().id.toLowerCase()}`,
    simulation_package_version: state.draft?.simulation_package_version || "v0.1",
    eligibility_system_id: eligibilitySystemDefinition.system_id, eligibility_system_version: eligibilitySystemDefinition.version,
    mode: state.mode, caller_profile_id: getCallerProfile().profile_id, caller_profile_version: "v0.1", caller_profile_intensity: state.selectedCallerIntensity, caller_voice_key: getCallerVoice().voice_key, caller_voice_id: getCallerVoice().voice_id, caller_voice_presentation: getCallerVoice().presentation,
    duration_seconds: state.elapsed, caller_affect_timeline: [...state.callerAffectTimeline], application_context_envelope: state.applicationContextEnvelope,
    contact_sequence: state.humeSession.contactSequence ? BenefitConnectIntegrated.clone(state.humeSession.contactSequence) : null,
    active_contact_id: state.humeSession.activeContactId,
    score: evaluation.overall_score, processing_score: evaluation.processing_score, interview_score: evaluation.interview_score, passed: evaluation.passed,
    critical_errors: evaluation.critical_errors.length, checks: evaluateForm().checks, post_call_evaluation: evaluation,
    events: attemptEvents, voice_turns: [...state.voiceTurns], screen_snapshots: [...state.screenSnapshots], observation_events: [...state.observationEvents], composite_screen_snapshots: [...state.compositeSnapshots], affect_observations: [...state.affectObservations],
    case_starting_state: state.caseStartingState, visibility_policy: state.visibilityPolicy, rubric: federalFeedbackRubric,
    attempt_exit: { reason: "end_call", timestamp: new Date().toISOString(), scored: true, completion_state: Object.values(state.closure).every(Boolean) ? "complete" : "incomplete", return_destination: "post_call_feedback" },
    coaching_plan: { priority_behaviors: evaluation.priorities.filter((item) => /interview|listening|language|opening|closure|empathy/i.test(item)).slice(0,2), processing_skills: evaluation.priorities.filter((item) => !/interview|listening|language|opening|closure|empathy/i.test(item)).slice(0,2), readings: federalFeedbackRubric.sources.map((item) => item.url), replay_anchors: evaluation.field_evaluations.filter((item) => !item.correctness).map((item) => item.target), retry_configuration: { scenario_id: getScenario().id, caller_profile_may_vary: true } },
    transcript_source_id: null, evaluation_note_id: null, published: false,
  };
  state.feedbackSelectedEventId = attemptEvents.at(-1)?.event_id || null;
  renderFeedbackView(state.latestAttempt);
  queueAttemptForSync(state.latestAttempt).then(syncAttemptOutbox).catch(() => updateAttemptSaveStatus("pending"));
}

function submitAssessment() { return submitAttempt(); }

function handlePrimaryAction() {
  if (state.activeScreen === "authorization") {
    if (!state.callEnded) return endLiveCall({ submit: true });
    submitAttempt();
    return;
  }
  const result = validateScreen();
  if (state.mode === "practice" && !result.passed) return;
  const index = workflow.findIndex((item) => item.id === state.activeScreen);
  if (index < workflow.length - 1) {
    navigateWorkflowScreen(workflow[index + 1].id, state.mode === "assessment" ? "recorded validation" : "validated continue");
  }
}

function reviewEvidence() {
  state.evidenceReviewed = true;
  markAuthoredResultStale();
  transitionCallerAffect("deescalate", "evidence_reviewed");
  addEvent("evidence", "Reviewed current wage statement", { target: `evidence:${getScenario().id.toLowerCase()}-wage`, before: "review_required", after: "reviewed", expected: "reviewed_before_validation", correct: true, sequenceStatus: state.form.income ? "after_entry" : "before_entry", citation: `${sourceIds.qc} · Verification requirement` });
  renderWorkflow();
  renderScreen();
  showToast("Evidence reviewed", "The wage statement is now available to the evaluator.");
}

function addVoiceTurn(speaker, transcript, disclosedFactIds = [], contactOverride = null) {
  const contact = contactOverride || activeSimulationContact();
  const turn = { voice_turn_id: `voice:bo-${Date.now()}-${state.voiceTurns.length + 1}`, attempt_id: `attempt:active-${getScenario().id.toLowerCase()}`, speaker, transcript, start_time: state.elapsed, end_time: state.elapsed + 1, time: formatTime(state.elapsed), disclosed_fact_ids: disclosedFactIds, contact_id: speaker === "client" ? contact?.contact_id || null : null, contact_name: speaker === "client" ? contact?.name || getScenario().persona.name : null, contact_role: speaker === "client" ? contact?.role || "applicant" : null, raw_audio_persisted: false };
  state.voiceTurns.unshift(turn);
  if (speaker === "client") {
    dom.clientCaption.textContent = transcript;
    dom.disclosureLabel.textContent = disclosedFactIds.length ? "Case fact disclosed" : "Client turn";
    dom.disclosureTime.textContent = turn.time;
  }
  renderLiveTranscript();
  return turn;
}

function beginCallWorkspace(connectionLabel, { seedOpening = true } = {}) {
  state.callPhase = "live";
  state.callConnected = true;
  state.callEnded = false;
  state.activeScreen = "intake";
  state.validated = false;
  state.elapsed = 0;
  dom.humeConnection?.classList.remove("connecting");
  dom.humeConnection?.classList.add("connected");
  if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = connectionLabel;
  if (dom.callStateLabel) dom.callStateLabel.textContent = "Live";
  state.applicationContextEnvelope = buildApplicationContextEnvelope();
  if (!state.humeSession.contactSequence) state.humeSession.contactSequence = prepareContactSequenceForCall();
  const contact = activeSimulationContact();
  if (contact) {
    state.humeSession.activeContactId = contact.contact_id;
    dom.clientName.textContent = contact.name;
    dom.clientDescription.textContent = `${contact.role.replaceAll("_", " ")} · ${contact.preferred_language || "English"}`;
    dom.clientPortrait.textContent = contact.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }
  initializeCallerAffect("call_connected");
  const greeting = contact?.greeting || "Hello?";
  if (seedOpening) addVoiceTurn("client", greeting, [], contact);
  renderPrograms();
  renderWorkflow();
  renderScreen();
  renderPrompts();
  renderCoachGuidance();
  addEvent("voice", `${connectionLabel} client call connected`, { target: "call:session", after: "connected", sequenceStatus: "preflight_complete", citation: `${NOTEBOOK_ID} · frozen persona` });
}

function startGuidedCall() {
  state.humeSession.status = "guided";
  state.humeSession.contactSequence = prepareContactSequenceForCall();
  state.humeSession.activeContactId = state.humeSession.contactSequence.active_contact_id;
  beginCallWorkspace("Guided demo");
  speakGuidedCaller(activeSimulationContact()?.greeting || "Hello?");
  showToast("Guided voice connected", "The browser is speaking the frozen applicant responses. Use the interview topics to continue the conversation.");
}

function sendHumeChatQaTurn(event) {
  event.preventDefault();
  const input = document.querySelector("#humeChatQaInput");
  const status = document.querySelector("#humeChatQaStatus");
  const text = input?.value.trim();
  if (!text) return;
  const socket = state.humeSession.socket;
  if (state.humeSession.status !== "connected" || !socket || socket.readyState !== WebSocket.OPEN) {
    status.textContent = "Start and confirm a live Hume session first.";
    return;
  }
  try {
    socket.send(JSON.stringify({ type: "user_input", text }));
    status.textContent = "Test turn sent through the live caller session.";
    input.value = "";
    markHumeActivity();
    addEvent("system", "Hume text QA turn sent", { target: "hume:text-qa", after: "sent", sequenceStatus: "developer_test", citation: `${NOTEBOOK_ID} · active caller context` });
  } catch (error) {
    status.textContent = `Test turn failed: ${error.message}`;
  }
}

function setHumeConnectionPhase(phase) {
  state.humeSession.connectionPhase = phase;
  state.humeSession.status = phase === "connected" ? "connected" : phase === "failed" ? "failed" : "connecting";
  const label = humePhaseLabels[phase] || "Connecting";
  if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = label;
  dom.humeConnection?.classList.toggle("connecting", !["connected", "failed"].includes(phase));
  dom.humeConnection?.classList.toggle("connected", phase === "connected");
  const button = document.querySelector("#startLiveCall");
  if (button && phase !== "connected") {
    button.disabled = !["failed", "idle"].includes(phase);
    button.textContent = label;
  }
}

async function createLiveHumeSession(startRequest, { signal } = {}) {
  const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(startRequest), signal };
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      let response = await fetch("/api/hume/session", options);
      if (response.status === 404) response = await fetch("/hume/session", options);
      const result = await response.json().catch(() => ({}));
      if (response.ok) return result;
      const code = response.status === 429 ? "session_rate_limited" : [502, 503, 504].includes(response.status) ? "session_temporarily_unavailable" : "session_error";
      const error = Object.assign(new Error(result.detail || "Hume is not configured"), { code, statusCode: response.status });
      if (![502, 503, 504].includes(response.status) || attempt === 2) throw error;
      lastError = error;
    } catch (caught) {
      if (signal?.aborted || caught?.name === "AbortError") throw caught;
      const error = caught?.code ? caught : Object.assign(new Error("The secure session service could not be reached"), { code: "session_temporarily_unavailable", cause: caught });
      if (error.code !== "session_temporarily_unavailable" || attempt === 2) throw error;
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw lastError || Object.assign(new Error("The secure session service could not be reached"), { code: "session_temporarily_unavailable" });
}

function reportHumeDiagnostic(diagnostic, client) {
  const sessionProof = state.humeSession.sessionProof || client?.session?.session_proof;
  if (!sessionProof) return;
  void fetch("/api/hume/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ action: "client_diagnostic", session_proof: sessionProof, diagnostic }),
  }).catch(() => {});
}

function buildLiveHumeStartRequest(contactSequence = prepareContactSequenceForCall()) {
  state.applicationContextEnvelope = buildApplicationContextEnvelope();
  return {
    action: "start",
    scenario_id: getScenario().id,
    profile_id: getCallerProfile().profile_id,
    intensity: state.selectedCallerIntensity,
    voice_key: getCallerVoice().voice_key,
    voice_id: getCallerVoice().voice_id,
    application_context: state.applicationContextEnvelope,
    caller_brief: getScenario().callerBrief || buildDemoCallerBriefDefinition(getScenario(), getScenario().integratedCase),
    contact_sequence: contactSequence,
    turn_policy: HUME_TURN_POLICY,
    scenario: { synthetic: true, name: getScenario().persona.name, case_id: getScenario().caseId },
  };
}

async function handleLiveHumeFailure(error, client) {
  if (client && state.humeSession.client && state.humeSession.client !== client) return;
  const runtimeError = { code: error?.code || "runtime_error", phase: error?.phase || state.humeSession.connectionPhase || "failed", message: error?.message || "The live call could not continue", closeCode: Number.isInteger(error?.closeCode) ? error.closeCode : undefined };
  await releaseHumeMedia({ closeSocket: true });
  state.callPhase = "preflight";
  state.callConnected = false;
  state.humeSession.status = "failed";
  state.humeSession.connectionPhase = "failed";
  state.humeSession.runtimeError = runtimeError;
  dom.humeConnection?.classList.remove("connecting", "connected");
  renderScreen();
  if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = "Connection failed";
  const copy = humeRuntimeErrorCopy(runtimeError);
  showToast(copy.title, copy.detail, "!");
}

async function startLiveCall() {
  if (window.location.protocol === "file:") {
    window.location.replace(`https://eligibility-workspace-blue-origin.vercel.app/${window.location.search}${window.location.hash}`);
    return;
  }
  if (state.callPhase !== "preflight" || state.humeSession.status === "connecting") return;
  const Runtime = window.BlueOriginHumeRuntime;
  const SDK = window.BlueOriginHumeSDK;
  if (!Runtime || !SDK) return handleLiveHumeFailure({ code: "unsupported_media", phase: "prepare_audio", message: "The Hume browser runtime did not load" });

  state.voicePreviewAudio?.pause();
  state.voicePreviewAudio = null;
  state.humeSession.runtimeError = null;
  state.humeSession.firstAudioReceived = false;
  initializeCallerAffect("hume_session_start");
  const contactSequence = prepareContactSequenceForCall();
  const startRequest = buildLiveHumeStartRequest(contactSequence);
  let client;
  try {
    client = new Runtime.HumeBrowserClient({
      transport: Runtime.createHumeSdkTransport(SDK),
      mediaDevices: navigator.mediaDevices,
      MediaRecorderClass: window.MediaRecorder,
      createSession: createLiveHumeSession,
      userAgent: navigator.userAgent,
      onPhase: (phase, attemptId) => {
        if (state.humeSession.client !== client && state.humeSession.client) return;
        state.humeSession.connectionAttemptId = attemptId;
        setHumeConnectionPhase(phase);
      },
      onPermissionPending: () => showToast("Allow microphone access", "Choose Allow in the browser prompt to start the live call.", "mic"),
      onDiagnostic: (diagnostic) => reportHumeDiagnostic(diagnostic, client),
      onMessage: (message) => {
        if (message.type === "audio_output") state.humeSession.firstAudioReceived = true;
        handleHumeMessage(message);
      },
      onFatal: (error) => void handleLiveHumeFailure(error, client),
    });
    state.humeSession.client = client;
    const result = await client.start({ request: startRequest, volume: state.humeSession.volume });
    if (state.humeSession.client !== client) return;
    const session = result.session;
    state.humeSession.socket = result.socket;
    state.humeSession.stream = result.stream;
    state.humeSession.recorder = result.recorder;
    state.humeSession.playback = result.player;
    state.humeSession.sessionId = session.session_id;
    state.humeSession.sessionProof = session.session_proof || null;
    state.humeSession.serverSelection = session.selection || null;
    state.humeSession.contactSequence = session.contact_sequence || contactSequence;
    state.humeSession.activeContactId = session.active_contact_id || contactSequence.active_contact_id || contactSequence.answering_contact_id;
    state.humeSession.contextRevision = 0;
    state.humeSession.turnPolicy = session.turn_policy || HUME_TURN_POLICY;
    state.humeSession.paused = false;
    state.humeSession.handoffInProgress = false;
    state.humeSession.interruptedResponseIds = new Set();
    state.humeSession.status = "connected";
    state.humeSession.connectionPhase = "connected";
    beginCallWorkspace("Hume live", { seedOpening: false });
    markHumeActivity();
    const selected = session.selection || { profile: getCallerProfile().label, intensity: state.selectedCallerIntensity, voice: getCallerVoice().label, presentation: getCallerVoice().presentation };
    showToast("Hume applicant connected", `${getScenario().persona.name} entered as ${String(selected.profile).toLowerCase()} at ${selected.intensity} intensity using the ${selected.presentation} ${selected.voice} voice. Raw audio remains transient.`);
  } catch (error) {
    await handleLiveHumeFailure(error, client);
  }
}

async function releaseHumeMedia({ closeSocket = false } = {}) {
  const { client, recorder, stream, socket, playback } = state.humeSession;
  cancelSilenceCheckin();
  if (client && closeSocket) await client.close();
  else {
    try { if (recorder?.state !== "inactive") recorder?.stop(); } catch { /* already stopped */ }
    stream?.getTracks().forEach((track) => track.stop());
    if (closeSocket) {
      try { if (socket?.readyState < WebSocket.CLOSING) socket.close(); } catch { /* already closed */ }
    }
    await playback?.dispose?.();
  }
  if (closeSocket) state.humeSession.client = null;
  state.humeSession.recorder = null;
  state.humeSession.stream = null;
  state.humeSession.playback = null;
  state.humeSession.paused = false;
  state.humeSession.handoffInProgress = false;
  if (closeSocket || socket?.readyState === WebSocket.CLOSED) state.humeSession.socket = null;
}

function handleHumeMessage(raw) {
  let message;
  try { message = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return; }
  const type = message.type || message.message?.type;
  const responseId = String(message.message_id || message.generation_id || message.response_id || message.id || "");
  if (type === "user_interruption" || type === "user_message") {
    const interruptedId = state.humeSession.currentResponseId || responseId;
    if (interruptedId) state.humeSession.interruptedResponseIds.add(interruptedId);
    markHumeActivity();
  }
  if (type === "assistant_message" || type === "user_message") {
    const text = message.message?.content || message.message?.text || message.content || "";
    if (type === "assistant_message") state.humeSession.currentResponseId = responseId || state.humeSession.currentResponseId;
    if (text && !message.interim) {
      const factIds = type === "assistant_message" ? (message.fact_ids || state.humeSession.pendingFactIds || []) : [];
      const turn = addVoiceTurn(type === "assistant_message" ? "client" : "learner", text, factIds);
      if (type === "user_message") state.pendingLearnerQuestion = text;
      if (type === "assistant_message") {
        synchronizeAuthoredFactsFromConversation(state.pendingLearnerQuestion, text, turn);
        state.pendingLearnerQuestion = "";
        state.humeSession.pendingFactIds = [];
      }
    }
  }
  if (type === "expression_measurement" || message.models?.prosody) {
    const scores = message.models?.prosody?.scores || message.scores || {};
    const candidates = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [expression, confidence] = candidates[0] || ["neutral", 0.5];
    const speaker = type === "assistant_message" || message.role === "assistant" || message.speaker === "assistant" ? "client" : "learner";
    const learnerLabel = /anger|annoyance|distress/i.test(expression) ? "Learner vocal strain detected" : /confusion|doubt|hesitation/i.test(expression) ? "Learner may need to slow down" : /calm|concentration|interest/i.test(expression) ? "Learner sounds steady" : `Learner signal: ${expression}`;
    if (speaker === "learner") state.learnerAffect = { state: expression, label: learnerLabel, trend: "steady", confidence: Number(confidence) };
    else state.callerAffect = { state: expression, label: callerStateLabel(expression), trend: "adaptive", confidence: Number(confidence), source: "hume_observation" };
    state.affectObservations.unshift({ affect_observation_id: `affect:${Date.now()}`, call_turn_id: state.voiceTurns[0]?.voice_turn_id || null, speaker, source: "hume_prosody", expression_scores: scores, top_expression: expression, confidence: Number(confidence), is_diagnostic: false, observed_at: new Date().toISOString() });
    renderCoachGuidance();
  }
  if (type === "tool_call") void authorizeHumeToolCall(message);
  if (type === "audio_output" && message.data) {
    if (responseId && state.humeSession.interruptedResponseIds.has(responseId)) return;
    state.humeSession.currentResponseId = responseId || state.humeSession.currentResponseId;
    markHumeActivity({ resetCheckin: false });
    if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = "Applicant speaking";
  }
  if (type === "assistant_end") {
    if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = state.humeSession.paused ? "Caller paused" : "Hume live";
    state.humeSession.currentResponseId = null;
    if (!state.humeSession.paused) scheduleSilenceCheckin();
  }
  if (type === "error") showToast("Hume call error", message.message || message.error || "Hume could not continue the voice response.", "!");
}

function humeToolArguments(message) {
  let args = message.parameters || message.args || {};
  if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = {}; } }
  return args;
}

function sendHumeToolResponse(socket, message, result) {
  const response = window.BlueOriginHumeRuntime?.buildHumeToolResponse?.(message, result);
  if (response && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(response));
}

async function authorizeHumeCaseResponse(message) {
  const socket = state.humeSession.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const args = humeToolArguments(message);
  let result = { authorized: false, response_text: "I can only respond with facts contained in this training case.", fact_ids: [] };
  try {
    const response = await fetch("/api/hume/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "case_response", session_proof: state.humeSession.sessionProof, context_revision: state.humeSession.contextRevision, active_contact_id: state.humeSession.activeContactId, fact_id: args.fact_id, case_path: args.case_path, topic: args.topic, learner_question: args.learner_question }),
    });
    if (!response.ok) throw new Error("Case disclosure authorization failed");
    result = await response.json();
  } catch (error) {
    result = { ...result, error: error.message };
  }
  state.humeSession.sessionProof = result.session_proof || state.humeSession.sessionProof;
  state.humeSession.contextRevision = Number(result.context?.context_revision || state.humeSession.contextRevision);
  (result.fact_ids || []).forEach((factId) => state.disclosedFacts.add(factId));
  if (result.authorized && result.fact) {
    const factEvent = {
      conversation_fact_event_id: `conversation-fact:${Date.now()}-${state.conversationFactEvents.length + 1}`,
      fact_id: result.fact.fact_id,
      contact_id: state.humeSession.activeContactId,
      case_path: result.fact.case_path,
      label: result.fact.label,
      normalized_value: result.fact.normalized_value,
      display_value: result.fact.display_value,
      provenance: result.fact.provenance || "Caller statement",
      destination_stage: result.fact.destination_stage || "",
      destination_section: result.fact.destination_section || "",
      context_revision: Number(result.context?.context_revision || state.humeSession.contextRevision),
      disclosed_at: new Date().toISOString(),
    };
    state.conversationFactEvents.unshift(factEvent);
    if (state.mode === "practice" && state.guidedFollow && factEvent.case_path) window.setTimeout(() => focusConversationFactDestination(factEvent), 450);
  }
  if (result.authorized) state.humeSession.pendingFactIds = [...new Set([...(state.humeSession.pendingFactIds || []), ...(result.fact_ids || [])])];
  sendHumeToolResponse(socket, message, result);
  addEvent("voice", result.authorized ? `Server authorized Hume disclosure: ${(result.fact_ids || []).join(", ")}` : "Server blocked out-of-scenario Hume disclosure", { target: result.authorized ? `fact:${result.fact_ids?.[0] || "authorized"}` : "fact:unauthorized", after: result.authorized, sequenceStatus: "server_authorized", citation: `${NOTEBOOK_ID} · frozen disclosure rules` });
  renderCoachGuidance();
}

async function authorizeHumeContactHandoff(message) {
  const socket = state.humeSession.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN || state.humeSession.handoffInProgress) return;
  const args = humeToolArguments(message);
  state.handoffAttempted = true;
  state.humeSession.handoffInProgress = true;
  markHumeActivity();
  state.humeSession.client?.stopPlayback();
  if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = "Contact handoff";
  try {
    const response = await fetch("/api/hume/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "contact_handoff", session_proof: state.humeSession.sessionProof, context_revision: state.humeSession.contextRevision, current_contact_id: state.humeSession.activeContactId, requested_contact_id: args.requested_contact_id || state.humeSession.contactSequence?.intended_contact_id, reason: args.reason }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || "Contact handoff failed");
    if (!result.authorized) {
      sendHumeToolResponse(socket, message, result);
      addEvent("voice", "Server blocked contact handoff", { target: "contact:handoff", after: result.response_text, sequenceStatus: "server_blocked" });
      return;
    }
    state.humeSession.sessionProof = result.session_proof;
    state.humeSession.contextRevision = Number(result.context?.context_revision || state.humeSession.contextRevision);
    state.humeSession.activeContactId = result.active_contact_id;
    state.handoffCompleted = true;
    if (state.humeSession.contactSequence) state.humeSession.contactSequence.active_contact_id = result.active_contact_id;
    const target = result.contact || activeSimulationContact();
    if (target) {
      dom.clientName.textContent = target.name;
      dom.clientDescription.textContent = `${target.role.replaceAll("_", " ")} · ${target.preferred_language || "English"}`;
      dom.clientPortrait.textContent = target.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    }
    socket.send(JSON.stringify({ type: "session_settings", system_prompt: result.system_prompt, context: { text: JSON.stringify(result.context), type: "persistent" }, voice_id: result.voice_id || undefined }));
    addEvent("voice", `Contact handoff: ${target?.name || result.active_contact_id}`, { target: `contact:${result.active_contact_id}`, before: args.current_contact_id || "answering contact", after: result.active_contact_id, sequenceStatus: "server_authorized_handoff" });
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    sendHumeToolResponse(socket, message, result);
  } catch (error) {
    sendHumeToolResponse(socket, message, { authorized: false, response_text: "I cannot complete the handoff right now.", error: error.message });
    addEvent("voice", "Contact handoff failed", { target: "contact:handoff", after: error.message, sequenceStatus: "handoff_error" });
  } finally {
    state.humeSession.handoffInProgress = false;
  }
}

async function authorizeHumeCallbackMessage(message) {
  const socket = state.humeSession.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const args = humeToolArguments(message);
  let result;
  try {
    const response = await fetch("/api/hume/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "callback_message", session_proof: state.humeSession.sessionProof, context_revision: state.humeSession.contextRevision, active_contact_id: state.humeSession.activeContactId, message: args.message || args.callback_message }) });
    result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || "Callback message validation failed");
    state.humeSession.sessionProof = result.session_proof || state.humeSession.sessionProof;
    state.humeSession.contextRevision = Number(result.context?.context_revision || state.humeSession.contextRevision);
  } catch (error) {
    result = { authorized: false, response_text: "I cannot take that message right now.", error: error.message };
  }
  state.callbackDisposition = result.authorized ? "callback_message_recorded" : result.oversharing ? "oversharing_blocked" : "message_declined";
  sendHumeToolResponse(socket, message, result);
  addEvent("voice", result.authorized ? "Callback message recorded" : result.oversharing ? "Callback message blocked for oversharing" : "Callback message declined", { target: `contact:${state.humeSession.activeContactId || "active"}`, after: result.authorized, correct: result.authorized, sequenceStatus: result.oversharing ? "privacy_boundary" : "server_authorized" });
  renderCoachGuidance();
}

async function authorizeHumeToolCall(message) {
  const name = message.name || message.tool_name || message.function?.name || "request_case_response";
  if (name === "request_contact_handoff") return authorizeHumeContactHandoff(message);
  if (name === "record_callback_message") return authorizeHumeCallbackMessage(message);
  return authorizeHumeCaseResponse(message);
}

async function endLiveCall({ submit = true } = {}) {
  if (state.callEnded && state.submitted) return;
  state.callEnded = true;
  state.callConnected = false;
  window.speechSynthesis?.cancel();
  state.voicePreviewAudio?.pause();
  state.voicePreviewAudio = null;
  await releaseHumeMedia({ closeSocket: true });
  state.humeSession = { ...state.humeSession, status: "ended", socket: null, recorder: null, stream: null, playback: null };
  addEvent("voice", "Learner ended the simulated client call", { target: "call:closure", after: "ended", sequenceStatus: Object.values(state.closure).every(Boolean) ? "closure_complete" : "closure_incomplete", citation: coachGuidance.authorization.citation });
  if (dom.callStateLabel) dom.callStateLabel.textContent = "Ended";
  if (dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = "Ended";
  dom.humeConnection?.classList.remove("connected", "connecting");
  syncFooter();
  showToast("Call ended", "Transcript and timing were retained; raw audio was discarded.");
  if (submit) await submitAttempt();
}

async function probeHumeAvailability() {
  try {
    let response = await fetch("/api/hume/health");
    if (response.status === 404) response = await fetch("/hume/health");
    const data = response.ok ? await response.json() : { configured: false };
    state.humeSession.configured = Boolean(data.configured);
  } catch { state.humeSession.configured = false; }
  // Attempts launch from Assignments, Scenario Library, and retry routes. Once
  // health resolves, always refresh an active preflight shell so the Start
  // control reflects the server configuration.
  if (state.callPhase === "preflight" && !dom.appShell.classList.contains("product-view")) renderScreen();
}

function openHumeConfigDialog() {
  const dialog = document.querySelector("#humeConfigDialog");
  const status = document.querySelector("#humeConfigStatus");
  status.textContent = "";
  status.classList.remove("success");
  dialog.showModal();
  window.setTimeout(() => document.querySelector("#humeApiKey")?.focus(), 0);
}

async function saveHumeConfiguration(event) {
  event.preventDefault();
  const button = document.querySelector("#saveHumeConfig");
  const status = document.querySelector("#humeConfigStatus");
  const payload = {
    api_key: document.querySelector("#humeApiKey").value.trim(),
    secret_key: document.querySelector("#humeSecretKey").value.trim(),
    config_id: document.querySelector("#humeConfigId").value.trim(),
  };
  button.disabled = true;
  button.textContent = "Validating with Hume…";
  status.classList.remove("success");
  status.textContent = "Checking the API key and Secret key without exposing them to the application.";
  try {
    const response = await fetch("/hume/configure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || "Hume configuration could not be validated");
    state.humeSession.configured = true;
    status.classList.add("success");
    status.textContent = "Hume connected. The local server will use temporary access tokens for calls.";
    document.querySelector("#humeApiKey").value = "";
    document.querySelector("#humeSecretKey").value = "";
    window.setTimeout(() => {
      document.querySelector("#humeConfigDialog").close();
      renderScreen();
      showToast("Hume connected", "Live applicant voice is ready. No guided fallback is active.", "✓");
    }, 500);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Validate & connect";
  }
}

function renderScenarioLibrary() {
  dom.scenarioGrid.innerHTML = scenarios.map((scenario, index) => scenario.authoring?.previewOnly ? "" : `<button class="scenario-card" data-scenario="${index}"><span class="scenario-card-index">${scenario.number}</span><h3>${escapeHTML(scenario.shortTitle)}</h3><p>${escapeHTML(scenario.description)}</p><div class="scenario-card-programs">${scenario.programs.map((program) => `<span>${program}</span>`).join("")}</div></button>`).join("");
  dom.scenarioGrid.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => selectScenario(Number(button.dataset.scenario)));
  });
}

function selectScenario(index) {
  state.scenarioIndex = index;
  const scenario = getScenario();
  state.caseStartingState = buildCaseStartingState(scenario);
  state.activeScreen = "intake";
  state.callPhase = "preflight";
  state.callConnected = false;
  state.evidenceReviewed = false;
  state.caseDraft = BenefitConnectIntegrated.clone(scenario.integratedCase);
  state.mockEligibility = { status: "unrun", variant: null, lastRunAt: null };
  state.openCaseSections = null;
  state.disclosedFacts = new Set();
  state.conversationFactEvents = [];
  state.pendingLearnerQuestion = "";
  state.handoffCompleted = false;
  state.handoffAttempted = false;
  state.callbackDisposition = null;
  state.validated = false;
  state.lastValidation = null;
  state.assessmentRecorded = false;
  state.householdComplete = false;
  state.submitted = false;
  state.callEnded = false;
  state.screenZoom = 1;
  state.coachCollapsed = false;
  state.hintLevel = 0;
  state.highlightedTargetId = null;
  state.coachRequestController?.abort();
  window.clearTimeout(state.coachRequestTimer);
  state.coachRequestController = null;
  state.coachRequestTimer = null;
  state.coachRecommendation = null;
  state.coachRecommendationCache = new Map();
  state.lastValidation = null;
  state.closure = { discrepancies: false, factsConfirmed: false, nextSteps: false, closingSummary: false };
  state.form = { relationship: state.caseStartingState.prefilled_fields.relationship.value, income: "", notes: "" };
  state.screenValues = {};
  state.validatedScreens = new Set();
  state.compositeSnapshots = [];
  state.affectObservations = [];
  state.applicationContextEnvelope = null;
  cancelSilenceCheckin();
  state.humeSession.contactSequence = null;
  state.humeSession.activeContactId = null;
  state.humeSession.contextRevision = 0;
  state.humeSession.sessionProof = null;
  state.humeSession.paused = false;
  state.humeSession.handoffInProgress = false;
  state.humeSession.silenceCheckinSent = false;
  state.humeSession.interruptedResponseIds = new Set();
  state.humeSession.currentResponseId = null;
  state.humeSession.pendingFactIds = [];
  const callerAssignment = scenarioCallerAssignments[scenario.id] || {
    default_profile_id: state.simulationAuthoring?.behavior?.profileId || "benefits-anxious",
    default_voice_key: state.simulationAuthoring?.behavior?.voiceKey || "voice-warm-american-female",
  };
  state.selectedCallerProfileId = callerAssignment.default_profile_id;
  state.selectedCallerVoiceKey = callerAssignment.default_voice_key;
  state.selectedCallerIntensity = callerAssignment.default_intensity || "moderate";
  initializeCallerAffect("scenario_assignment");
  state.events = [];
  state.voiceTurns = [];
  state.screenSnapshots = [];
  state.observationEvents = [];
  state.feedbackFilter = "all";
  state.feedbackSelectedEventId = null;
  state.pendingExitIntent = null;
  hideFeedbackView();
  hydrateScenario();
  setCoachTab("client");
  if (dom.scenarioDialog.open) dom.scenarioDialog.close();
  showToast("Scenario ready", `${scenario.shortTitle} is in preflight. The attempt begins only after Start live call.`);
}

function hydrateScenario() {
  const scenario = getScenario();
  if (!state.screenPack) state.screenPack = createDemoScreenPack();
  if (!state.caseStartingState || state.caseStartingState.scenario_id !== scenario.id) {
    state.caseStartingState = buildCaseStartingState(scenario);
    state.form.relationship = state.caseStartingState.prefilled_fields.relationship.value;
  }
  dom.scenarioTitle.textContent = scenario.title;
  dom.sidebarScenarioTitle.textContent = scenario.shortTitle;
  dom.scenarioNumber.textContent = scenario.number;
  dom.caseId.textContent = scenario.caseId;
  dom.packageVersion.textContent = `${scenario.id} · v0.1`;
  dom.clientName.textContent = scenario.persona.name;
  dom.clientDescription.textContent = scenario.persona.description;
  dom.clientPortrait.textContent = scenario.persona.initials;
  const answeringContact = (scenario.contactSequence || createDefaultContactSequence(scenario)).contacts.find((contact) => contact.contact_id === (scenario.contactSequence?.answering_contact_id || scenario.contactSequence?.intended_contact_id)) || (scenario.contactSequence || createDefaultContactSequence(scenario)).contacts[0];
  dom.clientCaption.textContent = answeringContact?.greeting || "Hello?";
  dom.disclosureLabel.textContent = "Configured phone greeting";
  dom.evaluationEmpty.hidden = false;
  dom.evaluationResult.hidden = true;
  dom.evaluationEmpty.querySelector("p").textContent = state.mode === "practice" ? "Complete the fields and validate the screen. Feedback will appear here with source citations." : "Actions will be recorded silently. Feedback appears only after assessment submission.";
  renderPrograms();
  renderWorkflow();
  renderPrompts();
  renderScreen();
  renderCoachGuidance();
  renderLiveTranscript();
  renderMidscenePresenter();
  probeHumeAvailability();
}

function setMode(mode) {
  state.mode = mode;
  if (mode === "assessment") {
    const assignment = scenarioCallerAssignments[getScenario().id] || {};
    state.selectedCallerProfileId = assignment.default_profile_id || "benefits-anxious";
    state.selectedCallerVoiceKey = assignment.default_voice_key || "voice-warm-american-female";
    state.selectedCallerIntensity = assignment.default_intensity || "moderate";
    initializeCallerAffect("assessment_assignment");
  }
  state.visibilityPolicy = attemptVisibilityPolicies[mode];
  state.validated = false;
  state.lastValidation = null;
  state.assessmentRecorded = false;
  state.householdComplete = false;
  state.submitted = false;
  if (mode === "assessment") {
    state.coachRequestController?.abort();
    window.clearTimeout(state.coachRequestTimer);
  }
  clearMidsceneHighlight();
  document.querySelectorAll("[data-mode]").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active.toString());
  });
  dom.evaluationModeLabel.textContent = mode === "practice" ? "Practice mode" : "Assessment mode";
  hydrateScenario();
  if (mode === "assessment" && state.coachTab === "coach") setCoachTab("client");
  addEvent("mode", `Switched to ${mode} mode`);
  showToast(`${mode === "practice" ? "Practice" : "Assessment"} mode`, mode === "practice" ? "Immediate cited feedback is active." : "Evaluation is silent until submission.", mode === "practice" ? "✓" : "•");
}

function closeResponsivePanels() {
  dom.workflowSidebar.classList.remove("open");
  dom.coachPanel.classList.remove("open");
  document.querySelector("#studioSidebar")?.classList.remove("open");
}

function collectionFrom(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return Array.isArray(payload?.items) ? payload.items : [];
}

async function apiJSON(path, options = {}) {
  const response = await fetch(`/open-notebook${path}`, options);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try { detail = (await response.json()).detail || detail; } catch { /* response was not JSON */ }
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function loadOpenNotebook({ quiet = false } = {}) {
  try {
    const health = await fetch("/api/studio/integrations");
    if (health.ok) {
      const integrations = await health.json();
      if (!integrations.notebook) {
        state.openNotebook.notebook = null;
        state.openNotebook.sources = [];
        state.openNotebook.notes = [];
        state.openNotebook.live = false;
        state.openNotebook.loading = false;
        state.openNotebook.error = "Open Notebook is not configured";
        if (state.route !== "simulations") renderProductView();
        return;
      }
    }
  } catch { /* Local proxy deployments may not expose integration health. */ }
  if (!quiet) {
    state.openNotebook.loading = true;
    if (state.route !== "simulations") renderProductView();
  }
  try {
    const [notebookPayload, sourcesPayload, notesPayload] = await Promise.all([
      apiJSON(`/api/notebooks/${encodeURIComponent(NOTEBOOK_ID)}`),
      apiJSON(`/api/sources?notebook_id=${encodeURIComponent(NOTEBOOK_ID)}&limit=100`),
      apiJSON(`/api/notes?notebook_id=${encodeURIComponent(NOTEBOOK_ID)}`),
    ]);
    state.openNotebook.notebook = notebookPayload;
    state.openNotebook.sources = collectionFrom(sourcesPayload, ["sources", "results"]);
    state.openNotebook.notes = collectionFrom(notesPayload, ["notes", "results"]);
    state.openNotebook.live = true;
    state.openNotebook.error = null;
    if (!state.selectedNoteIds.size && state.openNotebook.notes.length) state.selectedNoteIds.add(state.openNotebook.notes[0].id);
  } catch (error) {
    state.openNotebook.notebook = null;
    state.openNotebook.sources = [];
    state.openNotebook.notes = [];
    state.openNotebook.live = false;
    state.openNotebook.error = error.message;
  } finally {
    state.openNotebook.loading = false;
    if (state.route !== "simulations") renderProductView();
  }
}

function sourceTitle(source) {
  return source.title || source.name || source.asset?.title || source.url || "Untitled source";
}

function noteTitle(note) {
  return note.title || note.name || "Untitled note";
}

function recordId(record) {
  return String(record?.id || record?.source_id || record?.note_id || "pending");
}

function shortId(id) {
  const [kind, value = ""] = String(id).split(":");
  return `${kind}:${value.slice(0, 8)}${value.length > 8 ? "…" : ""}`;
}

function topicList(record, defaults = []) {
  const topics = record.topics || record.tags || defaults;
  return (Array.isArray(topics) ? topics : []).slice(0, 3);
}

function lifecycleMarkup(activeStage) {
  const stages = ["Research", "Product design", "Draft", "Frozen package", "Simulation", "Evaluation", "Decision"];
  return `<div class="lifecycle-strip" aria-label="Prototype lifecycle">${stages.map((stage, index) => `<div class="lifecycle-step ${index === activeStage ? "active" : ""} ${index < activeStage ? "complete" : ""}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${stage}</strong></div>`).join("")}</div>`;
}

function legacyProductHeader(view) {
  const config = productRoutes[view];
  dom.scenarioTitle.textContent = config.title;
  dom.caseId.textContent = shortId(NOTEBOOK_ID);
  const badge = document.querySelector(".synthetic-badge");
  badge.textContent = config.label;
  dom.programStrip.innerHTML = lifecycleMarkup(config.stage);
  dom.programStrip.setAttribute("aria-label", "Product lifecycle");
}

function liveStatusMarkup() {
  const { live, error } = state.openNotebook;
  return `<div class="notebook-status ${live ? "live" : "offline"}"><span></span><strong>${live ? "Live local notebook" : "Cached baseline"}</strong><small>${live ? "127.0.0.1 only" : "Open Notebook unavailable · frozen local package active"}</small></div>`;
}

function renderNotebookHome() {
  const { notebook, sources, notes, loading } = state.openNotebook;
  if (loading) return `<div class="product-page"><div class="loading-state"><span></span><strong>Connecting to Open Notebook…</strong><p>Loading the product baseline, source lineage, and canonical notes.</p></div></div>`;
  const notebookName = notebook?.name || notebook?.title || "BlueOrigin Product Baseline";
  return `<div class="product-page notebook-home">
    <section class="product-hero">
      <div class="product-hero-copy"><span class="product-kicker">Product design & prototype environment</span><h2>Research becomes a testable product.</h2><p>Open Notebook is the front door. Sources ground the product design, approved notes generate frozen simulation packages, and every learner attempt returns evidence to the same baseline.</p>
        <div class="product-actions"><button class="button button-primary" data-action="add-source">Add source</button><button class="button button-secondary" data-action="open-notebook">Open Open Notebook ↗</button></div>
      </div>
      <div class="notebook-identity">${liveStatusMarkup()}<span>Notebook</span><strong>${escapeHTML(notebookName)}</strong><code>${escapeHTML(NOTEBOOK_ID)}</code></div>
    </section>
    <section class="metric-grid" aria-label="Notebook summary">
      <article class="metric-card orange"><span>Grounded sources</span><strong>${sources.length}</strong><small>policy, product, screen, and prototype evidence</small></article>
      <article class="metric-card slate"><span>Canonical notes</span><strong>${notes.length}</strong><small>versioned specifications and decisions</small></article>
      <article class="metric-card dark"><span>Demonstration cases</span><strong>${scenarios.length}</strong><small>Medicaid · SNAP · TANF</small></article>
    </section>
    <section class="flow-loop" aria-label="Connected product workflow">
      ${["Research", "Product design", "Simulation prototype", "Learner test", "Evaluation", "Product decision"].map((label, index) => `<button class="flow-node" data-flow-step="${index}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${label}</strong>${index < 5 ? "<i>→</i>" : "<i>↻</i>"}</button>`).join("")}
    </section>
    <section class="workspace-grid">
      <article class="workspace-panel"><div class="workspace-panel-heading"><div><span>01 · Research library</span><h3>Product sources</h3></div><button class="text-button" data-view-link="generate">Select for draft →</button></div><div class="panel-list">${sources.slice(0, 6).map((source) => `<div class="record-row"><span class="record-icon">S</span><div><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(shortId(recordId(source)))}</small></div><span class="record-state">${escapeHTML(source.status || "ready")}</span></div>`).join("") || '<div class="empty-state">No sources yet. Add research to start the loop.</div>'}</div></article>
      <article class="workspace-panel"><div class="workspace-panel-heading"><div><span>02 · Product design</span><h3>Canonical notes</h3></div><button class="text-button" data-view-link="design">Open specifications →</button></div><div class="panel-list">${notes.slice(0, 6).map((note) => `<div class="record-row"><span class="record-icon note">N</span><div><strong>${escapeHTML(noteTitle(note))}</strong><small>${escapeHTML(shortId(recordId(note)))}</small></div><span class="record-state">current</span></div>`).join("") || '<div class="empty-state">No notes yet. Create the first specification.</div>'}</div></article>
    </section>
  </div>`;
}

function renderDesignView() {
  const notes = state.openNotebook.notes;
  return `<div class="product-page">
    <section class="page-intro"><div><span class="product-kicker">Grounded specification layer</span><h2>Design from evidence. Keep every decision retrievable.</h2><p>Canonical notes translate product and policy sources into a reviewable eligibility experience. Select the notes that are approved inputs to draft generation.</p></div><button class="button button-primary" data-action="create-note">Create specification note</button></section>
    <div class="selection-summary"><span>${state.selectedNoteIds.size} note${state.selectedNoteIds.size === 1 ? "" : "s"} selected for the next SimulationDraft</span><button class="text-button" data-view-link="generate">Continue to generation →</button></div>
    <section class="design-note-grid">${notes.map((note, index) => { const id = recordId(note); const selected = state.selectedNoteIds.has(id); return `<button class="design-note-card ${selected ? "selected" : ""} ${id === SPEC_NOTE_ID ? "featured" : ""}" data-select-note="${escapeHTML(id)}" aria-pressed="${selected}"><div class="note-card-top"><span>${id === SPEC_NOTE_ID ? "UI/UX DIRECTION" : `SPEC ${String(index + 1).padStart(2, "0")}`}</span><span class="selection-check">${selected ? "✓" : "+"}</span></div><h3>${escapeHTML(noteTitle(note))}</h3><p>${escapeHTML(String(note.content || note.summary || "Canonical product requirement stored in the product baseline.").replace(/[#*_`]/g, "").slice(0, 145))}</p><div class="topic-row">${topicList(note, ["product-baseline", "prototype"]).map((topic) => `<span>${escapeHTML(topic)}</span>`).join("")}</div><code>${escapeHTML(shortId(id))}</code></button>`; }).join("")}</section>
  </div>`;
}

function renderGenerateView() {
  const sources = state.openNotebook.sources;
  const notes = state.openNotebook.notes;
  const draft = state.draft;
  return `<div class="product-page">
    <section class="page-intro"><div><span class="product-kicker">Grounded generation</span><h2>Compile a simulation from explicit lineage.</h2><p>Choose the exact sources and specification notes. The resulting draft records every identifier and freezes them before an attempt begins.</p></div><span class="security-pill">No live notebook queries during attempts</span></section>
    <section class="draft-layout">
      <div class="draft-inputs">
        <article class="selection-panel"><div class="workspace-panel-heading"><div><span>Inputs · Sources</span><h3>${state.selectedSourceIds.size} selected</h3></div></div><div class="selection-list">${sources.map((source) => { const id = recordId(source); const selected = state.selectedSourceIds.has(id); return `<label class="selection-row"><input type="checkbox" data-select-source="${escapeHTML(id)}" ${selected ? "checked" : ""}/><span><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(shortId(id))}</small></span></label>`; }).join("")}</div></article>
        <article class="selection-panel"><div class="workspace-panel-heading"><div><span>Inputs · Specifications</span><h3>${state.selectedNoteIds.size} selected</h3></div></div><div class="selection-list">${notes.map((note) => { const id = recordId(note); const selected = state.selectedNoteIds.has(id); return `<label class="selection-row"><input type="checkbox" data-select-note="${escapeHTML(id)}" ${selected ? "checked" : ""}/><span><strong>${escapeHTML(noteTitle(note))}</strong><small>${escapeHTML(shortId(id))}</small></span></label>`; }).join("")}</div></article>
      </div>
      <aside class="draft-panel ${draft ? "ready" : ""}">${draft ? `<div class="draft-state"><span></span>${draft.status === "frozen" ? "Frozen package" : "SimulationDraft ready"}</div><h3>${escapeHTML(draft.title)}</h3><p>Scenario definitions, screen schema, expected actions, deterministic rules, and citations were compiled from the selected records.</p><dl class="draft-schema"><div><dt>simulation_draft_id</dt><dd>${escapeHTML(draft.simulation_draft_id)}</dd></div><div><dt>source_ids</dt><dd>${draft.source_ids.length}</dd></div><div><dt>specification_note_ids</dt><dd>${draft.specification_note_ids.length}</dd></div><div><dt>screens</dt><dd>9 eligibility stages</dd></div><div><dt>evaluation_rules</dt><dd>deterministic + cited</dd></div>${draft.simulation_package_version ? `<div><dt>package version</dt><dd>${escapeHTML(draft.simulation_package_version)}</dd></div>` : ""}</dl><div class="draft-actions"><button class="button button-secondary" data-action="save-draft">Save draft to notebook</button>${draft.status === "frozen" ? '<button class="button button-primary" data-view-link="simulations">Run frozen package →</button>' : '<button class="button button-primary" data-action="freeze-draft">Freeze package</button>'}</div>` : `<span class="product-kicker">SimulationDraft</span><h3>Nothing generated yet.</h3><p>Select at least one source and one specification note, then generate a traceable draft.</p><div class="draft-placeholder"><span>scenario</span><span>screens</span><span>expected actions</span><span>evaluation rules</span><span>citations</span></div><button class="button button-primary" data-action="generate-draft">Generate draft</button>`}</aside>
    </section>
  </div>`;
}

function renderResultsView() {
  const attempt = state.latestAttempt;
  return `<div class="product-page">
    <section class="page-intro"><div><span class="product-kicker">Evaluation → product decision</span><h2>Return every finding to the same notebook.</h2><p>Screen events, voice disclosures, deterministic evaluations, transcripts, and lessons learned close the loop without mutating a package that is already in use.</p></div>${attempt && !attempt.published ? '<button class="button button-primary" data-action="publish-result">Publish latest evaluation</button>' : ""}</section>
    <section class="result-loop"><article><span>Frozen input</span><strong>${escapeHTML(state.draft?.simulation_package_version || "v0.1")}</strong><small>${escapeHTML(state.draft?.simulation_package_id || "package:bo-demo")}</small></article><i>→</i><article><span>Attempt</span><strong>${attempt ? attempt.score : "—"}${attempt ? "/100" : ""}</strong><small>${attempt ? escapeHTML(shortId(attempt.attempt_id)) : "Run an assessment to create an attempt"}</small></article><i>→</i><article><span>Writeback</span><strong>${attempt?.published ? "Published" : "Pending"}</strong><small>${attempt?.evaluation_note_id ? escapeHTML(shortId(attempt.evaluation_note_id)) : "Approval required before create"}</small></article><i>↻</i></section>
    <section class="workspace-grid"><article class="workspace-panel"><div class="workspace-panel-heading"><div><span>Attempt evidence</span><h3>What returns to Open Notebook</h3></div></div><div class="pipeline-timeline">${["Voice transcript linked to screen events", "Program/person/month result summary", "Deterministic pass/fail and critical errors", "Learner retries and coaching events", "Product lessons and baseline revision"].map((item, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><p>${item}</p></div>`).join("")}</div></article><article class="workspace-panel dark-panel"><span class="product-kicker">Runtime boundary</span><h3>The attempt stays frozen.</h3><p>The simulation runtime never asks changing notebook content what to do mid-attempt. New evidence becomes the next reviewed package version.</p><dl class="lineage-list"><div><dt>notebook_id</dt><dd>${escapeHTML(shortId(NOTEBOOK_ID))}</dd></div><div><dt>transcript_source_id</dt><dd>${attempt?.transcript_source_id ? escapeHTML(shortId(attempt.transcript_source_id)) : "created after publish"}</dd></div><div><dt>evaluation_note_id</dt><dd>${attempt?.evaluation_note_id ? escapeHTML(shortId(attempt.evaluation_note_id)) : "created after publish"}</dd></div></dl></article></section>
  </div>`;
}

function renderDecisionsView() {
  const decisions = [
    ["Open Notebook role", "Product design, source lineage, prototype evidence, and lessons learned—not the production eligibility backend."],
    ["Runtime boundary", "Compile approved content into a frozen package. Never query mutable notebook content during an attempt."],
    ["Formal correctness", "Deterministic rules control eligibility, calculations, critical errors, and pass/fail."],
    ["AI boundary", "AI may evaluate communication and free-text reasoning; it cannot override critical processing rules."],
    ["Data boundary", "Use synthetic applicant data, transient raw audio, and localhost-only product services."],
    ["Deployment", "Keep the stack in local Docker. A persistent VM is the later remote-hosting path—not Vercel Functions."],
  ];
  return `<div class="product-page"><section class="page-intro"><div><span class="product-kicker">Architecture decision record</span><h2>Decisions stay beside the evidence that produced them.</h2><p>The notebook retains prior versions, open questions, and the product lessons that justify each revision.</p></div><button class="button button-secondary" data-action="open-notebook">Open decisions note ↗</button></section><section class="decision-grid">${decisions.map(([title, body], index) => `<article><span>ADR ${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${body}</p></article>`).join("")}</section><section class="decision-footer"><div><span class="product-kicker">Continuous loop</span><strong>Research → design → prototype → test → evaluate → decide → revise</strong></div><button class="button button-primary" data-view-link="notebook">Return to baseline</button></section></div>`;
}

function legacyRenderProductView() {
  if (state.route === "simulations") return;
  productHeader(state.route);
  const renderers = { notebook: renderNotebookHome, design: renderDesignView, generate: renderGenerateView, results: renderResultsView, decisions: renderDecisionsView };
  dom.screenContent.innerHTML = (renderers[state.route] || renderNotebookHome)();
  bindProductViewEvents();
}

function legacySetProductView(view) {
  state.route = view;
  document.querySelectorAll(".rail-button[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  if (view === "simulations") {
    dom.appShell.classList.remove("product-view");
    dom.programStrip.setAttribute("aria-label", "Programs requested");
    hydrateScenario();
    addEvent("navigation", "Opened frozen-package simulation runtime");
  } else {
    dom.appShell.classList.add("product-view");
    closeResponsivePanels();
    renderProductView();
    dom.screenContent.scrollTop = 0;
  }
}

function legacyBindProductViewEvents() {
  dom.screenContent.querySelectorAll("[data-view-link]").forEach((button) => button.addEventListener("click", () => setProductView(button.dataset.viewLink)));
  dom.screenContent.querySelectorAll("button[data-select-note]").forEach((control) => control.addEventListener("click", () => {
    const id = control.dataset.selectNote;
    if (state.selectedNoteIds.has(id)) state.selectedNoteIds.delete(id); else state.selectedNoteIds.add(id);
    renderProductView();
  }));
  dom.screenContent.querySelectorAll("input[data-select-note]").forEach((input) => input.addEventListener("change", () => {
    input.checked ? state.selectedNoteIds.add(input.dataset.selectNote) : state.selectedNoteIds.delete(input.dataset.selectNote);
    renderProductView();
  }));
  dom.screenContent.querySelectorAll("input[data-select-source]").forEach((input) => input.addEventListener("change", () => {
    input.checked ? state.selectedSourceIds.add(input.dataset.selectSource) : state.selectedSourceIds.delete(input.dataset.selectSource);
    renderProductView();
  }));
  dom.screenContent.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleProductAction(button.dataset.action)));
  dom.screenContent.querySelectorAll("[data-flow-step]").forEach((button) => button.addEventListener("click", () => {
    const routes = ["notebook", "design", "simulations", "simulations", "results", "decisions"];
    setProductView(routes[Number(button.dataset.flowStep)]);
  }));
}

function legacyHandleProductAction(action) {
  if (action === "open-notebook") {
    setProductView("notebook");
    return;
  }
  if (action === "add-source") return openWriteDialog("source");
  if (action === "create-note") return openWriteDialog("note");
  if (action === "save-draft") return openWriteDialog("draft");
  if (action === "publish-result") return openWriteDialog("result");
  if (action === "generate-draft") {
    if (!state.selectedSourceIds.size || !state.selectedNoteIds.size) return showToast("Select grounded inputs", "Choose at least one source and one specification note.", "!");
    state.draft = {
      simulation_draft_id: `draft:bo-${Date.now()}`,
      title: "Combined Medicaid, SNAP & TANF initial application",
      notebook_id: NOTEBOOK_ID,
      source_ids: [...state.selectedSourceIds],
      specification_note_ids: [...state.selectedNoteIds],
      scenario_ids: scenarios.map((scenario) => scenario.id),
      status: "ready",
    };
    renderProductView();
    showToast("SimulationDraft generated", "Lineage, screens, rules, and citations are ready for review.");
    return;
  }
  if (action === "freeze-draft") {
    state.draft = { ...state.draft, status: "frozen", simulation_package_id: `package:blueorigin-${Date.now()}`, simulation_package_version: "v0.1" };
    renderProductView();
    showToast("Package frozen", "The runtime will use this immutable version for every attempt.");
  }
}

function draftMarkdown() {
  if (!state.draft) return "";
  return `# ${state.draft.title}\n\n- simulation_draft_id: ${state.draft.simulation_draft_id}\n- notebook_id: ${NOTEBOOK_ID}\n- source_ids: ${state.draft.source_ids.join(", ")}\n- specification_note_ids: ${state.draft.specification_note_ids.join(", ")}\n- status: ${state.draft.status}\n\n## Compiled contents\n\nSix scenarios; nine eligibility screen stages; expected learner actions; deterministic evaluation rules; voice disclosure constraints; source citations.`;
}

function resultMarkdown() {
  const attempt = state.latestAttempt;
  if (!attempt) return "";
  return `# Prototype evaluation — ${attempt.scenario_id}\n\n- attempt_id: ${attempt.attempt_id}\n- notebook_id: ${NOTEBOOK_ID}\n- simulation_package_id: ${attempt.simulation_package_id}\n- simulation_package_version: ${attempt.simulation_package_version}\n- mode: ${attempt.mode}\n- score: ${attempt.score}/100\n- passed: ${attempt.passed}\n- critical_errors: ${attempt.critical_errors}\n- raw_audio_retained: false\n- continuous_screen_recording: false\n- event_snapshots: ${attempt.screen_snapshots.length}\n- midscene_observations: ${attempt.observation_events.length}\n\n## Deterministic checks\n\n${attempt.checks.map((check) => `- ${check.correct ? "PASS" : check.severity === "critical" ? "CRITICAL ERROR" : "REVIEW"}: ${check.dimension} — ${check.title}; actual: ${check.actual}; expected: ${check.expected}; sequence: ${check.sequence_status}; citation: ${check.citation}`).join("\n")}\n\n## Transcript\n\n${attempt.voice_turns.map((turn) => `- ${turn.time || turn.timestamp || "00:00"} — ${turn.speaker}: ${turn.transcript}`).join("\n") || "- No retained voice turns."}\n\n## Normalized event trace\n\n${attempt.events.map((event) => `- ${event.time} — ${event.channel} — ${event.label}; target: ${event.target}; sequence: ${event.sequence_status}; correctness: ${event.correct ?? "recorded"}`).join("\n")}\n\n## Lessons learned\n\n- Confirm the starting-case provenance before changing an existing value.\n- Ask for missing or changed material facts before committing them to the eligibility replica.\n- Review supporting evidence before validation and authorization.\n- Close the call by confirming facts, explaining pending actions, interpreting results, and summarizing next steps.\n- Midscene observations are replay evidence only; deterministic scenario rules remain authoritative.`;
}

function creationMarkdown() {
  const type = state.route === "video" ? "video" : state.route === "quiz" ? "quiz" : "simulation";
  const draft = state.creationDrafts[type];
  if (!draft) return "";
  return `# ${draft.title}\n\n- creation_id: ${draft.creation_id}\n- type: ${draft.type}\n- notebook_id: ${draft.notebook_id}\n- source_ids: ${draft.source_ids.join(", ")}\n- specification_note_ids: ${draft.specification_note_ids.join(", ")}\n- status: ${draft.status}\n\n## Grounded draft\n\nEditable ${draft.type} draft with citations, review state, and publication lineage.`;
}

function openWriteDialog(mode) {
  state.writeMode = mode;
  const isSource = mode === "source";
  const isLibrarySource = isSource && state.route === "library";
  const isNotebook = mode === "notebook";
  const titles = { source: isLibrarySource ? "Add a document" : "Add a product source", notebook: "Create a notebook", note: "Create a specification note", creation: "Save grounded draft", draft: "Save SimulationDraft", result: "Publish evaluation result" };
  document.querySelector("#writeDialogTitle").textContent = state.pendingPublishType ? `Publish ${creatorLabel(state.pendingPublishType)}` : titles[mode];
  document.querySelector("#writeDialogKicker").textContent = isLibrarySource ? "Library document" : isSource ? "Open Notebook source" : isNotebook ? "Product Studio notebook" : "Open Notebook note";
  document.querySelector("#writeDialogIntro").textContent = state.pendingPublishType ? "Publishing creates a versioned Open Notebook note and then makes this grounded experience available. Nothing is written until you confirm." : isLibrarySource ? "The original document will be stored in the Library database. Extracted text is prepared separately for Notebook authoring." : `This will create a ${isSource ? "source" : isNotebook ? "notebook workspace" : "versioned note"}. Nothing is written until you confirm.`;
  document.querySelector("#sourceTypeField").hidden = !isSource;
  document.querySelector("#writeUrlField").hidden = !isSource || document.querySelector("#writeType").value !== "link";
  document.querySelector("#writeFileField").hidden = !isSource || document.querySelector("#writeType").value !== "upload";
  document.querySelector("#writeContentField").hidden = isNotebook || (isSource && document.querySelector("#writeType").value === "link");
  if (isSource && document.querySelector("#writeType").value === "upload") document.querySelector("#writeContentField").hidden = true;
  const currentDraft = state.route === "video" ? state.creationDrafts.video : state.route === "quiz" ? state.creationDrafts.quiz : state.creationDrafts.simulation;
  document.querySelector("#writeTitle").value = mode === "draft" ? `SimulationDraft — ${state.draft?.title || "BlueOrigin"} — v0.1` : mode === "creation" ? `${creatorLabel(currentDraft?.type || "video")} — ${currentDraft?.title || "Grounded draft"}` : mode === "result" ? `Prototype Evaluation — ${state.latestAttempt?.scenario_id || "BlueOrigin"}` : "";
  document.querySelector("#writeContent").value = mode === "draft" ? draftMarkdown() : mode === "creation" ? creationMarkdown() : mode === "result" ? resultMarkdown() : "";
  document.querySelector("#writeUrl").value = "";
  document.querySelector("#writeFile").value = "";
  document.querySelector("#writeConfirmationText").textContent = state.pendingPublishType ? "Confirming will create the versioned note and publish this experience. Delete and settings tools are not exposed." : isLibrarySource ? "Confirming stores the original file and its authoring extraction. You can archive or delete it from the Library." : `Confirming will create a ${isSource ? "source" : isNotebook ? "local notebook workspace" : "note"}. Delete and settings tools are not exposed.`;
  dom.writeDialog.showModal();
}

async function confirmWrite(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    state.pendingPublishType = null;
    dom.writeDialog.close();
    return;
  }
  const button = document.querySelector("#confirmWrite");
  const title = document.querySelector("#writeTitle").value.trim();
  const content = document.querySelector("#writeContent").value.trim();
  if (!title) return showToast("Title required", "Give the new notebook record a title.", "!");
  button.disabled = true;
  button.textContent = "Creating…";
  try {
    let created;
    if (state.writeMode === "notebook") {
      throw new Error("Create notebooks from the server-backed Notebooks workspace.");
    } else if (state.writeMode === "source") {
      const type = document.querySelector("#writeType").value;
      const url = document.querySelector("#writeUrl").value.trim();
      const file = document.querySelector("#writeFile").files[0];
      if ((type === "link" && !url) || (type === "text" && !content) || (type === "upload" && !file)) throw new Error(type === "link" ? "URL is required" : type === "upload" ? "A file is required" : "Content is required");
      if (state.route === "library") {
        created = await createLibraryDocument({ type, title, url, content, file, onProgress: (progress) => { button.textContent = `Uploading ${progress}%`; } });
      } else {
        const form = new FormData();
        form.set("notebook_id", NOTEBOOK_ID);
        form.set("type", type);
        form.set("title", title);
        if (type === "link") form.set("url", url);
        if (type === "text") form.set("content", content);
        if (type === "upload") form.set("file", file, file.name);
        form.set("embed", "false");
        form.set("async_processing", "false");
        created = await apiJSON("/api/sources", { method: "POST", headers: { "X-BlueOrigin-Approval": "confirmed" }, body: form });
      }
    } else {
      if (!content) throw new Error("Content is required");
      created = await apiJSON("/api/notes", { method: "POST", headers: { "Content-Type": "application/json", "X-BlueOrigin-Approval": "confirmed" }, body: JSON.stringify({ notebook_id: NOTEBOOK_ID, title, content, note_type: "human" }) });
      if (state.writeMode === "result" && state.latestAttempt) {
        state.latestAttempt.published = true;
        state.latestAttempt.evaluation_note_id = recordId(created);
      }
      if (state.pendingPublishType) {
        const publishedType = state.pendingPublishType;
        const publishedDraft = state.creationDrafts[publishedType];
        publishedDraft.status = "published";
        publishedDraft.publication_note_id = recordId(created);
        if (publishedType === "simulation") {
          Object.assign(publishedDraft, { simulation_package_id: `package:blueorigin-${Date.now()}`, simulation_package_version: "v0.1" });
          state.draft = { ...publishedDraft, status: "frozen" };
        }
        state.pendingPublishType = null;
      }
    }
    dom.writeDialog.close();
    if (state.writeMode === "source" && state.route === "library") {
      await loadLibraryRegistry({ quiet: true });
      showToast("Document added", `${title} is stored in the Library and ready to open.`, "✓");
    } else {
      if (state.writeMode !== "notebook") await loadOpenNotebook({ quiet: true });
      showToast(state.writeMode === "notebook" ? "Notebook created" : "Created in Open Notebook", `${title} is now part of the product workspace.`);
    }
  } catch (error) {
    showToast(state.writeMode === "source" && state.route === "library" ? "Library upload failed" : "Open Notebook write failed", error.message, "!");
  } finally {
    button.disabled = false;
    button.textContent = "Confirm create";
    renderProductView();
  }
}

function bindStaticEvents() {
  document.querySelector("#openScenarioLibrary").addEventListener("click", () => dom.scenarioDialog.showModal());
  document.querySelector("#closeScenarioLibrary").addEventListener("click", () => dom.scenarioDialog.close());
  dom.scenarioDialog.addEventListener("click", (event) => { if (event.target === dom.scenarioDialog) dom.scenarioDialog.close(); });
  document.querySelector("#feedbackReturn")?.addEventListener("click", returnFromSimulation);
  document.querySelector("#retryAttempt")?.addEventListener("click", retryLatestAttempt);
  dom.backFromCall?.addEventListener("click", () => openCallExitDialog("back"));
  dom.confirmCallExit?.addEventListener("click", (event) => { event.preventDefault(); confirmCallExitIntent(); });
  dom.callExitDialog?.addEventListener("close", () => { if (dom.callExitDialog.returnValue === "cancel") state.pendingExitIntent = null; });
  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  dom.primaryActionButton.addEventListener("click", handlePrimaryAction);
  dom.reviewEvidenceButton.addEventListener("click", reviewEvidence);
  dom.previousScreenButton?.addEventListener("click", () => {
    const index = workflow.findIndex((item) => item.id === state.activeScreen);
    if (index <= 0) return;
    navigateWorkflowScreen(workflow[index - 1].id, "previous screen");
  });
  dom.endCallTop?.addEventListener("click", endCallAndOpenFeedback);
  dom.pauseCallerButton?.addEventListener("click", () => toggleHumePause());
  const coachResizeHandle = dom.coachPanel?.querySelector("[data-coach-resize]");
  coachResizeHandle?.addEventListener("pointerdown", beginCoachPanelResize);
  coachResizeHandle?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") return setCoachPanelWidth(380);
    if (event.key === "End") return setCoachPanelWidth(640);
    setCoachPanelWidth(state.coachPanelWidth + (event.key === "ArrowLeft" ? 24 : -24));
  });
  dom.workflowCollapseButton?.addEventListener("click", () => {
    const expanded = dom.workflowSidebar.classList.toggle("expanded");
    dom.workflowCollapseButton.setAttribute("aria-expanded", expanded.toString());
    dom.workflowCollapseButton.setAttribute("aria-label", expanded ? "Collapse case workflow" : "Expand case workflow");
  });
  dom.eventTraceToggle.addEventListener("click", () => {
    const expanded = dom.eventTraceToggle.getAttribute("aria-expanded") === "true";
    dom.eventTraceToggle.setAttribute("aria-expanded", (!expanded).toString());
    dom.eventTrace.hidden = expanded;
  });
  document.querySelectorAll("[data-coach-tab]").forEach((button, index, buttons) => {
    button.addEventListener("click", () => setCoachTab(button.dataset.coachTab));
    button.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      setCoachTab(buttons[nextIndex].dataset.coachTab);
    });
  });
  dom.presenterToggle?.addEventListener("click", () => {
    state.presenterMode = !state.presenterMode;
    renderMidscenePresenter();
    if (state.presenterMode) setCoachTab("activity");
    addEvent("system", `Presenter observation view ${state.presenterMode ? "enabled" : "disabled"}`, { target: "presenter:midscene", sequenceStatus: "demo_control" });
  });
  dom.requestHintButton?.addEventListener("click", () => requestCoachHint("next"));
  dom.policyGuideButton?.addEventListener("click", () => requestCoachHint("policy"));
  dom.locateTargetButton?.addEventListener("click", () => {
    if (!state.visibilityPolicy.target_highlights) return requestCoachHint("locator");
    locateCurrentTarget();
  });
  document.querySelector("#audioButton").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const muted = button.classList.toggle("muted");
    button.setAttribute("aria-pressed", (!muted).toString());
    state.humeSession.muted = muted;
    if (muted) window.speechSynthesis?.cancel();
    if (muted) state.humeSession.client?.mute();
    else {
      state.humeSession.client?.setVolume(state.humeSession.volume);
      state.humeSession.client?.unmute();
      if (state.humeSession.status === "connected" && dom.humeConnectionLabel) dom.humeConnectionLabel.textContent = "Hume live";
    }
    showToast(muted ? "Audio muted" : "Audio on", "Captions remain available throughout the attempt.", muted ? "×" : "✓");
  });
  document.querySelector("#copyPackage").addEventListener("click", async () => {
    const value = `${getScenario().id}:v0.1`;
    try { await navigator.clipboard.writeText(value); showToast("Package ID copied", value); }
    catch { showToast("Package ID", value, "•"); }
  });
  document.querySelector("#openSidebar").addEventListener("click", () => document.querySelector("#studioSidebar").classList.add("open"));
  document.querySelector("#closeSidebar").addEventListener("click", () => dom.workflowSidebar.classList.remove("open"));
  document.querySelector("#closeProductSidebar").addEventListener("click", () => document.querySelector("#studioSidebar").classList.remove("open"));
  document.querySelector(".main-column").addEventListener("click", (event) => {
    if (window.innerWidth <= 1080 && event.clientX > window.innerWidth - 100 && event.clientY > window.innerHeight - 150) {
      dom.coachPanel.classList.toggle("open");
    }
  });
  document.querySelector("#helpButton").addEventListener("click", () => showToast("Product Studio help", "Add knowledge, create a grounded experience, or run a frozen simulation."));
  document.querySelector("#openNotebookButton").addEventListener("click", () => setProductView("notebook"));
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setProductView(button.dataset.view)));
  document.querySelectorAll("[data-role]").forEach((button) => button.addEventListener("click", () => {
    state.role = button.dataset.role;
    dom.appShell.dataset.role = state.role;
    document.querySelectorAll("[data-role]").forEach((control) => { const active = control.dataset.role === state.role; control.classList.toggle("active", active); control.setAttribute("aria-pressed", active.toString()); });
    setProductView("home");
  }));
  document.querySelector("#newButton").addEventListener("click", () => {
    const menu = document.querySelector("#newMenu");
    const open = menu.hidden;
    menu.hidden = !open;
    document.querySelector("#newButton").setAttribute("aria-expanded", open.toString());
  });
  document.querySelectorAll("[data-new]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("#newMenu").hidden = true;
    document.querySelector("#newButton").setAttribute("aria-expanded", "false");
    const type = button.dataset.new;
    if (type === "source") openWriteDialog("source");
    else if (type === "notebook") openWriteDialog("notebook");
    else setProductView(type === "simulation" ? "simulation-builder" : type);
  }));
  document.querySelector("#writeType").addEventListener("change", (event) => {
    const isLink = event.target.value === "link";
    const isUpload = event.target.value === "upload";
    document.querySelector("#writeUrlField").hidden = !isLink;
    document.querySelector("#writeFileField").hidden = !isUpload;
    document.querySelector("#writeContentField").hidden = isLink || isUpload;
  });
  document.querySelector("#writeFile").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    const title = document.querySelector("#writeTitle");
    if (file && !title.value.trim()) title.value = file.name.replace(/\.[^.]+$/, "");
  });
  dom.writeForm.addEventListener("submit", confirmWrite);
  document.querySelectorAll("[data-close-write]").forEach((button) => button.addEventListener("click", () => dom.writeDialog.close()));
  dom.writeDialog.addEventListener("click", (event) => { if (event.target === dom.writeDialog) dom.writeDialog.close(); });
  document.querySelector("#humeConfigForm").addEventListener("submit", saveHumeConfiguration);
  document.querySelectorAll("[data-close-hume-config]").forEach((button) => button.addEventListener("click", () => document.querySelector("#humeConfigDialog").close()));
  document.querySelector("#humeConfigDialog").addEventListener("click", (event) => { if (event.target.id === "humeConfigDialog") event.target.close(); });
  const humeChatQaPanel = document.querySelector("#humeChatQaPanel");
  if (humeChatQaPanel && new URLSearchParams(window.location.search).get("humeChatQA") === "1") humeChatQaPanel.hidden = false;
  document.querySelector("#humeChatQaForm")?.addEventListener("submit", sendHumeChatQaTurn);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeResponsivePanels();
  });
}

// Action-led Product Studio views. These override the earlier lifecycle prototype
// while intentionally reusing the eligibility simulation runtime below it.
function materialIcon(name) {
  return `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
}

function renderHome() {
  const { notebook, sources, notes, loading } = state.openNotebook;
  if (loading) return `<div class="product-page"><div class="loading-state"><span></span><strong>Connecting to Open Notebook…</strong><p>Loading the product baseline and grounded sources.</p></div></div>`;
  const notebookName = notebook?.name || notebook?.title || "BlueOrigin Product Baseline";
  if (state.role === "learner") return `<div class="product-page home-page">
    <section class="home-heading"><div><span class="page-kicker">Learner workspace</span><h2>Ready for your next case?</h2><p>Practice eligibility work with a simulated client, screen coaching, and feedback grounded in approved sources.</p></div>${liveStatusMarkup()}</section>
    <section class="assignment-hero lighthouse-home-hero"><div>${materialIcon("school")}<span>Continue learning</span><h3>Verification and Evidence</h3><p>Review the field guide, complete the knowledge check, and continue your Blue Origin Academy path.</p><button class="button button-primary" data-view-link="my-learning">Open My Learning</button></div><dl><div><dt>Progress</dt><dd>50% complete</dd></div><div><dt>Path</dt><dd>Verification</dd></div><div><dt>Due</dt><dd>Aug 8</dd></div></dl></section>
    <section class="assignment-hero"><div>${materialIcon("headset_mic")}<span>Due next</span><h3>${escapeHTML(state.assignments[0].title)}</h3><p>Continue the combined-program application with live captions and action evaluation.</p><button class="button button-primary" data-action="start-assignment" data-scenario="0">Continue simulation</button></div><dl><div><dt>Progress</dt><dd>2 of 9 screens</dd></div><div><dt>Mode</dt><dd>Practice</dd></div><div><dt>Package</dt><dd>${state.assignments[0].package}</dd></div></dl></section>
    <div class="section-bar"><div><h3>My assignments</h3><span>${state.assignments.length} active</span></div><button class="view-button" data-view-link="assignments">View all</button></div>
    <section class="compact-grid">${state.assignments.map((item, index) => `<article class="compact-card"><span class="card-icon slate">${materialIcon("assignment")}</span><div><strong>${escapeHTML(item.title)}</strong><small>Due ${item.due} · ${item.package}</small></div><span class="status-chip ${index ? "neutral" : "orange"}">${item.status}</span><button class="row-action" data-action="start-assignment" data-scenario="${index ? 4 : 0}">Open</button></article>`).join("")}</section>
    <div class="section-bar"><div><h3>Explore knowledge</h3><span>Grounded answers with citations</span></div><button class="view-button" data-view-link="search">Ask & Search</button></div>
  </div>`;
  return `<div class="product-page home-page">
    <section class="home-heading"><div><span class="page-kicker">Author workspace</span><h2>What do you want to do?</h2><p>Start with trusted knowledge, turn it into a learning experience, and test it through simulation.</p></div>${liveStatusMarkup()}</section>
    <section class="action-grid" aria-label="Primary actions">
      <button class="action-card knowledge" data-view-link="sources"><span class="card-icon">${materialIcon("library_add")}</span><small>Knowledge</small><strong>Add knowledge</strong><p>Bring in policy, PDFs, links, screen evidence, raw text, or transcripts.</p><span class="action-link">Add or select sources ${materialIcon("arrow_forward")}</span></button>
      <button class="action-card create" data-view-link="video"><span class="card-icon">${materialIcon("auto_awesome")}</span><small>Create</small><strong>Create content</strong><p>Generate an editable video, quiz, or simulation grounded in selected sources.</p><span class="action-link">Choose a format ${materialIcon("arrow_forward")}</span></button>
      <button class="action-card simulate" data-view-link="scenario-library"><span class="card-icon">${materialIcon("play_circle")}</span><small>Simulate</small><strong>Start simulation</strong><p>Run a frozen scenario with action capture, voice, captions, and evaluation.</p><span class="action-link">Open scenario library ${materialIcon("arrow_forward")}</span></button>
      <button class="action-card lighthouse" data-view-link="lighthouse-builder"><span class="card-icon">${materialIcon("school")}</span><small>Learn</small><strong>Build a module</strong><p>Assemble videos, quizzes, simulations, decks, and guidance into a measurable learning experience.</p><span class="action-link">Open module builder ${materialIcon("arrow_forward")}</span></button>
    </section>
    <div class="section-bar"><div><h3>Continue working</h3><span>Recently opened across the studio</span></div><button class="view-button" data-view-link="notebooks">View all</button></div>
    <section class="recent-grid">
      <button class="recent-card featured" data-view-link="notebooks"><span class="card-icon slate">${materialIcon("menu_book")}</span><div><strong>${escapeHTML(notebookName)}</strong><small>Notebook · ${sources.length} sources · ${notes.length} notes</small></div><span class="status-chip">Open Notebook</span></button>
      <button class="recent-card" data-view-link="simulation-builder"><span class="card-icon orange">${materialIcon("smart_toy")}</span><div><strong>Combined initial application</strong><small>Simulation · Draft · Medicaid, SNAP, TANF</small></div><span class="status-chip orange">Continue</span></button>
      <button class="recent-card" data-view-link="quiz"><span class="card-icon slate">${materialIcon("quiz")}</span><div><strong>Verification fundamentals</strong><small>Quiz · 5 questions · Grounded draft</small></div><span class="status-chip neutral">Draft</span></button>
    </section>
    <div class="section-bar"><div><h3>Recent knowledge</h3><span>${sources.length} grounded sources</span></div><button class="view-button" data-view-link="sources">Browse sources</button></div>
    <section class="knowledge-list">${sources.slice(0, 4).map((source) => `<article><span class="card-icon">${materialIcon("description")}</span><div><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(shortId(recordId(source)))} · ${escapeHTML(source.status || "ready")}</small></div><button class="row-action" data-view-link="sources">Open</button></article>`).join("")}</section>
  </div>`;
}

function renderSourcesView() {
  const sources = state.openNotebook.sources;
  return `<div class="product-page"><section class="list-heading"><div><span class="page-kicker">Knowledge</span><h2>Sources</h2><p>Policy and supporting evidence that can ground every created experience.</p></div><div class="heading-actions"><label class="search-control">${materialIcon("search")}<input id="sourceSearch" placeholder="Search sources…" /></label><button class="button button-primary" data-action="add-source">${materialIcon("add")} Add source</button></div></section>
    <div class="source-type-strip"><button class="active">All <span>${sources.length}</span></button><button>Policy</button><button>Product</button><button>Screen evidence</button><button>Transcripts</button></div>
    <section class="source-table">${sources.map((source) => { const id = recordId(source); return `<article data-source-row data-title="${escapeHTML(sourceTitle(source).toLowerCase())}"><span class="card-icon">${materialIcon("description")}</span><div class="source-main"><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(shortId(id))} · ${topicList(source, ["eligibility"]).map(escapeHTML).join(" · ")}</small></div><span class="status-chip">${escapeHTML(source.status || "ready")}</span><div class="source-create"><span>Create:</span><button data-create-from-source="${escapeHTML(id)}" data-output="video">Video</button><button data-create-from-source="${escapeHTML(id)}" data-output="quiz">Quiz</button><button data-create-from-source="${escapeHTML(id)}" data-output="simulation">Simulation</button></div></article>`; }).join("") || '<div class="empty-state">No sources yet. Add policy or supporting material to begin.</div>'}</section></div>`;
}

function renderNotebooksView() {
  return `<div class="product-page"><div class="empty-state"><strong>Notebook workspace is loading.</strong><p>Use the server-backed Notebooks destination to create or open governed work.</p></div></div>`;
}

function renderSearchView() {
  const query = state.searchQuery;
  return `<div class="product-page search-page"><section class="search-hero"><span class="page-kicker">Ask & Search</span><h2>Ask the product baseline.</h2><p>Answers stay grounded in the selected notebook and display the exact sources used.</p><form id="knowledgeSearchForm"><label>${materialIcon("search")}<input id="knowledgeSearchInput" value="${escapeHTML(query)}" placeholder="Ask about Medicaid, SNAP, TANF, screens, or evaluation…" /><button class="button button-primary">Ask</button></label></form></section>${query ? `<section class="answer-card"><div class="answer-heading"><span class="card-icon slate">${materialIcon("auto_awesome")}</span><div><small>Grounded answer</small><strong>${escapeHTML(query)}</strong></div></div><p>Formal correctness is deterministic. Every meaningful screen action is compared with the frozen case facts, required evidence, valid sequence, calculation interpretation, notice, and final action. Practice mode provides immediate cited feedback; assessment mode reveals results after submission.</p><div class="citation-list"><button>${shortId(SPEC_NOTE_ID)} · Screen evaluation model</button><button>${shortId(sourceIds.qc)} · Verification requirements</button></div></section>` : `<section class="search-suggestions"><h3>Try asking</h3>${["What evidence is required before validating income?", "How does practice mode differ from assessment?", "Which facts trigger SNAP expedited screening?"].map((item) => `<button data-search-suggestion="${escapeHTML(item)}">${materialIcon("north_east")} ${escapeHTML(item)}</button>`).join("")}</section>`}</div>`;
}

function creatorLabel(type) {
  return type === "video" ? "Video" : type === "quiz" ? "Quiz" : "Simulation";
}

function renderCreatorSteps(type, draft) {
  const active = draft ? (draft.status === "published" ? 4 : draft.status === "in_review" ? 3 : 2) : state.creatorStep[type];
  return `<ol class="creator-steps">${["Sources", "Configure", "Review", "Publish"].map((label, index) => `<li class="${index + 1 === active ? "active" : ""} ${index + 1 < active ? "complete" : ""}"><span>${index + 1}</span>${label}</li>`).join("")}</ol>`;
}

function renderSourceSelector(type) {
  return `<section class="creator-grid"><article class="selection-panel"><div class="panel-title"><div><span>Step 1</span><h3>Choose grounded sources</h3></div><strong>${state.selectedSourceIds.size} selected</strong></div><div class="selection-list">${state.openNotebook.sources.map((source) => { const id = recordId(source); return `<label class="selection-row"><input type="checkbox" data-select-source="${escapeHTML(id)}" ${state.selectedSourceIds.has(id) ? "checked" : ""}/><span><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(shortId(id))}</small></span></label>`; }).join("")}</div></article><aside class="grounding-panel"><span class="card-icon orange">${materialIcon(type === "video" ? "movie" : type === "quiz" ? "quiz" : "smart_toy")}</span><small>Create ${creatorLabel(type)}</small><h3>Information must lead to action.</h3><p>Select the policy and product evidence that should control this ${type}. Every generated section keeps its source lineage.</p><div class="grounding-count"><strong>${state.selectedSourceIds.size}</strong><span>explicit source ID${state.selectedSourceIds.size === 1 ? "" : "s"}</span></div><button class="button button-primary" data-action="continue-${type}" ${state.selectedSourceIds.size ? "" : "disabled"}>Continue to configure</button></aside></section>`;
}

function renderVideoDraft(draft) {
  return `<section class="draft-workspace"><article class="draft-editor"><div class="draft-toolbar"><div><span class="status-chip ${draft.status === "published" ? "orange" : ""}">${draft.status.replace("_", " ")}</span><small>${escapeHTML(shortId(draft.creation_id))}</small></div><div>${draft.status === "published" ? '<button class="button button-secondary" data-action="add-to-lighthouse" data-creation-type="video">Add to Lighthouse</button>' : ""}<button class="button button-secondary" data-action="save-video">Save to notebook</button><button class="button button-secondary" data-action="review-video">Review</button><button class="button button-primary" data-action="publish-video">Publish</button></div></div><label class="editor-title">Title<input data-draft-field="title" data-draft-type="video" value="${escapeHTML(draft.title)}" /></label><div class="objective-list"><h3>Learning objectives</h3>${draft.objectives.map((item) => `<p>${materialIcon("check_circle")} ${escapeHTML(item)}</p>`).join("")}</div><h3>Storyboard</h3><div class="storyboard">${draft.scenes.map((scene, index) => `<article><div class="scene-preview"><span>${String(index + 1).padStart(2, "0")}</span>${materialIcon(scene.icon)}</div><div><small>${scene.duration}</small><strong>${escapeHTML(scene.title)}</strong><label>Narration<textarea data-scene-index="${index}">${escapeHTML(scene.narration)}</textarea></label><p><b>Visual:</b> ${escapeHTML(scene.visual)}</p><span class="citation-chip">${escapeHTML(shortId(draft.citations[index % draft.citations.length]))}</span></div></article>`).join("")}</div></article><aside class="preview-panel"><span class="page-kicker">Preview</span><div class="video-frame">${materialIcon("play_arrow")}<span>02:18</span></div><h3>${escapeHTML(draft.title)}</h3><p>Storyboard preview with captions. Actual MP4 rendering is outside this prototype phase.</p><div class="caption-preview">“Verify the supported monthly amount before calculating eligibility.”</div></aside></section>`;
}

function renderQuizDraft(draft) {
  return `<section class="draft-workspace"><article class="draft-editor"><div class="draft-toolbar"><div><span class="status-chip ${draft.status === "published" ? "orange" : ""}">${draft.status.replace("_", " ")}</span><small>${escapeHTML(shortId(draft.creation_id))}</small></div><div>${draft.status === "published" ? '<button class="button button-secondary" data-action="add-to-lighthouse" data-creation-type="quiz">Add to Lighthouse</button>' : ""}<button class="button button-secondary" data-action="save-quiz">Save to notebook</button><button class="button button-secondary" data-action="review-quiz">Review</button><button class="button button-primary" data-action="publish-quiz">Publish</button></div></div><label class="editor-title">Title<input data-draft-field="title" data-draft-type="quiz" value="${escapeHTML(draft.title)}" /></label><div class="question-editor">${draft.questions.map((question, index) => `<article><span>Question ${index + 1}</span><strong>${escapeHTML(question.prompt)}</strong><div class="answer-options">${question.options.map((option, optionIndex) => `<label><input type="radio" name="quiz-${index}" data-quiz-answer="${index}" value="${optionIndex}" ${String(state.quizAnswers[index]) === String(optionIndex) ? "checked" : ""}/><span>${escapeHTML(option)}</span></label>`).join("")}</div>${state.quizSubmitted ? `<div class="quiz-feedback ${Number(state.quizAnswers[index]) === question.answer ? "correct" : "incorrect"}"><strong>${Number(state.quizAnswers[index]) === question.answer ? "Correct" : `Correct answer: ${question.options[question.answer]}`}</strong><p>${escapeHTML(question.explanation)}</p><small>${escapeHTML(shortId(question.citation))}</small></div>` : ""}</article>`).join("")}</div><button class="button button-primary" data-action="submit-quiz">Check answers</button></article><aside class="preview-panel score-panel"><span class="page-kicker">Learner preview</span><strong>${state.quizSubmitted ? `${draft.questions.filter((question, index) => Number(state.quizAnswers[index]) === question.answer).length}/${draft.questions.length}` : draft.questions.length}</strong><h3>${state.quizSubmitted ? "Questions correct" : "Grounded questions"}</h3><p>Each answer includes a cited explanation and deterministic scoring.</p></aside></section>`;
}

function renderSimulationDraft(draft) {
  return `<section class="draft-workspace"><article class="draft-editor"><div class="draft-toolbar"><div><span class="status-chip ${draft.status === "published" ? "orange" : ""}">${draft.status.replace("_", " ")}</span><small>${escapeHTML(shortId(draft.creation_id))}</small></div><div>${draft.status === "published" ? '<button class="button button-secondary" data-action="add-to-lighthouse" data-creation-type="simulation">Add to Lighthouse</button>' : ""}<button class="button button-secondary" data-action="save-simulation">Save to notebook</button><button class="button button-secondary" data-action="review-simulation">Review</button><button class="button button-primary" data-action="publish-simulation">Publish</button></div></div><label class="editor-title">Title<input data-draft-field="title" data-draft-type="simulation" value="${escapeHTML(draft.title)}" /></label><section class="package-summary"><article><span>Starting state</span><strong>Hybrid case</strong><p>Prefilled provenance plus missing, changed, and unverified facts.</p></article><article><span>Screens</span><strong>9 stages</strong><p>Household through call closure and authorization.</p></article><article><span>Evaluator</span><strong>Deterministic</strong><p>Values, evidence, sequence, interpretation, and final action.</p></article><article><span>Voice + capture</span><strong>Live captions</strong><p>Voice turns and event snapshots persist; raw audio is transient.</p></article></section><div class="schema-list"><div><span>source_ids</span><strong>${draft.source_ids.length}</strong></div><div><span>semantic_targets</span><strong>${draft.semantic_screen_targets.length}</strong></div><div><span>workflow_alternatives</span><strong>${draft.valid_workflow_alternatives.length}</strong></div><div><span>visibility_policies</span><strong>${Object.keys(draft.attempt_visibility_policies).length}</strong></div><div><span>voice_disclosure_rules</span><strong>${draft.voice_disclosure_rules.length}</strong></div><div><span>snapshot_triggers</span><strong>${draft.snapshot_capture_policy.length}</strong></div></div></article><aside class="preview-panel package-panel"><span class="page-kicker">${draft.status === "published" ? "Frozen package" : "Package preview"}</span><span class="card-icon orange">${materialIcon("smart_toy")}</span><h3>${escapeHTML(draft.title)}</h3><p>The runtime uses this immutable package. Midscene observes and locates controls but cannot score or enter data.</p>${draft.status === "published" ? `<dl><div><dt>Package</dt><dd>${escapeHTML(shortId(draft.simulation_package_id))}</dd></div><div><dt>Version</dt><dd>${draft.simulation_package_version}</dd></div></dl><button class="button button-secondary" data-action="add-to-lighthouse" data-creation-type="simulation">Add to Lighthouse</button><button class="button button-primary" data-action="run-simulation">Run simulation</button><button class="button button-secondary" data-action="assign-simulation">Assign to learner</button>` : `<button class="button button-secondary" data-action="review-simulation">Review package</button>`}</aside></section>`;
}

function renderSpecificationNotePicker() {
  const notes = state.openNotebook.notes.slice(0, 5);
  return `<fieldset class="spec-note-picker"><legend>Specification notes</legend><p>Select the approved product notes that should shape the output.</p>${notes.map((note) => { const id = recordId(note); return `<label><input type="checkbox" data-select-note="${escapeHTML(id)}" ${state.selectedNoteIds.has(id) ? "checked" : ""}/><span><strong>${escapeHTML(note.title || note.name || "Specification note")}</strong><small>${escapeHTML(shortId(id))}</small></span></label>`; }).join("") || '<div class="empty-state">No specification notes are available.</div>'}</fieldset>`;
}

function renderCreator(type) {
  const draft = state.creationDrafts[type];
  const descriptions = { video: "Build a cited script and scene-by-scene storyboard.", quiz: "Create playable questions with answer keys and cited explanations.", simulation: "Compile a frozen case package with screens, voice, and deterministic evaluation." };
  let body = renderSourceSelector(type);
  if (!draft && state.creatorStep[type] === 2) body = `<section class="configure-card"><div><span class="page-kicker">Step 2 · Configure</span><h3>Set the learning intent.</h3><p>These choices shape the grounded draft. You can edit everything after generation.</p></div><div class="configure-fields"><label>Working title<input id="creatorTitle" value="${type === "video" ? "Processing a combined eligibility application" : type === "quiz" ? "Verification and evidence fundamentals" : "Combined Medicaid, SNAP & TANF initial application"}" /></label><label>Audience<select><option>Eligibility workers in training</option><option>Experienced eligibility workers</option><option>Supervisors and reviewers</option></select></label><label>Mode<select>${type === "simulation" ? '<option>Practice with immediate coaching</option><option>Assessment with delayed feedback</option>' : '<option>Guided learning</option><option>Knowledge check</option>'}</select></label><label>Length<select><option>${type === "video" ? "2–3 minutes" : type === "quiz" ? "5 questions" : "20–30 minutes"}</option></select></label></div><div class="configure-actions"><button class="button button-secondary" data-action="back-${type}">Back</button><button class="button button-primary" data-action="generate-${type}">${materialIcon("auto_awesome")} Generate grounded draft</button></div></section>`;
  if (!draft && state.creatorStep[type] === 2) body = body.replace('<div class="configure-actions">', `${renderSpecificationNotePicker()}<div class="configure-actions">`);
  if (draft) body = type === "video" ? renderVideoDraft(draft) : type === "quiz" ? renderQuizDraft(draft) : renderSimulationDraft(draft);
  return `<div class="product-page creator-page"><section class="creator-heading"><div><span class="page-kicker">Create</span><h2>${creatorLabel(type)}</h2><p>${descriptions[type]}</p></div><span class="security-pill">Grounded in ${state.selectedSourceIds.size} source${state.selectedSourceIds.size === 1 ? "" : "s"}</span></section>${renderCreatorSteps(type, draft)}${body}</div>`;
}

function renderScenarioLibraryView() {
  return `<div class="product-page"><section class="list-heading"><div><span class="page-kicker">Simulate</span><h2>Scenario Library</h2><p>Published, frozen packages for Medicaid, SNAP, and TANF practice.</p></div><div class="heading-actions"><label class="search-control">${materialIcon("search")}<input placeholder="Search scenarios…" /></label>${state.role === "author" ? '<button class="button button-primary" data-view-link="simulation-builder">Create simulation</button>' : ""}</div></section><section class="scenario-product-grid">${scenarios.map((scenario, index) => scenario.authoring?.previewOnly ? "" : `<article><div class="scenario-top"><span>${scenario.number}</span><span class="status-chip">Published</span></div><small>${escapeHTML(scenario.type)}</small><h3>${escapeHTML(scenario.shortTitle)}</h3><p>${escapeHTML(scenario.description)}</p><div class="program-tags">${scenario.programs.map((program) => `<span>${program}</span>`).join("")}</div><div class="scenario-footer"><span>${scenario.id} · v0.1</span><button class="button button-primary" data-action="start-assignment" data-scenario="${index}">Start</button></div></article>`).join("")}</section></div>`;
}

function renderAssignmentsView() {
  return `<div class="product-page"><section class="list-heading"><div><span class="page-kicker">Simulate</span><h2>${state.role === "author" ? "Assignments" : "My assignments"}</h2><p>${state.role === "author" ? "Publish frozen packages to learners and follow completion." : "Complete assigned cases and review your feedback."}</p></div>${state.role === "author" ? '<button class="button button-primary" data-view-link="scenario-library">Assign scenario</button>' : ""}</section><section class="assignment-table"><header><span>Assignment</span><span>Package</span><span>Due</span><span>Status</span><span></span></header>${state.assignments.map((item, index) => `<article><div><span class="card-icon slate">${materialIcon("assignment")}</span><strong>${escapeHTML(item.title)}</strong></div><span>${item.package}</span><span>${item.due}</span><span class="status-chip ${item.status === "Not started" ? "neutral" : "orange"}">${item.status}</span><button class="row-action" data-action="start-assignment" data-scenario="${index ? 4 : 0}">${state.role === "author" ? "Preview" : "Open"}</button></article>`).join("")}</section></div>`;
}

function renderAttemptsView() {
  const attempt = state.latestAttempt;
  const events = attempt?.events || state.events;
  const snapshots = attempt?.screen_snapshots || state.screenSnapshots;
  const voiceTurns = attempt?.voice_turns || state.voiceTurns;
  const history = state.repositoryHistory;
  const profile = state.learnerProfile;
  const scores = history.filter((item) => Number.isFinite(Number(item.score))).slice().reverse();
  const maxScore = Math.max(100, ...scores.map((item) => Number(item.score)));
  return `<div class="product-page progress-page"><section class="list-heading"><div><span class="page-kicker">Demo learner</span><h2>My Progress</h2><p>Durable attempt history, skill trends, and targeted practice for the protected BlueOrigin demo learner.</p></div><button class="button button-secondary" data-action="refresh-progress">Refresh</button></section>
    ${state.performanceError ? `<div class="progress-sync-notice"><span>${materialIcon("cloud_off")}</span><div><strong>Repository unavailable</strong><p>${escapeHTML(state.performanceError)} Local attempts remain queued and will retry automatically.</p></div></div>` : ""}
    <section class="result-summary-grid"><article><span>Latest score</span><strong>${attempt ? `${attempt.score}%` : history[0]?.score != null ? `${history[0].score}%` : "—"}</strong><small>${attempt ? `${attempt.mode} · ${attempt.critical_errors} critical errors` : "Complete an attempt"}</small></article><article><span>Stored attempts</span><strong>${history.length}</strong><small>Retries remain separate records</small></article><article><span>Demonstrated strengths</span><strong>${profile.strengths?.length || 0}</strong><small>Rolling criterion proficiency ≥ 80</small></article><article><span>Current priorities</span><strong>${profile.gaps?.length || 0}</strong><small>Lowest rolling skill areas</small></article></section>
    <section class="progress-grid"><article class="progress-panel"><div class="panel-title"><div><span>Score history</span><h3>Processing and interview trend</h3></div><strong>${scores.length} scored</strong></div><div class="trend-chart" aria-label="Attempt score trend">${scores.map((item) => `<div class="trend-column"><div><i class="processing" style="height:${Number(item.processing_score || 0) / 60 * 100}%" title="Processing ${item.processing_score}/60"></i><i class="interview" style="height:${Number(item.interview_score || 0) / 40 * 100}%" title="Interview ${item.interview_score}/40"></i></div><strong>${item.score}</strong><small>${new Date(item.created_at).toLocaleDateString([], { month:"short", day:"numeric" })}</small></div>`).join("") || '<div class="empty-state">Scores will appear after the first synchronized attempt.</div>'}</div></article>
    <article class="progress-panel"><div class="panel-title"><div><span>Skill profile</span><h3>Strengths and gaps</h3></div></div><div class="skill-profile-list">${(profile.skills || []).map((skill) => `<div><span><strong>${escapeHTML(skill.label)}</strong><small>${escapeHTML(skill.category)} · ${escapeHTML(skill.trend)}</small></span><div><i style="width:${skill.proficiency}%"></i></div><b>${skill.proficiency}%</b></div>`).join("") || '<div class="empty-state">Skill proficiency will build across attempts.</div>'}</div></article></section>
    <section class="progress-grid"><article class="progress-panel"><div class="panel-title"><div><span>Recent attempts</span><h3>Feedback history</h3></div></div><div class="attempt-history-list">${history.map((item) => `<button type="button" data-history-attempt="${escapeHTML(item.attempt_id)}"><span class="card-icon slate">${materialIcon("assignment_turned_in")}</span><span><strong>${escapeHTML(item.scenario_id)}</strong><small>${new Date(item.created_at).toLocaleString()} · ${escapeHTML(item.mode)}</small></span><b>${item.score == null ? "Saved" : `${item.score}%`}</b><em class="status-chip ${item.sync_status === "complete" ? "" : "neutral"}">${escapeHTML(item.sync_status)}</em></button>`).join("") || '<div class="empty-state">No synchronized attempts yet.</div>'}</div></article>
    <article class="progress-panel"><div class="panel-title"><div><span>Recommended practice</span><h3>What to do next</h3></div></div><div class="recommendation-list">${(profile.recommendations || []).map((item) => `<article><span>${item.priority}</span><div><strong>${escapeHTML(item.rationale)}</strong><small>${escapeHTML(item.scenario_id)} · ${escapeHTML(item.caller_profile_id)}</small></div><button class="row-action" data-action="run-simulation">Practice</button></article>`).join("") || '<div class="empty-state">Recommendations will appear after synchronized scoring.</div>'}</div></article></section>
    ${attempt ? `<section class="event-ledger"><div class="panel-title"><div><span>Latest local attempt</span><h3>Synchronized activity</h3></div><strong>${events.length} events · ${snapshots.length} frames · ${voiceTurns.length} turns</strong></div>${events.slice(0, 8).map((event) => `<article><time>${event.time}</time><span class="status-chip neutral">${event.channel}</span><div><strong>${escapeHTML(event.label)}</strong><small>${escapeHTML(event.target || "system")}</small></div><span>${event.correct === false ? "Review" : "Recorded"}</span></article>`).join("")}</section>` : ""}</div>`;
}

async function loadDemoPerformance() {
  state.performanceLoading = true;
  syncAttemptOutbox().catch(() => {});
  try {
    const [historyResponse, profileResponse] = await Promise.all([fetch("/api/performance/demo/history"), fetch("/api/performance/demo/profile")]);
    if (!historyResponse.ok || !profileResponse.ok) throw new Error("Neon performance repository is not connected on this deployment.");
    const history = await historyResponse.json(); const profile = await profileResponse.json();
    state.repositoryHistory = history.attempts || []; state.learnerProfile = profile; state.performanceError = null;
  } catch (error) { state.performanceError = error.message; }
  finally { state.performanceLoading = false; if (state.route === "attempts") renderProductView(); }
}

function renderTemplatesView() {
  return `<div class="product-page"><section class="list-heading"><div><span class="page-kicker">Manage</span><h2>Templates</h2><p>Reusable grounded structures for learning content and eligibility practice.</p></div><button class="button button-primary">New template</button></section><section class="template-grid">${[["Video storyboard", "movie", "Objectives, scenes, narration, captions"], ["Knowledge check", "quiz", "Questions, scoring, cited explanations"], ["Eligibility simulation", "smart_toy", "Persona, screens, evaluator, voice"]].map(([title, icon, text]) => `<article><span class="card-icon slate">${materialIcon(icon)}</span><h3>${title}</h3><p>${text}</p><span class="status-chip">System template</span></article>`).join("")}</section></div>`;
}

function renderSettingsView() {
  return `<div class="product-page"><section class="list-heading"><div><span class="page-kicker">Manage</span><h2>Settings</h2><p>Workspace controls and local integration status.</p></div></section><section class="settings-list"><article><div><strong>Open Notebook connection</strong><p>${state.openNotebook.live ? "Connected to the local BlueOrigin Product Baseline." : "Using the cached product baseline."}</p></div><span class="status-chip ${state.openNotebook.live ? "orange" : "neutral"}">${state.openNotebook.live ? "Connected" : "Cached"}</span></article><article><div><strong>Write approvals</strong><p>Creates and updates require explicit confirmation.</p></div><span class="status-chip">Required</span></article><article><div><strong>Library document management</strong><p>Authors can archive documents or permanently delete unreferenced Library records after confirmation.</p></div><span class="status-chip">Available</span></article><article><div><strong>Raw audio</strong><p>Audio remains transient; only captions and voice-turn metadata persist.</p></div><span class="status-chip">Transient</span></article></section></div>`;
}

function renderScreenPacksView() {
  const pack = state.uploadedScreenPack || state.screenPack || createDemoScreenPack();
  const selected = pack.screens.find((screen) => screen.workflow_stage_id === state.selectedPackScreen) || pack.screens[0];
  const targets = pack.interaction_targets.filter((target) => target.screen_id === selected.screen_id);
  const isDemo = pack.screen_pack_id === "screen-pack:blueorigin-demo-v1";
  return `<div class="product-page screen-pack-page"><section class="list-heading"><div><span class="page-kicker">Simulate · Screen assets</span><h2>Customer Screen Packs</h2><p>Freeze sanitized screenshots, approved interaction maps, and required transitions with each simulation.</p></div><div class="heading-actions"><span class="status-chip ${pack.status === "frozen" ? "orange" : "neutral"}">${escapeHTML(pack.status)}</span><button class="button button-primary" data-action="validate-screen-pack">Validate screenshot pack</button></div></section>
    <div class="pack-callout"><span class="material-symbols-rounded">info</span><div><strong>${isDemo ? "A synthetic screen pack is ready for the demonstration." : "Customer screenshot draft"}</strong><p>${isDemo ? "It is MI Bridges-informed only at the level of public-benefits workflow structure. It does not copy Michigan branding or represent a real worker system. Replace it later with sanitized, customer-approved screenshots." : "Confirm sanitization, map all required targets, validate every scenario path, then freeze the pack."}</p></div></div>
    <section class="screen-pack-layout"><article class="pack-list-panel"><header class="pack-list-header"><div><h3>${escapeHTML(pack.customer_label)}</h3><p>${escapeHTML(pack.version)} · ${pack.screens.length} screens</p></div><span class="material-symbols-rounded">capture</span></header><div class="screen-pack-list">${pack.screens.map((screen, index) => `<button class="screen-pack-row ${screen.screen_id === selected.screen_id ? "active" : ""}" data-pack-screen="${escapeHTML(screen.workflow_stage_id)}"><span class="pack-thumb">${index + 1}</span><span><strong>${escapeHTML(workflow.find((item) => item.id === screen.workflow_stage_id)?.label || screen.workflow_stage_id)}</strong><small>${escapeHTML(screen.screen_id)}</small></span><span class="pack-stage-count">${pack.interaction_targets.filter((target) => target.screen_id === screen.screen_id).length} targets</span></button>`).join("")}</div><div class="pack-upload"><label><span class="material-symbols-rounded">upload_file</span>Start a customer screenshot draft</label><input type="file" id="screenPackUpload" accept="image/png,image/jpeg,image/webp" multiple/><label style="margin-top:10px"><input type="checkbox" id="sanitizationAttestation" ${pack.sanitization_attestation ? "checked" : ""}/> I attest these screenshots contain no real applicant information.</label></div></article><article class="pack-editor-panel"><header class="pack-editor-header"><div><h3>${escapeHTML(selected.accessible_name)}</h3><p>${isDemo ? "Approved" : "Midscene-proposed"} normalized interaction map</p></div>${targets.every((target) => target.approved) ? '<span class="status-chip">Approved</span>' : '<button class="button button-secondary" data-action="approve-screen-mappings">Approve this screen</button>'}</header><div class="pack-preview-wrap"><div class="pack-preview"><img src="${escapeHTML(selected.image_reference)}" alt="${escapeHTML(selected.accessible_name)}"/>${targets.map((target) => { const [left, top, width, height] = target.normalized_bounds; return `<span class="mapping-marker" style="left:${left * 100}%;top:${top * 100}%;width:${width * 100}%;height:${height * 100}%"><span>${escapeHTML(target.semantic_description)}</span></span>`; }).join("")}</div><dl class="pack-metadata"><div><dt>Screen</dt><dd>${escapeHTML(selected.screen_id)}</dd></div><div><dt>State</dt><dd>${escapeHTML(selected.state_id)}</dd></div><div><dt>Source size</dt><dd>${selected.original_width} × ${selected.original_height}</dd></div><div><dt>Required targets</dt><dd>${selected.required_targets.length}</dd></div></dl><section class="pack-target-list">${targets.map((target) => `<article><div><strong>${escapeHTML(target.semantic_description)}</strong><small>${escapeHTML(target.target_id)}</small></div><span>${escapeHTML(target.control_type)}</span><span>${target.approved ? "Approved" : "Needs review"}</span></article>`).join("") || '<div class="empty-state">No mapped targets for this screen.</div>'}</section></div></article></section></div>`;
}

function importCustomerScreens(fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  const attested = document.querySelector("#sanitizationAttestation")?.checked;
  state.uploadedScreenPack = {
    ...createDemoScreenPack(),
    screen_pack_id: `screen-pack:customer-draft-${Date.now()}`,
    customer_label: "Customer screenshot draft",
    version: "draft",
    status: "draft",
    source_system_label: "Customer-provided sanitized eligibility screens",
    sanitization_attestation: Boolean(attested),
    screens: files.slice(0, workflow.length).map((file, index) => ({ screen_id: `screen:customer-${workflow[index].id}`, workflow_stage_id: workflow[index].id, state_id: `${workflow[index].id}:default`, image_reference: URL.createObjectURL(file), original_width: "pending", original_height: "pending", accessible_name: `${workflow[index].label} customer screenshot`, variant_of: null, required_targets: (demoTargetMap[workflow[index].id] || []).map((target) => target.target_id) })),
  };
  state.uploadedScreenPack.interaction_targets = state.uploadedScreenPack.screens.flatMap((screen) => (demoTargetMap[screen.workflow_stage_id] || []).map((target) => ({ ...target, screen_id: screen.screen_id, approved: false, proposal_source: "midscene_semantic_mapping_proposal" })));
  state.selectedPackScreen = workflow[0].id;
  renderProductView();
  showToast("Screenshot draft created", `${files.length} sanitized asset${files.length === 1 ? "" : "s"} loaded locally. Review each proposed mapping before validation.`);
}

function productHeader(view) {
  const config = productRoutes[view] || productRoutes.home;
  dom.scenarioTitle.textContent = config.title;
  dom.caseId.textContent = state.role === "author" ? "Author workspace" : "Learner workspace";
  document.querySelector(".synthetic-badge").textContent = config.label;
  dom.programStrip.innerHTML = "";
}

function renderProductView() {
  if (state.route === "simulations") return;
  productHeader(state.route);
  if (window.BlueOriginLighthouse?.routes.has(state.route)) {
    const context = {
      role: state.role,
      navigate: setProductView,
      rerender: renderProductView,
      showToast,
      launchSimulation: (moduleId, blockId, scenarioIndex) => {
        state.lighthouseReturn = { moduleId, blockId };
        selectScenario(scenarioIndex);
        setProductView("simulations");
      },
    };
    dom.screenContent.innerHTML = window.BlueOriginLighthouse.render(state.route, context);
    bindProductViewEvents();
    window.BlueOriginLighthouse.bind(dom.screenContent, context);
    return;
  }
  const renderers = { home: renderHome, sources: renderSourcesView, notebooks: renderNotebooksView, search: renderSearchView, video: () => renderCreator("video"), quiz: () => renderCreator("quiz"), "simulation-builder": () => renderCreator("simulation"), "scenario-library": renderScenarioLibraryView, "screen-packs": renderScreenPacksView, assignments: renderAssignmentsView, attempts: renderAttemptsView, templates: renderTemplatesView, settings: renderSettingsView };
  dom.screenContent.innerHTML = (renderers[state.route] || renderHome)();
  bindProductViewEvents();
}

function setProductView(view) {
  if (state.role === "learner" && ["video", "quiz", "simulation-builder", "templates", "settings", "lighthouse-builder", "lighthouse-manage"].includes(view)) view = "home";
  state.route = view;
  document.querySelectorAll("[data-view]").forEach((button) => {
    const lighthouseNav = ["lighthouse", "lighthouse-path", "lighthouse-player"].includes(view) ? "lighthouse" : view === "lighthouse-builder" ? "lighthouse-manage" : view;
    const active = button.dataset.view === lighthouseNav || (view === "simulations" && button.dataset.view === "scenario-library");
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  if (view === "simulations") {
    dom.appShell.classList.remove("product-view");
    hydrateScenario();
    addEvent("navigation", "Opened frozen-package simulation runtime", { target: `package:${getScenario().id}` });
  } else {
    dom.appShell.classList.add("product-view");
    closeResponsivePanels();
    renderProductView();
    if (view === "attempts") loadDemoPerformance();
  }
  document.querySelector("#studioSidebar")?.classList.remove("open");
}

function bindProductViewEvents() {
  dom.screenContent.querySelectorAll("[data-view-link]").forEach((button) => button.addEventListener("click", () => setProductView(button.dataset.viewLink)));
  dom.screenContent.querySelectorAll("input[data-select-source]").forEach((input) => input.addEventListener("change", () => { input.checked ? state.selectedSourceIds.add(input.dataset.selectSource) : state.selectedSourceIds.delete(input.dataset.selectSource); renderProductView(); }));
  dom.screenContent.querySelectorAll("input[data-select-note]").forEach((input) => input.addEventListener("change", () => { input.checked ? state.selectedNoteIds.add(input.dataset.selectNote) : state.selectedNoteIds.delete(input.dataset.selectNote); }));
  dom.screenContent.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleProductAction(button.dataset.action, button)));
  dom.screenContent.querySelectorAll("[data-create-from-source]").forEach((button) => button.addEventListener("click", () => { state.selectedSourceIds = new Set([button.dataset.createFromSource]); state.creatorStep[button.dataset.output] = 2; setProductView(button.dataset.output === "simulation" ? "simulation-builder" : button.dataset.output); }));
  dom.screenContent.querySelectorAll("[data-draft-field]").forEach((input) => input.addEventListener("change", () => { state.creationDrafts[input.dataset.draftType][input.dataset.draftField] = input.value; }));
  dom.screenContent.querySelectorAll("[data-scene-index]").forEach((input) => input.addEventListener("change", () => { state.creationDrafts.video.scenes[Number(input.dataset.sceneIndex)].narration = input.value; }));
  dom.screenContent.querySelectorAll("[data-quiz-answer]").forEach((input) => input.addEventListener("change", () => { state.quizAnswers[input.dataset.quizAnswer] = Number(input.value); }));
  document.querySelector("#sourceSearch")?.addEventListener("input", (event) => { dom.screenContent.querySelectorAll("[data-source-row]").forEach((row) => { row.hidden = !row.dataset.title.includes(event.target.value.toLowerCase()); }); });
  document.querySelector("#knowledgeSearchForm")?.addEventListener("submit", (event) => { event.preventDefault(); state.searchQuery = document.querySelector("#knowledgeSearchInput").value.trim(); renderProductView(); });
  dom.screenContent.querySelectorAll("[data-search-suggestion]").forEach((button) => button.addEventListener("click", () => { state.searchQuery = button.dataset.searchSuggestion; renderProductView(); }));
  dom.screenContent.querySelectorAll("[data-pack-screen]").forEach((button) => button.addEventListener("click", () => { state.selectedPackScreen = button.dataset.packScreen; renderProductView(); }));
  document.querySelector("#screenPackUpload")?.addEventListener("change", (event) => importCustomerScreens(event.target.files));
  dom.screenContent.querySelectorAll("[data-history-attempt]").forEach((button) => button.addEventListener("click", () => {
    const stored = state.repositoryHistory.find((item) => item.attempt_id === button.dataset.historyAttempt)?.feedback;
    if (!stored?.post_call_evaluation) return showToast("Feedback details unavailable", "The summary is stored, but this historical feedback payload is unavailable.", "!");
    state.latestAttempt = stored;
    state.feedbackSelectedEventId = stored.events?.at(-1)?.event_id || null;
    renderFeedbackView(stored);
    updateAttemptSaveStatus("saved");
  }));
}

function makeCreationDraft(type) {
  const title = document.querySelector("#creatorTitle")?.value.trim() || `${creatorLabel(type)} draft`;
  const common = { creation_id: `creation:${type}-${Date.now()}`, type, notebook_id: NOTEBOOK_ID, source_ids: [...state.selectedSourceIds], specification_note_ids: [...state.selectedNoteIds], title, status: "draft", citations: [...state.selectedSourceIds].slice(0, 3) };
  if (type === "video") return { ...common, objectives: ["Identify supported case facts before data entry", "Review evidence in the correct sequence", "Interpret the combined-program result"], scenes: [{ title: "Meet the applicant", duration: "00:24", icon: "person", narration: "Maya is applying for medical, food, and cash assistance after her work hours changed.", visual: "Synthetic client profile and program requests" }, { title: "Review the evidence", duration: "00:42", icon: "fact_check", narration: "Open the wage statement before converting earnings into a monthly amount.", visual: "Eligibility screen with evidence panel" }, { title: "Process the result", duration: "01:12", icon: "task_alt", narration: "Apply deterministic program rules, resolve pending actions, and select the cited notice.", visual: "Program/person/month results and authorization" }], captions: true };
  if (type === "quiz") return { ...common, passing_score: 80, questions: [{ prompt: "What must happen before validating the applicant's monthly income?", options: ["Review the current wage evidence", "Authorize all programs", "Create the denial notice"], answer: 0, explanation: "Evidence must support the value before validation.", citation: sourceIds.qc }, { prompt: "When should assessment feedback be shown?", options: ["After every field", "After submission", "Before the attempt begins"], answer: 1, explanation: "Assessment mode captures silently and reveals evaluation after submission.", citation: SPEC_NOTE_ID }, { prompt: "Can AI override a critical eligibility rule?", options: ["Yes, with a reason", "Only in practice mode", "No"], answer: 2, explanation: "Deterministic rules control formal correctness and pass/fail.", citation: sourceIds.qc }] };
  return {
    ...common,
    simulation_draft_id: `draft:bo-${Date.now()}`,
    scenario_ids: scenarios.map((scenario) => scenario.id),
    screens: workflow.map((item) => item.id),
    case_starting_states: scenarios.map(buildCaseStartingState),
    semantic_screen_targets: Object.values(midsceneTargets),
    valid_workflow_alternatives: ["Interview then enter", "Review evidence then enter", "Disclose, enter, then verify before screen check"],
    voice_disclosure_rules: scenarios.flatMap((scenario) => scenario.facts.map((fact) => ({ scenario_id: scenario.id, fact_id: fact.id, reveal_only_after: fact.prompt, client_cannot_offer_policy_advice: true }))),
    deterministic_evaluation_rules: { owner: "BlueOrigin", expected_actions: 24, evaluation_rules: 18, midscene_may_override: false },
    eligibility_system_id: eligibilitySystemDefinition.system_id,
    eligibility_system_version: eligibilitySystemDefinition.version,
    customer_screen_pack_id: state.screenPack?.screen_pack_id || null,
    customer_screen_pack_version: state.screenPack?.version || null,
    attempt_visibility_policies: attemptVisibilityPolicies,
    snapshot_capture_policy: ["screen_entered", "screen_exited", "material_fact_disclosed", "field_committed", "evidence_reviewed", "calculation_requested", "validation_result", "notice_or_authorization", "hint_requested", "attempt_submitted"],
    voice_enabled: true,
    raw_audio_retained: false,
    continuous_screen_recording: false,
  };
}

function handleProductAction(action, trigger = null) {
  if (action === "open-notebook") return setProductView("notebook");
  if (action === "add-to-lighthouse") {
    const type = trigger?.dataset.creationType;
    const draft = state.creationDrafts[type];
    if (!draft || draft.status !== "published") return showToast("Publish first", "Only published Studio releases can be added to Lighthouse.", "!");
    window.BlueOriginLighthouse?.startFromStudio(type, draft);
    return setProductView("lighthouse-builder");
  }
  if (action === "add-source") return openWriteDialog("source");
  if (action === "add-notebook") return openWriteDialog("notebook");
  if (action === "publish-result") return openWriteDialog("result");
  if (action === "refresh-progress") return loadDemoPerformance();
  if (action === "validate-screen-pack") {
    const pack = state.uploadedScreenPack || state.screenPack;
    const missingStages = workflow.filter((item) => !pack.screens.some((screen) => screen.workflow_stage_id === item.id));
    const pendingMappings = pack.interaction_targets.filter((target) => !target.approved);
    const attested = pack.sanitization_attestation || document.querySelector("#sanitizationAttestation")?.checked;
    if (!attested) return showToast("Sanitization attestation required", "Confirm that no real applicant information appears in the screenshots.", "!");
    if (missingStages.length) return showToast("Screen pack incomplete", `${missingStages.length} required workflow stage${missingStages.length === 1 ? " is" : "s are"} missing.`, "!");
    if (pendingMappings.length) return showToast("Mapping review required", `${pendingMappings.length} Midscene-proposed target${pendingMappings.length === 1 ? " needs" : "s need"} approval.`, "!");
    pack.sanitization_attestation = true;
    pack.status = "frozen";
    pack.version = pack.version === "draft" ? "v1.0" : pack.version;
    state.screenPack = pack;
    renderProductView();
    return showToast("Screen pack frozen", "All required screenshots, targets, transitions, and sanitization checks passed.");
  }
  if (action === "approve-screen-mappings") {
    const pack = state.uploadedScreenPack;
    if (!pack) return;
    const screen = pack.screens.find((item) => item.workflow_stage_id === state.selectedPackScreen);
    pack.interaction_targets.filter((target) => target.screen_id === screen?.screen_id).forEach((target) => { target.approved = true; target.approved_at = new Date().toISOString(); target.approval_authority = "human_author"; });
    renderProductView();
    return showToast("Mappings approved", "Midscene proposals are now human-approved normalized targets for this screen.");
  }
  if (action === "start-assignment") {
    selectScenario(Number(trigger?.dataset.scenario || 0));
    return setProductView("simulations");
  }
  if (action === "run-simulation") { selectScenario(0); return setProductView("simulations"); }
  if (action === "assign-simulation") { state.assignments.unshift({ id: `assignment:bo-${Date.now()}`, title: state.creationDrafts.simulation.title, due: "Aug 12", status: "Not started", package: state.creationDrafts.simulation.simulation_package_version }); renderProductView(); return showToast("Assigned to learner", "The frozen package is now available in Assignments."); }
  if (action === "submit-quiz") { state.quizSubmitted = true; renderProductView(); return; }
  for (const type of ["video", "quiz", "simulation"]) {
    if (action === `continue-${type}`) { state.creatorStep[type] = 2; renderProductView(); return; }
    if (action === `back-${type}`) { state.creatorStep[type] = 1; renderProductView(); return; }
    if (action === `generate-${type}`) { if (!state.selectedSourceIds.size) return showToast("Select a source", "Every draft needs at least one explicit source ID.", "!"); state.creationDrafts[type] = makeCreationDraft(type); renderProductView(); return showToast(`${creatorLabel(type)} draft generated`, "The editable draft includes source lineage and citations."); }
    if (action === `review-${type}`) { if (!state.creationDrafts[type]) return; state.creationDrafts[type].status = "in_review"; renderProductView(); return showToast("Ready for review", "The grounded draft is in review."); }
    if (action === `publish-${type}`) { if (!state.creationDrafts[type]) return; state.pendingPublishType = type; return openWriteDialog("creation"); }
    if (action === `save-${type}`) return openWriteDialog(type === "simulation" ? "draft" : "creation");
  }
}

function startTimer() {
  window.setInterval(() => {
    if (!state.callConnected || state.callEnded || state.callPhase !== "live") return;
    state.elapsed += 1;
    dom.timer.textContent = formatTime(state.elapsed);
  }, 1000);
}

function init() {
  state.screenPack = createDemoScreenPack();
  state.caseStartingState = buildCaseStartingState(getScenario());
  initializeCallerAffect("scenario_assignment");
  renderScenarioLibrary();
  bindStaticEvents();
  dom.appShell.dataset.role = state.role;
  setProductView("home");
  loadOpenNotebook();
  startTimer();
  window.addEventListener("online", () => syncAttemptOutbox());
  syncAttemptOutbox().catch(() => {});
}

init();
