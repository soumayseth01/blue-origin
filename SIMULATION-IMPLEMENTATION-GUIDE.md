# BlueOrigin Simulation — Complete As-Built Guide

**Status:** Current implementation reference  
**Reviewed:** July 30, 2026  
**Application:** BlueOrigin Product Studio  
**Simulation:** BenefitConnect integrated-eligibility training workspace  
**Programs represented:** Medicaid, SNAP, and TANF  
**Production:** <https://eligibility-workspace-nu.vercel.app>

---

## 1. Executive summary

BlueOrigin Simulation is a synthetic, end-to-end eligibility interview and case-processing experience. A learner reviews a submitted application, conducts a live voice interview with a Hume-powered caller, processes the application through a nine-stage BenefitConnect training replica, reviews evidence, loads authored eligibility outcomes, prepares notices, completes authorization, and receives scored feedback with synchronized replay evidence.

The implementation has three connected experiences:

1. **Simulation authoring** — build a synthetic case manually or with AI; configure application data, caller behavior, contacts, evidence, and authored outcomes; then preview and publish it.
2. **Learner simulation** — prepare and conduct a live applicant call while completing the BenefitConnect workflow.
3. **Evaluation and results** — deterministically score case-processing targets and observable interview behaviors, preserve evidence, and produce an improvement plan.

The system separates three kinds of truth:

- **Application truth:** the authored application, compact caller brief, corrections, and known unknowns.
- **Workflow truth:** the learner's fields, evidence actions, validations, notices, and closure actions.
- **Evaluation truth:** stable scoring targets, rubric weights, critical errors, and captured evidence.

Hume controls voice, conversational wording, and natural reactions. It does not calculate eligibility, score the learner, operate BenefitConnect, or invent material case facts.

---

## 2. Product boundary

### What it is

- A synthetic training environment.
- A state-neutral representation of integrated Medicaid, SNAP, and TANF workflows.
- A realistic practice environment for interviewing, data entry, verification, notices, and closure.
- A deterministic performance-evaluation system.
- A demonstration of grounded, multi-contact voice interaction.

### What it is not

- Not a production eligibility system.
- No federal or state eligibility-rule engine.
- No benefit calculation from entered case data.
- No official case write, issuance, notice, or authorization.
- No policy or legal decision by AI.
- No scoring based independently on Hume emotion measurements.
- No raw audio retention.

### Authored-result rule

**Run mock eligibility** selects an authored `pending` or `final` scenario fixture. Editing a material fact can mark the fixture stale, but it never recalculates or changes the authored outcome.

All such results are presented as **Illustrative authored results**.

---

## 3. End-to-end architecture

```mermaid
flowchart LR
    A["Author builds or selects scenario"] --> B["Frozen scenario package"]
    B --> C["Scenario Library or Assignment"]
    C --> D["Learner call preflight"]
    D --> E["Secure Hume session"]
    D --> F["BenefitConnect case draft"]
    E <--> G["Interview, facts, handoffs"]
    G --> F
    F --> H["Evidence and authored result"]
    H --> I["Notices and authorization"]
    I --> J["Deterministic evaluation"]
    J --> K["Score, replay, improvement plan"]
    K --> L["IndexedDB retry outbox"]
    L --> M["Neon records and private Blob artifacts"]
```

### Standard learner journey

1. Open a case from Assignments or Scenario Library.
2. Select Practice or Assessment.
3. Review the submitted application and call participants.
4. Confirm microphone, caller voice, and output readiness.
5. Start the Hume call.
6. Introduce the call and establish the correct contact.
7. Ask about missing, changed, disputed, or gated facts.
8. Complete the nine BenefitConnect stages.
9. Review documents and resolve evidence discrepancies.
10. Load and interpret the authored mock outcome.
11. Prepare program notices and complete call closure.
12. Submit the attempt and review the result.

---

## 4. Major implementation components

