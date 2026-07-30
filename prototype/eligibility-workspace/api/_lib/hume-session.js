import { createHmac, timingSafeEqual } from "node:crypto";
import { assertCallerBriefValid, resolveDemoCallerBrief } from "./caller-brief.js";

export const HUME_VOICES = Object.freeze({
  "voice-kora": {
    voice_id: "59cfc7ab-e945-43de-ad1a-471daa379c67",
    label: "Kora",
    presentation: "Feminine",
    provider: "HUME_AI",
  },
  "voice-ito": {
    voice_id: "f60ecf9e-ff1e-4bae-9206-dba7c653a69e",
    label: "Ito",
    presentation: "Masculine",
    provider: "HUME_AI",
  },
});

const BENEFITS_PROFILES = {
  "benefits-calm": ["Calm", "calmness", "open", "low", "Speak calmly and cooperatively, with measured pacing."],
  "benefits-anxious": ["Anxious", "anxiety", "needs-reassurance", "moderate", "Sound worried about benefits and deadlines. Ask for reassurance without becoming theatrical."],
  "benefits-frustrated": ["Frustrated", "frustration", "conditional", "moderate", "Sound frustrated by repeated paperwork and delays, but remain realistic and responsive to respectful help."],
  "benefits-angry": ["Angry", "anger", "challenging", "high", "Speak with controlled anger about the situation. Do not threaten, insult, or become abusive."],
  "benefits-guarded": ["Guarded", "doubt", "cautious", "high", "Be cautious about sensitive questions and ask why information is needed before answering."],
  "benefits-reluctant": ["Reluctant", "resignation", "minimal", "high", "Give short answers and require patient, plain-language follow-up before sharing private facts."],
  "benefits-sad": ["Sad", "sadness", "low-energy", "moderate", "Sound discouraged and low-energy. Respond better to acknowledgment and patient pacing."],
  "benefits-confused": ["Confused", "confusion", "needs-clarity", "moderate", "Be uncertain about terminology and dates. Ask for plain-language clarification when jargon is used."],
  "benefits-distressed": ["Distressed", "distress", "overwhelmed", "moderate", "Sound overwhelmed by immediate needs while remaining able to answer one clear question at a time."],
};

const EXPRESSION_NAMES = ["disgust", "anger", "sarcasm", "grief", "embarrassment", "fear", "disappointment", "resignation", "savoring", "contemplation", "awe", "joy", "envy", "horror"];

export const HUME_PROFILES = Object.freeze({
  ...Object.fromEntries(Object.entries(BENEFITS_PROFILES).map(([profile_id, [label, expression, cooperation, resistance, instructions]]) => [profile_id, {
    profile_id, label, expression, cooperation, resistance, instructions,
  }])),
  ...Object.fromEntries(EXPRESSION_NAMES.map((expression) => [`expression-${expression}`, {
    profile_id: `expression-${expression}`,
    label: expression.charAt(0).toUpperCase() + expression.slice(1),
    expression,
    cooperation: ["anger", "disgust", "sarcasm", "envy"].includes(expression) ? "challenging" : "conditional",
    resistance: ["anger", "disgust", "sarcasm", "embarrassment", "fear"].includes(expression) ? "high" : "moderate",
    instructions: `Use a restrained, realistic ${expression}-influenced delivery appropriate to a benefits application call. Never perform a caricature.`,
  }])),
});

export const HUME_INTENSITIES = Object.freeze({
  low: { value: 1, instructions: "Keep the expression subtle and easy to de-escalate." },
  moderate: { value: 2, instructions: "Make the expression clearly perceptible but realistic." },
  high: { value: 3, instructions: "Make the expression strong while staying safe, coherent, and non-abusive." },
});

export const HUME_SCENARIOS = Object.freeze({
  "BO-001": { name: "Maya Ortiz", case_id: "CASE-BO-2401" },
  "BO-002": { name: "Andre Bell", case_id: "CASE-BO-2402" },
  "BO-003": { name: "Danielle Reed", case_id: "CASE-BO-2403" },
  "BO-004": { name: "Robert Chen", case_id: "CASE-BO-2404" },
  "BO-005": { name: "Elena Vega", case_id: "CASE-BO-2405" },
  "BO-006": { name: "Tasha Green", case_id: "CASE-BO-2406" },
});

