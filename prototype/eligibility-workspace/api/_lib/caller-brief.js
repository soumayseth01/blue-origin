export const CALLER_BRIEF_VERSION = "demo-caller-brief-v1";
export const CALLER_BRIEF_MAX_BYTES = 8192;
export const HUME_CONTEXT_MAX_BYTES = 12288;

const DEFAULT_BOUNDARY = Object.freeze({
  allowed: ["Natural wording and pacing", "Hesitation and emotional reactions", "Small talk", "Requests for clarification", "Saying information is not remembered"],
  prohibited: ["Names or household members", "Dates, addresses, or contact details", "Programs", "Employment or income", "Expenses or resources", "Nonfinancial eligibility facts", "Documents or agency actions"],
});

function text(value, max = 600) {
  return String(value ?? "").trim().slice(0, max);
}

function pathParts(path) {
  return text(path, 220).split(".").filter(Boolean).map((part) => /^\d+$/.test(part) ? Number(part) : part);
}

function getPath(value, path) {
  return pathParts(path).reduce((current, part) => current == null ? undefined : current[part], value);
}

function meaningful(value) {
  return value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length);
}

function displayValue(value) {
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ").slice(0, 500);
  if (value && typeof value === "object") return Object.entries(value).filter(([, item]) => meaningful(item)).map(([key, item]) => `${key}: ${displayValue(item)}`).join("; ").slice(0, 500);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return text(value, 500);
}

function byteSize(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export function resolveDemoCallerBrief({ definition = {}, applicationContext = {}, contactSequence = {}, scenarioId = "" } = {}) {
  const errors = [];
  const application = applicationContext.applicant_case_view || {};
  const activeContactId = contactSequence.active_contact_id || contactSequence.answering_contact_id;
  const activeContact = (contactSequence.contacts || []).find((contact) => contact.contact_id === activeContactId) || contactSequence.contacts?.[0] || {};
  const seenPaths = new Set();
  const facts = [];

  for (const item of Array.isArray(definition.fact_paths) ? definition.fact_paths.slice(0, 80) : []) {
    const casePath = text(item.case_path, 220);
    const topic = text(item.topic, 120);
    if (!casePath || !topic) { errors.push("Every caller-brief fact requires a case path and topic."); continue; }
    if (seenPaths.has(casePath)) { errors.push(`Duplicate caller-brief path: ${casePath}`); continue; }
    seenPaths.add(casePath);
    const value = getPath(application, casePath);
    if (!meaningful(value)) { errors.push(`Caller-brief path is missing or blank: ${casePath}`); continue; }
    facts.push({
      fact_id: text(item.fact_id || `brief:${casePath}`, 120),
      case_path: casePath,
      topic,
      value: displayValue(value),
      status: "submitted",
      provenance: "Submitted application",
    });
  }

  const corrections = new Map((applicationContext.private_corrections || []).map((item) => [item.fact_id, item]));
  const gatedFacts = [];
  for (const factId of Array.isArray(definition.correction_ids) ? definition.correction_ids.slice(0, 20) : []) {
    const correction = corrections.get(factId);
    if (!correction?.case_path || !correction?.authorized_response) {
      errors.push(`Caller correction is incomplete: ${text(factId, 120)}`);
      continue;
    }
    const submittedValue = getPath(application, correction.case_path);
    if (!meaningful(submittedValue)) {
      errors.push(`Caller correction has no submitted value: ${correction.case_path}`);
      continue;
    }
    gatedFacts.push({ fact_id: text(correction.fact_id, 120), case_path: text(correction.case_path, 220), topic: text(correction.topic, 120), status: text(correction.status || "corrected", 30), disclosure: "request_case_response" });
  }

  const knownUnknowns = (Array.isArray(definition.known_unknowns) ? definition.known_unknowns : []).slice(0, 20).map((item) => ({ topic: text(item.topic, 120), response: text(item.response || "I do not remember that information.", 300) })).filter((item) => item.topic);
  const boundary = definition.improvisation_boundary || DEFAULT_BOUNDARY;
  const callerBrief = {
    version: CALLER_BRIEF_VERSION,
    scenario_id: text(scenarioId || definition.scenario_id, 120),
    summary: text(definition.summary, 1000),
    caller: { contact_id: text(activeContact.contact_id, 100), name: text(activeContact.name, 120), role: text(activeContact.role, 60), greeting: text(activeContact.greeting || "Hello?", 180), language: text(activeContact.preferred_language || "English", 60), behavior: text(activeContact.profile_id, 100) },
    facts,
    known_unknowns: knownUnknowns,
    gated_facts: gatedFacts,
    improvisation_boundary: {
      allowed: (Array.isArray(boundary.allowed) ? boundary.allowed : DEFAULT_BOUNDARY.allowed).slice(0, 12).map((item) => text(item, 160)),
      prohibited: (Array.isArray(boundary.prohibited) ? boundary.prohibited : DEFAULT_BOUNDARY.prohibited).slice(0, 16).map((item) => text(item, 160)),
    },
    missing_fact_response: "That was not provided in my application, or I do not remember it. Please do not assume a value.",
  };
  const sizeBytes = byteSize(callerBrief);
  if (!callerBrief.caller.contact_id || !callerBrief.caller.name) errors.push("Caller identity and contact ID are required.");
  if (!callerBrief.summary) errors.push("Caller brief summary is required.");
  if (!facts.length) errors.push("Caller brief must include at least one submitted fact.");
  if (sizeBytes > CALLER_BRIEF_MAX_BYTES) errors.push(`Caller brief exceeds ${CALLER_BRIEF_MAX_BYTES} bytes.`);
  return {
    caller_brief: callerBrief,
    validation: {
      valid: errors.length === 0,
      errors,
      size_bytes: sizeBytes,
      fact_count: facts.length,
      gated_fact_count: gatedFacts.length,
      excluded_sections: ["evidence", "authoredOutcomes", "notices", "authorization", "scoring", "coaching"],
    },
  };
}

export function assertCallerBriefValid(result) {
  if (result?.validation?.valid) return result;
  throw Object.assign(new Error(result?.validation?.errors?.[0] || "Caller brief is invalid"), { statusCode: 400, details: result?.validation });
}

export function assertHumeContextBudget(context, systemPrompt = "") {
  const sizeBytes = byteSize(context) + Buffer.byteLength(String(systemPrompt || ""), "utf8");
  if (sizeBytes > HUME_CONTEXT_MAX_BYTES) throw Object.assign(new Error(`Hume turn-time context exceeds ${HUME_CONTEXT_MAX_BYTES} bytes`), { statusCode: 400 });
  return sizeBytes;
}