| Component | Function | Information carried | Main files |
|---|---|---|---|
| Product shell | Role-aware navigation and page composition | Route, role, scenario, assignment, result state | `index.html`, `app.js`, CSS files |
| Scenario catalog | Supplies six frozen demo cases | Case identity, application, facts, callers, outcomes, scoring expectations | `app.js`, `integrated-case.js` |
| Authoring workspace | Creates and validates cases | Setup, prompt, integrated case, behavior, contacts, brief, outcomes | `simulation-authoring.js` |
| Call preflight | Prepares the learner and browser | Mode, voice, participants, case brief, mic/output status | `app.js` |
| Hume browser runtime | Manages live voice and audio | Connection phase, access token, audio, transcripts, tool calls | `hume-browser-runtime.js`, `vendor-hume-evi.js` |
| Hume server session | Grounds and authorizes the caller | Applicant view, caller brief, prompt, contact scopes, signed revision | `api/hume/session.js`, `api/_lib/hume-session.js` |
| BenefitConnect | Provides the case-processing replica | Integrated case, program units, evidence, outcomes, notices | `app.js`, `integrated-case.js` |
| Grounded coach | Recommends the next permitted action | Current stage, disclosure, evidence, targets, validation state | `coach-engine.js` |
| Evaluator | Produces processing and interview scores | Target values, transcript, events, closure, critical errors | `app.js` |
| Capture/replay | Preserves attempt evidence | Events, turns, snapshots, targets, observations, citations | `app.js` |
| Performance repository | Stores attempts and trends | Scores, criteria, events, artifacts, learner profile | Performance APIs and migrations |

---

## 5. Navigation and roles

### Roles

- **Author:** creates simulations, reviews the Scenario Library, manages assignments, and examines results.
- **Learner:** launches assigned or available simulations and reviews personal attempts.

### Simulation navigation

The product's **Simulate** group contains:

- **Scenario Library** — published/frozen scenarios and launch actions.
- **Assignments** — assigned cases, status, due information, and continue actions.
- **Attempts & Results** — attempt history, scores, skills, and recommendations.

Authors can enter **Create simulation** from the creation menu.

### Within a simulation

The learner moves through:

1. Configure applicant call.
2. Live BenefitConnect workspace.
3. Post-call result.

The results experience contains:

- Overview;
- Case processing;
- Interview skills;
- Replay; and
- Improvement plan.

---

## 6. Built-in scenario catalog

| Scenario | Case and applicant | Programs | Main focus |
|---|---|---|---|
| BO-001 | CASE-BO-2401 — Maya Ortiz | Medicaid, SNAP, TANF | Initial application, household, reduced wages, pregnancy, expenses |
| BO-002 | CASE-BO-2402 — Andre Bell | Medicaid, SNAP, TANF | Household addition, new job, income and rent change |
| BO-003 | CASE-BO-2403 — Danielle Reed | Medicaid, SNAP, TANF | Renewal, wage-match reconciliation, dependent-care change |
| BO-004 | CASE-BO-2404 — Robert Chen | Medicaid | Tax household, disability/dialysis, ended health coverage |
| BO-005 | CASE-BO-2405 — Elena Vega | SNAP | Spanish captions, liquid resources, shelter, expedited screen |
| BO-006 | CASE-BO-2406 — Tasha Green | TANF | Parent/child unit, earnings, account/vehicle, work participation |

Each scenario contains:

- scenario and case identifiers;
- title, type, requested programs, and objective;
- persona and authored caller behavior;
- submitted application and reported changes;
- gated interview facts and responses;
- integrated case data;
- contact sequence and disclosure authority;
- compact Hume caller brief;
- training targets and expected values;
- pending and final authored outcomes;
- coach-policy metadata; and
- package/version metadata.

---

## 7. Scenario and attempt state

### Authored scenario state

Important properties include:

- `id`, `caseId`, `title`, `type`, and `programs`;
- `persona`, `description`, and `facts`;
- `expected` values;
- `integratedCase`;
- `contactSequence`;
- `callerBrief`;
- `trainingTargets`;
- `authoredOutcomeVariants`; and
- authoring/package metadata.

### Learner attempt state

Opening a scenario creates mutable state for:

- current screen and validated screens;
- Practice/Assessment mode and visibility rules;
- case starting state and working draft;
- field values and material-change state;
- disclosed caller facts;
- evidence review;
- mock-result status;
- closure attestations;
- Hume connection and active contact;
- transcript turns and observations;
- event and screenshot capture;
- validation and score results; and
- local/server synchronization.

The scenario definition remains frozen while the learner's attempt changes.

### Fact status and provenance

The case model distinguishes:

- blank;
- unknown;
- no;
- not applicable;
- submitted;
- confirmed;
- corrected;
- disputed;
- verified; and
- worker-only.

Provenance can identify the application, caller statement, worker entry, document, data match, system, procedure, calculation, or authored fixture.

---

## 8. Simulation authoring

### Creation paths

#### Prompt-assisted

`Setup → Prompt → Nine case stages → AI behavior → Preview`

The author supplies a jurisdiction label, programs, case type, difficulty, channel, objective, focus tags, and a 30–3,000 character prompt. OpenAI Structured Outputs returns a synthetic scenario that the author must review stage by stage.

#### Manual

`Setup → Nine case stages → AI behavior → Preview`

The manual path starts with an empty synthetic integrated case and does not call AI for generation.

### Prompt focus areas

- variable income;
- recent job change;
- self-employment;
- shared custody;
- student status;
- disability;
- medical expenses;
- subsidized shelter;
- prior benefits;
- group living;
- immigration; and
- interstate transfer.

### Synthetic-data controls

- SSN-like patterns are guarded.
- Generated phone numbers use `555`.
- Generated emails use `.invalid`.
- Generated ZIP code uses `00000`.
- Generated simulations are not represented as sourced policy content.

### Repeaters

Authors can add people, income sources, resources, utilities, dependent-care expenses, medical expenses, evidence, and outcome rows. Removing populated records requires confirmation.

### Program-aware behavior

Selecting a program creates its request, person participation, unit, authored outcome, notice, and authorization structures. Removing a program asks before clearing populated program-owned data.

### Call participants

Authors configure:

- direct, screened, or authorized-contact mode;
- answering and intended contacts;
- voice, language, greeting, behavior, and intensity;
- knowledge and disclosure scope;
- contact availability;
- handoff path; and
- callback/message authority.

Publication is blocked for missing contacts, invalid screened-call identity, missing handoff voice, or an unavailable-contact branch without an outcome.

### Caller-brief preview

The author can inspect the exact compact information Hume receives, including fact paths, known unknowns, corrections, gated facts, size, count, and worker-only exclusions.

The caller brief must remain below 8 KB. Invalid paths, conflicts, or incomplete corrections block publication.

### Draft, preview, and publish

- Draft state is saved to `localStorage` under `blueorigin-simulation-authoring`.
- Preview adds a preview-only case to the learner runtime.
- Publish freezes a `v0.1` package in the current runtime and places it in Scenario Library.

**Current boundary:** author-created simulation publication is browser/runtime based, not yet a durable multi-user server repository.

---

## 9. Learner preflight

The **Configure applicant call** screen includes:

### Header

- Back / save and exit
- Synthetic case and case ID
- Scenario title
- Voice connection status
- Practice/Assessment selector

### Voice and behavior

- Caller behavior profile
- Opening behavior
- Low, moderate, or high intensity
- Behavior explanation
- Selected Hume voice and metadata
- Real voice preview

Practice can permit caller overrides. Assessment restores the authored assignment settings.

### Participants

- Call mode
- Who answers first
- Intended contact
- Contact roles and relationship
- Greetings
- Authored handoff route

### Audio readiness

- Microphone status
- Echo cancellation, noise suppression, and automatic gain-control information
- Output volume
- Voice test
- Browser-specific error and retry messaging

### Case brief

- Application type and case ID
- Programs and received date
- Starting stage and objective
- Primary applicant
- Submitted information
- Reported changes
- Topics to confirm
- Available evidence

---

## 10. Hume live-call runtime

### Startup state machine

`Request microphone → Prepare caller audio → Create secure session → Connect to Hume → Confirm chat metadata → Connected`

