const text = { type: "string" };

function object(properties, required = Object.keys(properties)) {
  return { type: "object", properties, required, additionalProperties: false };
}

function list(items) {
  return { type: "array", items };
}

const application = object({
  type: text, channel: text, receivedDate: text, receivedTime: text, preferredLanguage: text,
  interpreterNeeded: text, accessibilityNeed: text, contactMethod: text, phone: text, email: text,
  bestContactTime: text, residentialAddress: text, cityStateZip: text, mailingAddressSame: text,
  mailingAddress: text, authorizedRepresentative: text, representativeName: text, urgentNeed: text,
  urgentNeedType: text, interviewMode: text, interviewStatus: text,
});

const person = object({
  personId: text, name: text, dateOfBirth: text, relationship: text, livesAtCaseAddress: text,
  alternateAddress: text, temporaryAbsent: text, absenceReason: text, expectedReturnDate: text,
  sharedCustody: text, custodySchedule: text, maritalStatus: text, taxFilingStatus: text,
  claimedAsDependent: text, pregnant: text, dueDate: text, snapFoodTogether: text, tanfRole: text,
  medicaidParticipation: text, snapParticipation: text, tanfParticipation: text,
});

const income = object({
  incomeId: text, person: text, category: text, type: text, employer: text, employmentStatus: text,
  payBasis: text, hourlyRate: text, hoursPerWeek: text, grossAmount: text, frequency: text,
  paymentDate: text, expectedChange: text, changeDate: text, selfEmploymentBusiness: text,
  grossReceipts: text, businessExpenses: text,
});

const shelter = object({ type: text, amount: text, frequency: text, shared: text, subsidized: text, subsidyType: text, subsidyAmount: text });
const utility = object({ type: text, arrangement: text, amount: text, frequency: text, shared: text });
const dependentCare = object({ person: text, reason: text, provider: text, amount: text, frequency: text, subsidized: text });
const medicalExpense = object({ person: text, type: text, amount: text, frequency: text, reimbursement: text });
const expenses = object({ shelter, utilitiesStatus: text, utilities: list(utility), dependentCareStatus: text, dependentCare: list(dependentCare), supportStatus: text, medicalStatus: text, medical: list(medicalExpense) });

const resource = object({ resourceId: text, owner: text, type: text, institution: text, value: text, jointlyOwned: text, incomeProducing: text, vehicleDescription: text, vehicleUse: text });
const nonfinancial = object({
  identityStatus: text, residency: text, citizenship: text, immigrationDocument: text, sponsorStatus: text,
  sponsorName: text, ssnStatus: text, studentStatus: text, disabilityClaimed: text, disabilityDetails: text,
  blindnessStatus: text, pregnancyStatus: text, caretakerStatus: text, healthCoverage: text,
  workParticipation: text, absentParentStatus: text, priorBenefitHistory: text, disqualificationHistory: text,
});
const evidence = object({ evidenceId: text, type: text, title: text, person: text, program: text, fact: text, receivedDate: text, status: text, discrepancy: text });
const outcome = object({ program: text, person: text, month: text, status: text, benefit: text, reason: text, pendingReason: text });
const notice = object({ program: text, type: text, effectiveDate: text, delivery: text, language: text, verificationDueDate: text, appealRights: text });
const authorization = object({ program: text, action: text, effectiveDate: text });

export const simulationGenerationSchema = object({
  suggested_title: text,
  short_title: text,
  description: text,
  persona: object({ name: text, initials: text, description: text, preferred_language: text }),
  opening: text,
  facts: list(object({ id: text, case_path: text, label: text, question: text, caption: text })),
  case_data: object({
    schemaVersion: { type: "string", enum: ["2.0.0-demo"] },
    application,
    people: list(person),
    incomeSources: list(income),
    expenses,
    resources: list(resource),
    nonfinancial,
    evidence: list(evidence),
    outcomes: list(outcome),
    notices: list(notice),
    authorizations: list(authorization),
  }),
  behavior: object({
    profile_id: { type: "string", enum: ["benefits-calm", "benefits-anxious", "benefits-frustrated", "benefits-guarded", "benefits-confused", "benefits-distressed"] },
    intensity: { type: "string", enum: ["low", "moderate", "high"] },
    voice_key: { type: "string", enum: ["voice-warm-american-female", "voice-imani-carter", "voice-caring-mother", "voice-charming-cowgirl", "voice-warm-female-assistant", "voice-soft-american-male", "voice-terrence-bentley", "voice-colton-rivers", "voice-grizzled-new-yorker", "voice-spanish-instructor"] },
  }),
  expected_actions: list(text),
  training_objectives: list(text),
});