function clampText(value, max = 500) {
  return String(value ?? "").slice(0, max);
}

function clampStructured(value, depth = 0) {
  if (depth > 7) return null;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => clampStructured(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).slice(0, 250).map(([key, item]) => [clampText(key, 120), clampStructured(item, depth + 1)]));
  }
  if (typeof value === "string") return clampText(value, 1200);
  if (["number", "boolean"].includes(typeof value) || value === null) return value;
  return clampText(value, 1200);
}

const CONTACT_ROLES = new Set(["applicant", "authorized_representative", "household_contact", "answering_contact"]);
const CONTACT_AVAILABILITY = new Set(["available_handoff", "temporarily_unavailable", "not_at_location", "declines_call", "answerer_authorized"]);
const KNOWLEDGE_SCOPES = new Set(["full_application", "authorized_application", "self_and_contact", "contact_only", "message_only"]);
const DISCLOSURE_AUTHORITIES = new Set(["full", "authorized", "limited", "none"]);
const MESSAGE_AUTHORITIES = new Set(["full", "limited", "none"]);

export const HUME_TOOL_DEFINITIONS = Object.freeze([
  {
    type: "function",
    name: "request_case_response",
    description: "Authorize a gated correction, dispute, omitted detail, ambiguous multi-fact answer, or contact-specific disclosure. Ordinary authored interview facts already present in caller_brief.interview_facts should be answered directly without this tool.",
    parameters: JSON.stringify({ type: "object", properties: { active_contact_id: { type: "string", description: "The active contact ID from context." }, fact_id: { type: "string", description: "Stable fact ID when known." }, case_path: { type: "string", description: "Stable applicant-case path when known." }, topic: { type: "string", description: "Short fact topic." }, learner_question: { type: "string", description: "Concise summary of what the learner asked." } }, required: ["active_contact_id", "topic", "learner_question"] }),
    fallback_content: "I do not know that information or I am not authorized to discuss it.",
  },
  {
    type: "function",
    name: "request_contact_handoff",
    description: "Request a server-authorized transition from the active answering contact to the intended contact. Never change identity without a successful tool result.",
    parameters: JSON.stringify({ type: "object", properties: { current_contact_id: { type: "string" }, requested_contact_id: { type: "string" }, reason: { type: "string", description: "Why the learner requested the other contact." } }, required: ["current_contact_id", "requested_contact_id", "reason"] }),
    fallback_content: "I cannot transfer the call to that person.",
  },
  {
    type: "function",
    name: "record_callback_message",
    description: "Validate and record a callback message when the intended contact is unavailable. Use before accepting or repeating the message.",
    parameters: JSON.stringify({ type: "object", properties: { active_contact_id: { type: "string" }, message: { type: "string", description: "The exact proposed callback message." } }, required: ["active_contact_id", "message"] }),
    fallback_content: "I cannot take that message.",
  },
]);

function defaultGreeting(contact) {
  if (contact.greeting_mode === "name_only") return `Hello, this is ${clampText(contact.name, 80).split(/\s+/)[0] || "me"}.`;
  if (contact.greeting_mode === "callback_aware" && contact.greeting) return clampText(contact.greeting, 180);
  return "Hello?";
}