### Connection protections

- Microphone request starts from the learner's Start-button gesture.
- Permission help appears after about 2 seconds.
- Microphone setup times out after 45 seconds.
- Secure-session and connection stages have deadlines.
- Hume connection allows two retry attempts within an 18-second window.
- `chat_metadata` is required before capture and greeting.
- The greeting starts roughly 650 ms after confirmation.
- A 12-second watchdog catches a silent first response.
- Every retry cleans up the old socket, recorder, stream, player, timers, and audio.
- Connection-attempt IDs reject late events from abandoned sessions.

### Audio input

- One live microphone track.
- Browser-supported WebM, MP4, or WAV capture.
- MediaRecorder starts only after Hume confirms the session.
- Short audio chunks are sent continuously.

### Audio output

- Uses Hume's `EVIWebAudioPlayer`.
- Sends complete `audio_output` events to preserve response ID and chunk order.
- Supports AudioWorklet playback with buffer fallback.
- Volume, mute, pause, interruption, handoff, and teardown all control the same player.
- Suspended audio contexts require a renewed user gesture instead of continuing silently.

### Turn policy

| Setting | Value |
|---|---:|
| End-of-turn silence | 2,000 ms |
| Minimum interruption | 1,200 ms |
| Speech threshold | 0.5 |
| Prefix padding | 300 ms |
| Quick responses | Off |
| Automatic Hume nudges | Off |
| Inactivity timeout | 180 seconds |
| Maximum duration | 1,800 seconds |

Learner interruption clears pending caller audio. Pause, handoff, speech, playback, or call termination cancel silence handling. After 20 seconds of genuine silence, one “Hello—are you still there?” check-in can be issued.

### Diagnostics

The runtime distinguishes microphone, unsupported media, audio activation, session, socket, metadata, response, and playback failures. Safe diagnostics contain phase and technical milestones, never audio, transcript, case facts, prompt, or token data.

---

## 11. Caller grounding

### Compact caller brief

Hume receives a scenario-specific `DemoCallerBrief`, rather than the full integrated application. It can contain:

- caller identity, role, greeting, language, and behavior;
- application type, programs, and dates;
- household members and relationships;
- employment, income, hours, frequency, and changes;
- representative expenses and resources;
- pregnancy, disability, health-coverage, and TANF facts;
- facts the caller does not know or remember;
- authored corrections and disputes; and
- contact availability, handoff, and callback behavior.

Submitted facts reference stable integrated-case paths. The brief is limited to 8 KB; total turn-time Hume context is limited to 12 KB.

### Excluded information

The caller does not receive worker-only evidence conclusions, eligibility outcomes, notices, authorization, scoring, coaching, or system-operation details.

### Allowed improvisation

Hume can improvise natural wording, pacing, hesitation, emotional reactions, small talk, clarification, and “I don't remember.”

It cannot invent people, dates, addresses, programs, income, expenses, resources, nonfinancial facts, documents, application history, eligibility, or agency actions.

When a material fact is absent, the caller must say it is unknown, not provided, or not remembered.

### Synchronization rule

Ordinary BenefitConnect edits do not become caller knowledge. Only explicitly confirmed, corrected, or disputed conversation facts can update the signed Hume context revision.

---

## 12. Multi-contact calls

### Supported flows

- Applicant answers directly.
- Another person answers and hands the phone to the applicant.
- An authorized representative answers and continues.
- Applicant is unavailable and a limited callback message is handled.

Only one AI contact speaks at a time.

### Per-contact configuration

- Contact/person ID
- Name, relationship, and role
- Preferred language
- Voice and greeting
- Initial behavior
- Knowledge scope
- Disclosure authority
- Message authority

### Availability states

- Available and accepts handoff
- Temporarily unavailable
- Not at the location
- Declines the call
- Answerer authorized to continue

### Handoff

Hume calls `request_contact_handoff`. The server verifies the authored transition, pauses responses, clears old audio, records an event, changes active identity/voice/knowledge/behavior, waits about 1.5 seconds, and resumes with the new contact's greeting.

