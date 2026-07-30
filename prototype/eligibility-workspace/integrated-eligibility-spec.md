# BenefitConnect Integrated-Eligibility Training Specification

Version: `2.0.0-demo`  
Programs: Medicaid, SNAP, TANF  
Jurisdiction: state-neutral synthetic demonstration

## Purpose and system boundary

BenefitConnect is a training replica for practicing public-benefit intake, interview, verification, result review, notices, and call closure. It is deliberately more complete than a minimal screen mock so a learner can work through realistic fields, dropdowns, repeaters, and conditional paths.

BenefitConnect is **not an eligibility system**. It does not apply income limits, deductions, household-construction rules, categorical requirements, benefit formulas, time limits, sanctions, verification sufficiency rules, or state policy. It does not create an official case, determination, issuance, notice, or authorization.

The Eligibility stage loads a frozen, scenario-authored `pending` or `final` result fixture. The entered case facts never calculate or alter an eligibility outcome.

All names, addresses, identifiers, employers, providers, institutions, documents, and case facts are synthetic.

## Canonical demonstration contract

Each scenario exposes:

- `integratedCase`: the editable synthetic case draft.
- `trainingTargets`: the small stable subset evaluated by practice and assessment mode.
- `authoredOutcomeVariants.pending`: results shown while required evidence remains unresolved.
- `authoredOutcomeVariants.final`: results shown after the evidence-review workflow is complete.

The case draft uses `schemaVersion: 2.0.0-demo` and contains:

| Object | Purpose |
| --- | --- |
| `application` | Intake, contact, address, representation, urgency, and interview facts. |
| `people[]` | Shared household roster and person-level program relationships. |
| `programRequests` | Requested/not-requested state for Medicaid, SNAP, and TANF. |
| `programUnits` | Separate Medicaid, SNAP, and TANF household/unit descriptions. |
| `incomeSources[]` | Employment, self-employment, unearned, rental, and one-time income facts. |
| `expenses` | Shelter, utilities, dependent care, support, and medical-expense facts. |
| `resources[]` | Accounts, vehicles, and other resource facts. |
| `nonfinancial` | Identity, residency, citizenship, health, education, family, and participation facts. |
| `evidence[]` | Document/data-match records linked to person, program, and fact. |
| `notices` | Program-scoped synthetic notice configuration. |
| `authorization` | Program-scoped prototype actions. |
| `authoredOutcomes` | Frozen pending and final result fixtures. |

Unknown, blank, No, Not applicable, Pending, and Verified are distinct values. The UI must not silently convert one into another.

## Workflow fields and decision paths

### 1. Intake & requests

Implemented fields include application activity, channel, received date/time, preferred language, interpreter need, accessibility need, preferred contact method, synthetic phone/email, contact time, residential and mailing address, authorized representative, requested programs, immediate need, need type, interview mode, and interview status.

Conditional paths:

- `mailingAddressSame = No` shows the alternate mailing address.
- `authorizedRepresentative = Yes` shows representative details.
- `urgentNeed = Yes` shows the urgent-need type.
- Changing an activating value prompts before clearing populated child facts.

### 2. Household

The roster supports adding and removing synthetic people. Each person has a stable demonstration ID, name, birth date, relationship, residence, program participation, temporary absence, custody, marital/tax relationship, pregnancy, SNAP food-unit relationship, and TANF family role.

Conditional paths:

- `livesAtCaseAddress = No` shows alternate residence.
- `temporaryAbsent = Yes` shows reason and return date.
- A shared-custody value other than No shows schedule details.
- `pregnant = Yes` shows expected due date.

The shared case household never substitutes for program-specific Medicaid tax households, SNAP food units, or TANF assistance units.

### 3. Programs

Only requested program accordions are rendered.

- Medicaid: household basis, MAGI/non-MAGI pathway screen, other health coverage, and retroactive-coverage request.
- SNAP: food-unit members, purchase/prepare arrangement, prior benefits, and expedited-screen capture.
- TANF: assistance-unit members, caretaker, family circumstance, and participation-screen status.