function sanitizeContact(contact = {}, fallback = {}) {
  const profileId = HUME_PROFILES[contact.profile_id] ? contact.profile_id : fallback.profile_id;
  const intensity = HUME_INTENSITIES[contact.intensity] ? contact.intensity : fallback.intensity;
  return {
    contact_id: clampText(contact.contact_id || fallback.contact_id, 100),
    person_id: clampText(contact.person_id || "", 100),
    name: clampText(contact.name || fallback.name || "Synthetic caller", 120),
    role: CONTACT_ROLES.has(contact.role) ? contact.role : "applicant",
    relationship: clampText(contact.relationship || "Self", 100),
    preferred_language: clampText(contact.preferred_language || "English", 60),
    interpreter_needed: clampText(contact.interpreter_needed || "No", 30),
    profile_id: profileId,
    intensity,
    voice_key: clampText(contact.voice_key || fallback.voice_key, 120),
    voice_id: clampText(contact.voice_id || fallback.voice_id, 120),
    voice_label: clampText(contact.voice_label || fallback.voice_label || "Hume voice", 120),
    voice_presentation: clampText(contact.voice_presentation || fallback.voice_presentation || "Voice Library", 80),
    greeting_mode: ["neutral", "name_only", "callback_aware", "alternate_answerer"].includes(contact.greeting_mode) ? contact.greeting_mode : "neutral",
    greeting: defaultGreeting(contact),
    knowledge_scope: KNOWLEDGE_SCOPES.has(contact.knowledge_scope) ? contact.knowledge_scope : "full_application",
    disclosure_authority: DISCLOSURE_AUTHORITIES.has(contact.disclosure_authority) ? contact.disclosure_authority : "full",
    message_authority: MESSAGE_AUTHORITIES.has(contact.message_authority) ? contact.message_authority : "limited",
  };
}

export function sanitizeContactSequence(input, fallback = {}) {
  const source = input && typeof input === "object" ? input : {};
  const contacts = (Array.isArray(source.contacts) ? source.contacts : []).slice(0, 8).map((contact, index) => sanitizeContact(contact, {
    ...fallback,
    contact_id: contact.contact_id || `contact-${index + 1}`,
  })).filter((contact) => contact.contact_id);
  if (!contacts.length) contacts.push(sanitizeContact({
    contact_id: "contact-primary",
    name: fallback.name,
    role: "applicant",
    profile_id: fallback.profile_id,
    intensity: fallback.intensity,
    voice_key: fallback.voice_key,
    voice_id: fallback.voice_id,
    voice_label: fallback.voice_label,
    voice_presentation: fallback.voice_presentation,
  }, fallback));
  const intended = contacts.find((contact) => contact.contact_id === source.intended_contact_id) || contacts.find((contact) => contact.role === "applicant") || contacts[0];
  const answering = contacts.find((contact) => contact.contact_id === source.answering_contact_id) || intended;
  const mode = source.mode === "screened" && answering.contact_id !== intended.contact_id ? "screened" : source.mode === "authorized_contact" ? "authorized_contact" : "direct";
  return {
    mode,
    contacts,
    answering_contact_id: answering.contact_id,
    intended_contact_id: intended.contact_id,
    active_contact_id: answering.contact_id,
    intended_contact_availability: CONTACT_AVAILABILITY.has(source.intended_contact_availability) ? source.intended_contact_availability : "available_handoff",
    callback_window: clampText(source.callback_window || "", 160),
    allowed_handoffs: mode === "screened" ? (Array.isArray(source.allowed_handoffs) ? source.allowed_handoffs.slice(0, 4).map((item) => ({ from_contact_id: clampText(item.from_contact_id, 100), to_contact_id: clampText(item.to_contact_id, 100) })) : [{ from_contact_id: answering.contact_id, to_contact_id: intended.contact_id }]) : [],
    route_id: clampText(source.route_id || "", 120),
    route_locked: source.route_locked === true,
    message_policy: ["neutral_callback_only", "decline_message_offer_callback_window"].includes(source.message_policy) ? source.message_policy : "neutral_callback_only",
    expected_handoff: source.expected_handoff === true,
    expected_terminal_state: clampText(source.expected_terminal_state || "interview_complete", 80),
  };
}