The UI shows the transition and transcripts retain contact ID, name, and role.

### Callback privacy

Unauthorized answerers can receive only neutral worker, agency, callback-number, and return-call information. Program, application, evidence, eligibility, and benefit details are blocked.

### Contact tools

- `request_case_response`
- `request_contact_handoff`
- `record_callback_message`

All tools validate the active contact and signed revision. Stale revisions, impossible handoffs, and unauthorized disclosures are rejected.

---

## 13. BenefitConnect UI and field model

### Desktop composition

- Top call header
- Left workflow rail
- Central BenefitConnect workspace
- Resizable right simulation-assistant panel

### Field types

- Text, email, date, and time
- Currency
- Selects
- Radio groups
- Checkboxes and switches
- Textareas
- Person selectors
- Repeaters
- Read-only provenance
- Conditional accordions
- Program-specific panels

Supporting fields use stable `data-case-path` values. Scored controls use stable `data-target-id` values.

### Conditional clearing

Turning off a populated condition prompts before clearing child fields. Covered examples include alternate mailing address, representative, urgent need, temporary absence, shared custody, pregnancy due date, shelter subsidy, disability, and sponsor information.

### Material changes

Material edits mark an existing authored result stale. Reloading the fixture does not recalculate eligibility.

---

## 14. Nine BenefitConnect stages

### 1. Intake & requests

Application/change/renewal type, channel, received date/time, contact preference, language, interpreter, accessibility, addresses, representative, program requests, urgent needs, and interview scheduling.

Demo targets: interview required and interview date.

### 2. Household

Repeatable people; identity; relationship; residence; temporary absence; custody; marital/tax relationships; pregnancy; SNAP food relationship; TANF role; and per-person program participation.

Demo targets: relationship and food-unit relationship.

### 3. Programs

Shared household plus Medicaid tax household/pathway, SNAP food unit/expedited screen, TANF assistance unit, per-person inclusion states, other coverage, and prior-benefit facts.

Demo targets: SNAP food group and expedited-screen status.

### 4. Financial

Employment, self-employment, unearned/rental/one-time income, rate, hours, frequency, gross, dates, expected changes, shelter, utilities, dependent care, support, medical expenses, accounts, vehicles, and resources.

No income, deduction, or resource policy test is applied.

Demo targets: pay frequency, gross per pay, and monthly converted income.

### 5. Non-financial

Identity/SSN status, residency, citizenship/immigration, sponsor, disability, blindness, student, pregnancy, caretaker, health coverage, TANF participation, absent-parent/cooperation, prior benefits, and disqualification history.

Demo targets: residency and citizenship.

### 6. Evidence

Documents and data matches linked to person/program/fact, status, discrepancy, resolution, due date, and worker notes.

Opening evidence does not verify it. The learner records what it supports and resolves discrepancies.

Demo targets: wage-document review and wage-match resolution.

### 7. Eligibility

Run reason, unrun/pending/final/stale status, program/person/month rows, authored amounts, reasons, pending items, and review attestation.

**Run mock eligibility** loads the authored fixture only.

### 8. Notices

Program-specific notice type, effective period, verification request and due date, delivery, language, appeal-information acknowledgement, and comments.

Demo targets: notice type and processing summary.

### 9. Authorization

Program action, effective date, unresolved items, fact/evidence/communication attestations, call closure, and prototype-only submission.

No official authorization occurs.

---

## 15. Practice and Assessment

| Feature | Practice | Assessment |
|---|---|---|
| Coach | Visible | Hidden/locked |
| Policy help | Available | Hidden |
| Locate/highlight | Available | Disabled |
| Correctness | Immediate after validation | Delayed until submission |
| Failed stage | Blocks until corrected | Records and allows continuation |
| Caller override | Can be allowed | Restored to authored assignment |
| Final evaluator | Deterministic | Same deterministic evaluator |

Assessment changes assistance visibility, not the scoring rubric.

---

## 16. Grounded coach

The coach uses deterministic state, not free-form AI decision-making.

### Inputs

