import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL("../demo-scenario-system.js", import.meta.url), "utf8"), context);
const demo = context.globalThis.BlueOriginDemoScenarios;

const voices = [
  ["voice-warm-american-female", "voice-maya"],
  ["voice-soft-american-male", "voice-andre"],
  ["voice-caring-mother", "voice-kendra"],
  ["voice-charming-cowgirl", "voice-mei"],
  ["voice-colton-rivers", "voice-carlos"],
  ["voice-imani-carter", "voice-denise"],
].map(([voice_key, voice_id]) => ({ voice_key, voice_id, label: voice_key, presentation: "Synthetic" }));

function baseDraft(name, programs) {
  return {
    application: { preferredLanguage: "English", interpreterNeeded: "No", bestContactTime: "Weekdays after 3 PM", receivedDate: "2026-07-29" },
    people: [
      { personId: "person-01", name, dateOfBirth: "1990-01-01", relationship: "Self", maritalStatus: "Single", taxFilingStatus: "Non-filer", claimedAsDependent: "No", snapFoodTogether: "Yes", pregnant: "No", dueDate: "", programParticipation: {} },
      { personId: "person-02", name: "Household member", dateOfBirth: "2010-01-01", relationship: "Child", maritalStatus: "Not applicable", taxFilingStatus: "Non-filer", claimedAsDependent: "Yes", snapFoodTogether: "Yes", sharedCustody: "No shared custody", custodySchedule: "", programParticipation: {} },
    ],
    programUnits: { snap: { foodUnit: "", purchasePrepare: "" }, tanf: { assistanceUnit: "", caretaker: "" } },
    incomeSources: [{ employer: "Employer", hourlyRate: "18", hoursPerWeek: "30", grossAmount: "1000", frequency: "Monthly", changeDate: "2026-07-01" }],
    expenses: { shelter: { amount: "1000" }, utilitiesStatus: "None", utilities: [], dependentCareStatus: "None", dependentCare: [] },
    resourcesStatus: "None",
    resources: [],
    nonfinancial: { healthCoverage: "No other coverage" },
  };
}

const definitions = [
  ["BO-001", "Maya Ortiz", ["Medicaid", "SNAP", "TANF"], "voice-warm-american-female"],
  ["BO-002", "Andre Bell", ["Medicaid", "SNAP", "TANF"], "voice-soft-american-male"],
  ["BO-003", "Danielle Reed", ["Medicaid"], "voice-warm-american-female"],
  ["BO-004", "Robert Chen", ["SNAP"], "voice-soft-american-male"],
  ["BO-005", "Elena Vega", ["TANF"], "voice-warm-american-female"],
  ["BO-006", "Tasha Green", ["Medicaid", "SNAP"], "voice-warm-american-female"],
];

const bundles = definitions.map(([id, name, programs, voiceKey]) => {
  const scenario = { id, persona: { name }, programs, facts: [{ id: "household", label: "Household", question: "Who lives with you?", caption: "I live with my household." }] };
  return demo.compileScenario(scenario, baseDraft(name, programs), voices, { default_voice_key: voiceKey, default_profile_id: "benefits-calm", default_intensity: "moderate" });
});

assert.equal(demo.VERSION, "demo-case-bundle-v2");
assert.deepEqual(bundles.map((bundle) => bundle.contactSequence.mode), ["direct", "direct", "screened", "screened", "screened", "screened"]);
assert.deepEqual(bundles.map((bundle) => bundle.contactSequence.expected_terminal_state), ["interview_complete", "interview_complete", "interview_complete", "interview_complete", "callback_message_recorded", "call_later"]);
assert.equal(bundles.filter((bundle) => bundle.contactSequence.expected_handoff).length, 2);
assert.equal(bundles.filter((bundle) => ["callback_message_recorded", "call_later"].includes(bundle.contactSequence.expected_terminal_state)).length, 2);
assert.ok(bundles.every((bundle) => bundle.validation.valid), bundles.flatMap((bundle) => bundle.validation.errors).join("\n"));

for (const bundle of bundles.slice(0, 2)) {
  assert.ok(bundle.validation.blank_interview_fact_count >= 12);
  for (const fact of bundle.truthLedger.filter((item) => item.fact_state === "interview_only")) {
    assert.equal(demo.meaningful(demo.getPath(bundle.integratedCase, fact.case_path)), false, `${fact.case_path} must be blank in the submitted application`);
    assert.ok(demo.meaningful(fact.normalized_value), `${fact.fact_id} requires an authored interview value`);
    assert.ok(fact.natural_response.split(/\s+/).length > 3, `${fact.fact_id} must have a communicative response`);
  }
}

for (const bundle of bundles.filter((item) => item.contactSequence.expected_handoff)) {
  const [answerer, intended] = bundle.contactSequence.contacts;
  assert.notEqual(answerer.contact_id, intended.contact_id);
  assert.notEqual(answerer.voice_id, intended.voice_id);
  assert.equal(JSON.stringify(bundle.contactSequence.allowed_handoffs), JSON.stringify([{ from_contact_id: answerer.contact_id, to_contact_id: intended.contact_id }]));
}

assert.equal(bundles[4].contactSequence.message_policy, "neutral_callback_only");
assert.equal(bundles[5].contactSequence.message_policy, "decline_message_offer_callback_window");
assert.equal(bundles[4].contactSequence.allowed_handoffs.length, 0);
assert.equal(bundles[5].contactSequence.allowed_handoffs.length, 0);

const maritalMatches = demo.matchConversationFacts({
  learner_text: "Are you currently married?",
  caller_text: "I’m separated. My husband does not live with us right now.",
  facts: bundles[0].truthLedger,
  disclosed_fact_ids: [],
});
assert.equal(maritalMatches[0]?.fact_id, "bo001-marital");
assert.ok(maritalMatches[0]?.match.score > 0.5);

const unknownMatches = demo.matchConversationFacts({
  learner_text: "What color is your front door?",
  caller_text: "I do not remember that detail.",
  facts: bundles[0].truthLedger,
  disclosed_fact_ids: [],
});
assert.equal(unknownMatches.length, 0);

for (const bundle of bundles.slice(0, 2)) {
  for (const fact of bundle.truthLedger) {
    const matches = demo.matchConversationFacts({
      learner_text: fact.learner_question_examples[0],
      caller_text: fact.natural_response,
      facts: bundle.truthLedger,
      disclosed_fact_ids: [],
    });
    assert.equal(matches[0]?.fact_id, fact.fact_id, `${fact.fact_id} did not map its authored question and answer back to the correct case path`);
  }
}

process.stdout.write("Demo scenario system contract: ok\n");