The person-by-program matrix supports Applying, Included, Excluded, Not applying, and Pending. These are authored worker entries, not calculated memberships.

### 4. Financial

Income repeaters support employment, self-employment, unearned income, rental/roomer income, and one-time/other income. Common fields include person, type, source, basis, rate, hours, gross amount, frequency, payment date, expected change, and change date. Self-employment activates business, receipts, and expense fields.

Expense sections cover shelter, sharing, subsidy, utilities, dependent care, and illustrative medical expenses. Resource repeaters cover owner, type, value, financial institution, and vehicle description/use.

No entered amount is compared with a standard or used to produce a result.

### 5. Non-financial

Fields cover identity, SSN status, residency, citizenship/immigration, immigration document, sponsor, student status, disability/work limitation, blindness, pregnancy, other health coverage, caretaker relationship, participation status, absent-parent/cooperation facts, prior benefits, and disqualification history.

Conditional paths:

- Noncitizen selections show immigration-document and sponsor questions.
- `sponsorStatus = Yes` shows sponsor name.
- `disabilityClaimed = Yes` shows reported limitation details.
- TANF questions appear only when TANF was requested.
- Medicaid coverage/pathway questions appear only when Medicaid was requested.

### 6. Evidence

Evidence records include type, title, person, program, fact supported, received date, status, discrepancy, and review action. Supported statuses include Received, Review required, Reviewed, Verified, Insufficient, Conflict, Resolved, and Unable to resolve.

Opening a record and verifying a fact are separate actions. The stable wage-document and wage-match targets remain part of the evaluator.

### 7. Eligibility

`Run mock eligibility` selects an authored fixture only:

1. If required wage evidence has not been reviewed, load `authoredOutcomes.pending`.
2. After evidence review, load `authoredOutcomes.final`.
3. Editing a material case fact after a run marks the displayed result stale.
4. Rerunning reloads the appropriate authored fixture; it does not calculate from the edited fact.

Every result is labeled **Illustrative authored result** and displays program, person/unit, month, authored status, illustrative benefit, and authored reason.

### 8. Notices

Each requested program has a notice accordion with type, effective date, verification due date, delivery method, language, and appeal-information status. The mapped notice type and processing summary remain evaluated training targets. No notice is transmitted.

### 9. Authorization

Each requested program has a separate prototype action and effective date. Worker attestations cover material facts, discrepancies, and next steps; the closing-summary target captures client communication. Submission remains blocked by the existing call-closure requirements and creates only a local attempt record.

## Interaction, provenance, and validation rules

- Supporting fields use stable `data-case-path` attributes and generate normalized attempt events.
- Material supporting edits invalidate current screen validation and mark any loaded authored result stale.
- Stable `data-target-id` controls remain the only fields scored by the deterministic practice/assessment evaluator.
- Practice mode may reveal correctness immediately; assessment mode continues to hide it until submission.
- Conditional child values are absent when inactive. If populated children would be hidden, the learner must confirm clearing them.
- Repeater additions and removals are explicit, recorded actions. Removal requires confirmation.
- Requested-program filtering must not delete shared household, contact, income, evidence, or nonfinancial facts.
- Every visible control has a label, keyboard-operable native input, and synthetic/provenance helper text where useful.

## Acceptance criteria

- All six scenario fixtures render without console errors.
- Combined and single-program scenarios show only relevant program accordions.
- Alternate address, temporary absence, shared custody, pregnancy, sponsor, disability, self-employment, shelter subsidy, household, income, and resource branches operate and clear inactive data safely.
- Mock results move from unrun to pending/final, become stale after material edits, and never change because of an amount entered by the learner.
- Voice interaction, practice/assessment evaluation, evidence review, event snapshots, notices, authorization, and final recap remain functional.
- Desktop and mobile layouts remain scrollable, keyboard accessible, and free of horizontal page overflow.

## Reference handling

The ClickUp SNAP screen-and-field specification is a read-only design reference. It is not modified by this implementation and is not the runtime contract for BenefitConnect.