export function sanitizeApplicationContext(input) {
  const context = input && typeof input === "object" ? input : {};
  const corrections = Array.isArray(context.private_corrections) ? context.private_corrections.slice(0, 20) : [];
  const missing = Array.isArray(context.missing_facts) ? context.missing_facts.slice(0, 20) : [];
  const facts = Array.isArray(context.facts) ? context.facts.slice(0, 500) : [];
  const interviewFacts = Array.isArray(context.interview_facts) ? context.interview_facts.slice(0, 80) : [];
  return {
    case_type: clampText(context.case_type, 80),
    programs: Array.isArray(context.programs) ? context.programs.slice(0, 6).map((item) => clampText(item, 40)) : [],
    submitted_facts: context.submitted_facts && typeof context.submitted_facts === "object" ? context.submitted_facts : {},
    applicant_case_view: clampStructured(context.applicant_case_view || {}),
    facts: facts.map((item) => ({
      fact_id: clampText(item.fact_id, 120),
      case_path: clampText(item.case_path, 220),
      topic: clampText(item.topic, 160),
      submitted_value: clampStructured(item.submitted_value),
      applicant_value: clampStructured(item.applicant_value),
      status: ["submitted", "confirmed", "corrected", "disputed", "unknown", "not_applicable", "worker_only"].includes(item.status) ? item.status : "submitted",
      provenance: clampText(item.provenance || "Submitted application", 120),
      allowed_contact_ids: Array.isArray(item.allowed_contact_ids) ? item.allowed_contact_ids.slice(0, 8).map((id) => clampText(id, 100)) : [],
    })),
    interview_facts: interviewFacts.map((item) => ({
      fact_id: clampText(item.fact_id, 120),
      case_path: clampText(item.case_path, 220),
      topic: clampText(item.topic, 160),
      applicant_value: clampStructured(item.applicant_value),
      normalized_value: clampStructured(item.normalized_value),
      authorized_response: clampText(item.authorized_response, 1200),
      status: ["interview_only", "conversation_topic"].includes(item.status) ? item.status : "interview_only",
      provenance: clampText(item.provenance || "Caller statement", 120),
      destination_stage: clampText(item.destination_stage, 80),
      destination_section: clampText(item.destination_section, 120),
      allowed_contact_ids: Array.isArray(item.allowed_contact_ids) ? item.allowed_contact_ids.slice(0, 8).map((id) => clampText(id, 100)) : [],
    })),
    private_corrections: corrections.map((item) => ({ fact_id: clampText(item.fact_id, 120), case_path: clampText(item.case_path, 220), topic: clampText(item.topic, 160), authorized_response: clampText(item.authorized_response, 800), status: clampText(item.status || "corrected", 30), allowed_contact_ids: Array.isArray(item.allowed_contact_ids) ? item.allowed_contact_ids.slice(0, 8).map((id) => clampText(id, 100)) : [] })),
    missing_facts: missing.map((item) => ({ fact_id: clampText(item.fact_id, 80), topic: clampText(item.topic, 120), appropriate_question: clampText(item.appropriate_question, 500) })),
    evidence_references: Array.isArray(context.evidence_references) ? context.evidence_references.slice(0, 20) : [],
    disclosure_rules: Array.isArray(context.disclosure_rules) ? context.disclosure_rules.slice(0, 20) : [],
    call_objectives: Array.isArray(context.call_objectives) ? context.call_objectives.slice(0, 10).map((item) => clampText(item, 240)) : [],
  };
}

export function sanitizeHumeClientDiagnostic(input = {}) {
  const allowedPhases = new Set(["idle", "request_microphone", "prepare_audio", "create_session", "connect_hume", "confirm_session", "connected", "failed", "disconnected"]);
  const phase = clampText(input.phase, 64);
  const diagnostic = {
    phase: allowedPhases.has(phase) ? phase : "unknown",
    code: clampText(input.code, 64) || "unknown",
    browser_family: clampText(input.browser_family, 32) || "Other",
    elapsed_ms: Math.max(0, Math.min(300000, Math.round(Number(input.elapsed_ms || 0)))),
  };
  const closeCode = Number(input.close_code);
  if (Number.isInteger(closeCode)) diagnostic.close_code = closeCode;
  const errorName = clampText(input.error_name, 80);
  if (errorName) diagnostic.error_name = errorName;
  const milestone = clampText(input.milestone, 80);
  if (milestone) diagnostic.milestone = milestone;
  return diagnostic;
}

function activeContact(session) {
  return session.contact_sequence.contacts.find((contact) => contact.contact_id === session.context.active_contact_id) || session.contact_sequence.contacts[0];
}

function callerBriefForActiveContact(session) {
  if (!session.caller_brief) return null;
  const contact = activeContact(session);
  return {
    ...session.caller_brief,
    caller: {
      contact_id: contact.contact_id,
      name: contact.name,
      role: contact.role,
      greeting: contact.greeting,
      language: contact.preferred_language,
      behavior: contact.profile_id,
    },
  };
}