export function validateSimulationGenerationRequest(body) {
  const setup = body?.setup || {};
  const prompt = String(body?.prompt || "").trim();
  if (!setup.jurisdiction) throw Object.assign(new Error("State or jurisdiction is required"), { statusCode: 400 });
  if (!Array.isArray(setup.programs) || !setup.programs.length) throw Object.assign(new Error("At least one program is required"), { statusCode: 400 });
  if (setup.programs.some(program => !["Medicaid", "SNAP", "TANF"].includes(program))) throw Object.assign(new Error("Unsupported program"), { statusCode: 400 });
  if (prompt.length < 30 || prompt.length > 3000) throw Object.assign(new Error("Prompt must contain 30 to 3,000 characters"), { statusCode: 400 });
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(prompt)) throw Object.assign(new Error("Remove Social Security numbers or other real identifying information"), { statusCode: 422 });
  return { setup, focus_tags: Array.isArray(body.focus_tags) ? body.focus_tags.map(String).slice(0, 20) : [], prompt };
}

export function validateGeneratedSimulation(payload, expectedPrograms = []) {
  const serialized = JSON.stringify(payload || {});
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(serialized)) throw Object.assign(new Error("AI returned a prohibited personal identifier"), { statusCode: 502 });
  const application = payload?.case_data?.application || {};
  if (application.phone && !/555/.test(application.phone)) throw Object.assign(new Error("AI returned a phone number that was not clearly synthetic"), { statusCode: 502 });
  if (application.email && !/\.invalid$/i.test(application.email)) throw Object.assign(new Error("AI returned an email address that was not clearly synthetic"), { statusCode: 502 });
  if (application.cityStateZip && !/\b00000\b/.test(application.cityStateZip)) throw Object.assign(new Error("AI returned an address that was not clearly synthetic"), { statusCode: 502 });
  if (!String(payload?.persona?.name || "").trim()) throw Object.assign(new Error("AI returned an incomplete synthetic applicant"), { statusCode: 502 });
  const allowedFactRoots = new Set(["people", "incomeSources", "expenses", "resources", "nonfinancial", "application"]);
  if (!(payload?.facts || []).length || payload.facts.some((fact) => !String(fact.case_path || "").trim() || !allowedFactRoots.has(String(fact.case_path).split(".")[0]))) throw Object.assign(new Error("AI returned an interview fact without a valid submitted case path"), { statusCode: 502 });
  const returnedPrograms = new Set([...(payload?.case_data?.outcomes || []), ...(payload?.case_data?.notices || []), ...(payload?.case_data?.authorizations || [])].map(item => item.program));
  if (expectedPrograms.some(program => !returnedPrograms.has(program)) || [...returnedPrograms].some(program => !expectedPrograms.includes(program))) {
    throw Object.assign(new Error("AI returned records for the wrong program selection"), { statusCode: 502 });
  }
  return payload;
}

export const simulationGenerationInstructions = `Create one complete synthetic public-benefits training case from the supplied author setup and prompt.
Return only the requested structured data. Use invented names, a 555 phone number, an email ending in .invalid, and a fictional city/state with ZIP 00000. Never reproduce a real SSN or personal identifier.
Set case_data.schemaVersion to 2.0.0-demo. Include every selected program and no unselected program. Create internally consistent applicant, household, income, expense, resource, nonfinancial, evidence, notice, authorization, and illustrative outcome records.
The case is not grounded in policy sources. Do not claim legal accuracy or make an official eligibility determination. Outcomes must be clearly illustrative training fixtures.
Create four to eight gated interview facts. Each fact needs an appropriate learner question, a concise applicant response enclosed in natural spoken language, and a case_path pointing to its submitted value under application, people, incomeSources, expenses, resources, or nonfinancial.
Use dates and amounts that permit coherent case processing. Keep all record identifiers unique within the case. Populate empty strings when a conditional field does not apply.
For each person, set medicaidParticipation, snapParticipation, and tanfParticipation to Applying, Included, Excluded, Not applying, Pending, or an empty string. The client will map these into program participation records.`;
