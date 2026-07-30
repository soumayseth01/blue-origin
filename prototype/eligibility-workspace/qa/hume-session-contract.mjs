import assert from "node:assert/strict";
import {
  authorizeCallbackMessage,
  authorizeCaseFact,
  authorizeContactHandoff,
  buildAuthoritativeHumeSession,
  buildHumeClientContext,
  HUME_TOOL_DEFINITIONS,
  sanitizeHumeClientDiagnostic,
  signSessionEnvelope,
  verifySessionEnvelope,
} from "../api/_lib/hume-session.js";
import { humeConfigChecks } from "../api/_lib/hume-config.js";
import { assertHumeContextBudget } from "../api/_lib/caller-brief.js";

const contacts = [
  { contact_id: "contact:jordan", person_id: "person-02", name: "Jordan Ortiz", role: "household_contact", relationship: "Sibling", profile_id: "benefits-calm", intensity: "low", voice_key: "voice-ito", voice_id: "voice-jordan", voice_label: "Jordan voice", voice_presentation: "Masculine", greeting_mode: "alternate_answerer", greeting: "Hello?", knowledge_scope: "self_and_contact", disclosure_authority: "limited", message_authority: "limited" },
  { contact_id: "contact:maya", person_id: "person-01", name: "Maya Ortiz", role: "applicant", relationship: "Self", profile_id: "benefits-anxious", intensity: "moderate", voice_key: "voice-kora", voice_id: "voice-maya", voice_label: "Maya voice", voice_presentation: "Feminine", greeting_mode: "name_only", greeting: "Hi, this is Maya.", knowledge_scope: "full_application", disclosure_authority: "full", message_authority: "full" },
];

function sessionWithAvailability(availability = "available_handoff") {
  return buildAuthoritativeHumeSession({
    scenario_id: "BO-001",
    profile_id: "benefits-calm",
    intensity: "low",
    voice_key: "voice-ito",
    session_id: "session:test",
    contact_sequence: { mode: "screened", contacts, answering_contact_id: "contact:jordan", intended_contact_id: "contact:maya", intended_contact_availability: availability, callback_window: "Weekdays after 3 PM" },
    application_context: {
      case_type: "Initial application",
      programs: ["Medicaid", "SNAP", "TANF"],
      applicant_case_view: { application: { preferredLanguage: "English" }, people: [{ name: "Maya Ortiz" }], income: [{ grossAmount: "780" }] },
      facts: [{ fact_id: "fact:income", case_path: "income.0.grossAmount", topic: "Current earnings", submitted_value: "920", applicant_value: "780", status: "corrected", provenance: "Applicant interview", allowed_contact_ids: ["contact:maya"] }],
      private_corrections: [{ fact_id: "fact:income", case_path: "income.0.grossAmount", topic: "Current earnings", authorized_response: "My current gross earnings are $780.", status: "corrected", allowed_contact_ids: ["contact:maya"] }],
      interview_facts: [{ fact_id: "fact:marital", case_path: "people.0.maritalStatus", topic: "Marital status", authorized_response: "I’m separated, and my husband does not live with us.", normalized_value: "Separated", fact_state: "interview_only", destination_stage: "household", allowed_contact_ids: ["contact:maya"] }],
    },
    caller_brief: {
      version: "demo-caller-brief-v2",
      summary: "Maya submitted a combined-program application and is ready for an eligibility interview.",
      fact_paths: [
        { fact_id: "brief:language", case_path: "application.preferredLanguage", topic: "Preferred language" },
        { fact_id: "brief:name", case_path: "people.0.name", topic: "Applicant name" },
      ],
      correction_ids: ["fact:income"],
      interview_fact_ids: ["fact:marital"],
      known_unknowns: [{ topic: "Exact document upload time", response: "I do not remember the exact time." }],
    },
    turn_policy: { end_of_turn_silence_ms: 2000, min_interruption_ms: 1200, speech_detection_threshold: 0.5, prefix_padding_ms: 300, silence_checkin_ms: 20000 },
  });
}