export function buildContactPrompt(session) {
  const contact = activeContact(session);
  const intended = session.contact_sequence.contacts.find((item) => item.contact_id === session.contact_sequence.intended_contact_id) || contact;
  const profile = HUME_PROFILES[contact.profile_id] || HUME_PROFILES[session.profile_id];
  const intensity = HUME_INTENSITIES[contact.intensity] || HUME_INTENSITIES[session.intensity];
  const activeIsIntended = contact.contact_id === intended.contact_id;
  const contactRouting = activeIsIntended
    ? `You are already speaking with the intended contact. If the learner asks for ${intended.name}, say that this is ${intended.name.split(/\s+/)[0]}. Never say that you are unavailable, offer a handoff to yourself, or offer to take a message for yourself.`
    : `The intended contact's authored availability is ${session.contact_sequence.intended_contact_availability.replaceAll("_", " ")}; the authored callback window is ${JSON.stringify(session.contact_sequence.callback_window || "not provided")}; the message policy is ${String(session.contact_sequence.message_policy || "neutral_callback_only").replaceAll("_", " ")}. If asked for the intended contact, follow those availability and handoff rules. Do not switch identities yourself. Use request_contact_handoff and wait for the authorized result before speaking as another person. If the intended contact is unavailable and the learner proposes a message, use record_callback_message before accepting or repeating it. If the message policy says decline message offer, politely decline to take any message and provide only the authored callback window.`;
  return `You are ${contact.name}, the active ${contact.role.replaceAll("_", " ")} in synthetic case ${session.case_id}. The intended contact for this call is ${intended.name}. ${contactRouting} Your knowledge scope is ${contact.knowledge_scope.replaceAll("_", " ")}, disclosure authority is ${contact.disclosure_authority}, and message authority is ${contact.message_authority}. You are answering a phone call and do not initially know why the learner is calling. Begin only with the configured greeting: ${JSON.stringify(contact.greeting)}. Do not mention benefits, the application, the agency, or the call purpose until the learner explains it. The caller_brief in context is authoritative: use its submitted facts and authored interview_facts exactly, including each authored response; never change amounts, dates, names, programs, people, or statuses, and never invent a material fact. Answer ordinary questions covered by interview_facts directly without a tool. Use request_case_response only for gated corrections, disputes, omitted details, ambiguous multi-fact questions, or contact-specific disclosure checks. Use only facts within your contact knowledge scope. Do not adopt facts known only by another household member, the intended applicant, or the agency. Distinguish submitted facts from facts that are confirmed, corrected, disputed, unknown, or not remembered. Speak like a real person, never like a database or application. Do not say that a fact is 'not in the application', 'not in the payload', or 'not in the system'. When you genuinely do not know, say naturally that you are not sure, do not remember, or need to check. For an appropriate open interview question, answer directly in the first sentence and add one useful authored detail in a second sentence when available. Most answers should be one to three sentences and roughly 10 to 45 words; do not give one-word answers to exploratory questions and do not turn answers into long monologues. A simple confirmation may remain brief when no context is useful. Begin with the authored disposition and intensity, then react naturally to the learner's tone, clarity, empathy, pacing, and interview conduct. Do not announce or describe your emotional state. Never provide policy advice, coach or score the learner, operate the eligibility system, browse the web, invent information, threaten, or become abusive. ${profile.instructions} ${intensity.instructions}`;
}

