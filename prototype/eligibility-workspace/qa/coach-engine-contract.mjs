import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL("../coach-engine.js", import.meta.url), "utf8"), sandbox);
const coach = sandbox.BenefitConnectCoach;

const policyPack = {
  cards: {
    household: { summary: "Confirm household facts.", scope: "Demonstration procedure", citation: "spec · household", citations: [] },
    evidence: { summary: "Review evidence before use.", scope: "Federal baseline / demonstration procedure", citation: "source · evidence", citations: [] },
    eligibility: { summary: "Results are authored fixtures.", scope: "Demonstration procedure", citation: "spec · eligibility", citations: [] },
  },
};

function context(overrides = {}) {
  return {
    scenarioId: "BO-001",
    stageId: "household",
    stageLabel: "Household",
    mode: "practice",
    targets: [],
    evidenceReviewed: false,
    mockEligibilityStatus: "unrun",
    currentStageValidated: false,
    validationFailures: [],
    callEnded: false,
    nextStage: { id: "programs", label: "Programs" },
    policyPack,
    ...overrides,
  };
}

const target = {
  target_id: "household-relationship",
  label: "Relationship",
  stage_id: "household",
  value: "",
  expected_value: "Self",
  provenance: "Caller statement",
  fact_id: "household",
  question: "Who lives with you?",
};

const ask = coach.recommend(context({ targets: [{ ...target, fact_disclosed: false }] }));
assert.equal(ask.action_type, "ask");
assert.equal(ask.information.value, null, "Undisclosed applicant values must never be revealed");

const enter = coach.recommend(context({ targets: [{ ...target, fact_disclosed: true }] }));
assert.equal(enter.action_type, "enter");
assert.equal(enter.information.value, "Self");
assert.equal(enter.target.target_id, target.target_id);

const evidence = coach.recommend(context({ stageId: "eligibility", stageLabel: "Eligibility", evidenceReviewed: false }));
assert.equal(evidence.action_type, "review");
assert.equal(evidence.target.stage_id, "evidence");

const correction = coach.recommend(context({
  evidenceReviewed: true,
  targets: [{ ...target, value: "Spouse", fact_disclosed: true }],
  validationFailures: [{ target_id: target.target_id, label: target.label, stage_id: "household" }],
}));
assert.equal(correction.action_type, "correct");

const validate = coach.recommend(context({ evidenceReviewed: true, targets: [{ ...target, value: "Self", fact_disclosed: true }] }));
assert.equal(validate.action_type, "validate");

const navigate = coach.recommend(context({ evidenceReviewed: true, targets: [{ ...target, value: "Self", fact_disclosed: true }], currentStageValidated: true }));
assert.equal(navigate.action_type, "navigate");
assert.equal(navigate.target.stage_id, "programs");

const authoredRun = coach.recommend(context({
  stageId: "eligibility",
  stageLabel: "Eligibility",
  evidenceReviewed: true,
  targets: [{ target_id: "eligibility-run-reason", label: "Run reason", stage_id: "eligibility", value: "Initial application", safe_to_reveal: true }],
  mockEligibilityStatus: "unrun",
}));
assert.equal(authoredRun.action_type, "explain");
assert.equal(authoredRun.target.action_id, "run-mock-eligibility");
assert.match(authoredRun.instruction, /does not calculate or change/i);

console.log(JSON.stringify({ ask: true, enter: true, evidence: true, correction: true, validate: true, navigate: true, authoredFixtureBoundary: true }, null, 2));
