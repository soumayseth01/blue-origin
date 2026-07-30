(function () {
  "use strict";

  const YES_NO_UNKNOWN = ["", "Yes", "No", "Unknown"];
  const STATUS_OPTIONS = ["", "Not answered", "None", "One or more"];
  const PROGRAM_LABELS = {
    Medicaid: "Medical assistance",
    SNAP: "Food assistance",
    TANF: "Cash assistance",
  };
  let activeOpenSections = null;

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pathParts(path) {
    return String(path).split(".").map((part) => /^\d+$/.test(part) ? Number(part) : part);
  }

  function getPath(object, path) {
    return pathParts(path).reduce((value, part) => value == null ? undefined : value[part], object);
  }

  function setPath(object, path, value) {
    const parts = pathParts(path);
    const last = parts.pop();
    const parent = parts.reduce((target, part, index) => {
      if (target[part] == null) target[part] = typeof parts[index + 1] === "number" ? [] : {};
      return target[part];
    }, object);
    parent[last] = value;
  }

  function hasMeaningfulData(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.values(value).some(hasMeaningfulData);
    return value !== "" && value !== null && value !== undefined && value !== false;
  }

  function createOutcomeRows(scenario, variant) {
    return scenario.programs.flatMap((program) => {
      const person = program === "Medicaid" ? scenario.persona.name : "Case household";
      if (variant === "pending") {
        return [{
          program,
          person,
          month: "Aug 2026",
          status: "Pending verification",
          benefit: "—",
          reason: program === "Medicaid" ? "Residency confirmation outstanding" : "Current income evidence outstanding",
        }];
      }
      return [{
        program,
        person,
        month: "Aug 2026",
        status: "Approved — illustrative",
        benefit: program === "Medicaid" ? "Coverage" : program === "SNAP" ? "$536" : "$412",
        reason: "Authored training outcome loaded",
      }];
    });
  }

  function createCase(scenario) {
    const primary = scenario.persona.name;
    const secondPerson = scenario.id === "BO-004" ? "Jamie Chen" : scenario.id === "BO-005" ? "Mateo Vega" : scenario.id === "BO-006" ? "Noah Green" : "Elena Ortiz";
    const programs = Object.fromEntries(["Medicaid", "SNAP", "TANF"].map((program) => [program, {
      requested: scenario.programs.includes(program),
      requestStatus: scenario.programs.includes(program) ? "Requested" : "Not requested",
      applicationDate: "2026-07-28",
    }]));

    return {
      schemaVersion: "2.0.0-demo",
      application: {
        type: scenario.type,
        channel: scenario.type === "Reported change" ? "Client portal" : "Online application",
        receivedDate: "2026-07-28",
        receivedTime: "08:12",
        preferredLanguage: scenario.id === "BO-005" ? "Spanish" : "English",
        interpreterNeeded: scenario.id === "BO-005" ? "Yes" : "No",
        accessibilityNeed: "None reported",
        contactMethod: "Phone",
        phone: "(555) 010-2401",
        email: "synthetic@example.invalid",
        bestContactTime: "Weekdays after 3 PM",
        residentialAddress: "410 Cedar Avenue",
        cityStateZip: "Riverton, ST 00000",
        mailingAddressSame: "Yes",
        mailingAddress: "",
        authorizedRepresentative: "No",
        representativeName: "",
        urgentNeed: scenario.id === "BO-005" ? "Yes" : "No",
        urgentNeedType: scenario.id === "BO-005" ? "Food" : "",
        interviewMode: "Phone",
        interviewStatus: "Scheduled",
      },
      peopleStatus: "One or more",
      people: [
        {
          personId: "person-01",
          name: primary,
          dateOfBirth: "1993-04-17",
          relationship: "Self",
          livesAtCaseAddress: "Yes",
          alternateAddress: "",
          temporaryAbsent: "No",
          absenceReason: "",
          expectedReturnDate: "",
          sharedCustody: "No shared custody",
          custodySchedule: "",
          maritalStatus: "Never married",
          taxFilingStatus: "Files taxes",
          claimedAsDependent: "No",
          pregnant: scenario.id === "BO-001" ? "Yes" : "No",
          dueDate: scenario.id === "BO-001" ? "2026-12-18" : "",
          snapFoodTogether: "Yes",
          tanfRole: scenario.programs.includes("TANF") ? "Parent/caretaker" : "Not applicable",
          programParticipation: Object.fromEntries(scenario.programs.map((program) => [program, "Applying"])),
        },
        {
          personId: "person-02",
          name: secondPerson,
          dateOfBirth: scenario.id === "BO-004" ? "1991-08-09" : "2017-10-06",
          relationship: scenario.id === "BO-004" ? "Spouse" : "Child",
          livesAtCaseAddress: "Yes",
          alternateAddress: "",
          temporaryAbsent: "No",
          absenceReason: "",
          expectedReturnDate: "",
          sharedCustody: "No shared custody",
          custodySchedule: "",
          maritalStatus: scenario.id === "BO-004" ? "Married" : "Not applicable",
          taxFilingStatus: scenario.id === "BO-004" ? "Files jointly" : "Non-filer",
          claimedAsDependent: scenario.id === "BO-004" ? "No" : "Yes",
          pregnant: "No",
          dueDate: "",
          snapFoodTogether: "Yes",
          tanfRole: scenario.programs.includes("TANF") ? "Dependent child" : "Not applicable",
          programParticipation: Object.fromEntries(scenario.programs.map((program) => [program, program === "TANF" && scenario.id === "BO-001" ? "Not applying" : "Applying"])),
        },
      ],
      programRequests: programs,
      programUnits: {
        medicaid: { householdType: "MAGI tax household", pathwayScreen: scenario.id === "BO-004" ? "MAGI plus non-MAGI screen" : "MAGI", otherCoverage: "No", retroCoverage: "No" },
        snap: { foodUnit: `${primary} and ${secondPerson}`, expeditedScreen: scenario.id === "BO-005" ? "Screened — yes" : "Screened — no", purchasePrepare: "Together", priorBenefits: "No" },
        tanf: { assistanceUnit: `${primary} and ${secondPerson}`, caretaker: primary, deprivationFactor: "Parent with reduced earnings", workProgramStatus: "Screening required" },
      },
      incomeStatus: "One or more",
      incomeSources: [{
        incomeId: "income-01",
        person: primary,
        category: "Employment",
        type: "Wages",
        employer: "Northline Market",
        employmentStatus: "Active",
        payBasis: "Hourly",
        hourlyRate: "18.50",
        hoursPerWeek: "24",
        grossAmount: scenario.id === "BO-001" ? "910" : scenario.expected.income,
        frequency: scenario.id === "BO-001" ? "Twice monthly" : "Monthly",
        paymentDate: "2026-07-24",
        expectedChange: scenario.type === "Reported change" ? "New income" : "Reduction in hours",
        changeDate: "2026-07-01",
        selfEmploymentBusiness: "",
        grossReceipts: "",
        businessExpenses: "",
      }],
      expenses: {
        shelter: { type: "Rent", amount: scenario.id === "BO-001" ? "1275" : "1025", frequency: "Monthly", shared: "No", subsidized: scenario.id === "BO-001" ? "Yes" : "No", subsidyType: scenario.id === "BO-001" ? "Housing voucher" : "", subsidyAmount: scenario.id === "BO-001" ? "450" : "" },
        utilitiesStatus: "One or more",
        utilities: [{ type: "Electricity", arrangement: "Paid separately", amount: "145", frequency: "Monthly", shared: "No" }],
        dependentCareStatus: scenario.programs.includes("TANF") || scenario.programs.includes("SNAP") ? "One or more" : "None",
        dependentCare: [{ person: secondPerson, reason: "Employment", provider: "Bright Start Center", amount: "320", frequency: "Monthly", subsidized: "No" }],
        supportStatus: "None",
        medicalStatus: scenario.id === "BO-004" ? "One or more" : "None",
        medical: [{ person: primary, type: "Prescription", amount: "75", frequency: "Monthly", reimbursement: "0" }],
      },
      resourcesStatus: "One or more",
      resources: [
        { resourceId: "resource-01", owner: primary, type: "Checking account", institution: "Community Bank", value: scenario.id === "BO-005" ? "32" : "210", jointlyOwned: "No", incomeProducing: "No", vehicleDescription: "", vehicleUse: "" },
        { resourceId: "resource-02", owner: primary, type: "Vehicle", institution: "", value: "4200", jointlyOwned: "No", incomeProducing: "No", vehicleDescription: "2011 compact sedan", vehicleUse: "Transportation to work" },
      ],
      nonfinancial: {
        identityStatus: "Electronic match pending",
        residency: "Resident",
        citizenship: "Verified citizen",
        immigrationDocument: "",
        sponsorStatus: "No",
        sponsorName: "",
        ssnStatus: "Matched",
        studentStatus: "No",
        disabilityClaimed: scenario.id === "BO-004" ? "Yes" : "No",
        disabilityDetails: scenario.id === "BO-004" ? "Dialysis; disability application pending" : "",
        blindnessStatus: "No",
        pregnancyStatus: scenario.id === "BO-001" ? "Yes" : "No",
        caretakerStatus: scenario.programs.includes("TANF") ? "Parent/caretaker" : "Not applicable",
        healthCoverage: scenario.id === "BO-004" ? "Coverage ended" : "No other coverage",
        workParticipation: scenario.programs.includes("TANF") ? "Screening required" : "Not applicable",
        absentParentStatus: scenario.programs.includes("TANF") ? "Information pending" : "Not applicable",
        priorBenefitHistory: "No",
        disqualificationHistory: "No",
      },
      evidence: [
        { evidenceId: "evidence-application", type: "Application", title: scenario.type === "Renewal" ? "Renewal form" : "Submitted application", person: primary, program: "All requested programs", fact: "Application facts", receivedDate: "2026-07-28", status: "Received", discrepancy: "None" },
        { evidenceId: "evidence-wage", type: "Document", title: "Current wage statement", person: primary, program: "All requested programs", fact: "Current earned income", receivedDate: "2026-07-28", status: "Review required", discrepancy: "Current hours differ from quarterly match" },
        { evidenceId: "evidence-match", type: "Data match", title: "Quarterly wage match", person: primary, program: "All requested programs", fact: "Historical wages", receivedDate: "2026-07-29", status: "Conflict", discrepancy: "Historical wages do not reflect reduced hours" },
        { evidenceId: "evidence-identity", type: "Data match", title: "Identity and SSN match", person: primary, program: "All requested programs", fact: "Identity", receivedDate: "2026-07-29", status: "Verified", discrepancy: "None" },
      ],
      notices: Object.fromEntries(scenario.programs.map((program) => [program, { type: "Approval and pending verification", effectiveDate: "2026-08-01", delivery: "Mail + portal", language: "English", verificationDueDate: "2026-08-08", appealRights: "Included" }])),
      authorization: Object.fromEntries(scenario.programs.map((program) => [program, { action: "Hold for final review", effectiveDate: "2026-08-01" }])),
      authoredOutcomes: {
        pending: createOutcomeRows(scenario, "pending"),
        final: createOutcomeRows(scenario, "final"),
      },
    };
  }

  function createBlankCase(scenario) {
    const draft = createCase({
      ...scenario,
      programs: [],
      persona: { name: "Synthetic Applicant" },
      expected: { income: "" },
    });
    draft.schemaVersion = "2.0.0-demo";
    draft.application = {
      type: scenario.type || "Initial application",
      channel: "",
      receivedDate: "",
      receivedTime: "",
      preferredLanguage: "",
      interpreterNeeded: "",
      accessibilityNeed: "",
      contactMethod: "",
      phone: "(555) 010-0000",
      email: "applicant@example.invalid",
      bestContactTime: "",
      residentialAddress: "100 Example Avenue",
      cityStateZip: "Example City, ST 00000",
      mailingAddressSame: "",
      mailingAddress: "",
      authorizedRepresentative: "",
      representativeName: "",
      urgentNeed: "",
      urgentNeedType: "",
      interviewMode: "",
      interviewStatus: "",
    };
    draft.peopleStatus = "One or more";
    draft.people = [{
      personId: "person-01",
      name: "Synthetic Applicant",
      dateOfBirth: "",
      relationship: "Self",
      livesAtCaseAddress: "",
      alternateAddress: "",
      temporaryAbsent: "",
      absenceReason: "",
      expectedReturnDate: "",
      sharedCustody: "",
      custodySchedule: "",
      maritalStatus: "",
      taxFilingStatus: "",
      claimedAsDependent: "",
      pregnant: "",
      dueDate: "",
      snapFoodTogether: "",
      tanfRole: "",
      programParticipation: {},
    }];
    draft.programRequests = Object.fromEntries(["Medicaid", "SNAP", "TANF"].map((program) => [program, {
      requested: false,
      requestStatus: "Not requested",
      applicationDate: "",
    }]));
    draft.programUnits = {
      medicaid: { householdType: "", pathwayScreen: "", otherCoverage: "", retroCoverage: "" },
      snap: { foodUnit: "", expeditedScreen: "", purchasePrepare: "", priorBenefits: "" },
      tanf: { assistanceUnit: "", caretaker: "", deprivationFactor: "", workProgramStatus: "" },
    };
    draft.incomeStatus = "";
    draft.incomeSources = [];
    draft.expenses = {
      shelter: { type: "", amount: "", frequency: "", shared: "", subsidized: "", subsidyType: "", subsidyAmount: "" },
      utilitiesStatus: "",
      utilities: [],
      dependentCareStatus: "",
      dependentCare: [],
      supportStatus: "",
      medicalStatus: "",
      medical: [],
    };
    draft.resourcesStatus = "";
    draft.resources = [];
    draft.nonfinancial = {
      identityStatus: "",
      residency: "",
      citizenship: "",
      immigrationDocument: "",
      sponsorStatus: "",
      sponsorName: "",
      ssnStatus: "",
      studentStatus: "",
      disabilityClaimed: "",
      disabilityDetails: "",
      blindnessStatus: "",
      pregnancyStatus: "",
      caretakerStatus: "",
      healthCoverage: "",
      workParticipation: "",
      absentParentStatus: "",
      priorBenefitHistory: "",
      disqualificationHistory: "",
    };
    draft.evidence = [];
    draft.notices = {};
    draft.authorization = {};
    draft.authoredOutcomes = { pending: [], final: [] };
    return draft;
  }

  function optionMarkup(options, value) {
    return options.map((option) => `<option value="${escapeHTML(option)}" ${String(value ?? "") === String(option) ? "selected" : ""}>${escapeHTML(option || "Select")}</option>`).join("");
  }

  function field(draft, config) {
    if (config.when && !config.when(draft)) return "";
    const value = getPath(draft, config.path) ?? "";
    const id = `case-${config.path.replaceAll(".", "-")}`;
    const attrs = `id="${escapeHTML(id)}" data-case-path="${escapeHTML(config.path)}" data-case-label="${escapeHTML(config.label)}" ${config.material === false ? "" : 'data-material="true"'} ${config.conditional ? 'data-conditional="true"' : ""}`;
    let control;
    if (config.type === "select") control = `<select ${attrs}>${optionMarkup(config.options || [""], value)}</select>`;
    else if (config.type === "textarea") control = `<textarea ${attrs} rows="3">${escapeHTML(value)}</textarea>`;
    else if (config.type === "checkbox") control = `<label class="bc-switch"><input ${attrs} type="checkbox" ${value ? "checked" : ""}/><span>${escapeHTML(config.checkboxLabel || config.label)}</span></label>`;
    else if (config.type === "radio") control = `<div class="bc-radio-group" role="radiogroup" aria-labelledby="${id}-label">${config.options.map((option, optionIndex) => `<label><input id="${id}-${optionIndex}" data-case-path="${escapeHTML(config.path)}" data-case-label="${escapeHTML(config.label)}" ${config.material === false ? "" : 'data-material="true"'} ${config.conditional ? 'data-conditional="true"' : ""} type="radio" name="${id}" value="${escapeHTML(option)}" ${String(value) === String(option) ? "checked" : ""}/><span>${escapeHTML(option)}</span></label>`).join("")}</div>`;
    else control = `<input ${attrs} type="${config.type === "date" ? "date" : config.type === "time" ? "time" : config.type === "email" ? "email" : "text"}" ${config.type === "currency" ? 'inputmode="decimal"' : ""} value="${escapeHTML(value)}" ${config.readOnly ? "readonly" : ""}/>`;
    return `<div class="bc-field ${config.full ? "bc-field-full" : ""}"><span id="${id}-label">${escapeHTML(config.label)}${config.required ? '<b class="bc-required">Required</b>' : ""}</span>${control}<small>${escapeHTML(config.helper || config.provenance || "Worker entry")}</small></div>`;
  }

  function accordion(id, title, summary, body, open = false, program = "") {
    const isOpen = activeOpenSections instanceof Set ? activeOpenSections.has(id) : open;
    return `<details class="bc-accordion" data-section-id="${escapeHTML(id)}" ${isOpen ? "open" : ""}><summary><span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(summary)}</small></span>${program ? `<em>${escapeHTML(program)}</em>` : ""}<i class="material-symbols-rounded">expand_more</i></summary><div class="bc-accordion-body">${body}</div></details>`;
  }

  function fields(draft, configs) {
    return `<div class="bc-fields bc-expanded-fields">${configs.map((config) => field(draft, config)).join("")}</div>`;
  }

  function statusPill(status) {
    const success = /verified|approved|clear|received/i.test(status);
    const warning = /pending|conflict|required|stale/i.test(status);
    return `<span class="bc-status ${success ? "success" : warning ? "warning" : ""}">${escapeHTML(status)}</span>`;
  }

  function renderIntake(ctx) {
    const d = ctx.draft;
    const sections = [
      accordion("intake-application", "Application and contact", `${d.application.channel} · ${d.application.preferredLanguage}`, fields(d, [
        { path: "application.type", label: "Application activity", type: "select", options: ["Initial application", "Reported change", "Renewal"], provenance: "Frozen scenario" },
        { path: "application.channel", label: "Submission channel", type: "select", options: ["Online application", "Client portal", "Paper", "Phone", "In person"] },
        { path: "application.receivedDate", label: "Received date", type: "date", provenance: "System" },
        { path: "application.receivedTime", label: "Received time", type: "time", provenance: "System" },
        { path: "application.preferredLanguage", label: "Preferred language", type: "select", options: ["English", "Spanish", "Arabic", "Portuguese", "Other"] },
        { path: "application.interpreterNeeded", label: "Interpreter needed", type: "select", options: YES_NO_UNKNOWN, conditional: true },
        { path: "application.accessibilityNeed", label: "Accessibility need", type: "select", options: ["None reported", "Large print", "Relay service", "Sign-language interpreter", "Other"] },
        { path: "application.contactMethod", label: "Preferred contact", type: "select", options: ["Phone", "Text", "Email", "Mail", "Portal"] },
        { path: "application.phone", label: "Synthetic phone", type: "text" },
        { path: "application.email", label: "Synthetic email", type: "email" },
        { path: "application.bestContactTime", label: "Best contact time", type: "text" },
      ]), true),
      accordion("intake-address", "Address and representation", d.application.mailingAddressSame === "Yes" ? "Mailing address matches residence" : "Alternate mailing address provided", fields(d, [
        { path: "application.residentialAddress", label: "Synthetic residential address", type: "text" },
        { path: "application.cityStateZip", label: "City, state, ZIP", type: "text" },
        { path: "application.mailingAddressSame", label: "Mailing address same", type: "select", options: YES_NO_UNKNOWN, conditional: true },
        { path: "application.mailingAddress", label: "Synthetic mailing address", type: "text", full: true, when: (caseDraft) => caseDraft.application.mailingAddressSame === "No" },
        { path: "application.authorizedRepresentative", label: "Authorized representative", type: "select", options: YES_NO_UNKNOWN, conditional: true },
        { path: "application.representativeName", label: "Representative synthetic name", type: "text", when: (caseDraft) => caseDraft.application.authorizedRepresentative === "Yes" },
      ])),
      accordion("intake-routing", "Program routing and urgency", `${ctx.scenario.programs.join(" · ")} requested`, `<div class="bc-program-checks">${Object.entries(d.programRequests).map(([program, request]) => `<label class="${request.requested ? "selected" : ""}"><input type="checkbox" ${request.requested ? "checked" : ""} disabled/><span><strong>${escapeHTML(PROGRAM_LABELS[program])}</strong><small>${escapeHTML(request.requestStatus)}</small></span></label>`).join("")}</div>${fields(d, [
        { path: "application.urgentNeed", label: "Immediate need reported", type: "radio", options: ["Yes", "No", "Unknown"], conditional: true },
        { path: "application.urgentNeedType", label: "Immediate need type", type: "select", options: ["", "Food", "Shelter", "Medical", "Safety", "Utilities", "Other"], when: (caseDraft) => caseDraft.application.urgentNeed === "Yes" },
        { path: "application.interviewMode", label: "Interview mode", type: "select", options: ["Phone", "Video", "In person", "Waived in scenario"] },
        { path: "application.interviewStatus", label: "Interview status", type: "select", options: ["Not scheduled", "Scheduled", "Completed", "Reschedule required"] },
      ])}`),
    ];
    return `${sections.join("")}<div class="bc-status-bar"><strong>Required training targets</strong><span>Confirm the interview requirement and date.</span><div class="bc-inline-targets">${ctx.mapped("intake-interview-required", "Interview required")}${ctx.mapped("intake-interview-date", "Interview date")}</div></div>`;
  }

  function renderHousehold(ctx) {
    const d = ctx.draft;
    const peopleRows = d.people.map((person, index) => `<tr><td><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(person.personId)}</small></td><td>${escapeHTML(person.dateOfBirth)}</td><td>${index === 0 ? ctx.mapped("household-relationship", "Relationship") : escapeHTML(person.relationship)}</td><td>${escapeHTML(person.livesAtCaseAddress)}</td><td>${Object.keys(person.programParticipation).length} program${Object.keys(person.programParticipation).length === 1 ? "" : "s"}</td><td>${index === 0 ? "Primary" : `<button class="bc-text-button" type="button" data-repeat-remove="people" data-repeat-index="${index}">Remove</button>`}</td></tr>`).join("");
    const primaryFields = fields(d, [
      { path: "people.0.livesAtCaseAddress", label: "Lives at case address", type: "select", options: YES_NO_UNKNOWN, conditional: true },
      { path: "people.0.alternateAddress", label: "Alternate residence", type: "text", full: true, when: (caseDraft) => caseDraft.people[0].livesAtCaseAddress === "No" },
      { path: "people.0.temporaryAbsent", label: "Temporarily absent", type: "select", options: YES_NO_UNKNOWN, conditional: true },
      { path: "people.0.absenceReason", label: "Absence reason", type: "select", options: ["", "Medical", "School", "Work", "Temporary care", "Other"], when: (caseDraft) => caseDraft.people[0].temporaryAbsent === "Yes" },
      { path: "people.0.expectedReturnDate", label: "Expected return date", type: "date", when: (caseDraft) => caseDraft.people[0].temporaryAbsent === "Yes" },
      { path: "people.0.sharedCustody", label: "Shared-custody status", type: "select", options: ["No shared custody", "Primary residence here", "Primary residence elsewhere", "Equal/shared schedule", "Other schedule"], conditional: true },
      { path: "people.0.custodySchedule", label: "Custody schedule", type: "textarea", full: true, when: (caseDraft) => !["", "No shared custody"].includes(caseDraft.people[0].sharedCustody) },
      { path: "people.0.maritalStatus", label: "Marital status", type: "select", options: ["Never married", "Married", "Separated", "Divorced", "Widowed", "Not applicable"] },
      { path: "people.0.taxFilingStatus", label: "Tax filing status", type: "select", options: ["Files taxes", "Files jointly", "Files separately", "Non-filer", "Unknown"] },
      { path: "people.0.claimedAsDependent", label: "Claimed as tax dependent", type: "select", options: YES_NO_UNKNOWN },
      { path: "people.0.pregnant", label: "Pregnancy reported", type: "select", options: YES_NO_UNKNOWN, conditional: true },
      { path: "people.0.dueDate", label: "Expected due date", type: "date", when: (caseDraft) => caseDraft.people[0].pregnant === "Yes" },
      { path: "people.0.snapFoodTogether", label: "Purchases/prepares food together", type: "select", options: YES_NO_UNKNOWN, when: () => ctx.scenario.programs.includes("SNAP") },
      { path: "people.0.tanfRole", label: "Cash-assistance family role", type: "select", options: ["Parent/caretaker", "Dependent child", "Other adult", "Not applicable"], when: () => ctx.scenario.programs.includes("TANF") },
    ]);
    return `${accordion("household-roster", "Household roster", `${d.people.length} people · ${d.peopleStatus}`, `<div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Person</th><th>Date of birth</th><th>Relationship</th><th>Lives here</th><th>Programs</th><th></th></tr></thead><tbody>${peopleRows}</tbody></table></div><button class="bc-add-row" type="button" data-repeat-add="people"><span class="material-symbols-rounded">person_add</span>Add household member</button>`, true)}${accordion("household-primary", `${d.people[0].name} details`, "Residence, custody, tax and program relationships", primaryFields, true)}${accordion("household-program-links", "Program relationships", "Separate household concepts remain visible", `<div class="bc-program-summary">${ctx.scenario.programs.map((program) => `<article><strong>${escapeHTML(PROGRAM_LABELS[program])}</strong><span>${program === "Medicaid" ? "Tax household" : program === "SNAP" ? "Purchases and prepares together" : "Parent/caretaker and dependent child"}</span><small>Shared facts; program-specific membership</small></article>`).join("")}</div>${fields(d, [{ path: "people.0.snapFoodTogether", label: "Food unit relationship", type: "select", options: YES_NO_UNKNOWN, when: () => ctx.scenario.programs.includes("SNAP") }])}`)}`;
  }

  function renderPrograms(ctx) {
    const d = ctx.draft;
    const cards = ctx.scenario.programs.map((program) => {
      if (program === "Medicaid") return accordion("program-medicaid", "Medical assistance", "Tax household and pathway screening", fields(d, [
        { path: "programUnits.medicaid.householdType", label: "Household basis", type: "select", options: ["", "MAGI tax household", "Non-MAGI household", "Child-only household", "Pending review"] },
        { path: "programUnits.medicaid.pathwayScreen", label: "Pathway screen", type: "select", options: ["", "MAGI", "MAGI plus non-MAGI screen", "Non-MAGI", "Unknown"] },
        { path: "programUnits.medicaid.otherCoverage", label: "Other health coverage", type: "select", options: YES_NO_UNKNOWN },
        { path: "programUnits.medicaid.retroCoverage", label: "Retroactive coverage requested", type: "select", options: YES_NO_UNKNOWN },
      ]), true, "MEDICAID");
      if (program === "SNAP") return accordion("program-snap", "Food assistance", "Food unit and expedited-screen facts", `${fields(d, [
        { path: "programUnits.snap.foodUnit", label: "Food unit members", type: "text" },
        { path: "programUnits.snap.purchasePrepare", label: "Purchase/prepare arrangement", type: "select", options: ["", "Together", "Separately", "Mixed arrangement", "Unknown"] },
        { path: "programUnits.snap.priorBenefits", label: "Benefits in another state", type: "select", options: YES_NO_UNKNOWN },
      ])}<div class="bc-training-target">${ctx.mapped("program-food-group", "Food group")}${ctx.mapped("program-expedited", "Expedited screening")}</div>`, true, "SNAP");
      return accordion("program-tanf", "Cash assistance", "Assistance unit and participation screening", fields(d, [
        { path: "programUnits.tanf.assistanceUnit", label: "Assistance-unit members", type: "text" },
        { path: "programUnits.tanf.caretaker", label: "Parent/caretaker", type: "select", options: d.people.map((person) => person.name) },
        { path: "programUnits.tanf.deprivationFactor", label: "Family circumstance", type: "select", options: ["", "Parent with reduced earnings", "Absent parent", "Unemployed parent", "Two-parent household", "Pending review"] },
        { path: "programUnits.tanf.workProgramStatus", label: "Participation screen", type: "select", options: ["", "Screening required", "Potential exemption", "Participation planned", "Pending facts"] },
      ]), true, "TANF");
    });
    const membershipRows = d.people.map((person) => `<tr><td><strong>${escapeHTML(person.name)}</strong></td>${ctx.scenario.programs.map((program) => `<td><select data-case-path="people.${d.people.indexOf(person)}.programParticipation.${program}" data-case-label="${program} participation" data-material="true"><option>Applying</option><option ${person.programParticipation[program] === "Included" ? "selected" : ""}>Included</option><option ${person.programParticipation[program] === "Excluded" ? "selected" : ""}>Excluded</option><option ${person.programParticipation[program] === "Not applying" ? "selected" : ""}>Not applying</option><option ${person.programParticipation[program] === "Pending" ? "selected" : ""}>Pending</option></select></td>`).join("")}</tr>`).join("");
    return `${accordion("program-membership", "Person-by-program membership", "One case household; separate program units", `<div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Person</th>${ctx.scenario.programs.map((program) => `<th>${escapeHTML(program)}</th>`).join("")}</tr></thead><tbody>${membershipRows}</tbody></table></div>`, true)}${cards.join("")}`;
  }

  function renderFinancial(ctx) {
    const d = ctx.draft;
    const incomeRows = d.incomeSources.map((income, index) => `<article class="bc-repeater-card"><header><span><strong>${escapeHTML(income.person || "New source")}</strong><small>${escapeHTML(income.category || "Income source")}</small></span>${ctx.authorMode || index ? `<button type="button" data-repeat-remove="incomeSources" data-repeat-index="${index}">Remove</button>` : ""}</header>${fields(d, [
      { path: `incomeSources.${index}.person`, label: "Person", type: "select", options: d.people.map((person) => person.name) },
      { path: `incomeSources.${index}.category`, label: "Income category", type: "select", options: ["Employment", "Self-employment", "Unearned income", "Rental/roomer income", "One-time/other income"], conditional: true },
      { path: `incomeSources.${index}.type`, label: "Income type", type: "select", options: ["Wages", "Salary", "Tips", "Social Security", "Child support received", "Unemployment", "Pension", "Rental income", "Other"] },
      { path: `incomeSources.${index}.employer`, label: "Synthetic employer/source", type: "text", when: (caseDraft) => caseDraft.incomeSources[index].category === "Employment" },
      { path: `incomeSources.${index}.payBasis`, label: "Pay basis", type: "select", options: ["Hourly", "Salary", "Piece rate", "Other"], when: (caseDraft) => caseDraft.incomeSources[index].category === "Employment" },
      { path: `incomeSources.${index}.hourlyRate`, label: "Hourly rate", type: "currency", when: (caseDraft) => caseDraft.incomeSources[index].category === "Employment" && caseDraft.incomeSources[index].payBasis === "Hourly" },
      { path: `incomeSources.${index}.hoursPerWeek`, label: "Average hours/week", type: "text", when: (caseDraft) => caseDraft.incomeSources[index].category === "Employment" },
      { path: `incomeSources.${index}.grossAmount`, label: "Gross amount", type: "currency" },
      { path: `incomeSources.${index}.frequency`, label: "Frequency", type: "select", options: ["Weekly", "Every two weeks", "Twice monthly", "Monthly", "One time", "Irregular"] },
      { path: `incomeSources.${index}.paymentDate`, label: "Most recent payment", type: "date" },
      { path: `incomeSources.${index}.expectedChange`, label: "Expected/recent change", type: "select", options: ["No expected change", "New income", "Amount change", "Reduction in hours", "Job ended", "Frequency change", "Unknown"], conditional: true },
      { path: `incomeSources.${index}.changeDate`, label: "Change date", type: "date", when: (caseDraft) => !["", "No expected change", "Unknown"].includes(caseDraft.incomeSources[index].expectedChange) },
      { path: `incomeSources.${index}.selfEmploymentBusiness`, label: "Synthetic business", type: "text", when: (caseDraft) => caseDraft.incomeSources[index].category === "Self-employment" },
      { path: `incomeSources.${index}.grossReceipts`, label: "Gross receipts", type: "currency", when: (caseDraft) => caseDraft.incomeSources[index].category === "Self-employment" },
      { path: `incomeSources.${index}.businessExpenses`, label: "Business expenses", type: "currency", when: (caseDraft) => caseDraft.incomeSources[index].category === "Self-employment" },
    ])}</article>`).join("");
    const commonExpense = `${fields(d, [
      { path: "expenses.shelter.type", label: "Shelter type", type: "select", options: ["Rent", "Own with mortgage", "Own without mortgage", "Room/board", "Homeless/no fixed residence"] },
      { path: "expenses.shelter.amount", label: "Shelter amount", type: "currency" },
      { path: "expenses.shelter.frequency", label: "Frequency", type: "select", options: ["Weekly", "Monthly", "Quarterly", "Annual"] },
      { path: "expenses.shelter.shared", label: "Cost shared", type: "select", options: YES_NO_UNKNOWN },
      { path: "expenses.shelter.subsidized", label: "Rent subsidized", type: "select", options: YES_NO_UNKNOWN, conditional: true },
      { path: "expenses.shelter.subsidyType", label: "Subsidy type", type: "select", options: ["Housing voucher", "Public housing", "Other"], when: (caseDraft) => caseDraft.expenses.shelter.subsidized === "Yes" },
      { path: "expenses.shelter.subsidyAmount", label: "Subsidy amount", type: "currency", when: (caseDraft) => caseDraft.expenses.shelter.subsidized === "Yes" },
    ])}<div class="bc-mini-repeaters"><article><strong>Utilities</strong><span>${d.expenses.utilities.length} record · ${d.expenses.utilities[0]?.type || "None"}</span><small>${d.expenses.utilities[0]?.arrangement || "Not answered"} · $${d.expenses.utilities[0]?.amount || "0"}</small></article><article><strong>Dependent care</strong><span>${d.expenses.dependentCareStatus}</span><small>${d.expenses.dependentCare[0]?.provider || "No provider"}</small></article>${ctx.scenario.programs.includes("Medicaid") ? `<article><strong>Medical expenses</strong><span>${escapeHTML(d.expenses.medicalStatus)}</span><small>Shown for pathway training; no deduction is calculated</small></article>` : ""}</div>`;
    const resourceRows = d.resources.map((resource, index) => `<tr><td>${escapeHTML(resource.owner)}</td><td><select data-case-path="resources.${index}.type" data-case-label="Resource type" data-material="true"><option ${resource.type === "Checking account" ? "selected" : ""}>Checking account</option><option ${resource.type === "Savings account" ? "selected" : ""}>Savings account</option><option ${resource.type === "Vehicle" ? "selected" : ""}>Vehicle</option><option ${resource.type === "Retirement account" ? "selected" : ""}>Retirement account</option><option ${resource.type === "Other" ? "selected" : ""}>Other</option></select></td><td><input data-case-path="resources.${index}.value" data-case-label="Resource value" data-material="true" inputmode="decimal" value="${escapeHTML(resource.value)}"/></td><td>${escapeHTML(resource.type === "Vehicle" ? resource.vehicleDescription : resource.institution)}</td><td>${ctx.authorMode || index ? `<button class="bc-text-button" type="button" data-repeat-remove="resources" data-repeat-index="${index}">Remove</button>` : "Primary"}</td></tr>`).join("");
    return `${accordion("financial-income", "Income sources", `${d.incomeSources.length} source · ${d.incomeStatus}`, `${incomeRows}<button class="bc-add-row" type="button" data-repeat-add="incomeSources"><span class="material-symbols-rounded">add</span>Add income source</button><div class="bc-training-target bc-three">${ctx.mapped("financial-pay-frequency", "Pay frequency")}${ctx.mapped("financial-gross-amount", "Gross per pay", "Enter from wage evidence")}${ctx.mapped("financial-monthly-income", "Monthly converted amount", "Training target; not an eligibility calculation")}</div>`, true)}${accordion("financial-expenses", "Shelter and expenses", "Shared facts with program-specific sections", commonExpense, true)}${accordion("financial-resources", "Resources and vehicles", `${d.resources.length} records · no limit test is performed`, `<div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Owner</th><th>Type</th><th>Value</th><th>Details</th><th></th></tr></thead><tbody>${resourceRows}</tbody></table></div><button class="bc-add-row" type="button" data-repeat-add="resources"><span class="material-symbols-rounded">add</span>Add resource</button>`)}`;
  }

  function renderNonfinancial(ctx) {
    const d = ctx.draft;
    return `${accordion("nonfinancial-identity", "Identity, residency and citizenship", `${d.nonfinancial.identityStatus} · ${d.nonfinancial.ssnStatus}`, `${fields(d, [
      { path: "nonfinancial.identityStatus", label: "Identity status", type: "select", options: ["Electronic match pending", "Verified", "Document required", "Unable to verify"] },
      { path: "nonfinancial.ssnStatus", label: "SSN status", type: "select", options: ["Matched", "Provided", "Applied for", "Not provided", "Not applicable"] },
    ])}<div class="bc-training-target">${ctx.mapped("nonfinancial-residency", "State residency")}${ctx.mapped("nonfinancial-citizenship", "Citizenship status")}</div>${fields(d, [
      { path: "nonfinancial.citizenship", label: "Detailed citizenship/immigration status", type: "select", options: ["Verified citizen", "Qualified noncitizen", "Lawful permanent resident", "Other immigration status", "Pending"], conditional: true },
      { path: "nonfinancial.immigrationDocument", label: "Immigration document type", type: "select", options: ["Permanent resident card", "Employment authorization", "Arrival/departure record", "Other"], when: (caseDraft) => !["", "Verified citizen", "Pending"].includes(caseDraft.nonfinancial.citizenship) },
      { path: "nonfinancial.sponsorStatus", label: "Immigration sponsor", type: "select", options: YES_NO_UNKNOWN, when: (caseDraft) => !["", "Verified citizen", "Pending"].includes(caseDraft.nonfinancial.citizenship) },
      { path: "nonfinancial.sponsorName", label: "Sponsor synthetic name", type: "text", when: (caseDraft) => caseDraft.nonfinancial.sponsorStatus === "Yes" },
    ])}`, true)}${accordion("nonfinancial-pathways", "Health, education and pathway facts", "Capture facts without making a determination", fields(d, [
      { path: "nonfinancial.studentStatus", label: "Student status", type: "select", options: ["No", "Full time", "Half time", "Less than half time", "Unknown"] },
      { path: "nonfinancial.disabilityClaimed", label: "Disability or work limitation claimed", type: "select", options: YES_NO_UNKNOWN, conditional: true },
      { path: "nonfinancial.disabilityDetails", label: "Reported limitation details", type: "textarea", full: true, when: (caseDraft) => caseDraft.nonfinancial.disabilityClaimed === "Yes" },
      { path: "nonfinancial.blindnessStatus", label: "Blindness status", type: "select", options: YES_NO_UNKNOWN },
      { path: "nonfinancial.pregnancyStatus", label: "Pregnancy status", type: "select", options: YES_NO_UNKNOWN },
      { path: "nonfinancial.healthCoverage", label: "Other health coverage", type: "select", options: ["No other coverage", "Employer coverage", "Coverage ended", "COBRA", "Unknown"], when: () => ctx.scenario.programs.includes("Medicaid") },
    ]), true, ctx.scenario.programs.includes("Medicaid") ? "MEDICAID" : "")}${ctx.scenario.programs.includes("TANF") ? accordion("nonfinancial-tanf", "Cash-assistance family and participation facts", "State-neutral training questions", fields(d, [
      { path: "nonfinancial.caretakerStatus", label: "Caretaker relationship", type: "select", options: ["Parent/caretaker", "Non-parent caretaker", "No eligible caretaker", "Pending"] },
      { path: "nonfinancial.workParticipation", label: "Participation status", type: "select", options: ["Screening required", "Potential exemption", "Ready for referral", "Currently participating", "Unknown"] },
      { path: "nonfinancial.absentParentStatus", label: "Absent-parent/cooperation facts", type: "select", options: ["Information pending", "Information provided", "Good-cause claim", "Not applicable"] },
      { path: "nonfinancial.priorBenefitHistory", label: "Prior benefit history", type: "select", options: YES_NO_UNKNOWN },
      { path: "nonfinancial.disqualificationHistory", label: "Disqualification history", type: "select", options: YES_NO_UNKNOWN },
    ]), false, "TANF") : ""}`;
  }

  function renderEvidence(ctx) {
    const rows = ctx.draft.evidence.map((record) => `<tr><td><strong>${escapeHTML(record.title)}</strong><small>${escapeHTML(record.type)}</small></td><td>${escapeHTML(record.person)}</td><td>${escapeHTML(record.program)}</td><td>${escapeHTML(record.fact)}</td><td>${statusPill(record.status)}</td><td>${escapeHTML(record.discrepancy)}</td><td>${record.evidenceId === "evidence-wage" ? ctx.mapped("evidence-wage-review", "Review wage statement") : record.evidenceId === "evidence-match" ? ctx.mapped("evidence-wage-match", "Resolve wage match") : `<button class="bc-text-button" type="button" data-case-action="open-evidence" data-evidence-id="${escapeHTML(record.evidenceId)}">Open</button>`}</td></tr>`).join("");
    const inventory = accordion("evidence-inventory", "Evidence inventory", `${ctx.draft.evidence.length} records across documents and data matches`, `<div class="bc-table-wrap"><table class="bc-table bc-evidence-table"><thead><tr><th>Evidence</th><th>Person</th><th>Program</th><th>Fact supported</th><th>Status</th><th>Discrepancy</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`, true);
    if (ctx.authorMode) return inventory;
    return `${inventory}${accordion("evidence-resolution", "Verification resolution", ctx.evidenceReviewed ? "Required wage evidence reviewed" : "Required evidence remains unresolved", fields(ctx.draft, [
      { path: "evidence.1.status", label: "Wage-document status", type: "select", options: ["Review required", "Reviewed", "Verified", "Insufficient"] },
      { path: "evidence.2.status", label: "Wage-match status", type: "select", options: ["Conflict", "Resolved", "Verified", "Unable to resolve"] },
      { path: "evidence.1.receivedDate", label: "Received date", type: "date" },
      { path: "evidence.1.discrepancy", label: "Resolution note", type: "textarea", full: true },
    ]), true)}`;
  }

  function renderEligibility(ctx) {
    const run = ctx.mockEligibility;
    const variant = run.variant || "pending";
    const rows = ctx.draft.authoredOutcomes[variant].map((result) => `<tr><td><strong>${escapeHTML(PROGRAM_LABELS[result.program])}</strong></td><td>${escapeHTML(result.person)}</td><td>${escapeHTML(result.month)}</td><td>${statusPill(result.status)}</td><td>${escapeHTML(result.benefit)}</td><td>${escapeHTML(result.reason)}</td></tr>`).join("");
    if (ctx.authorMode) {
      const authoredRows = ctx.draft.authoredOutcomes.final.map((result) => `<tr><td><strong>${escapeHTML(PROGRAM_LABELS[result.program] || result.program)}</strong></td><td>${escapeHTML(result.person)}</td><td>${escapeHTML(result.month)}</td><td>${statusPill(result.status)}</td><td>${escapeHTML(result.benefit)}</td><td>${escapeHTML(result.reason)}</td></tr>`).join("");
      return `${accordion("eligibility-results", "Illustrative program outcomes", `${ctx.draft.authoredOutcomes.final.length} authored rows`, `<div class="bc-authored-banner"><span class="material-symbols-rounded">science</span><div><strong>Author-controlled training fixture</strong><p>These outcomes are editable training content. They are not calculated or represented as official policy determinations.</p></div></div><div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Program</th><th>Person/unit</th><th>Month</th><th>Authored status</th><th>Illustrative benefit</th><th>Reason</th></tr></thead><tbody>${authoredRows}</tbody></table></div>`, true)}`;
    }
    const resultContent = run.status === "unrun" ? `<div class="bc-empty-result"><span class="material-symbols-rounded">rule_settings</span><strong>No illustrative result loaded</strong><p>Run the mock workflow to load the scenario-authored result state.</p></div>` : `<div class="bc-authored-banner ${run.status === "stale" ? "stale" : ""}"><span class="material-symbols-rounded">${run.status === "stale" ? "sync_problem" : "science"}</span><div><strong>${run.status === "stale" ? "Authored result is stale" : "Illustrative authored result"}</strong><p>${run.status === "stale" ? "Case facts changed after the last mock run. Rerun to refresh the authored training state." : "This result came from the frozen scenario fixture. It was not calculated from the entered fields."}</p></div></div><div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Program</th><th>Person/unit</th><th>Month</th><th>Authored status</th><th>Illustrative benefit</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    return `${accordion("eligibility-run", "Mock eligibility run", run.status === "unrun" ? "Ready to load authored outcomes" : `${variant} fixture · ${run.status}`, `<div class="bc-mock-run-grid"><div>${ctx.mapped("eligibility-run-reason", "Run reason")}</div><div class="bc-run-explainer"><strong>No rules engine</strong><span>The run chooses the pending fixture until evidence is reviewed, then the final fixture.</span></div><button class="bc-run-button" type="button" data-case-action="run-mock-eligibility"><span class="material-symbols-rounded">play_arrow</span>Run mock eligibility</button></div>`, true)}${accordion("eligibility-results", "Program/person/month results", run.status === "unrun" ? "No run yet" : `${ctx.draft.authoredOutcomes[variant].length} authored rows`, resultContent, true)}${accordion("eligibility-review", "Worker interpretation", "Review and acknowledge the illustrative result", `<div class="bc-training-target">${ctx.mapped("eligibility-result-reviewed", "Result reviewed")}</div>${fields(ctx.draft, [
      { path: "application.interviewStatus", label: "Interview status", type: "select", options: ["Not scheduled", "Scheduled", "Completed", "Reschedule required"] },
      { path: "evidence.1.status", label: "Income evidence", type: "select", options: ["Review required", "Reviewed", "Verified", "Insufficient"] },
    ])}`)}`;
  }

  function renderNotices(ctx) {
    const noticeSections = ctx.scenario.programs.map((program, index) => accordion(`notice-${program.toLowerCase()}`, `${PROGRAM_LABELS[program]} notice`, `${ctx.draft.notices[program].type} · ${ctx.draft.notices[program].delivery}`, fields(ctx.draft, [
      { path: `notices.${program}.type`, label: "Notice type", type: "select", options: ["", "Approval", "Approval and pending verification", "Denial", "Request for verification", "Change notice"] },
      { path: `notices.${program}.effectiveDate`, label: "Effective date", type: "date" },
      { path: `notices.${program}.verificationDueDate`, label: "Verification due date", type: "date" },
      { path: `notices.${program}.delivery`, label: "Delivery method", type: "select", options: ["", "Mail", "Portal", "Mail + portal", "Pickup", "Other"] },
      { path: `notices.${program}.language`, label: "Notice language", type: "select", options: ["", "English", "Spanish", "Other"] },
      { path: `notices.${program}.appealRights`, label: "Appeal information", type: "select", options: ["", "Included", "Not included", "Not applicable"] },
    ]), index === 0, program.toUpperCase()));
    return `${accordion("notice-required-action", "Required notice action", "Mapped training targets", `<div class="bc-training-target">${ctx.mapped("notice-type", "Notice type")}${ctx.mapped("notice-comments", "Processing summary", "Document facts, evidence, discrepancies, and action taken")}</div>`, true)}${noticeSections.join("")}`;
  }

  function renderAuthorization(ctx) {
    const rows = ctx.scenario.programs.map((program) => `<tr><td><strong>${escapeHTML(PROGRAM_LABELS[program])}</strong></td><td><select data-case-path="authorization.${program}.action" data-case-label="${program} action" data-material="false">${["", "Hold for final review", "Authorize illustrative action", "Return for information", "Supervisor review"].map((action) => `<option value="${escapeHTML(action)}" ${ctx.draft.authorization[program].action === action ? "selected" : ""}>${escapeHTML(action || "Select")}</option>`).join("")}</select></td><td><input type="date" data-case-path="authorization.${program}.effectiveDate" data-case-label="${program} effective date" data-material="false" value="${escapeHTML(ctx.draft.authorization[program].effectiveDate)}"/></td><td>${statusPill(ctx.mockEligibility.status === "final" ? "Authored result ready" : "Review required")}</td></tr>`).join("");
    return `${accordion("authorization-programs", "Program-scoped actions", "Each requested program is handled separately", `<div class="bc-table-wrap"><table class="bc-table"><thead><tr><th>Program</th><th>Prototype action</th><th>Effective date</th><th>Readiness</th></tr></thead><tbody>${rows}</tbody></table></div>`, true)}${accordion("authorization-checklist", "Final worker attestations", `${Object.values(ctx.closure).filter(Boolean).length} of 4 complete`, `<div class="bc-authorization-list">${ctx.mapped("authorization-facts", "All material facts confirmed with applicant")}${ctx.mapped("authorization-evidence", "Evidence and data-match discrepancies resolved")}${ctx.mapped("authorization-next-steps", "Next steps explained to applicant")}</div>`, true)}${accordion("authorization-close", "Client communication and closure", ctx.callEnded ? "Call completed" : "Simulated call remains active", `<div class="bc-training-target">${ctx.mapped("authorization-summary", "Closing summary provided")}</div><div class="bc-boundary-card"><span class="material-symbols-rounded">shield</span><div><strong>Prototype-only authorization</strong><p>No official case record, eligibility decision, benefit issuance, or notice is created.</p></div></div>`, true)}`;
  }

  function renderStage(ctx) {
    const renderers = { intake: renderIntake, household: renderHousehold, programs: renderPrograms, financial: renderFinancial, nonfinancial: renderNonfinancial, evidence: renderEvidence, eligibility: renderEligibility, notices: renderNotices, authorization: renderAuthorization };
    activeOpenSections = ctx.openSections;
    const markup = `<div class="bc-expanded-workspace" data-stage="${escapeHTML(ctx.stage)}" data-integrated-case-version="${escapeHTML(ctx.draft.schemaVersion)}">${renderers[ctx.stage](ctx)}</div>`;
    activeOpenSections = null;
    return markup;
  }

  const conditionalClears = {
    "application.mailingAddressSame": { inactive: (value) => value !== "No", paths: ["application.mailingAddress"] },
    "application.authorizedRepresentative": { inactive: (value) => value !== "Yes", paths: ["application.representativeName"] },
    "application.urgentNeed": { inactive: (value) => value !== "Yes", paths: ["application.urgentNeedType"] },
    "people.0.livesAtCaseAddress": { inactive: (value) => value !== "No", paths: ["people.0.alternateAddress"] },
    "people.0.temporaryAbsent": { inactive: (value) => value !== "Yes", paths: ["people.0.absenceReason", "people.0.expectedReturnDate"] },
    "people.0.sharedCustody": { inactive: (value) => ["", "No shared custody"].includes(value), paths: ["people.0.custodySchedule"] },
    "people.0.pregnant": { inactive: (value) => value !== "Yes", paths: ["people.0.dueDate"] },
    "expenses.shelter.subsidized": { inactive: (value) => value !== "Yes", paths: ["expenses.shelter.subsidyType", "expenses.shelter.subsidyAmount"] },
    "nonfinancial.disabilityClaimed": { inactive: (value) => value !== "Yes", paths: ["nonfinancial.disabilityDetails"] },
    "nonfinancial.sponsorStatus": { inactive: (value) => value !== "Yes", paths: ["nonfinancial.sponsorName"] },
  };

  function defaultRecord(type, draft) {
    if (type === "people") return { personId: `person-${String(draft.people.length + 1).padStart(2, "0")}`, name: "New household member", dateOfBirth: "", relationship: "Other adult", livesAtCaseAddress: "Yes", alternateAddress: "", temporaryAbsent: "No", absenceReason: "", expectedReturnDate: "", sharedCustody: "No shared custody", custodySchedule: "", maritalStatus: "Unknown", taxFilingStatus: "Unknown", claimedAsDependent: "Unknown", pregnant: "Unknown", dueDate: "", snapFoodTogether: "Unknown", tanfRole: "Other adult", programParticipation: {} };
    if (type === "incomeSources") return { incomeId: `income-${String(draft.incomeSources.length + 1).padStart(2, "0")}`, person: draft.people[0].name, category: "Unearned income", type: "Other", employer: "", employmentStatus: "", payBasis: "", hourlyRate: "", hoursPerWeek: "", grossAmount: "", frequency: "Monthly", paymentDate: "", expectedChange: "No expected change", changeDate: "", selfEmploymentBusiness: "", grossReceipts: "", businessExpenses: "" };
    return { resourceId: `resource-${String(draft.resources.length + 1).padStart(2, "0")}`, owner: draft.people[0].name, type: "Other", institution: "", value: "", jointlyOwned: "No", incomeProducing: "No", vehicleDescription: "", vehicleUse: "" };
  }

  function bind(root, ctx) {
    root.querySelectorAll(".bc-accordion").forEach((section) => section.addEventListener("toggle", () => ctx.onToggle?.(section.dataset.sectionId, section.open)));
    root.querySelectorAll("[data-case-path]").forEach((control) => {
      const eventName = control.matches('input[type="text"],input[type="email"],textarea') ? "change" : "change";
      control.addEventListener(eventName, (event) => {
        const input = event.currentTarget;
        const path = input.dataset.casePath;
        const before = getPath(ctx.draft, path);
        const after = input.type === "checkbox" ? input.checked : input.value;
        const clearing = conditionalClears[path];
        if (clearing && clearing.inactive(after)) {
          const populated = clearing.paths.filter((childPath) => hasMeaningfulData(getPath(ctx.draft, childPath)));
          if (populated.length && !window.confirm(`This change hides populated ${input.dataset.caseLabel.toLowerCase()} details. Clear those inactive values?`)) {
            if (input.type === "radio") root.querySelector(`[data-case-path="${path}"][value="${CSS.escape(String(before))}"]`).checked = true;
            else input.value = before;
            return;
          }
          populated.forEach((childPath) => setPath(ctx.draft, childPath, ""));
        }
        setPath(ctx.draft, path, after);
        ctx.onChange({ path, label: input.dataset.caseLabel || path, before, after, material: input.dataset.material === "true", rerender: Boolean(input.dataset.conditional) || Boolean(clearing) });
      });
    });
    root.querySelectorAll("[data-repeat-add]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.repeatAdd;
      ctx.draft[type].push(defaultRecord(type, ctx.draft));
      ctx.onRepeat({ type, action: "add" });
    }));
    root.querySelectorAll("[data-repeat-remove]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.repeatRemove;
      const index = Number(button.dataset.repeatIndex);
      const label = type === "people" ? ctx.draft.people[index]?.name : `${type} record ${index + 1}`;
      if (!window.confirm(`Remove ${label}? This cannot be undone within the current attempt.`)) return;
      ctx.draft[type].splice(index, 1);
      ctx.onRepeat({ type, action: "remove" });
    }));
    root.querySelectorAll("[data-case-action]").forEach((button) => button.addEventListener("click", () => ctx.onAction(button.dataset.caseAction, button.dataset)));
  }

  window.BenefitConnectIntegrated = {
    createCase,
    createBlankCase,
    clone,
    getPath,
    setPath,
    renderStage,
    bind,
    programLabels: PROGRAM_LABELS,
    sectionStatuses: STATUS_OPTIONS,
  };
})();