- Current stage and target values
- Fact-disclosure state
- Evidence status
- Validation failures
- Mock-result status
- Stage completion
- Call closure

### Priority

1. Required evidence before result/notice/authorization.
2. Ask for an undisclosed fact.
3. Enter a disclosed fact.
4. Review evidence.
5. Correct a failed Practice value.
6. Load/review the authored result.
7. Complete the remaining target.
8. Validate.
9. Navigate.
10. Close and submit.

The coach does not reveal applicant values before disclosure unless the value is explicitly safe from a procedure, system record, or document.

OpenAI may improve recommendation wording through `/api/studio/coach/recommend`, but the client rejects any result whose action, target, policy, or information differs from the deterministic recommendation.

**Locate field** navigates, opens the accordion, scrolls, focuses, and highlights the stable target.

---

## 17. Event capture and replay

### Events

Navigation, fields, repeaters, condition clearing, voice, evidence, validation, mock results, notices, authorization, coaching, handoffs, call end, and submission generate normalized events.

Events can carry timestamp, channel, action, stage, target/path, before/after, expected value, correctness, sequence, label, citation, and snapshot link.

### Transcript turns

Turns include speaker, transcript, timing, disclosed fact IDs, caller contact ID/name/role, and `raw_audio_persisted: false`.

### Screenshots

Meaningful events capture the live BenefitConnect region. Final submission reconstructs or captures all nine stages and identifies unvisited stages.

### Midscene

Midscene has `guide_and_observe_only` authority. It can locate semantic targets and create observations but cannot enter data or decide correctness.

### Replay

Replay synchronizes timeline event, transcript, BenefitConnect screenshot, target/path, evaluation, and citation. Filters cover all, critical, questions, data, evidence, and strong moments.

---

## 18. Scoring model

### Overall score

- Case processing: **60 points**
- Interview skills: **40 points**

### Processing rubric

| Criterion | Points |
|---|---:|
| Application review and discrepancy resolution | 10 |
| Household and program groups | 10 |
| Income, resources, expenses, deductions | 12 |
| Nonfinancial factors | 8 |
| Evidence and data matches | 8 |
| Result interpretation | 5 |
| Notices, documentation, authorization | 7 |

Only designated targets are scored. Supporting fields are recorded for realism and replay.

### Interview rubric

| Criterion | Points | Current evidence |
|---|---:|---|
| Identity, confidentiality, purpose | 4 | First learner turn patterns |
| Complete non-leading questions | 10 | Authored fact coverage |
| Listening and paraphrasing | 8 | Confirmation language |
| Empathy and professionalism | 7 | Supportive-language heuristics |
| Plain language | 6 | Jargon/plain-language heuristics |
| Closure | 5 | Facts, evidence, next steps, summary |

Hume expression measurements are supporting observations only.

### Critical errors

- Required verification unresolved
- Materially incorrect notice
- Critical discrepancy unresolved
- Incorrect authorization/result interpretation

Any critical error caps the score at 69.

### Result bands

- Pass: at least 80 and no critical error
- Proficient: 90–100
- Meets expectations: 80–89
- Developing: 70–79
- Needs coaching: below 70

---

## 19. Results experience

### Overview

Overall score, pass/fail, 60/40 breakdown, critical-error banner, strengths, and priorities.

### Case processing

Criterion points, field checks, actual/expected values, severity, sequence, target, and citation.

### Interview skills

Observable behavior, linked transcript evidence, contextual Hume observations, and recommended alternative behavior.

### Replay

Time-linked transcript, action, screenshot, target, and evaluation rationale.

### Improvement plan

Targeted recommendations based on low-performing criteria and an option to retry the scenario.

### Attempts & Results

Latest score, attempt history, processing/interview trends, rolling skill profile, strengths, gaps, and recommended practice.

---

## 20. Persistence

### Browser outbox

- IndexedDB database: `blueorigin-performance-v1`
- Store: `attempt_outbox`

Attempts remain queued for retry when offline or when upload fails.

### Neon records

- `learning_attempts`
- `criterion_results`
- `skill_observations`
- `attempt_events`
- `attempt_artifacts`
- `learner_skill_profiles`
- `practice_recommendations`

