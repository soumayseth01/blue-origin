# QC Platform — Engineering Team Working Document

| Document field | Current value |
|---|---|
| Status | Working draft |
| Date | July 28, 2026 |
| Purpose | Align on what we are building and validate the people required to build it |
| Primary reviewer | Engineering Head — India |
| Document owner | Soumay |
| Next review | _To be scheduled_ |

> **How to use this document:** Add comments directly in the tables, revise assumptions where needed, identify available people, and capture agreed decisions in the decision log. Nothing in this document should be treated as a final staffing commitment until it is recorded as approved.

## Review outcomes

By the end of the engineering review, we should have:

- A shared understanding of the proposed product and integration scope.
- Agreement on the boundaries and sequencing of the three priority use cases: QC Reviewer, Training, and Agent Builder.
- Agreement on the minimum technical capabilities needed for the initial build.
- A recommended India team structure and role-combination strategy.
- An initial view of available people, start dates, and employment model.
- An estimated monthly and annual people cost, including the assumptions behind the estimate.
- A recommended incentive structure for attracting, delivering with, and retaining the initial team.
- A list of technical unknowns requiring discovery before estimates are finalized.
- Named owners and dates for the next actions.

## Working assumptions

| ID | Assumption | Reviewer response | Status |
|---|---|---|---|
| A1 | The initial build will be led by an India-based engineering team. | _Add feedback_ | Open |
| A2 | The first delivery pod will be approximately 7.0 FTE equivalent. | _Add feedback_ | Open |
| A3 | Initial integrations may use APIs, batch extracts, structured exports, or supervised workflows depending on customer access. | _Add feedback_ | Open |
| A4 | Production-grade security, testing, observability, and deployment practices are required from the beginning. | _Add feedback_ | Open |
| A5 | Some roles may be combined initially, provided the required capabilities and ownership remain explicit. | _Add feedback_ | Open |
| A6 | Additional pods or capacity will be added only against signed backlog. | _Add feedback_ | Open |
| A7 | SharePoint, Google Docs, and Microsoft Word can be used as connected content and editing surfaces while workflow state remains in the platform. | _Add feedback_ | Open |
| A8 | The Agent Builder should use APIs where available and supervised screen interaction where APIs are unavailable. | _Add feedback_ | Open |
| A9 | High-impact system actions will require explicit human approval and a complete audit trail. | _Add feedback_ | Open |

## 1. What we are trying to build

### Systems and integration

Evidence must connect across the state technology environment.

#### Source systems

- Application portal and mobile
- Contact center and interview
- Document imaging / enterprise content management
- Verification services and data matches
- Eligibility and case system of record
- Rules and benefit calculation

#### QC reviewer core: case coherence engine

The proposed platform brings together the information needed to evaluate whether a case is complete, consistent, policy-aligned, and correctly resolved. Its core capabilities include:

- Application reader
- Interview quality reviewer
- Evidence checker
- System-of-record field comparator
- Policy adjudication checker
- Notice and action reviewer
- QC error explainer

#### Decision and learning systems

- Notices and correspondence
- EBT and benefit issuance
- Supervisor authorization
- Formal QC and audit reporting
- Training and knowledge
- Corrective-action analytics

#### Integration paths

- Read API or secure service
- Scheduled extract or batch
- Structured reports and exports
- Screen export or supervised MVP
- Documents initially, followed by event-based integration

#### Proposed integration sequence

| Priority | Scope |
|---|---|
| P0 | Application, system of record, budgets, notices, and policy |
| P1 | Interview, document management, and verification |
| P2 | EBT, QC, and training |
| P3 | Real-time assistance |

### Technical review notes

| Review area | Engineering feedback | Owner | Follow-up date |
|---|---|---|---|
| Overall architecture | _Add feedback_ | _TBD_ | _TBD_ |
| Integration feasibility | _Add feedback_ | _TBD_ | _TBD_ |
| AI / ML approach and evaluation | _Add feedback_ | _TBD_ | _TBD_ |
| Data and knowledge architecture | _Add feedback_ | _TBD_ | _TBD_ |
| Security and privacy | _Add feedback_ | _TBD_ | _TBD_ |
| Testing and release strategy | _Add feedback_ | _TBD_ | _TBD_ |
| Deployment and production support | _Add feedback_ | _TBD_ | _TBD_ |

## 2. Priority use cases

The initial product vision includes three connected use cases. At this stage, the goal is to communicate the scope clearly, confirm that the direction is technically credible, and understand the people required—not to finalize the architecture.

### Use case 1 — QC Reviewer

The QC Reviewer brings the relevant case information together and helps a human reviewer determine whether the case was handled correctly and consistently with policy.

**High-level scope:**