assert.equal(HUME_TOOL_DEFINITIONS.length, 3);
assert.ok(HUME_TOOL_DEFINITIONS.every((tool) => !("additionalProperties" in JSON.parse(tool.parameters))), "Hume's tool schema subset must not receive unsupported top-level keywords");
assert.deepEqual(sanitizeHumeClientDiagnostic({ phase: "connect_hume", code: "socket_close", browser_family: "Safari", elapsed_ms: 18123, close_code: 1006, error_name: "Error", token: "must-not-leak", transcript: "must-not-leak" }), { phase: "connect_hume", code: "socket_close", browser_family: "Safari", elapsed_ms: 18123, close_code: 1006, error_name: "Error" });
assert.deepEqual(HUME_TOOL_DEFINITIONS.map((tool) => tool.name), ["request_case_response", "request_contact_handoff", "record_callback_message"]);
const naturalToolConfig = { turn_detection: { end_of_turn_silence_ms: 2000, speech_detection_threshold: 0.5, prefix_padding_ms: 300 }, interruption: { min_interruption_ms: 1200 }, ellm_model: { allow_short_responses: false }, language_model: { model_provider: "OPEN_AI", model_resource: "gpt-4o-mini" }, builtin_tools: [], nudges: { enabled: false }, timeouts: { inactivity: { enabled: true, duration_secs: 180 }, max_duration: { enabled: true, duration_secs: 1800 } } };
assert.ok(Object.values(humeConfigChecks(naturalToolConfig)).every(Boolean));
assert.equal(humeConfigChecks({ ...naturalToolConfig, language_model: null }).tool_capable_language_model, false);
assert.equal(humeConfigChecks({ ...naturalToolConfig, builtin_tools: [{ name: "hang_up" }] }).automatic_hangup_disabled, false);

const initial = sessionWithAvailability();
assert.equal(initial.context.active_contact_id, "contact:jordan");
assert.equal(initial.voice_id, "voice-jordan", "the initial Hume voice must belong to the authored answering contact");
assert.match(initial.system_prompt, /You are Jordan Ortiz/);
assert.match(initial.system_prompt, /one to three sentences/i);
assert.match(initial.system_prompt, /not in the application/i);
assert.match(initial.system_prompt, /do not give one-word answers to exploratory questions/i);
assert.equal(initial.turn_policy.end_of_turn_silence_ms, 2000);
assert.equal(initial.turn_policy.min_interruption_ms, 1200);
assert.equal(initial.caller_brief_version, "demo-caller-brief-v2");
assert.equal(initial.caller_brief_fact_count, 2);
assert.equal(initial.caller_brief.gated_facts.length, 1);
assert.equal(initial.caller_brief.interview_facts.length, 1);
assert.equal(initial.caller_brief.interview_facts[0].response, "I’m separated, and my husband does not live with us.");
assert.ok(initial.caller_brief_size_bytes < 8192);
assert.match(initial.caller_brief.facts.map((fact) => `${fact.topic}: ${fact.value}`).join("\n"), /Applicant name: Maya Ortiz/);
assert.equal(JSON.stringify(initial.caller_brief).includes("evidence"), false);
const humeClientContext = buildHumeClientContext(initial);
const serializedHumeClientContext = JSON.stringify(humeClientContext);
assert.ok(serializedHumeClientContext.length < 12000, "turn-time Hume context must remain compact");
assert.equal(serializedHumeClientContext.includes("applicant_case_view"), false, "the full application must stay behind the case-response tool");
assert.equal(serializedHumeClientContext.includes('"value":"780"'), false, "gated correction values must not be dumped into Hume context");
assert.deepEqual(humeClientContext.application_summary.programs, ["Medicaid", "SNAP", "TANF"]);
assert.equal(humeClientContext.caller_brief.version, "demo-caller-brief-v2");
assert.ok(Buffer.byteLength(JSON.stringify(humeClientContext), "utf8") < 12288);
assert.ok(assertHumeContextBudget(humeClientContext, initial.system_prompt) < 12288);

