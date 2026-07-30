# Demo Journey QA Evidence

The current run is recorded in [demo-journey-evidence.json](./demo-journey-evidence.json).

Validated outcomes:

- 2 direct applicant calls.
- 2 alternate-answerer calls with authorized handoff and distinct voices.
- 2 unavailable-contact calls with different privacy and callback outcomes.
- BO-001 and BO-002 open and focus the exact BenefitConnect destination after the first authored answer.
- BO-005 and BO-006 use route-aware evaluation rather than penalizing unperformed eligibility work.
- All six scenario bundles pass deterministic validation.
- Chromium reports no page/console errors during the journey suite.
- The 390 px mobile viewport has no horizontal overflow.
- The production alias returns HTTP 200 at `https://eligibility-workspace-nu.vercel.app`.

Live Hume canary:

- Secure session confirmed against the deployed Hume configuration.
- The authored Maya greeting was returned: “Hello, this is Maya.”
- The first interview question returned the authored marital-status fact in a natural, multi-sentence answer.
- Two audio chunks were produced for the greeting response.
- The answer contained no “not in the application” or other system-facing language.
- The caller brief was 7,167 bytes and total Hume context was 11,210 bytes, below the configured limits.
- Full milestones and non-sensitive measurements are recorded in [hume-text-canary.json](./hume-text-canary.json).

Six-case live Hume matrix:

- BO-001 returned all 18 authored interview facts and BO-002 returned all 15.
- BO-003 and BO-004 invoked the server-authorized handoff tool, changed the active contact and voice, then returned all authored applicant facts.
- BO-005 invoked the callback-message validator and accepted only the neutral message.
- BO-006 declined message-taking and retained the authored call-later window without invoking the message tool.
- No live caller response exposed application payload, caller-brief, or system-prompt language.
- Non-sensitive milestones and synthetic responses are recorded in [hume-six-case-canary.json](./hume-six-case-canary.json).

Complete direct-case journeys:

- BO-001 entered all 18 authored interview facts into their rendered BenefitConnect case paths and BO-002 entered all 15.
- Both journeys passed all nine workflow stages, loaded only the final authored outcome fixture, completed notices and authorization, and reached post-call results.
- Both scored 60/60 for deterministic case processing, 39/40 for interview behavior, and 99/100 overall with no critical errors or unresolved case risks.
- Structured evidence is recorded in [demo-full-case-e2e.json](./demo-full-case-e2e.json), with authorization and result screenshots for both cases under [screenshots](./screenshots/).

Screenshots:

- [BO-001](./screenshots/bo-001-journey.png)
- [BO-002](./screenshots/bo-002-journey.png)
- [BO-003](./screenshots/bo-003-journey.png)
- [BO-004](./screenshots/bo-004-journey.png)
- [BO-005](./screenshots/bo-005-journey.png)
- [BO-006](./screenshots/bo-006-journey.png)

The automated canary verifies that Hume generated audio data. Final speaker audibility still depends on the browser's microphone and audio permissions; it is not represented as an automated human listening test.
