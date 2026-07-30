# Human-Audible Hume Release Canary

**Production:** <https://eligibility-workspace-nu.vercel.app>  
**Scope:** Synthetic training cases only  
**Purpose:** Certify what a person hears through the selected output device. Automated Hume tests already verify session creation, prompt grounding, tools, route transitions, and `audio_output` delivery; they cannot certify speaker audibility or perceived voice changes.

## Before starting

- [ ] Use current desktop Safari with site microphone permission allowed.
- [ ] Use current desktop Chrome with site microphone permission allowed.
- [ ] Confirm the browser tab and operating-system output are not muted.
- [ ] Set Product Studio output to approximately 80%.
- [ ] Use Practice mode and the production alias above.
- [ ] End each call before opening the next case.

## Safari

### Direct applicant — BO-001

- [ ] Open **Combined Medicaid, SNAP & TANF initial application**.
- [ ] Start the live call and hear Maya's opening greeting.
- [ ] Say: “Hi Maya, this is the county eligibility office. Are you married?”
- [ ] Hear a natural multi-sentence answer explaining that she is separated and her husband is not in the home.
- [ ] Confirm the call remains connected for a second learner turn.

### Authorized handoff — BO-003

- [ ] Open BO-003 and start the live call.
- [ ] Hear the alternate answering contact first.
- [ ] Introduce the call and ask for the intended applicant by name.
- [ ] See the visible contact transition and hear the authored handoff pause.
- [ ] Hear a clearly different intended-applicant voice after the transition.
- [ ] Ask one case question and hear a grounded answer from the intended applicant.

### Applicant unavailable — BO-005

- [ ] Open BO-005 and start the live call.
- [ ] Hear the alternate answering contact.
- [ ] Ask for the intended applicant and hear that they are unavailable.
- [ ] Leave only the worker name, agency, callback number, and return-call request.
- [ ] Hear the neutral callback message accepted without application or benefit details being disclosed.

## Chrome

### Direct applicant — BO-001

- [ ] Open **Combined Medicaid, SNAP & TANF initial application**.
- [ ] Start the live call and hear Maya's opening greeting.
- [ ] Say: “Hi Maya, this is the county eligibility office. Are you married?”
- [ ] Hear a natural multi-sentence answer explaining that she is separated and her husband is not in the home.
- [ ] Confirm the call remains connected for a second learner turn.

### Authorized handoff — BO-003

- [ ] Open BO-003 and start the live call.
- [ ] Hear the alternate answering contact first.
- [ ] Introduce the call and ask for the intended applicant by name.
- [ ] See the visible contact transition and hear the authored handoff pause.
- [ ] Hear a clearly different intended-applicant voice after the transition.
- [ ] Ask one case question and hear a grounded answer from the intended applicant.

### Applicant unavailable — BO-005

- [ ] Open BO-005 and start the live call.
- [ ] Hear the alternate answering contact.
- [ ] Ask for the intended applicant and hear that they are unavailable.
- [ ] Leave only the worker name, agency, callback number, and return-call request.
- [ ] Hear the neutral callback message accepted without application or benefit details being disclosed.

## Release decision

- [ ] All six representative browser/route checks passed.
- [ ] No silent call, clipped first greeting, overlapping speakers, mixed contact identity, premature disconnect, or late audio was observed.
- [ ] Record the date, browser versions, output device, tester, and any notes in `qa/evidence/human-audio-canary.json`.
- [ ] Mark the human-audible gate complete in `DEMO-SIMULATION-REFINEMENT-CHECKLIST.md` only after the tester confirms all checks.

If any check fails, record the browser, case, route, exact failed step, visible connection phase, and whether transcript text appeared despite missing audio. Do not substitute guided simulation for the failed live-call canary.