export function buildAuthoritativeHumeSession({ scenario_id, scenario_input, profile_id, intensity, voice_key, voice_override, application_context, caller_brief, contact_sequence, turn_policy, session_id }) {
  const scenario = HUME_SCENARIOS[scenario_id] || (scenario_input?.synthetic ? { name: clampText(scenario_input.name, 120), case_id: clampText(scenario_input.case_id, 120) } : null);
  const profile = HUME_PROFILES[profile_id];
  const intensityConfig = HUME_INTENSITIES[intensity];
  const voice = voice_override || HUME_VOICES[voice_key];
  if (!scenario) throw Object.assign(new Error("Unknown simulation scenario"), { statusCode: 400 });
  if (!profile) throw Object.assign(new Error("Caller profile is not allowed"), { statusCode: 400 });
  if (!intensityConfig) throw Object.assign(new Error("Caller intensity is not allowed"), { statusCode: 400 });
  if (!voice) throw Object.assign(new Error("Caller voice is not allowed"), { statusCode: 400 });
  const context = sanitizeApplicationContext(application_context);
  const currentState = profile_id.startsWith("benefits-") ? profile_id.replace("benefits-", "") : profile.expression;
  const sequence = sanitizeContactSequence(contact_sequence, { name: scenario.name, profile_id, intensity, voice_key, voice_id: voice.voice_id, voice_label: voice.label, voice_presentation: voice.presentation });
  const initialContact = sequence.contacts.find((contact) => contact.contact_id === sequence.active_contact_id) || sequence.contacts[0];
  const resolvedBrief = assertCallerBriefValid(resolveDemoCallerBrief({ definition: caller_brief, applicationContext: context, contactSequence: sequence, scenarioId: scenario_id }));
  const persistentContext = {
    training_boundary: "Synthetic applicant facts only. Never provide policy guidance or invent information.",
    applicant: { name: scenario.name, case_id: scenario.case_id },
    context_revision: 0,
    active_contact_id: sequence.active_contact_id,
    contact_sequence: sequence,
    conversation_phase: "answering",
    confirmed_fact_ids: [],
    caller_profile: { profile_id, intended_expression: profile.expression, cooperation_style: profile.cooperation, disclosure_resistance: profile.resistance, adaptation: "hume_driven" },
    selected_voice: { voice_key: initialContact.voice_key, voice_id: initialContact.voice_id, label: initialContact.voice_label, presentation: initialContact.voice_presentation },
    current_behavior_state: { state: currentState, intensity: intensityConfig.value, cooperation: profile.cooperation, source: "authored_seed" },
    application_context: context,
  };
  const session = {
    session_id,
    scenario_id,
    case_id: scenario.case_id,
    profile_id,
    intensity,
    voice_key,
    voice_id: initialContact.voice_id,
    selection: { profile: profile.label, expression: profile.expression, intensity, voice: initialContact.voice_label, presentation: initialContact.voice_presentation },
    contact_sequence: sequence,
    turn_policy: {
      end_of_turn_silence_ms: Math.max(500, Math.min(3000, Number(turn_policy?.end_of_turn_silence_ms || 2000))),
      min_interruption_ms: Math.max(50, Math.min(2000, Number(turn_policy?.min_interruption_ms || 1200))),
      speech_detection_threshold: Math.max(0, Math.min(1, Number(turn_policy?.speech_detection_threshold ?? 0.5))),
      prefix_padding_ms: Math.max(0, Math.min(1000, Number(turn_policy?.prefix_padding_ms || 300))),
      silence_checkin_ms: Math.max(10000, Math.min(60000, Number(turn_policy?.silence_checkin_ms || 20000))),
    },
    context: persistentContext,
    caller_brief_version: resolvedBrief.caller_brief.version,
    caller_brief: resolvedBrief.caller_brief,
    caller_brief_fact_count: resolvedBrief.validation.fact_count,
    caller_brief_size_bytes: resolvedBrief.validation.size_bytes,
    caller_brief_validation: resolvedBrief.validation,
  };
  session.system_prompt = buildContactPrompt(session);
  return session;
}

