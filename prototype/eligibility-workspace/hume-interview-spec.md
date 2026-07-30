# Full-Application, Multi-Contact Hume Interview Contract

## Boundary

The live caller is a synthetic training participant. Hume does not calculate eligibility, interpret policy, coach or score the learner, operate BenefitConnect, or receive worker-only conclusions. The BenefitConnect workflow, authored outcomes, deterministic evaluation, and guided fallback remain separate.

## Applicant case view and demo caller brief

`ApplicantCaseView` is created from the scenario's frozen `integratedCase` at call start. It includes applicant-facing application metadata and contact preferences, household people and relationships, program requests, income, expenses, resources, and nonfinancial facts. It excludes evidence conclusions, data-match findings, eligibility outcomes, notices, authorizations, scoring, coaching, and ordinary learner edits made after the call begins.

Every flattened `ApplicationFact` has a stable case path, submitted and applicant-known values, provenance, status, and allowed contact IDs. Supported states are submitted, confirmed, corrected, disputed, unknown, not applicable, and worker only. Conversation facts enter persistent Hume context only through a server-authorized tool response.

For the six demonstration scenarios, `DemoCallerBrief` is the only application-fact payload placed directly in Hume's turn-time context. It resolves a representative set of stable `ApplicantCaseView` paths at call start and includes identity, application metadata, household relationships, requested-program statuses, income, expenses, resources/vehicle information, and relevant nonfinancial facts. The complete `ApplicantCaseView` remains in the signed server envelope for deterministic tool authorization and never enters Hume context.

Each brief is limited to 8,192 serialized bytes. The combined Hume system prompt and persistent context are limited to 12,288 bytes. The server validates every referenced path, caller identity, submitted value, correction mapping, and size before issuing a live session. Worker evidence, authored outcomes, notices, authorization, scoring, and coaching are explicitly excluded.

Hume may improvise wording, pacing, hesitation, emotional reactions, small talk, and clarification requests. It may not invent material names, relationships, dates, programs, income, expenses, resources, health or nonfinancial facts, documents, application history, eligibility results, or agency actions. An absent material fact must be described as not provided, unknown, or not remembered.

## Contact sequence

`ContactSequenceConfig` supports:

- `direct`: the intended applicant answers.
- `screened`: another household or answering contact answers, and the server may authorize a sequential handoff.
- `authorized_contact`: an authorized representative answers and may continue within their authored authority.

Each `SimulationContact` has a contact/person ID, name, role, relationship, language, voice, greeting, starting disposition and intensity, knowledge scope, disclosure authority, and message authority. Availability values are `available_handoff`, `temporarily_unavailable`, `not_at_location`, `declines_call`, and `answerer_authorized`.

Only one synthetic contact may speak at a time. A screened handoff requires different answering and intended contacts, an authored transition, an available intended contact, and a target voice. The runtime pauses responses, clears queued audio, changes the signed active-contact context, prompt, and `voice_id`, waits 1.5 seconds, then resumes. Transcript turns and audit events retain the active contact ID.

## Server-authorized tools

Every live session dynamically equips Hume with three function schemas:

- `request_case_response`: checks the signed revision, active contact, fact/path, knowledge scope, and disclosure authority before returning a fact.
- `request_contact_handoff`: checks the signed revision and authored transition before changing contact, voice, prompt, and behavior seed.
- `record_callback_message`: checks the signed revision and message authority. Limited messages may contain only a neutral agency/worker identity, callback number, and return-call request.

Each response returns a signed session proof and context revision. Stale revisions, inactive contacts, unconfigured contacts, impossible handoffs, and unauthorized disclosures are rejected. Hume credentials and authorization logic remain server-side.

## Natural turn policy

The required Hume configuration is:

| Setting | Value |
|---|---:|
| End-of-turn silence | 2,000 ms |
| Minimum interruption | 1,200 ms |
| Speech detection threshold | 0.5 |
| Prefix padding | 300 ms |
| Quick responses | Disabled |
| Automatic Hume nudges | Disabled |
| Inactivity timeout | 180 seconds |
| Maximum duration | 1,800 seconds |

The application sends the configured neutral greeting 650 ms after the microphone and WebSocket are ready. It immediately stops and clears caller playback on learner speech or `user_interruption`, rejects late chunks associated with the interrupted response, and provides an explicit Pause/Resume caller control. After 20 seconds of genuine silence, the application injects one `Hello—are you still there?` check-in. Speech, transcript activity, playback, pause, handoff, or termination cancels that timer.

`npm run hume:configure` creates a new Hume configuration version while retaining the current prompt, language model, voice, tools, built-in tools, and webhooks. `/api/hume/health` reports the active version and whether required settings are present without returning credentials.

## Authoring and publication

The AI Behavior stage contains Call participants. Authors select the call path, answering and intended contacts, availability, callback window, and each contact's voice, greeting, starting behavior, language, knowledge scope, and authorities. Publication is blocked for missing contacts, same-person screened calls, missing handoff voices, or unavailable branches without a message/callback outcome. Similar voices produce a non-blocking warning.

The same stage displays the exact resolved caller brief, serialized size, included fact count, gated fact count, and excluded worker-only sections. Corrections and disputes must map to an existing submitted case path and contain an authored response. Changing the application automatically rebuilds the brief; publication is blocked when a path is missing, a correction is incomplete, or a size limit is exceeded.

## Audit and retention

Saved attempts include the frozen applicant envelope, contact sequence, active contact, contact-labeled transcript turns, conversation fact events, handoff events, callback validation outcomes, and affect observations. Raw audio remains transient. Hume expression measurements are observations and never independently determine emotional truth or scoring.
