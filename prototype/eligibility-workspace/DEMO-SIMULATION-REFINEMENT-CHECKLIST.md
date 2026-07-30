# Demo Simulation Refinement Checklist

**Scope:** Six authored BenefitConnect demonstration cases  
**Updated:** July 30, 2026  
**Release boundary:** Synthetic training only; no eligibility engine

## Completion status

### Scenario truth and deterministic routes

- [x] Lock BO-001 and BO-002 to direct applicant calls.
- [x] Lock BO-003 and BO-004 to alternate answerers followed by an authorized handoff.
- [x] Give both handoff contacts distinct Hume voices and reset caller behavior after the transition.
- [x] Lock BO-005 and BO-006 to unavailable-contact branches with different privacy outcomes.
- [x] Give BO-005 a neutral-message branch and BO-006 a no-message/call-later branch.
- [x] Validate the 2 direct / 2 handoff / 2 unavailable distribution in a contract test.

### Application and caller parity

- [x] Make BO-001 and BO-002 rich interview cases with at least 12 deliberately blank material fields.
- [x] Use stable `integratedCase` paths for every authored interview fact.
- [x] Keep submitted application facts, interview-only facts, corrections, and worker-only facts distinct.
- [x] Generate compact caller briefs below 8 KB and total Hume context below 12 KB.
- [x] Exclude evidence conclusions, outcomes, notices, authorization, scoring, and coaching from caller knowledge.
- [x] Block scenario validation when a blank interview fact is prepopulated or a referenced path is missing.

### Natural caller experience

- [x] Use a neutral or name-only phone greeting without assuming the call purpose.
- [x] Require one-to-three-sentence conversational answers for exploratory questions.
- [x] End factual interview answers with a statement and let the learner lead; do not append repetitive “anything else?” questions.
- [x] Prohibit “not in the application/payload/system” language.
- [x] Permit natural hesitation, small talk, clarification, and “I don’t remember” responses.
- [x] Prevent invention of material case facts.
- [x] Retain deterministic handoff, disclosure, and callback privacy tools.
- [x] Correlate ordinary tool-free Hume answers back to authored facts so the coach and results advance.

### Proactive coach and connected workflow

- [x] Show the next best question automatically in Practice mode.
- [x] After a supported caller answer, show the normalized value and exact BenefitConnect destination.
- [x] Automatically navigate, open the correct accordion, and focus the destination field.
- [x] Reveal the Coach tab automatically after a supported caller answer and after the learner enters the mapped value.
- [x] Advance the visible guidance to the next authored question without a hint or locate-button click.
- [x] Advance to the next question after the learner enters the supported value.
- [x] Guide handoff and unavailable-contact branches without requiring a hint-button click.
- [x] Keep the coach hidden in Assessment mode.
- [x] Use route-aware scoring so unavailable callers are not penalized for unperformed eligibility work.

### QA and release gates

- [x] Contract-test scenario distribution, application blanks, caller responses, voice differences, and privacy routes.
- [x] Browser-test all six route starts, proactive field focus, unavailable scoring, mobile overflow, and console errors.
- [x] Verify every BO-001 and BO-002 authored question/answer pair maps to its exact frozen fact and case path.
- [x] Provide developer text-QA mode using the live Hume prompt, brief, tools, and route.
- [x] Canary BO-001 greeting and one rich factual answer with generated Hume audio.
- [x] Run a full factual question matrix for all six callers in live Hume text mode.
- [x] Run live Hume handoff canaries for BO-003 and BO-004, including actual voice/context change.
- [x] Run live unavailable-contact/message canaries for BO-005 and BO-006.
- [x] Record explicit Hume audio-chunk delivery for all six cases and fail the matrix when a case produces no audio output.
- [x] Provide a repeatable Safari/Chrome human-audio worksheet and evidence record.
- [x] Complete an end-to-end BO-001 and BO-002 interview through field entry, evidence, authored outcome, notices, authorization, and results.
- [ ] Perform human-audible Safari and Chrome canaries for direct, handoff, and unavailable routes.
- [x] Deploy the transcript-to-fact synchronization change to Vercel and repeat the full six-case browser suite against production.

## Current implementation focus

All automated release gates are complete. The current six-case production matrix records 35, 30, 10, 9, 3, and 3 Hume audio chunks for BO-001 through BO-006 respectively. The remaining gate is the supervised procedure in `qa/HUMAN-AUDIO-CANARY-CHECKLIST.md`: a person must confirm current Safari and Chrome playback for direct, handoff, and unavailable routes because automated checks cannot certify what reaches the selected output device.