export function buildHumeClientContext(session = {}) {
  const context = session.context || {};
  const application = context.application_context || {};
  const sequence = session.contact_sequence || context.contact_sequence || {};
  return {
    training_boundary: context.training_boundary || "Synthetic applicant facts only. Never provide policy guidance or invent information.",
    applicant: context.applicant || {},
    context_revision: Number(context.context_revision || 0),
    active_contact_id: context.active_contact_id || sequence.active_contact_id || null,
    conversation_phase: context.conversation_phase || "answering",
    confirmed_fact_ids: Array.isArray(context.confirmed_fact_ids) ? context.confirmed_fact_ids.slice(0, 40) : [],
    contact_sequence: {
      route_id: sequence.route_id || "",
      mode: sequence.mode || "direct",
      answering_contact_id: sequence.answering_contact_id || null,
      intended_contact_id: sequence.intended_contact_id || null,
      active_contact_id: context.active_contact_id || sequence.active_contact_id || null,
      intended_contact_availability: sequence.intended_contact_availability || "available_handoff",
      callback_window: sequence.callback_window || "",
      message_policy: sequence.message_policy || "neutral_callback_only",
      expected_terminal_state: sequence.expected_terminal_state || "interview_complete",
      allowed_handoffs: Array.isArray(sequence.allowed_handoffs) ? sequence.allowed_handoffs.slice(0, 4) : [],
      contacts: Array.isArray(sequence.contacts) ? sequence.contacts.slice(0, 8).map((contact) => ({
        contact_id: contact.contact_id,
        name: contact.name,
        role: contact.role,
        relationship: contact.relationship,
        preferred_language: contact.preferred_language,
        knowledge_scope: contact.knowledge_scope,
        disclosure_authority: contact.disclosure_authority,
        message_authority: contact.message_authority,
      })) : [],
    },
    caller_profile: context.caller_profile || {},
    current_behavior_state: context.current_behavior_state || {},
    caller_brief: callerBriefForActiveContact(session),
    application_summary: {
      case_type: application.case_type || "",
      programs: Array.isArray(application.programs) ? application.programs.slice(0, 6) : [],
      fact_access: "Use request_case_response with the learner's topic and question before disclosing material application details.",
    },
  };
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function signSessionEnvelope(session, secret) {
  const payload = base64url(JSON.stringify({ ...session, issued_at: Date.now(), expires_at: Date.now() + 35 * 60 * 1000 }));
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionEnvelope(envelope, secret) {
  const [payload, signature] = String(envelope || "").split(".");
  if (!payload || !signature) throw Object.assign(new Error("Invalid Hume session proof"), { statusCode: 401 });
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw Object.assign(new Error("Invalid Hume session proof"), { statusCode: 401 });
  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (Date.now() > Number(session.expires_at || 0)) throw Object.assign(new Error("Hume session proof expired"), { statusCode: 401 });
  return session;
}

export function authorizeCaseFact(session, input = {}) {
  const application = session.context?.application_context || {};
  const corrections = application.private_corrections || [];
  const interviewFacts = application.interview_facts || [];
  const facts = application.facts || [];
  const contact = activeContact(session);
  const requestedContactId = clampText(input.active_contact_id, 100);
  if (requestedContactId && requestedContactId !== contact.contact_id) return { authorized: false, response_text: "That contact is not active in this conversation.", fact_ids: [], session };
  const factId = clampText(input.fact_id, 80);
  const casePath = clampText(input.case_path, 220);
  const topic = clampText(input.topic, 120).toLowerCase();
  const fact = corrections.find((item) => item.fact_id === factId || (casePath && item.case_path === casePath) || (topic && item.topic.toLowerCase().includes(topic)))
    || interviewFacts.find((item) => item.fact_id === factId || (casePath && item.case_path === casePath) || (topic && (item.topic.toLowerCase().includes(topic) || topic.includes(item.topic.toLowerCase()))))
    || facts.find((item) => item.fact_id === factId || (casePath && item.case_path === casePath) || (topic && item.topic.toLowerCase().includes(topic)));
  const allowed = fact && contact.disclosure_authority !== "none" && (!fact.allowed_contact_ids?.length || fact.allowed_contact_ids.includes(contact.contact_id));
  if (!allowed) return { authorized: false, response_text: "I do not know that information or I am not authorized to discuss it.", fact_ids: [], session };
  const responseText = fact.authorized_response || `${fact.topic}: ${typeof fact.applicant_value === "object" ? JSON.stringify(fact.applicant_value) : fact.applicant_value ?? fact.submitted_value}`;
  const confirmed = new Set(session.context.confirmed_fact_ids || []);
  confirmed.add(fact.fact_id);
  const revised = { ...session, context: { ...session.context, context_revision: Number(session.context.context_revision || 0) + 1, conversation_phase: "interview", confirmed_fact_ids: [...confirmed] } };
  return fact
    ? { authorized: true, response_text: responseText, fact_status: fact.status || "confirmed", fact_ids: [fact.fact_id], case_paths: fact.case_path ? [fact.case_path] : [], fact: { fact_id: fact.fact_id, case_path: fact.case_path || "", label: fact.topic || "Case fact", normalized_value: fact.normalized_value ?? fact.applicant_value ?? fact.submitted_value ?? "", display_value: fact.normalized_value ?? fact.applicant_value ?? fact.submitted_value ?? "", provenance: fact.provenance || (fact.status === "interview_only" ? "Caller statement" : "Submitted application"), destination_stage: fact.destination_stage || "", destination_section: fact.destination_section || "" }, session: revised }
    : { authorized: false, response_text: "I can only respond with facts contained in this training case.", fact_ids: [] };
}

export function authorizeContactHandoff(session, input = {}) {
  const currentId = clampText(input.current_contact_id, 100);
  const requestedId = clampText(input.requested_contact_id, 100);
  const current = activeContact(session);
  const target = session.contact_sequence.contacts.find((contact) => contact.contact_id === requestedId);
  const transition = session.contact_sequence.allowed_handoffs.find((item) => item.from_contact_id === current.contact_id && item.to_contact_id === requestedId);
  const available = session.contact_sequence.intended_contact_availability === "available_handoff";
  if (currentId !== current.contact_id || !target || !transition || !available) {
    const availability = session.contact_sequence.intended_contact_availability;
    const response = availability === "temporarily_unavailable" ? `${session.contact_sequence.contacts.find((item) => item.contact_id === session.contact_sequence.intended_contact_id)?.name || "They"} cannot come to the phone right now.`
      : availability === "not_at_location" ? "They are not here right now."
        : availability === "declines_call" ? "They are not available to take the call."
          : "I cannot transfer the call to that person.";
    return { authorized: false, response_text: response, active_contact_id: current.contact_id, session };
  }
  const revised = {
    ...session,
    voice_key: target.voice_key,
    voice_id: target.voice_id,
    profile_id: target.profile_id,
    intensity: target.intensity,
    selection: { profile: HUME_PROFILES[target.profile_id]?.label || target.profile_id, expression: HUME_PROFILES[target.profile_id]?.expression || "natural", intensity: target.intensity, voice: target.voice_label, presentation: target.voice_presentation },
    context: {
      ...session.context,
      context_revision: Number(session.context.context_revision || 0) + 1,
      active_contact_id: target.contact_id,
      conversation_phase: "handoff_complete",
      selected_voice: { voice_key: target.voice_key, voice_id: target.voice_id, label: target.voice_label, presentation: target.voice_presentation },
      current_behavior_state: { state: target.profile_id.replace(/^benefits-/, ""), intensity: HUME_INTENSITIES[target.intensity]?.value || 2, source: "authored_seed_after_handoff" },
    },
  };
  revised.system_prompt = buildContactPrompt(revised);
  return { authorized: true, response_text: target.greeting, handoff_complete: true, active_contact_id: target.contact_id, greeting: target.greeting, voice_id: target.voice_id, contact: target, session: revised };
}

export function authorizeCallbackMessage(session, input = {}) {
  const contact = activeContact(session);
  const requestedContactId = clampText(input.active_contact_id, 100);
  if (requestedContactId && requestedContactId !== contact.contact_id) return { authorized: false, response_text: "That contact is not active in this conversation.", session };
  const message = clampText(input.message, 600);
  if (!message || contact.message_authority === "none") return { authorized: false, response_text: "I cannot take a message.", session };
  const sensitive = /\b(medicaid|snap|tanf|benefit|application|renewal|eligib|verification|evidence|document|income|wage|expense|resource|household|notice|case|coverage|denied|approved)\b/i.test(message);
  if (contact.message_authority === "limited" && sensitive) return { authorized: false, oversharing: true, response_text: "You can leave your name, agency, callback number, and a request to return the call, but no case details.", session };
  const revised = { ...session, context: { ...session.context, context_revision: Number(session.context.context_revision || 0) + 1, conversation_phase: "callback_message_recorded", callback_message: { message, contact_id: contact.contact_id } } };
  return { authorized: true, oversharing: false, response_text: "Okay, I will pass along that message.", session: revised };
}