### Private artifact storage

Vercel Blob stores screenshots, transcript/replay data, and attempt evidence. Artifacts are checksummed and receive a 180-day retention date. A protected cron endpoint expires eligible files.

### Finalization

1. Build evaluation and attempt metadata.
2. Queue locally.
3. Finalize attempt on the server.
4. Upload artifacts.
5. Mark synchronization complete.
6. Refresh learner history/profile.

Saving an incomplete call preserves work without creating a score and leaves the assignment in progress.

---

## 21. Security and privacy

- Hume credentials and access-token creation remain server-side.
- The browser receives a short-lived token and signed session context.
- Tool calls validate session proof and revision.
- Worker-only content is excluded from caller knowledge.
- Disclosure and message authority are server checked.
- Raw audio is not persisted.
- Diagnostics exclude audio, transcript, prompts, tokens, and facts.
- All demo case data is synthetic.
- Replay artifacts use private Blob storage.

---

## 22. UI/UX and accessibility

### Desktop

- Focused preflight with case brief.
- Left workflow rail, center case workspace, right assistant panel.
- Assistant panel resizes from roughly 360–640 px.
- Dense information uses cards, accordions, repeaters, tables, and status bars.
- Synthetic/demo boundaries are visible throughout.

### Live controls

- Connection and timer
- Volume and mute
- Pause/resume caller
- Active contact and handoff state
- End call
- Captions/transcript
- Caller observations
- Mode-appropriate coach

### Responsive behavior

- Product navigation becomes a drawer.
- Workflow and assistant panels become drawers.
- Author step navigation scrolls horizontally.
- Author actions remain in a sticky footer.
- Mobile cards become full width.
- Dense tables scroll internally rather than forcing page overflow.
- Reduced-motion preferences are respected.

### Accessibility patterns

- Skip link and named landmarks
- Labeled controls
- Stable target/path attributes
- Live regions for captions, status, screen, and toasts
- Keyboard-operable dialogs and controls
- Keyboard assistant-panel resizing
- Focus on invalid fields/stages
- Captions and replay image descriptions
- Reduced-motion support

---

## 23. Screen packs

The frozen demo screen pack is `screen-pack:blueorigin-demo-v1` and contains nine 1280×720 stage references, expected semantic targets, transitions, mappings, sanitization metadata, and human approval state.

The learner operates live HTML. Screen-pack images support reference/import and replay; they do not determine correctness.

---

## 24. API surface

### Hume

- `GET /api/hume/health`
- `POST /api/hume/session`
  - `start`
  - `case_response`
  - `contact_handoff`
  - `callback_message`
  - `context_update`
  - `client_diagnostic`

### Simulation and coach

- `POST /api/studio/simulations/generate`
- `POST /api/studio/coach/recommend`

### Performance

- `POST /api/performance/attempts/finalize`
- `POST /api/performance/attempts/:id/artifacts`
- `POST /api/performance/attempts/:id/sync-complete`
- `GET /api/performance/demo/history`
- `GET /api/performance/demo/profile`

---

## 25. Code map

| File | Responsibility |
|---|---|
| `prototype/eligibility-workspace/index.html` | Shell, simulation regions, dialogs, result containers |
| `prototype/eligibility-workspace/app.js` | Scenarios, runtime, navigation, rendering, Hume orchestration, events, scoring, replay, persistence |
| `prototype/eligibility-workspace/integrated-case.js` | Case schema, fields, conditions, repeaters, program filtering, authored outcomes |
| `prototype/eligibility-workspace/simulation-authoring.js` | Authoring, validation, behavior, contacts, preview, publication |
| `prototype/eligibility-workspace/coach-engine.js` | Deterministic coach |
| `prototype/eligibility-workspace/hume-browser-runtime.js` | Hume browser adapter and audio lifecycle |
| `prototype/eligibility-workspace/vendor-hume-evi.js` | Local Hume browser bundle |
| `prototype/eligibility-workspace/api/hume/session.js` | Hume token and voice operations |
| `prototype/eligibility-workspace/api/_lib/hume-session.js` | Grounding, contact authorization, tools, signed context |
| `prototype/eligibility-workspace/api/_lib/caller-brief.js` | Compact brief construction/validation |
| `prototype/eligibility-workspace/api/_lib/simulation-schema.js` | Generated-case schema |
| `prototype/eligibility-workspace/api/_lib/performance.js` | Attempt and skill-profile persistence |
| `prototype/eligibility-workspace/migrations/001_performance_repository.sql` | Performance database model |
| `prototype/eligibility-workspace/qa/` | Contract and browser QA |

