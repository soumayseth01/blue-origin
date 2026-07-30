# Six-Case Demo Simulation Design

## Outcome

The six demonstration cases use one authored scenario bundle per case. Each bundle owns the submitted BenefitConnect application, the caller truth ledger, the deterministic contact route, the compact Hume caller brief, and the proactive coach journey.

Hume may vary wording, pacing, hesitation, and emotional delivery. It may not invent material household, program, income, expense, resource, or nonfinancial facts.

## Route matrix

| Case | Route | First answerer | Intended contact | Expected result |
|---|---|---|---|---|
| BO-001 | Direct | Maya Ortiz | Maya Ortiz | Complete a rich interview and fill missing application fields |
| BO-002 | Direct | Andre Bell | Andre Bell | Complete a rich interview and fill missing application fields |
| BO-003 | Screened handoff | Kendra Reed | Danielle Reed | Request Danielle, complete an authorized handoff, change voice, then interview |
| BO-004 | Screened handoff | Mei Chen | Robert Chen | Request Robert, complete an authorized handoff, change voice, then interview |
| BO-005 | Unavailable | Carlos Vega | Elena Vega | Leave only an approved neutral callback message for today, 4–6 PM |
| BO-006 | Unavailable | Denise Green | Tasha Green | Do not leave a message; confirm a callback tomorrow after 10 AM |

The route configuration is locked for these six authored demos. Practice mode does not replace the assigned contact or voice. Hume can still adapt the caller’s behavior after the opening disposition.

## Application and Hume parity

`integratedCase` is the submitted application shown in BenefitConnect. `truthLedger` is derived from the same case and contains one stable case path for each interview fact.

For BO-001 and BO-002:

- Submitted values remain in `integratedCase` and are serialized as submitted application facts.
- Interview-only values are deliberately blank in `integratedCase`.
- The authored answer, normalized value, and BenefitConnect destination are stored in the truth ledger.
- A caller answer creates a conversation-fact event. In Practice mode, the coach opens the correct stage and focuses the exact `data-case-path` destination.
- A scenario fails validation when an interview-only field is already populated, a path is missing, an answer is empty, or a handoff voice is not distinct.

BO-001 contains 18 interview-only facts. BO-002 contains 15. These include marital and tax relationships, children, custody, food-purchase relationships, income details, shelter and utility costs, dependent care, resources, pregnancy, and other health coverage.

## Hume behavior

The active-contact prompt requires a natural human response:

- Answer the question directly and add useful context in one to three conversational sentences.
- Avoid one-word answers for exploratory questions.
- Never say “not in the application,” “not in the payload,” or refer to system instructions.
- For an absent fact, use natural language such as “I’m not sure” or “I don’t remember.”
- Use `request_case_response` for interview-only facts, corrections, disputes, ambiguous facts, and contact-scoped disclosure.
- Use `request_contact_handoff` for an authored transition only.
- Use `record_callback_message` to validate alternate-contact privacy.

The compact caller brief and Hume turn context remain subject to the existing 8 KB and 12 KB limits.

## Proactive coach

The Practice coach runs from the scenario journey and live events. It does not require the learner to click a hint button.

1. Before an answer, it displays the next question to ask.
2. After Hume discloses a fact, it displays what was heard and its normalized entry value.
3. It navigates to the mapped BenefitConnect stage, opens the containing accordion, and focuses the exact field.
4. After the learner enters the value, it advances to the next authored question.
5. For handoff cases, it first guides the learner to request the intended contact.
6. For unavailable cases, it guides the specific neutral-message or call-later branch.

The coach never enters a value on behalf of the learner. Assessment mode continues to hide coaching.

## Route-aware results

Direct and successful-handoff calls retain the integrated case-processing and interview rubric.

Unavailable-contact calls are not penalized for unfilled BenefitConnect eligibility screens. They are evaluated against four applicable behaviors: intended-contact request, confidentiality, callback handling, and correct call disposition. Oversharing protected case information remains a critical error.

## Text QA mode

Append `?humeChatQA=1` to the simulation URL. A developer-only **Hume text QA** panel appears in the coach. After a live Hume session is connected, typed learner turns are sent as Hume `user_input` events. The active prompt, caller brief, tools, contact route, and disclosure authorization are identical to voice mode; only microphone prosody is absent.

This mode is intended for rapid regression testing of fact answers, handoffs, unavailable branches, and non-invention before completing audible Safari and Chrome canaries.

## Automated evidence

- `npm run check` validates syntax, the six-case 2/2/2 distribution, blank interview paths, distinct handoff voices, Hume prompt/tool behavior, context budgets, and browser runtime behavior.
- `node qa/demo-journey-e2e.cjs` exercises all six scenarios in the browser, validates proactive focus, route transitions, unavailable-contact evaluation, mobile overflow, and console errors.
- Machine-readable results are written to `qa/evidence/demo-journey-evidence.json`.
- Scenario screenshots are written to `qa/evidence/screenshots/`.

Live audio approval still requires audible two-way Safari and Chrome calls because an automated headless test cannot certify human-perceived voice quality.