- Read the application, interview, evidence, case-system data, calculations, notices, and applicable policy.
- Assemble a clear case summary and evidence timeline.
- Identify missing information, contradictions, and potential processing errors.
- Explain the issue and connect it to the relevant evidence and policy.
- Draft a QC finding or reviewer workpaper for human confirmation.
- Feed confirmed error patterns into corrective-action reporting and training.

The human reviewer remains responsible for the formal QC conclusion and any action affecting the official case record or benefit.

### Use case 2 — Training, similar to AR

The Training use case turns approved policy, procedures, QC findings, and corrective-action priorities into practical, role-specific learning content.

**High-level scope:**

- Ingest policies, procedures, job aids, notices, and QC findings.
- Identify what changed and which worker roles are affected.
- Draft training outlines, job aids, scenarios, simulations, and knowledge checks.
- Allow subject-matter experts to edit, review, and approve the material.
- Publish approved training into the customer's existing environment.
- Track learner readiness and connect recurring errors back to coaching or policy clarification.

**Document and editing integrations:**

- **SharePoint Online:** Direct integration is feasible through Microsoft Graph for discovering, reading, and publishing files in document libraries. Customer permissions and Microsoft Entra approval will be required. See [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/driveitem?view=graph-rest-1.0).
- **Google Docs:** Google Docs can be used as a collaborative editing tool through the Google Docs and Drive APIs. See the [Google Docs API](https://developers.google.com/workspace/docs/api/concepts/document).
- **Microsoft Word:** Word can be used as the editing tool for documents stored in SharePoint or OneDrive, either through a Word add-in or a controlled DOCX review workflow. See the [Word add-ins overview](https://learn.microsoft.com/en-us/office/dev/add-ins/word/word-add-ins-programming-overview).

The working direction is to let customers continue using Word or Google Docs for editing while our platform manages source lineage, workflow, approvals, publication status, and the relationship between policy, QC findings, and training.

### Use case 3 — Agent Builder for screen mapping and actions

The Agent Builder allows authorized teams to define reusable agents that understand a customer application's screens and complete permitted tasks on a user's behalf. The experience is similar to a Codex-style agent: the user gives an objective, the agent plans the steps, works across approved systems, shows what it did, and pauses when approval is required.

**High-level scope:**

- Map customer screens, fields, controls, and workflows to a common platform model.
- Navigate applications and collect information needed for QC or training.
- Draft notes, populate approved information, upload documents, or start workflows.
- Use customer APIs when available and supervised screen interaction where APIs are not available.
- Reuse and version screen mappings for different customers and applications.
- Record the agent's steps, evidence, approvals, results, and errors.

The initial model should be read-oriented and supervised. Material actions—such as changing an official case record, issuing a notice, changing a benefit, or finalizing a finding—remain subject to explicit human approval.

### How the three use cases connect

- **QC Reviewer** identifies and explains case-processing issues.
- **Training** turns policies and confirmed error patterns into staff readiness.
- **Agent Builder** connects the platform to customer systems and performs approved work.
- All three share the same policy foundation, evidence model, integrations, security controls, workflow, and audit history.

## 3. Initial people requirements

This is a working team model for an India-led build. The purpose is to validate the role mix, seniority, availability, and hiring sequence with the engineering head in India.

### India delivery core

| Role | Initial FTE | Primary capability |
|---|---:|---|
| Engineering Lead | 1.0 | Technical design, estimation, delivery planning, team allocation, and release readiness |
| Full-stack Engineers | 2.0 | Application workflows, user experience, APIs, and integration delivery |
| AI / ML Engineer | 1.0 | AI workflows, evaluation, guardrails, and model integration |
| Data / Knowledge Engineer | 1.0 | Policy, document, evidence, and knowledge pipelines |
| QA Engineer | 1.0 | Functional, regression, and automated testing |
| DevOps / SRE | 0.5 | Secure deployment, observability, reliability, and operational support |
| Implementation Analyst | 0.5 | Customer configuration, workflow mapping, and rollout support |
| **Core pod total** | **7.0** | **FTE equivalent** |

Additional capacity should be added only against signed backlog.

### India staffing worksheet

Use this table to validate staffing levels and identify potential people. Enter `retain`, `change`, `combine`, or `defer` in the recommendation column.

| Role | Proposed FTE | Recommended FTE | Recommendation | Required seniority / skills | Potential person(s) | Availability | Contract or full-time | Reviewer notes |
|---|---:|---:|---|---|---|---|---|---|
| Engineering Lead | 1.0 | _TBD_ | _TBD_ | Senior technical and delivery leadership | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |
| Full-stack Engineers | 2.0 | _TBD_ | _TBD_ | Application, API, workflow, and integration engineering | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |
| AI / ML Engineer | 1.0 | _TBD_ | _TBD_ | Applied AI workflows, evaluation, guardrails, and model integration | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |
| Data / Knowledge Engineer | 1.0 | _TBD_ | _TBD_ | Document processing, data pipelines, retrieval, and knowledge systems | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |
| QA Engineer | 1.0 | _TBD_ | _TBD_ | Functional, integration, regression, and automated testing | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |
| DevOps / SRE | 0.5 | _TBD_ | _TBD_ | Cloud deployment, CI/CD, observability, reliability, and incident support | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |
| Implementation Analyst | 0.5 | _TBD_ | _TBD_ | Requirements, configuration, workflow mapping, and rollout support | _TBD_ | _TBD_ | _TBD_ | _Add notes_ |

### People cost and incentive structure

Please provide a high-level estimate of what this team would cost and how compensation should be structured. The goal is to understand the likely people budget before the team model is finalized—not to approve individual compensation in this document.

Where possible, show costs in both INR and USD and identify whether each estimate is an employee cost, contractor rate, or internal allocation. Include salary or fees, employer costs, benefits, recruiting, equipment, and other material people-related overhead in the fully loaded estimate.

| Role | Proposed FTE | Recommended employment model | Estimated monthly cost per person | Estimated total monthly cost | Estimated annualized cost | Recommended incentive structure | Cost assumptions / notes |
|---|---:|---|---:|---:|---:|---|---|
| Engineering Lead | 1.0 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| Full-stack Engineers | 2.0 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| AI / ML Engineer | 1.0 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| Data / Knowledge Engineer | 1.0 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| QA Engineer | 1.0 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| DevOps / SRE | 0.5 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| Implementation Analyst | 0.5 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Add assumptions_ |
| **Core pod total** | **7.0** |  |  | **_TBD_** | **_TBD_** |  |  |

Please also recommend:

1. The appropriate mix of fixed compensation and variable incentives for each role.
2. Whether delivery or milestone bonuses should be tied to pilot completion, production readiness, customer acceptance, quality, or another measurable outcome.
3. Whether retention bonuses, project-completion bonuses, profit sharing, or long-term incentives are needed for critical roles.
4. Which incentives should apply to employees versus contractors, and whether any incentives should be team-based rather than individual.
5. Any one-time hiring, joining, notice-period buyout, recruiting, equipment, or onboarding costs that should be included in the initial budget.

### Adjacent support

| Role | Initial model | Primary capability |
|---|---|---|
| Production Systems Integration Engineer | US; fractional initially | Production APIs, deployment, and customer technical coordination |
| Program & Delivery Manager | US; fractional initially | Delivery governance, financial tracking, and escalation |
| Customer Success / Forward-Deployed Engineer | US; added at go-live | Customer support, renewal, and expansion |

### Role-combination options to evaluate

These are working options, not recommendations. The engineering reviewer should identify where combinations are practical and where separation is necessary.

| Potential combination | Conditions for success | Reviewer recommendation |
|---|---|---|
| Engineering Lead + senior architecture ownership | Lead has sufficient architecture depth and enough time outside delivery management | _Add feedback_ |
| Full-stack + integration engineering | Engineers have strong API, data-contract, security, and customer-system experience | _Add feedback_ |
| AI / ML + Data / Knowledge Engineering | Candidate is experienced across evaluation, retrieval, document pipelines, and production ML systems | _Add feedback_ |
| QA + test automation ownership within engineering | Clear independent release criteria and adequate automation capability remain in place | _Add feedback_ |
| DevOps / SRE shared across projects | Capacity, on-call expectations, security ownership, and production support are explicitly defined | _Add feedback_ |
| Implementation Analyst + Forward-Deployed Engineering | Individual can bridge customer workflow discovery and technical configuration | _Add feedback_ |

## 4. Feedback requested

1. Is the proposed role mix and seniority appropriate for the platform described above?
2. Which roles can reasonably be combined during the initial build?
3. Which people or capabilities are currently available, and how quickly could they start?
4. Which positions should begin as contract roles and which should be full-time?
5. What is the estimated fully loaded monthly and annual cost of the recommended team?
6. What incentive structure would attract and retain the required people while aligning them to delivery outcomes?
7. Are there important engineering, security, integration, or delivery capabilities missing from this model?
8. Which of the three use cases should be the first production pilot, and what foundation must be shared from the beginning?
9. Should the first Training release support SharePoint and Word, Google Drive and Google Docs, or one ecosystem first?
10. Which Agent Builder actions are safe enough for the initial supervised pilot?

### Additional reviewer questions

| Question | Response |
|---|---|
| What is the smallest credible team that can deliver the first production pilot? | _Add response_ |
| What work must be completed before staffing and delivery estimates can be trusted? | _Add response_ |
| Which proposed roles are hardest to source with the required experience? | _Add response_ |
| Which roles must be dedicated, and which can be shared? | _Add response_ |
| What is the expected fully loaded cost by role and for the complete initial pod? | _Add response_ |
| What fixed, variable, delivery, and retention incentives do you recommend by role? | _Add response_ |
| What are the greatest technical delivery risks in the proposed approach? | _Add response_ |
| What customer-system access or sample data is needed for discovery? | _Add response_ |
| What should the first 30, 60, and 90 days of engineering work accomplish? | _Add response_ |
| Which content repository and editing ecosystem should be supported first? | _Add response_ |
| What application should be used for the first screen-mapping proof of concept? | _Add response_ |
| What actions must remain human-only during the first pilot? | _Add response_ |

## 5. Open issues and risks

| ID | Issue or risk | Impact | Proposed response | Owner | Target date | Status |
|---|---|---|---|---|---|---|
| R1 | Customer integration methods and access are not yet confirmed. | May change architecture, staffing, and estimates. | Conduct technical discovery for the first target customer. | _TBD_ | _TBD_ | Open |
| R2 | Availability of people with public-benefits or eligibility-system experience is unknown. | May increase onboarding time and delivery risk. | Identify relevant experience within the India engineering organization. | _TBD_ | _TBD_ | Open |
| R3 | Role combinations have not been validated. | Team may be overstaffed or lack clear ownership. | Review each proposed combination against available candidates. | _TBD_ | _TBD_ | Open |
| R4 | Security, privacy, and data-handling requirements depend on the customer environment. | Could materially affect design and deployment. | Define a minimum security baseline and customer discovery checklist. | _TBD_ | _TBD_ | Open |
| R5 | Production support and operating model are not yet defined. | Reliability and go-live responsibilities may be unclear. | Define support coverage, escalation, and service ownership before pilot launch. | _TBD_ | _TBD_ | Open |
| R6 | The first document repository and editing ecosystem have not been selected. | Building both Microsoft and Google integrations at once may increase initial scope. | Select the first customer ecosystem and define a connector abstraction for later expansion. | _TBD_ | _TBD_ | Open |
| R7 | Screen automation can break when customer applications change. | Failed or incorrect actions could disrupt work or affect case records. | Use semantic mappings, versioning, regression tests, change detection, and safe failure. | _TBD_ | _TBD_ | Open |
| R8 | Agent action permissions and approval boundaries are not yet defined. | The platform could take actions beyond the intended authority. | Classify every action as read, propose, reversible write, material action, or authorization. | _TBD_ | _TBD_ | Open |
| R9 | _Add issue or risk_ | _Add impact_ | _Add response_ | _TBD_ | _TBD_ | Open |

## 6. Decisions

| Decision ID | Date | Decision | Rationale | Decision owner | Affected roles or scope |
|---|---|---|---|---|---|
| D1 | _TBD_ | _Add decision_ | _Add rationale_ | _TBD_ | _TBD_ |

## 7. Action items

| Action ID | Action | Owner | Due date | Dependency | Status |
|---|---|---|---|---|---|
| ACT-1 | Review the proposed India delivery pod and recommend changes. | Engineering Head — India | _TBD_ | None | Open |
| ACT-2 | Identify potential people for each India role and confirm availability. | _TBD_ | _TBD_ | ACT-1 | Open |
| ACT-3 | Recommend which roles should be contract, full-time, dedicated, or shared. | _TBD_ | _TBD_ | ACT-1 | Open |
| ACT-4 | Identify the technical discovery required for a credible pilot estimate. | _TBD_ | _TBD_ | Customer context | Open |
| ACT-5 | Recommend the first use case and pilot scope. | _TBD_ | _TBD_ | Use-case review | Open |
| ACT-6 | Select the first repository and editing ecosystem: Microsoft, Google, or both. | _TBD_ | _TBD_ | Customer and engineering input | Open |
| ACT-7 | Identify the target application and safe action set for the Agent Builder proof of concept. | _TBD_ | _TBD_ | Customer-system access | Open |
| ACT-8 | Produce a revised team plan and initial 30/60/90-day engineering plan. | _TBD_ | _TBD_ | ACT-1 through ACT-7 | Open |
| ACT-9 | Provide a fully loaded people-cost estimate and recommended incentive structure for the initial pod. | Engineering Head — India | _TBD_ | Recommended team structure | Open |
| ACT-10 | _Add action_ | _TBD_ | _TBD_ | _TBD_ | Open |

## 8. Change log

| Date | Change | Author |
|---|---|---|
| July 28, 2026 | Added a people-cost worksheet and questions on fixed, variable, delivery, and retention incentives. | Soumay |
| July 28, 2026 | Added briefs for QC Reviewer, Training, and Agent Builder, including document-integration and action-control decisions. | Soumay |
| July 28, 2026 | Created the working document from the two-slide engineering feedback deck. | Soumay |