Related specifications:

- `prototype/eligibility-workspace/integrated-eligibility-spec.md`
- `prototype/eligibility-workspace/hume-interview-spec.md`
- `prototype/eligibility-workspace/design-qa.md`
- `prototype/eligibility-workspace/DEPLOYMENT.md`

---

## 26. Validation coverage

`npm run check` performs JavaScript syntax validation and runs contracts for:

- grounded coach behavior;
- Hume multi-contact sessions;
- Hume configuration resilience; and
- Hume browser runtime behavior.

Additional QA covers integrated eligibility, authoring, caller briefs, contacts, two-turn voice continuity, performance persistence, post-call feedback, attempt history, and visual regressions.

Audible Safari and Chrome canaries remain required for voice releases because permission, audio activation, and WebSocket behavior cannot be completely proven by headless tests.

---

## 27. Current findings and limitations

### Validated strengths

- Six complete demonstration cases.
- Fully navigable nine-stage BenefitConnect workflow.
- Live Hume voice with compact grounding and multi-turn conversation.
- Multi-contact and authorized handoff structures.
- Server-authorized caller knowledge and disclosure.
- Distinct Practice and Assessment assistance models.
- Connected evidence, outcomes, notices, authorization, scoring, and replay.
- Server-backed attempt storage with offline retry.
- Explicit no-eligibility-engine boundary.

### Authoring persistence

Author drafts are local and published cases enter the current browser/runtime library. Durable multi-user simulation storage, lifecycle, and version governance are not yet implemented.

### Scoring is tuned to the frozen demos

The evaluator uses a shared `demoTargetMap`. Some targets contain BO-001-specific values, including Maya/Elena SNAP grouping, a fixed wage cadence, and a fixed gross amount. Scenario `expected` data adjusts only part of the map.

The six built-in cases are therefore the validated demonstration baseline. A schema-derived, program-aware target compiler is needed before arbitrary authored cases can be scored authoritatively.

### State-neutral policy

Policy cards and the rubric are demonstration guidance. Jurisdiction and customer policy must supersede them before production use.

### Interview heuristics

The 40-point interview score uses transparent transcript/workflow heuristics. It has not yet been calibrated against expert human raters for high-stakes use.

### Hume expression

Expression signals are observational coaching context, not objective emotional truth or independent scoring evidence.

### Guided fallback

A browser speech-synthesis path remains for fallback/testing. Live-call errors show a diagnostic and retry rather than automatically changing modes.

### Identity and tenancy

Performance history can use a demo learner identity. Production use requires authentication, tenant isolation, roles, and assignment governance.

---

## 28. Recommended hardening sequence

1. Persist simulations, versions, assignments, and publication events on the server.
2. Compile training targets from each authored scenario.
3. Exclude irrelevant program targets by construction.
4. Version the rubric and target set inside every package.
5. Calibrate interview scoring against expert raters.
6. Add tenant identity, roles, and access controls.
7. Retain Safari/Chrome audible canaries for every Hume change.
8. Automate every direct, screened, unavailable, and authorized-contact branch.

---

## 29. System contract

> An author supplies a synthetic application, caller behavior, contact rules, facts, evidence, and authored outcomes. A learner interviews one active caller at a time and processes the case through a realistic nine-stage BenefitConnect replica. Hume controls natural delivery within a compact, server-authorized knowledge boundary. Workflow actions and transcript evidence are evaluated deterministically and returned as a 100-point result with replay and coaching. No component calculates or writes real eligibility.