const direct = buildAuthoritativeHumeSession({
  scenario_id: "BO-001",
  profile_id: "benefits-anxious",
  intensity: "moderate",
  voice_key: "voice-kora",
  session_id: "session:direct",
  contact_sequence: { mode: "direct", contacts: [contacts[1]], answering_contact_id: "contact:maya", intended_contact_id: "contact:maya" },
  application_context: { case_type: "Initial application", programs: ["Medicaid", "SNAP", "TANF"], applicant_case_view: { people: [{ name: "Maya Ortiz" }] } },
  caller_brief: { version: "demo-caller-brief-v2", summary: "Maya submitted a combined-program initial application.", fact_paths: [{ case_path: "people.0.name", topic: "Applicant name" }] },
});
assert.match(direct.system_prompt, /already speaking with the intended contact/i);
assert.match(direct.system_prompt, /say that this is Maya/i);

const blockedFact = authorizeCaseFact(initial, { active_contact_id: "contact:jordan", fact_id: "fact:income" });
assert.equal(blockedFact.authorized, false);
assert.equal(blockedFact.session.context.context_revision, 0);

const safeMessage = authorizeCallbackMessage(initial, { active_contact_id: "contact:jordan", message: "Soumay from County Services called. Please return the call at 555-0100." });
assert.equal(safeMessage.authorized, true);
assert.equal(safeMessage.session.context.context_revision, 1);

const overshare = authorizeCallbackMessage(initial, { active_contact_id: "contact:jordan", message: "Please call about your SNAP application verification." });
assert.equal(overshare.authorized, false);
assert.equal(overshare.oversharing, true);

const handoff = authorizeContactHandoff(initial, { current_contact_id: "contact:jordan", requested_contact_id: "contact:maya", reason: "Learner asked for Maya" });
assert.equal(handoff.authorized, true);
assert.equal(handoff.session.context.active_contact_id, "contact:maya");
assert.equal(handoff.session.voice_id, "voice-maya");
assert.match(handoff.session.system_prompt, /You are Maya Ortiz/);

const disclosed = authorizeCaseFact(handoff.session, { active_contact_id: "contact:maya", case_path: "income.0.grossAmount", topic: "earnings" });
assert.equal(disclosed.authorized, true);
assert.deepEqual(disclosed.fact_ids, ["fact:income"]);
assert.equal(disclosed.session.context.context_revision, 2);

const interviewDisclosure = authorizeCaseFact(handoff.session, { active_contact_id: "contact:maya", fact_id: "fact:marital", topic: "marital status" });
assert.equal(interviewDisclosure.authorized, true);
assert.equal(interviewDisclosure.response_text, "I’m separated, and my husband does not live with us.");
assert.deepEqual(interviewDisclosure.fact, { fact_id: "fact:marital", case_path: "people.0.maritalStatus", label: "Marital status", normalized_value: "Separated", display_value: "Separated", provenance: "Caller statement", destination_stage: "household", destination_section: "" });

const unavailable = sessionWithAvailability("not_at_location");
const unavailableHandoff = authorizeContactHandoff(unavailable, { current_contact_id: "contact:jordan", requested_contact_id: "contact:maya" });
assert.equal(unavailableHandoff.authorized, false);
assert.match(unavailableHandoff.response_text, /not here/i);

const proof = signSessionEnvelope(disclosed.session, "test-secret");
assert.equal(verifySessionEnvelope(proof, "test-secret").context.active_contact_id, "contact:maya");
assert.throws(() => verifySessionEnvelope(`${proof}x`, "test-secret"), /Invalid Hume session proof/);

process.stdout.write("Hume multi-contact contract: ok\n");
