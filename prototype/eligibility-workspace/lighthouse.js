(function lighthouseFeature() {
  "use strict";

  const STORAGE_KEY = "blueorigin:lighthouse:v1";
  const VALID_ROUTES = new Set(["lighthouse", "lighthouse-path", "lighthouse-player", "lighthouse-builder", "lighthouse-manage", "my-learning"]);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const icon = (name) => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;

  const paths = [
    { id: "path-foundations", title: "Integrated Eligibility Foundations", summary: "Build the shared foundation for accurate, human-centered eligibility work.", programs: ["Integrated eligibility"], outcome: "Explain the application flow, construct households, and conduct effective client interviews.", accent: "slate" },
    { id: "path-programs", title: "Program Eligibility Essentials", summary: "Understand the purpose and core eligibility pathways for the major assistance programs.", programs: ["SNAP", "Medicaid", "TANF"], outcome: "Recognize program-specific eligibility pathways and route applications correctly.", accent: "blue" },
    { id: "path-determination", title: "Eligibility Determination", summary: "Apply financial and non-financial rules with consistent evidence and calculation practices.", programs: ["SNAP", "Medicaid", "TANF"], outcome: "Evaluate income, resources, residency, citizenship, student, and identity requirements.", accent: "orange" },
    { id: "path-maintenance", title: "Verification & Case Maintenance", summary: "Resolve evidence, communicate decisions, and keep cases accurate over time.", programs: ["Operations", "Quality"], outcome: "Request only necessary verification and complete notices, renewals, and maintenance work.", accent: "green" },
    { id: "path-practice", title: "Practice Lab", summary: "Turn knowledge into confident action through realistic eligibility simulations.", programs: ["Simulation"], outcome: "Practice complete client interactions and receive evidence-linked performance feedback.", accent: "violet" },
  ];

  const quizVerification = [
    { prompt: "What should happen before a worker validates reported income?", options: ["Review current supporting evidence", "Authorize every requested program", "Issue an adverse action notice"], answer: 0, explanation: "Current evidence should support the value before validation." },
    { prompt: "Which verification request is appropriate?", options: ["Every document in the case", "Only information required to resolve eligibility", "A new application in every case"], answer: 1, explanation: "Verification should be limited to information necessary for the determination." },
    { prompt: "How should an electronic data match be handled?", options: ["Accept it without review", "Ignore it", "Review relevance and resolve material discrepancies"], answer: 2, explanation: "A match is evidence, but material discrepancies still require review." },
    { prompt: "What makes a case note useful for quality review?", options: ["A clear rationale and evidence trail", "Only the final outcome", "A copy of unrelated policy"], answer: 0, explanation: "A concise rationale and evidence trail make the action auditable." },
    { prompt: "When should the client receive next-step information?", options: ["Only after a denial", "At closure, with pending items and deadlines", "Never during an interview"], answer: 1, explanation: "Closing communication should explain pending items, deadlines, and what happens next." },
  ];

  const quizPractice = [
    { prompt: "What is the first priority in a combined initial application?", options: ["Establish the household and requests", "Issue notices", "Close the case"], answer: 0, explanation: "The worker first establishes who is applying and which programs are requested." },
    { prompt: "When wages changed recently, what should the worker do?", options: ["Use an old amount", "Review current evidence and calculate a representative amount", "Skip financial eligibility"], answer: 1, explanation: "Current evidence and a documented calculation support the representative amount." },
    { prompt: "Can an AI suggestion override a deterministic eligibility rule?", options: ["Yes", "Only in practice mode", "No"], answer: 2, explanation: "Formal correctness stays with deterministic rules and reviewed policy." },
  ];

  const moduleSpecs = [
    ["mission-flow", "path-foundations", "Mission and Application Flow", "Follow an application from first contact through authorization.", ["Integrated eligibility"], "Beginner", 14],
    ["household-composition", "path-foundations", "Household Composition", "Build program groups and relationships from client statements.", ["SNAP", "Medicaid", "TANF"], "Beginner", 18],
    ["client-interview", "path-foundations", "Interview and Client Experience", "Use clear questions, active listening, and respectful closure.", ["Client experience"], "Beginner", 16],
    ["snap-essentials", "path-programs", "SNAP Essentials", "Recognize the core SNAP application and eligibility sequence.", ["SNAP"], "Intermediate", 20],
    ["medicaid-pathways", "path-programs", "Medicaid Pathways", "Distinguish MAGI and required non-MAGI screening pathways.", ["Medicaid"], "Intermediate", 22],
    ["tanf-basics", "path-programs", "TANF Basics", "Understand household, cooperation, and work-related considerations.", ["TANF"], "Intermediate", 18],
    ["financial-eligibility", "path-determination", "Income, Resources, and Deductions", "Determine what counts and document the calculation.", ["SNAP", "TANF"], "Intermediate", 28],
    ["nonfinancial-eligibility", "path-determination", "Non-Financial Eligibility", "Evaluate residency, identity, citizenship, student, and SSN requirements.", ["SNAP", "Medicaid"], "Intermediate", 24],
    ["verification-evidence", "path-maintenance", "Verification and Evidence", "Request, review, and document only the evidence needed for a supported decision.", ["Operations", "Quality"], "Intermediate", 26],
    ["case-maintenance", "path-maintenance", "Notices, Renewals, and Case Maintenance", "Communicate decisions and keep active cases accurate.", ["Operations"], "Intermediate", 22],
    ["combined-initial-practice", "path-practice", "Combined Initial Application Practice", "Complete a realistic Medicaid, SNAP, and TANF application with feedback.", ["Simulation", "SNAP", "Medicaid", "TANF"], "Advanced", 32],
    ["change-reporting-practice", "path-practice", "Change-Reporting Practice", "Process a household and earned-income change across an active case.", ["Simulation"], "Advanced", 25],
  ];

  function standardBlocks(id, title) {
    return [
      { id: `${id}-intro`, type: "text", title: `Welcome to ${title}`, required: true, minutes: 4, content: `This module connects approved policy knowledge to the decisions eligibility workers make every day. Review the objectives, examine the example, and complete the knowledge check before moving on.`, callout: "Grounded learning content · Blue Origin Academy" },
      { id: `${id}-resource`, type: "pdf", title: "Policy reference and field guide", required: true, minutes: 5, url: "/AZ-How-to-Apply-Nutrition-Assistance.pdf", source: "Approved demonstration reference" },
      { id: `${id}-check`, type: "quiz", title: "Knowledge check", required: true, minutes: 5, questions: quizPractice.slice(0, 3) },
    ];
  }

  function seedModules() {
    return moduleSpecs.map(([id, pathId, title, summary, programs, difficulty, minutes], index) => {
      let blocks = standardBlocks(id, title);
      if (id === "verification-evidence") blocks = [
        { id: `${id}-video`, type: "video", title: "Verification that moves the case forward", required: true, minutes: 3, duration: 4, url: "/assets/lighthouse-verification.mp4", captionsUrl: "/assets/lighthouse-verification.vtt", source: "Blue Origin Studio · grounded explainer", posterLabel: "Evidence → decision → documentation" },
        { id: `${id}-pdf`, type: "pdf", title: "Verification field guide", required: true, minutes: 6, url: "/AZ-How-to-Apply-Nutrition-Assistance.pdf", source: "Approved policy reference" },
        { id: `${id}-aid`, type: "download", title: "Change report job aid", required: false, minutes: 2, url: "/FAA-0412A.pdf", source: "Demonstration job aid" },
        { id: `${id}-quiz`, type: "quiz", title: "Verification knowledge check", required: true, minutes: 8, questions: quizVerification },
      ];
      if (id === "combined-initial-practice") blocks = [
        { id: `${id}-brief`, type: "text", title: "Practice briefing", required: true, minutes: 4, content: "Maya Ortiz is applying for Medicaid, SNAP, and TANF after her work hours changed. Establish the household, review wage evidence, process all three programs, and explain the outcome.", callout: "Synthetic case · no real applicant data" },
        { id: `${id}-simulation`, type: "simulation", title: "Combined initial application", required: true, minutes: 22, scenarioIndex: 0, source: "Frozen package BO-001 · v0.1" },
        { id: `${id}-debrief`, type: "text", title: "Reflect and debrief", required: true, minutes: 3, content: "Compare the sequence you used with the feedback evidence. Identify one interview behavior and one processing behavior to carry into the next attempt." },
        { id: `${id}-check`, type: "quiz", title: "Practice knowledge check", required: true, minutes: 5, questions: quizPractice },
      ];
      if (id === "change-reporting-practice") blocks[1] = { id: `${id}-simulation`, type: "simulation", title: "Household and income change", required: true, minutes: 17, scenarioIndex: 1, source: "Frozen package BO-002 · v0.1" };
      return {
        id, pathId, title, summary, description: `${summary} Use approved sources, structured examples, and immediate feedback to build confidence.`, programs, difficulty, minutes,
        audience: "Eligibility workers", objectives: [`Explain the core decisions in ${title.toLowerCase()}.`, "Apply the workflow to a realistic case example.", "Document the rationale using approved evidence."],
        status: "published", version: 1, order: index + 1, accent: paths.find((path) => path.id === pathId)?.accent || "slate", blocks,
      };
    });
  }

  const initialPersisted = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const state = {
    modules: seedModules(),
    customModules: Array.isArray(initialPersisted.customModules) ? initialPersisted.customModules : [],
    progress: initialPersisted.progress || { "verification-evidence": { blocks: { "verification-evidence-video": { status: "in_progress", progress: 50 }, "verification-evidence-pdf": { status: "not_started", progress: 0 } }, updatedAt: new Date().toISOString() } },
    assignments: initialPersisted.assignments || ["verification-evidence", "combined-initial-practice"],
    selectedPathId: "path-foundations",
    selectedModuleId: "verification-evidence",
    activeBlockId: "verification-evidence-pdf",
    catalogSearch: "",
    programFilter: "All programs",
    difficultyFilter: "All levels",
    formatFilter: "All formats",
    builderStep: 1,
    editingModuleId: null,
    builder: null,
    quizAnswers: {},
    quizResults: {},
    lineageOpen: false,
    hydrated: false,
    context: null,
    videoTimer: null,
  };

  function allModules() { return [...state.modules, ...state.customModules]; }
  function moduleById(id) { return allModules().find((module) => module.id === id); }
  function pathById(id) { return paths.find((path) => path.id === id); }
  function moduleProgress(id) { return state.progress[id] || { blocks: {} }; }
  function blockProgress(moduleId, blockId) { return moduleProgress(moduleId).blocks?.[blockId] || { status: "not_started", progress: 0 }; }
  function completeCount(module) { return module.blocks.filter((block) => block.required && blockProgress(module.id, block.id).status === "completed").length; }
  function requiredCount(module) { return module.blocks.filter((block) => block.required).length || 1; }
  function completionPercent(module) { return Math.round((completeCount(module) / requiredCount(module)) * 100); }
  function moduleComplete(module) { return completionPercent(module) === 100; }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ customModules: state.customModules, progress: state.progress, assignments: state.assignments })); }
  function statusLabel(module) { const value = completionPercent(module); return value === 100 ? "Completed" : value ? `${value}% complete` : state.assignments.includes(module.id) ? "Assigned" : "Published"; }
  function contentIcons(module) { return [...new Set(module.blocks.map((block) => block.type))].slice(0, 4).map((type) => `<span title="${esc(type)}">${icon({ video: "play_circle", pdf: "picture_as_pdf", download: "download", text: "article", quiz: "quiz", simulation: "smart_toy", link: "link", embed: "web_asset" }[type] || "article")}</span>`).join(""); }
  function tags(values) { return values.map((value) => `<span class="lh-tag">${esc(value)}</span>`).join(""); }
  function pathModules(pathId) { return allModules().filter((module) => module.pathId === pathId && module.status !== "archived").sort((a, b) => a.order - b.order); }

  function renderProgressBar(value, label = `${value}%`) {
    return `<div class="lh-progress" aria-label="${esc(label)}"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div>`;
  }

  function moduleCard(module) {
    const value = completionPercent(module);
    return `<article class="lh-module-card" data-module-id="${esc(module.id)}">
      <button class="lh-card-cover ${esc(module.accent)}" data-lh-action="open-module" data-module="${esc(module.id)}" aria-label="Open ${esc(module.title)}"><span>${icon(module.blocks.some((block) => block.type === "simulation") ? "smart_toy" : "school")}</span><small>${esc(pathById(module.pathId)?.title || "Custom path")}</small></button>
      <div class="lh-card-body"><div class="lh-card-tags">${tags(module.programs.slice(0, 2))}</div><h3>${esc(module.title)}</h3><p>${esc(module.summary)}</p>
        <div class="lh-card-meta"><span>${icon("signal_cellular_alt")} ${esc(module.difficulty)}</span><span>${icon("schedule")} ${module.minutes} min</span><span class="lh-format-icons">${contentIcons(module)}</span></div>
        ${value ? `${renderProgressBar(value)}<small class="lh-progress-label">${statusLabel(module)}</small>` : ""}
      </div>
      <footer><span class="lh-status ${moduleComplete(module) ? "complete" : ""}">${statusLabel(module)}</span><button class="lh-inline-action" data-lh-action="open-player" data-module="${esc(module.id)}">${value ? "Continue" : state.context?.role === "author" ? "Preview" : "Start"} ${icon("arrow_forward")}</button></footer>
    </article>`;
  }

  function filteredModules() {
    const query = state.catalogSearch.trim().toLowerCase();
    return allModules().filter((module) => module.status === "published" && (!query || `${module.title} ${module.summary} ${module.programs.join(" ")}`.toLowerCase().includes(query)) && (state.programFilter === "All programs" || module.programs.includes(state.programFilter)) && (state.difficultyFilter === "All levels" || module.difficulty === state.difficultyFilter) && (state.formatFilter === "All formats" || module.blocks.some((block) => block.type === state.formatFilter)));
  }

  function renderCatalog() {
    const modules = filteredModules();
    const continueModule = allModules().find((module) => completionPercent(module) > 0 && !moduleComplete(module));
    const totalMinutes = allModules().filter((module) => module.status === "published").reduce((sum, module) => sum + module.minutes, 0);
    return `<div class="product-page lh-page">
      <section class="lh-hero"><div><span class="page-kicker">Blue Origin Academy</span><h2>Build skills. Practice decisions. Improve outcomes.</h2><p>Lighthouse brings grounded learning, realistic practice, and measurable progress into one workforce-readiness experience.</p><div class="lh-hero-actions">${state.context?.role === "author" ? `<button class="button button-primary" data-lh-action="create-module">${icon("add")} Create module</button><button class="button button-secondary" data-lh-action="manage">Manage modules</button>` : `<button class="button button-primary" data-lh-action="my-learning">Continue my learning</button>`}</div></div><dl><div><dt>${paths.length}</dt><dd>Learning paths</dd></div><div><dt>${allModules().filter((module) => module.status === "published").length}</dt><dd>Modules</dd></div><div><dt>${Math.round(totalMinutes / 30) / 2}h</dt><dd>Guided learning</dd></div></dl></section>
      ${continueModule ? `<section class="lh-continue"><span class="lh-overline">Continue learning</span><div><div><h3>${esc(continueModule.title)}</h3><p>${esc(continueModule.summary)}</p></div><strong>${completionPercent(continueModule)}%</strong></div>${renderProgressBar(completionPercent(continueModule))}<button class="button button-primary" data-lh-action="open-player" data-module="${esc(continueModule.id)}">Resume module ${icon("arrow_forward")}</button></section>` : ""}
      <section class="lh-section-heading"><div><span class="page-kicker">Guided curriculum</span><h3>Learning paths</h3><p>Move from core knowledge to applied practice.</p></div></section>
      <section class="lh-path-grid">${paths.map((path) => { const modulesForPath = pathModules(path.id); const completed = modulesForPath.filter(moduleComplete).length; return `<button class="lh-path-card ${esc(path.accent)}" data-lh-action="open-path" data-path="${esc(path.id)}"><span class="lh-path-icon">${icon(path.id === "path-practice" ? "neurology" : "route")}</span><div>${tags(path.programs.slice(0, 2))}<h3>${esc(path.title)}</h3><p>${esc(path.summary)}</p></div><footer><span>${completed} of ${modulesForPath.length} completed</span>${icon("arrow_forward")}</footer></button>`; }).join("")}</section>
      <section class="lh-catalog-header"><div><span class="page-kicker">Explore Lighthouse</span><h3>All modules</h3></div><label class="lh-search">${icon("search")}<input id="lhCatalogSearch" value="${esc(state.catalogSearch)}" placeholder="Search modules…" /></label></section>
      <div class="lh-filters"><select data-lh-filter="program"><option>All programs</option>${["SNAP", "Medicaid", "TANF", "Operations", "Simulation"].map((item) => `<option ${state.programFilter === item ? "selected" : ""}>${item}</option>`).join("")}</select><select data-lh-filter="difficulty"><option>All levels</option>${["Beginner", "Intermediate", "Advanced"].map((item) => `<option ${state.difficultyFilter === item ? "selected" : ""}>${item}</option>`).join("")}</select><select data-lh-filter="format"><option>All formats</option>${["video", "pdf", "quiz", "simulation"].map((item) => `<option value="${item}" ${state.formatFilter === item ? "selected" : ""}>${item[0].toUpperCase() + item.slice(1)}</option>`).join("")}</select></div>
      <section class="lh-module-grid">${modules.length ? modules.map(moduleCard).join("") : `<div class="lh-empty">${icon("search_off")}<h3>No modules match these filters</h3><p>Try a broader search or clear one of the filters.</p><button class="button button-secondary" data-lh-action="clear-filters">Clear filters</button></div>`}</section>
    </div>`;
  }

  function renderPath() {
    const path = pathById(state.selectedPathId) || paths[0];
    const modules = pathModules(path.id);
    const progress = modules.length ? Math.round(modules.reduce((sum, module) => sum + completionPercent(module), 0) / modules.length) : 0;
    return `<div class="product-page lh-page"><button class="lh-back" data-lh-action="catalog">${icon("arrow_back")} Lighthouse</button>
      <section class="lh-path-hero ${esc(path.accent)}"><div><span class="page-kicker">Learning path</span>${tags(path.programs)}<h2>${esc(path.title)}</h2><p>${esc(path.summary)}</p><strong>Outcome</strong><p>${esc(path.outcome)}</p></div><aside><span>${icon("route")}</span><dl><div><dt>${modules.length}</dt><dd>Modules</dd></div><div><dt>${modules.reduce((sum, module) => sum + module.minutes, 0)}</dt><dd>Minutes</dd></div><div><dt>${progress}%</dt><dd>Complete</dd></div></dl>${renderProgressBar(progress)}</aside></section>
      <section class="lh-section-heading"><div><span class="page-kicker">Curriculum</span><h3>Modules in this path</h3></div></section>
      <div class="lh-path-list">${modules.map((module, index) => `<article><span class="lh-module-number ${moduleComplete(module) ? "complete" : ""}">${moduleComplete(module) ? icon("check") : String(index + 1).padStart(2, "0")}</span><div><div class="lh-card-tags">${tags(module.programs)}</div><h3>${esc(module.title)}</h3><p>${esc(module.summary)}</p><span>${module.blocks.length} lessons · ${module.minutes} min · ${esc(module.difficulty)}</span></div><div>${renderProgressBar(completionPercent(module))}<button class="button ${completionPercent(module) ? "button-primary" : "button-secondary"}" data-lh-action="open-player" data-module="${esc(module.id)}">${completionPercent(module) ? "Continue" : state.context?.role === "author" ? "Preview" : "Start"}</button></div></article>`).join("")}</div>
    </div>`;
  }

  function renderBlock(module, block) {
    const progress = blockProgress(module.id, block.id);
    if (block.type === "video") return `<section class="lh-content-block"><div class="lh-video-stage" data-lh-video-stage><div class="lh-video-frame"><video data-lh-video preload="metadata" playsinline aria-label="${esc(block.title)}" src="${esc(block.url || "/assets/lighthouse-verification.mp4")}">${block.captionsUrl ? `<track kind="captions" srclang="en" label="English" src="${esc(block.captionsUrl)}" default />` : ""}</video><div class="lh-video-poster" data-lh-video-poster>${icon("play_circle")}<span>${esc(block.posterLabel || block.title)}</span><small>${esc(block.source || "Blue Origin Studio")}</small></div></div><div class="lh-video-controls"><button class="lh-video-play" data-lh-action="play-video" data-module="${esc(module.id)}" data-block="${esc(block.id)}">${icon("play_arrow")} Watch lesson</button><div>${renderProgressBar(progress.progress || 0, "Video progress")}<span data-lh-video-label>${progress.progress || 0}% watched</span></div><time>${Math.floor((block.duration || 0) / 60)}:${String((block.duration || 0) % 60).padStart(2, "0")}</time></div></div><div class="lh-transcript"><strong>Lesson summary</strong><p>This grounded explainer shows how focused verification connects evidence, worker judgment, and a clear eligibility decision.</p></div></section>`;
    if (block.type === "pdf") return `<section class="lh-content-block"><div class="lh-document-bar"><div>${icon("picture_as_pdf")}<span><strong>${esc(block.title)}</strong><small>${esc(block.source || "Approved reference")}</small></span></div><a class="button button-secondary" href="${esc(block.url)}" target="_blank" rel="noopener">Open full document</a></div><iframe class="lh-pdf-frame" title="${esc(block.title)}" src="${esc(block.url)}#toolbar=0&navpanes=0"></iframe></section>`;
    if (block.type === "download") return `<section class="lh-download-card">${icon("download_for_offline")}<div><span class="page-kicker">Downloadable resource</span><h3>${esc(block.title)}</h3><p>${esc(block.source || "Module resource")}</p></div><a class="button button-secondary" href="${esc(block.url || "#")}" download>Download</a></section>`;
    if (block.type === "simulation") return `<section class="lh-simulation-card"><div><span>${icon("smart_toy")}</span><div><span class="page-kicker">Applied practice</span><h3>${esc(block.title)}</h3><p>Enter the frozen Blue Origin simulation, complete the client interaction, and return with evidence-linked feedback.</p>${tags([block.source || "Synthetic case", `${block.minutes} min`])}</div></div><button class="button button-primary" data-lh-action="launch-simulation" data-module="${esc(module.id)}" data-block="${esc(block.id)}" data-scenario="${block.scenarioIndex || 0}">Launch simulation ${icon("arrow_forward")}</button></section>`;
    if (block.type === "quiz") {
      const result = state.quizResults[block.id];
      return `<section class="lh-quiz"><header><span>${icon("quiz")}</span><div><span class="page-kicker">Knowledge check</span><h3>${esc(block.title)}</h3><p>Score 80% or higher to complete this lesson.</p></div>${result ? `<strong class="${result.passed ? "passed" : "retry"}">${result.score}%</strong>` : ""}</header><form data-lh-quiz="${esc(block.id)}">${block.questions.map((question, index) => `<fieldset><legend><span>${index + 1}</span>${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="${esc(block.id)}-${index}" value="${optionIndex}" ${state.quizAnswers[`${block.id}:${index}`] === optionIndex ? "checked" : ""}/><span>${esc(option)}</span></label>`).join("")}${result ? `<p class="lh-explanation ${state.quizAnswers[`${block.id}:${index}`] === question.answer ? "correct" : "incorrect"}">${esc(question.explanation)}</p>` : ""}</fieldset>`).join("")}<button class="button button-primary" type="button" data-lh-action="submit-quiz" data-module="${esc(module.id)}" data-block="${esc(block.id)}">${result?.passed ? "Passed" : result ? "Try again" : "Submit answers"}</button></form></section>`;
    }
    if (block.type === "link" || block.type === "embed") return `<section class="lh-download-card">${icon("link")}<div><span class="page-kicker">External resource</span><h3>${esc(block.title)}</h3><p>${esc(block.content || "Open the supporting learning resource.")}</p></div><a class="button button-secondary" href="${esc(block.url || "#")}" target="_blank" rel="noopener">Open resource</a></section>`;
    return `<article class="lh-reading"><span class="page-kicker">Lesson</span><h3>${esc(block.title)}</h3>${block.callout ? `<aside>${icon("verified")}<span>${esc(block.callout)}</span></aside>` : ""}<p>${esc(block.content || "Learning content is ready for author review.")}</p><h4>What to carry forward</h4><ul><li>Use the approved source before making a material decision.</li><li>Document what changed and why the selected action is supported.</li><li>Explain the next step in language the client can act on.</li></ul></article>`;
  }

  function renderPlayer() {
    const module = moduleById(state.selectedModuleId) || allModules()[0];
    if (!module) return renderCatalog();
    const active = module.blocks.find((block) => block.id === state.activeBlockId) || module.blocks.find((block) => blockProgress(module.id, block.id).status !== "completed") || module.blocks[0];
    state.activeBlockId = active.id;
    const index = module.blocks.findIndex((block) => block.id === active.id);
    const complete = moduleComplete(module);
    if (complete && state.context?.role !== "author" && state.lineageOpen === "completion") return renderCompletion(module);
    return `<div class="lh-player"><aside class="lh-player-outline"><button class="lh-player-exit" data-lh-action="catalog">${icon("arrow_back")} Exit module</button><div><span class="page-kicker">${esc(pathById(module.pathId)?.title || "Lighthouse")}</span><h2>${esc(module.title)}</h2><span>${completionPercent(module)}% complete</span>${renderProgressBar(completionPercent(module))}</div><nav aria-label="Module lessons">${module.blocks.map((block, blockIndex) => { const item = blockProgress(module.id, block.id); return `<button class="${block.id === active.id ? "active" : ""} ${item.status === "completed" ? "complete" : ""}" data-lh-action="select-block" data-block="${esc(block.id)}"><span>${item.status === "completed" ? icon("check") : blockIndex + 1}</span><span><strong>${esc(block.title)}</strong><small>${esc(block.type)} · ${block.minutes || 3} min</small></span></button>`; }).join("")}</nav><button class="lh-source-button" data-lh-action="toggle-lineage">${icon("account_tree")} Sources & lineage</button></aside>
      <main class="lh-player-main"><header><button class="lh-mobile-outline" data-lh-action="toggle-outline">${icon("format_list_bulleted")} Lessons</button><div><span>Lesson ${index + 1} of ${module.blocks.length}</span><strong>${esc(active.title)}</strong></div><span class="lh-required">${active.required ? "Required" : "Optional"}</span></header><div class="lh-player-content">${renderBlock(module, active)}</div><footer><button class="button button-secondary" data-lh-action="previous-block" ${index === 0 ? "disabled" : ""}>${icon("arrow_back")} Previous</button><div>${blockProgress(module.id, active.id).status === "completed" ? `<span class="lh-complete-label">${icon("check_circle")} Lesson complete</span>` : !["quiz", "simulation", "video"].includes(active.type) ? `<button class="button button-secondary" data-lh-action="complete-block" data-module="${esc(module.id)}" data-block="${esc(active.id)}">Mark complete</button>` : ""}<button class="button button-primary" data-lh-action="next-block" ${index === module.blocks.length - 1 && !moduleComplete(module) ? "disabled" : ""}>${index === module.blocks.length - 1 ? "Finish module" : "Next"} ${icon("arrow_forward")}</button></div></footer></main>
      ${state.lineageOpen === true ? `<aside class="lh-lineage"><header><div><span class="page-kicker">Grounding</span><h3>Sources & lineage</h3></div><button data-lh-action="toggle-lineage" aria-label="Close source lineage">${icon("close")}</button></header><div>${module.blocks.map((block) => `<article>${icon(block.source ? "verified" : "edit_note")}<div><strong>${esc(block.title)}</strong><p>${esc(block.source || "Author-created learning content")}</p><span>${esc(block.type)} · ${block.required ? "Required" : "Optional"}</span></div></article>`).join("")}</div></aside>` : ""}
    </div>`;
  }

  function renderCompletion(module) {
    const quizScores = module.blocks.map((block) => state.quizResults[block.id]?.score || blockProgress(module.id, block.id).score).filter((score) => Number.isFinite(score));
    const score = quizScores.length ? Math.round(quizScores.reduce((sum, value) => sum + value, 0) / quizScores.length) : 100;
    const next = pathModules(module.pathId).find((item) => item.order > module.order) || allModules().find((item) => item.pathId !== module.pathId && !moduleComplete(item));
    return `<div class="product-page lh-page"><section class="lh-completion"><span class="lh-badge-mark">${icon("workspace_premium")}</span><span class="page-kicker">Module completed</span><h2>${esc(module.title)}</h2><p>You completed every required lesson and demonstrated the core knowledge in this module.</p><div class="lh-completion-metrics"><div><strong>${score}%</strong><span>Knowledge score</span></div><div><strong>${module.minutes}</strong><span>Minutes</span></div><div><strong>${module.blocks.length}</strong><span>Lessons completed</span></div></div><div class="lh-skill-row">${tags(module.objectives.map((objective) => objective.split(" ").slice(0, 4).join(" ")))}</div><div class="lh-completion-actions"><button class="button button-secondary" data-lh-action="catalog">Return to Lighthouse</button>${next ? `<button class="button button-primary" data-lh-action="open-player" data-module="${esc(next.id)}">Next: ${esc(next.title)} ${icon("arrow_forward")}</button>` : ""}</div></section></div>`;
  }

  function renderMyLearning() {
    const assigned = state.assignments.map(moduleById).filter(Boolean);
    const inProgress = assigned.filter((module) => completionPercent(module) > 0 && !moduleComplete(module));
    const active = [...inProgress, ...assigned.filter((module) => !inProgress.includes(module) && !moduleComplete(module))];
    const completed = allModules().filter(moduleComplete);
    return `<div class="product-page lh-page"><section class="lh-page-title"><div><span class="page-kicker">Learner workspace</span><h2>My learning</h2><p>Continue assigned work, revisit completed modules, and see what comes next.</p></div><div class="lh-learning-score">${icon("workspace_premium")}<div><strong>${completed.length}</strong><span>Modules completed</span></div></div></section>
      <section class="lh-section-heading"><div><h3>Assigned and in progress</h3><p>${active.length} active module${active.length === 1 ? "" : "s"}</p></div></section><section class="lh-module-grid">${active.map(moduleCard).join("") || `<div class="lh-empty"><h3>No active assignments</h3><button class="button button-primary" data-lh-action="catalog">Explore Lighthouse</button></div>`}</section>
      <section class="lh-section-heading"><div><h3>Completed</h3><p>Your Blue Origin Academy history</p></div></section><div class="lh-completed-list">${completed.length ? completed.map((module) => `<button data-lh-action="open-player" data-module="${esc(module.id)}">${icon("workspace_premium")}<span><strong>${esc(module.title)}</strong><small>${esc(pathById(module.pathId)?.title)} · Completed</small></span><strong>Review ${icon("arrow_forward")}</strong></button>`).join("") : `<p>Complete your first module to earn a Lighthouse badge.</p>`}</div></div>`;
  }

  function renderManage() {
    const modules = allModules();
    const completions = modules.filter(moduleComplete).length + 8;
    return `<div class="product-page lh-page"><section class="lh-page-title"><div><span class="page-kicker">Lighthouse administration</span><h2>Manage modules</h2><p>Build, publish, assign, and understand the learning experience.</p></div><button class="button button-primary" data-lh-action="create-module">${icon("add")} Create module</button></section>
      <section class="lh-analytics"><article><span>${icon("group")}</span><strong>12</strong><small>Assigned learners</small></article><article><span>${icon("play_circle")}</span><strong>10</strong><small>Started</small></article><article><span>${icon("task_alt")}</span><strong>${completions}</strong><small>Completions</small></article><article><span>${icon("monitoring")}</span><strong>82%</strong><small>Completion rate</small></article><article><span>${icon("quiz")}</span><strong>88%</strong><small>Average quiz score</small></article></section>
      <div class="lh-manage-toolbar"><div class="lh-tabset"><button class="active">All</button><button>Draft</button><button>Published</button><button>Archived</button></div><label class="lh-search">${icon("search")}<input placeholder="Search modules…" data-lh-manage-search /></label></div>
      <section class="lh-module-table"><header><span>Module</span><span>Path</span><span>Learning</span><span>Status</span><span></span></header>${modules.map((module) => `<article data-lh-manage-row data-title="${esc(module.title.toLowerCase())}"><div><span class="lh-table-icon ${esc(module.accent)}">${icon(module.blocks.some((block) => block.type === "simulation") ? "smart_toy" : "school")}</span><span><strong>${esc(module.title)}</strong><small>v${module.version || 0} · ${module.blocks.length} lessons</small></span></div><span>${esc(pathById(module.pathId)?.title || "Custom")}</span><span>${module.minutes} min · ${module.blocks.length} blocks</span><span class="lh-status ${module.status}">${esc(module.status)}</span><div class="lh-row-actions"><button data-lh-action="edit-module" data-module="${esc(module.id)}" aria-label="Edit ${esc(module.title)}">${icon("edit")}</button><button data-lh-action="open-player" data-module="${esc(module.id)}" aria-label="Preview ${esc(module.title)}">${icon("visibility")}</button><button data-lh-action="assign-module" data-module="${esc(module.id)}" aria-label="Assign ${esc(module.title)}">${icon("person_add")}</button><button data-lh-action="duplicate-module" data-module="${esc(module.id)}" aria-label="Duplicate ${esc(module.title)}">${icon("content_copy")}</button></div></article>`).join("")}</section>
      <section class="lh-cohort"><div><span class="page-kicker">Synthetic demo cohort</span><h3>Learner status</h3></div><div>${["Maya O.", "Andre B.", "Danielle R.", "Robert C."].map((name, index) => `<article><span class="lh-avatar">${name.split(/\s/).map((part) => part[0]).join("")}</span><div><strong>${name}</strong><small>${index < 2 ? "Verification and Evidence" : "Combined Initial Application Practice"}</small></div><span>${index === 0 ? "Completed" : index === 1 ? "68% complete" : "Assigned"}</span></article>`).join("")}</div></section>
    </div>`;
  }

  function newBuilder(module = null) {
    const copy = module ? clone(module) : { id: `module-${Date.now()}`, pathId: paths[0].id, title: "", summary: "", description: "", programs: ["Integrated eligibility"], difficulty: "Beginner", minutes: 15, audience: "Eligibility workers", objectives: [""], status: "draft", version: 0, order: allModules().length + 1, accent: "slate", blocks: [] };
    copy.status = module?.status === "published" ? "draft" : copy.status;
    state.builder = copy;
    state.editingModuleId = module?.id || null;
    state.builderStep = 1;
  }

  function renderBuilderDetails() {
    const draft = state.builder;
    return `<div class="lh-builder-panel"><div class="lh-form-grid"><label class="full"><span>Module title *</span><input data-lh-builder-field="title" value="${esc(draft.title)}" placeholder="e.g. Verification Fundamentals" /></label><label class="full"><span>Summary *</span><textarea data-lh-builder-field="summary" placeholder="A concise catalog description">${esc(draft.summary)}</textarea></label><label class="full"><span>Description</span><textarea data-lh-builder-field="description">${esc(draft.description)}</textarea></label><label><span>Learning path</span><select data-lh-builder-field="pathId">${paths.map((path) => `<option value="${esc(path.id)}" ${draft.pathId === path.id ? "selected" : ""}>${esc(path.title)}</option>`).join("")}</select></label><label><span>Difficulty</span><select data-lh-builder-field="difficulty">${["Beginner", "Intermediate", "Advanced"].map((value) => `<option ${draft.difficulty === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label><span>Audience</span><input data-lh-builder-field="audience" value="${esc(draft.audience)}" /></label><label><span>Estimated minutes</span><input type="number" min="1" max="240" data-lh-builder-field="minutes" value="${draft.minutes}" /></label><label class="full"><span>Program tags</span><input data-lh-builder-field="programs" value="${esc(draft.programs.join(", "))}" placeholder="SNAP, Medicaid" /></label><label class="full"><span>Learning objectives *</span><textarea data-lh-builder-field="objectives" placeholder="One objective per line">${esc(draft.objectives.join("\n"))}</textarea></label></div></div>`;
  }

  function renderBuilderContent() {
    const draft = state.builder;
    return `<div class="lh-builder-layout"><aside class="lh-block-palette"><span class="page-kicker">Add content</span><h3>Learning blocks</h3><p>Combine Studio releases, uploaded assets, and author guidance.</p>${[["text", "article", "Text lesson"], ["video", "play_circle", "Studio video"], ["pdf", "picture_as_pdf", "PDF or deck"], ["quiz", "quiz", "Knowledge check"], ["simulation", "smart_toy", "Simulation"], ["link", "link", "Link or embed"]].map(([type, glyph, label]) => `<button data-lh-action="add-block" data-type="${type}">${icon(glyph)}<span>${label}</span>${icon("add")}</button>`).join("")}<label class="lh-upload-button">${icon("upload_file")}<span>Upload asset</span><input type="file" id="lhAssetUpload" accept="video/mp4,video/webm,application/pdf,.ppt,.pptx,image/png,image/jpeg" /></label></aside><section class="lh-block-canvas"><header><div><span class="page-kicker">Module content</span><h3>${draft.blocks.length} block${draft.blocks.length === 1 ? "" : "s"}</h3></div><span>Use arrows for accessible ordering</span></header>${draft.blocks.length ? draft.blocks.map((block, index) => `<article class="lh-builder-block"><span class="lh-drag-handle">${icon("drag_indicator")}</span><span class="lh-block-icon">${icon({ text: "article", video: "play_circle", pdf: "picture_as_pdf", download: "download", quiz: "quiz", simulation: "smart_toy", link: "link", embed: "web_asset" }[block.type] || "article")}</span><div><input data-lh-block-title="${index}" value="${esc(block.title)}" aria-label="Block title"/><small>${esc(block.type)} · ${block.minutes || 3} min · ${block.required ? "Required" : "Optional"}</small></div><label class="lh-required-toggle"><input type="checkbox" data-lh-block-required="${index}" ${block.required ? "checked" : ""}/><span>Required</span></label><div class="lh-builder-actions"><button data-lh-action="move-block-up" data-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Move block up">${icon("arrow_upward")}</button><button data-lh-action="move-block-down" data-index="${index}" ${index === draft.blocks.length - 1 ? "disabled" : ""} aria-label="Move block down">${icon("arrow_downward")}</button><button data-lh-action="remove-block" data-index="${index}" aria-label="Remove block">${icon("delete")}</button></div></article>`).join("") : `<div class="lh-builder-empty">${icon("view_agenda")}<h3>Build the learning sequence</h3><p>Add a text lesson, Studio asset, upload, quiz, or simulation.</p></div>`}</section></div>`;
  }

  function renderBuilderReview() {
    const draft = state.builder;
    const checks = [{ label: "Module title and summary", ok: Boolean(draft.title.trim() && draft.summary.trim()) }, { label: "At least one learning objective", ok: draft.objectives.some((item) => item.trim()) }, { label: "At least one content block", ok: draft.blocks.length > 0 }, { label: "Every block has a title", ok: draft.blocks.every((block) => block.title.trim()) }];
    return `<div class="lh-review-grid"><section><span class="page-kicker">Learner preview</span><div class="lh-review-cover ${esc(pathById(draft.pathId)?.accent || "slate")}">${icon("school")}<div>${tags(draft.programs)}<h2>${esc(draft.title || "Untitled module")}</h2><p>${esc(draft.summary || "Add a catalog summary in Details.")}</p><span>${draft.blocks.length} lessons · ${draft.minutes} min · ${esc(draft.difficulty)}</span></div></div><div class="lh-review-outline">${draft.blocks.map((block, index) => `<div><span>${index + 1}</span><div><strong>${esc(block.title)}</strong><small>${esc(block.type)} · ${block.required ? "Required" : "Optional"}</small></div></div>`).join("")}</div></section><aside><span class="page-kicker">Publish readiness</span><h3>Review checklist</h3>${checks.map((check) => `<div class="lh-check ${check.ok ? "ready" : "missing"}">${icon(check.ok ? "check_circle" : "error")}<span>${esc(check.label)}</span></div>`).join("")}<div class="lh-version-card"><span>${icon("history")}</span><div><strong>${draft.version ? `Republish as v${draft.version + 1}` : "Publish version 1"}</strong><p>Learners keep the previous snapshot until this draft is published.</p></div></div><button class="button button-primary" data-lh-action="publish-module" ${checks.every((check) => check.ok) ? "" : "disabled"}>Publish module</button><button class="button button-secondary" data-lh-action="publish-assign" ${checks.every((check) => check.ok) ? "" : "disabled"}>Publish & assign</button></aside></div>`;
  }

  function renderBuilder() {
    if (!state.builder) newBuilder();
    return `<div class="product-page lh-page"><button class="lh-back" data-lh-action="manage">${icon("arrow_back")} Manage modules</button><section class="lh-page-title"><div><span class="page-kicker">Module builder</span><h2>${state.editingModuleId ? `Edit ${esc(state.builder.title)}` : "Create a learning module"}</h2><p>Assemble approved content into a focused, measurable learner journey.</p></div><span class="lh-draft-badge">Draft saved locally</span></section><nav class="lh-builder-steps" aria-label="Module builder steps">${["Details", "Content", "Review & publish"].map((label, index) => `<button class="${state.builderStep === index + 1 ? "active" : ""} ${state.builderStep > index + 1 ? "complete" : ""}" data-lh-action="builder-step" data-step="${index + 1}"><span>${state.builderStep > index + 1 ? icon("check") : index + 1}</span><strong>${label}</strong></button>`).join("")}</nav>${state.builderStep === 1 ? renderBuilderDetails() : state.builderStep === 2 ? renderBuilderContent() : renderBuilderReview()}<footer class="lh-builder-footer"><button class="button button-secondary" data-lh-action="builder-back" ${state.builderStep === 1 ? "disabled" : ""}>${icon("arrow_back")} Back</button><span>Step ${state.builderStep} of 3</span>${state.builderStep < 3 ? `<button class="button button-primary" data-lh-action="builder-next">Continue ${icon("arrow_forward")}</button>` : `<button class="button button-secondary" data-lh-action="open-builder-preview">Preview as learner</button>`}</footer></div>`;
  }

  function render(route, context = {}) {
    state.context = context;
    if (route === "lighthouse-path") return renderPath();
    if (route === "lighthouse-player") return renderPlayer();
    if (route === "lighthouse-builder") return renderBuilder();
    if (route === "lighthouse-manage") return renderManage();
    if (route === "my-learning") return renderMyLearning();
    return renderCatalog();
  }

  async function api(path, options = {}) {
    try {
      const response = await fetch(`/api/lighthouse${path}`, { ...options, headers: { ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || `Request failed (${response.status})`);
      return await response.json();
    } catch { return null; }
  }

  function updateProgress(moduleId, blockId, patch) {
    const current = state.progress[moduleId] || { blocks: {} };
    current.blocks ||= {};
    current.blocks[blockId] = { ...(current.blocks[blockId] || {}), ...patch, updatedAt: new Date().toISOString() };
    current.updatedAt = new Date().toISOString();
    state.progress[moduleId] = current;
    persist();
    api("/progress", { method: "PUT", body: JSON.stringify({ module_id: moduleId, block_id: blockId, ...current.blocks[blockId] }) });
  }

  function rerender() { state.context?.rerender?.(); }
  function toast(title, message, glyph) { state.context?.showToast?.(title, message, glyph); }
  function navigate(route) { state.context?.navigate?.(route); }

  async function uploadAsset(file) {
    const allowed = ["video/mp4", "video/webm", "application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg"];
    const mimeType = file.type || (/\.pptx$/i.test(file.name) ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : /\.ppt$/i.test(file.name) ? "application/vnd.ms-powerpoint" : "");
    const limit = mimeType.startsWith("video/") ? 250 * 1024 * 1024 : mimeType.startsWith("image/") ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (!allowed.includes(mimeType)) return toast("Unsupported file", "Use MP4, WebM, PDF, PPTX, PNG, or JPEG.", "!");
    if (file.size > limit) return toast("File is too large", `The limit for this asset type is ${Math.round(limit / 1024 / 1024)} MB.`, "!");
    const type = mimeType.startsWith("video/") ? "video" : mimeType === "application/pdf" ? "pdf" : "download";
    const block = { id: `block-${Date.now()}`, type, title: file.name.replace(/\.[^.]+$/, ""), required: true, minutes: type === "video" ? 5 : 3, url: URL.createObjectURL(file), source: `Uploaded asset · ${file.name}`, fileName: file.name, mimeType, byteSize: file.size };
    state.builder.blocks.push(block);
    rerender();
    toast("Asset added", `${file.name} is ready in this module draft.`);
    try {
      const blobClient = await import("https://esm.sh/@vercel/blob@2/client");
      const uploaded = await blobClient.upload(file.name, file, { access: "private", contentType: mimeType, handleUploadUrl: "/api/lighthouse/assets/upload-token", clientPayload: JSON.stringify({ fileName: file.name, mimeType, byteSize: file.size, kind: type }) });
      block.url = uploaded.url;
      block.assetUrl = uploaded.url;
      const asset = await api("/assets/register", { method: "POST", body: JSON.stringify({ title: block.title, kind: type, file_name: file.name, mime_type: mimeType, byte_size: file.size, blob_url: uploaded.url, pathname: uploaded.pathname }) });
      if (asset?.asset_id) { block.assetId = asset.asset_id; block.url = `/api/lighthouse/assets/${encodeURIComponent(asset.asset_id)}/content`; }
      persist();
    } catch { /* Local object URL keeps the prototype flow functional. */ }
  }

  function addBlock(type) {
    const id = `block-${Date.now()}`;
    const defaults = {
      text: { title: "New text lesson", content: "Add the learner-facing explanation and key takeaways.", minutes: 4 },
      video: { title: "Studio video", source: "Blue Origin Studio release", posterLabel: "Grounded learning video", duration: 120, minutes: 3 },
      pdf: { title: "Reference deck", url: "/FAA-0001A.pdf", source: "Uploaded PDF", minutes: 5 },
      quiz: { title: "Knowledge check", questions: clone(quizPractice), minutes: 5 },
      simulation: { title: "Combined initial application", scenarioIndex: 0, source: "Frozen package BO-001 · v0.1", minutes: 22 },
      link: { title: "Supporting resource", url: "https://www.fns.usda.gov/snap", content: "Open the approved supporting resource.", minutes: 3 },
    };
    state.builder.blocks.push({ id, type, required: true, ...(defaults[type] || defaults.text) });
    rerender();
  }

  function saveBuilderFields(root) {
    root.querySelectorAll("[data-lh-builder-field]").forEach((field) => {
      const key = field.dataset.lhBuilderField;
      if (key === "programs") state.builder.programs = field.value.split(",").map((value) => value.trim()).filter(Boolean);
      else if (key === "objectives") state.builder.objectives = field.value.split("\n").map((value) => value.trim()).filter(Boolean);
      else if (key === "minutes") state.builder.minutes = Number(field.value) || 1;
      else state.builder[key] = field.value;
    });
    root.querySelectorAll("[data-lh-block-title]").forEach((field) => { state.builder.blocks[Number(field.dataset.lhBlockTitle)].title = field.value; });
    root.querySelectorAll("[data-lh-block-required]").forEach((field) => { state.builder.blocks[Number(field.dataset.lhBlockRequired)].required = field.checked; });
  }

  async function publishBuilder(assign) {
    const draft = clone(state.builder);
    if (!(draft.title.trim() && draft.summary.trim() && draft.objectives.length && draft.blocks.length)) return toast("Module is not ready", "Complete the publish checklist before publishing.", "!");
    draft.status = "published";
    draft.version = (moduleById(draft.id)?.version || draft.version || 0) + 1;
    draft.accent = pathById(draft.pathId)?.accent || "slate";
    draft.publishedSnapshot = clone(draft);
    const existingIndex = state.customModules.findIndex((module) => module.id === draft.id);
    if (existingIndex >= 0) state.customModules[existingIndex] = draft; else state.customModules.push(draft);
    if (assign && !state.assignments.includes(draft.id)) state.assignments.unshift(draft.id);
    persist();
    await api(`/modules${state.editingModuleId ? `/${encodeURIComponent(draft.id)}` : ""}`, { method: state.editingModuleId ? "PATCH" : "POST", body: JSON.stringify(draft) });
    await api(`/modules/${encodeURIComponent(draft.id)}/publish`, { method: "POST", headers: { "X-BlueOrigin-Approval": "confirmed" }, body: JSON.stringify({ assign }) });
    state.selectedModuleId = draft.id;
    state.activeBlockId = draft.blocks[0].id;
    toast("Module published", `${draft.title} is live in Lighthouse as version ${draft.version}.`);
    if (assign) toast("Assigned to learner", "The module is now visible in My Learning.");
    navigate("lighthouse-manage");
  }

  function bind(root, context) {
    state.context = context;
    if (root.dataset.lighthouseBound === "true") return;
    root.dataset.lighthouseBound = "true";
    root.addEventListener("input", (event) => {
      if (event.target.id === "lhCatalogSearch") { state.catalogSearch = event.target.value; window.clearTimeout(event.target._timer); event.target._timer = window.setTimeout(rerender, 120); }
      if (event.target.matches("[data-lh-builder-field], [data-lh-block-title], [data-lh-block-required]")) saveBuilderFields(root);
      if (event.target.matches("[data-lh-quiz] input")) { const [blockId, index] = event.target.name.split(/-(?=\d+$)/); state.quizAnswers[`${blockId}:${index}`] = Number(event.target.value); }
      if (event.target.matches("[data-lh-manage-search]")) root.querySelectorAll("[data-lh-manage-row]").forEach((row) => { row.hidden = !row.dataset.title.includes(event.target.value.toLowerCase()); });
    });
    root.addEventListener("change", (event) => {
      if (event.target.dataset.lhFilter) { state[`${event.target.dataset.lhFilter}Filter`] = event.target.value; rerender(); }
      if (event.target.id === "lhAssetUpload" && event.target.files[0]) uploadAsset(event.target.files[0]);
    });
    root.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-lh-action]");
      if (!trigger) return;
      const action = trigger.dataset.lhAction;
      if (action === "catalog") { state.lineageOpen = false; return navigate("lighthouse"); }
      if (action === "manage") return navigate("lighthouse-manage");
      if (action === "my-learning") return navigate("my-learning");
      if (action === "clear-filters") { state.catalogSearch = ""; state.programFilter = "All programs"; state.difficultyFilter = "All levels"; state.formatFilter = "All formats"; return rerender(); }
      if (action === "open-path") { state.selectedPathId = trigger.dataset.path; return navigate("lighthouse-path"); }
      if (action === "open-module") { const module = moduleById(trigger.dataset.module); state.selectedPathId = module.pathId; return navigate("lighthouse-path"); }
      if (action === "open-player") { const module = moduleById(trigger.dataset.module); state.selectedModuleId = module.id; state.activeBlockId = module.blocks.find((block) => blockProgress(module.id, block.id).status !== "completed")?.id || module.blocks[0].id; state.lineageOpen = false; return navigate("lighthouse-player"); }
      if (action === "select-block") { state.activeBlockId = trigger.dataset.block; return rerender(); }
      if (action === "toggle-lineage") { state.lineageOpen = state.lineageOpen === true ? false : true; return rerender(); }
      if (action === "toggle-outline") { root.querySelector(".lh-player-outline")?.classList.toggle("open"); return; }
      if (action === "previous-block" || action === "next-block") {
        const module = moduleById(state.selectedModuleId); const index = module.blocks.findIndex((block) => block.id === state.activeBlockId);
        if (action === "next-block" && index === module.blocks.length - 1 && moduleComplete(module)) { state.lineageOpen = "completion"; return rerender(); }
        const next = module.blocks[index + (action === "next-block" ? 1 : -1)]; if (next) { state.activeBlockId = next.id; rerender(); } return;
      }
      if (action === "complete-block") { updateProgress(trigger.dataset.module, trigger.dataset.block, { status: "completed", progress: 100 }); toast("Lesson complete", "Your Lighthouse progress was saved."); return rerender(); }
      if (action === "play-video") {
        if (state.videoTimer) window.clearInterval(state.videoTimer);
        let progress = blockProgress(trigger.dataset.module, trigger.dataset.block).progress || 0;
        trigger.disabled = true; trigger.innerHTML = `${icon("pause")} Playing…`;
        const stage = root.querySelector("[data-lh-video-stage]"); const video = stage?.querySelector("[data-lh-video]"); const bar = stage?.querySelector(".lh-progress span"); const label = stage?.querySelector("[data-lh-video-label]");
        let completed = false;
        const completeVideo = () => { if (completed) return; completed = true; updateProgress(trigger.dataset.module, trigger.dataset.block, { status: "completed", progress: 100 }); toast("Video complete", "You watched the required portion of this lesson."); rerender(); };
        const syncVideo = () => { if (!video?.duration || completed) return; progress = Math.min(100, Math.round((video.currentTime / video.duration) * 100)); if (bar) bar.style.width = `${progress}%`; if (label) label.textContent = `${progress}% watched`; updateProgress(trigger.dataset.module, trigger.dataset.block, { status: progress >= 80 ? "completed" : "in_progress", progress }); if (progress >= 80) completeVideo(); };
        const play = () => { if (!video) return; if (progress > 0 && progress < 80 && video.currentTime < 0.1) video.currentTime = video.duration * progress / 100; stage.classList.add("playing"); video.addEventListener("timeupdate", syncVideo); video.addEventListener("ended", completeVideo, { once: true }); video.play().catch(() => { state.videoTimer = window.setInterval(() => { progress = Math.min(100, progress + 10); if (bar) bar.style.width = `${progress}%`; if (label) label.textContent = `${progress}% watched`; updateProgress(trigger.dataset.module, trigger.dataset.block, { status: progress >= 80 ? "completed" : "in_progress", progress }); if (progress >= 80) { window.clearInterval(state.videoTimer); state.videoTimer = null; completeVideo(); } }, 350); }); };
        if (video?.readyState >= 1) play(); else video?.addEventListener("loadedmetadata", play, { once: true }); return;
      }
      if (action === "submit-quiz") {
        const module = moduleById(trigger.dataset.module); const block = module.blocks.find((item) => item.id === trigger.dataset.block);
        const answered = block.questions.filter((question, index) => Number.isInteger(state.quizAnswers[`${block.id}:${index}`])).length;
        if (answered !== block.questions.length) return toast("Answer every question", `${block.questions.length - answered} question${block.questions.length - answered === 1 ? " remains" : "s remain"}.`, "!");
        const correct = block.questions.filter((question, index) => state.quizAnswers[`${block.id}:${index}`] === question.answer).length;
        const score = Math.round((correct / block.questions.length) * 100); const passed = score >= 80;
        state.quizResults[block.id] = { score, passed }; updateProgress(module.id, block.id, { status: passed ? "completed" : "in_progress", progress: passed ? 100 : 0, score });
        api("/quiz-attempts", { method: "POST", body: JSON.stringify({ module_id: module.id, block_id: block.id, answers: block.questions.map((question, index) => state.quizAnswers[`${block.id}:${index}`]), score, passed }) });
        toast(passed ? "Knowledge check passed" : "Review and try again", passed ? `${score}% — this lesson is complete.` : `${score}% — 80% is required.`, passed ? "✓" : "!"); return rerender();
      }
      if (action === "launch-simulation") { updateProgress(trigger.dataset.module, trigger.dataset.block, { status: "in_progress", progress: 25 }); return context.launchSimulation?.(trigger.dataset.module, trigger.dataset.block, Number(trigger.dataset.scenario || 0)); }
      if (action === "create-module") { newBuilder(); return navigate("lighthouse-builder"); }
      if (action === "edit-module") { newBuilder(moduleById(trigger.dataset.module)); return navigate("lighthouse-builder"); }
      if (action === "duplicate-module") { const copy = clone(moduleById(trigger.dataset.module)); copy.id = `module-${Date.now()}`; copy.title += " Copy"; copy.status = "draft"; copy.version = 0; state.customModules.push(copy); persist(); toast("Module duplicated", `${copy.title} is ready to edit.`); return rerender(); }
      if (action === "assign-module") { if (!state.assignments.includes(trigger.dataset.module)) state.assignments.unshift(trigger.dataset.module); persist(); api(`/modules/${encodeURIComponent(trigger.dataset.module)}/assign`, { method: "POST", headers: { "X-BlueOrigin-Approval": "confirmed" }, body: "{}" }); toast("Assigned to learner", "The module now appears in My Learning."); return rerender(); }
      if (action === "builder-step") { saveBuilderFields(root); state.builderStep = Number(trigger.dataset.step); return rerender(); }
      if (action === "builder-back") { saveBuilderFields(root); state.builderStep = Math.max(1, state.builderStep - 1); return rerender(); }
      if (action === "builder-next") { saveBuilderFields(root); if (state.builderStep === 1 && !(state.builder.title.trim() && state.builder.summary.trim() && state.builder.objectives.length)) return toast("Complete required details", "Add a title, summary, and at least one learning objective.", "!"); state.builderStep = Math.min(3, state.builderStep + 1); return rerender(); }
      if (action === "add-block") return addBlock(trigger.dataset.type);
      if (["move-block-up", "move-block-down"].includes(action)) { saveBuilderFields(root); const index = Number(trigger.dataset.index); const target = index + (action === "move-block-up" ? -1 : 1); [state.builder.blocks[index], state.builder.blocks[target]] = [state.builder.blocks[target], state.builder.blocks[index]]; return rerender(); }
      if (action === "remove-block") { saveBuilderFields(root); state.builder.blocks.splice(Number(trigger.dataset.index), 1); toast("Block removed", "The module sequence was updated."); return rerender(); }
      if (action === "open-builder-preview") { saveBuilderFields(root); const preview = clone(state.builder); const existing = state.customModules.findIndex((module) => module.id === preview.id); if (existing >= 0) state.customModules[existing] = preview; else state.customModules.push(preview); state.selectedModuleId = preview.id; state.activeBlockId = preview.blocks[0]?.id; persist(); return navigate("lighthouse-player"); }
      if (action === "publish-module" || action === "publish-assign") { saveBuilderFields(root); return publishBuilder(action === "publish-assign"); }
    });
  }

  function completeSimulation(moduleId, blockId, score = 100) {
    updateProgress(moduleId, blockId, { status: "completed", progress: 100, score });
    state.selectedModuleId = moduleId;
    const module = moduleById(moduleId); const index = module?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    state.activeBlockId = module?.blocks[index + 1]?.id || blockId;
    toast("Practice completed", "Your simulation attempt was added to Lighthouse progress.");
  }

  function startFromStudio(type, draft) {
    newBuilder();
    state.builder.title = draft?.title || `${type} learning module`;
    state.builder.summary = `A grounded ${type} experience created in Blue Origin Studio.`;
    state.builder.description = "This module keeps the Studio artifact, its source lineage, and the learner completion experience together.";
    state.builder.objectives = Array.isArray(draft?.objectives) && draft.objectives.length ? clone(draft.objectives) : ["Apply the grounded guidance in a realistic eligibility workflow."];
    const base = { id: `studio-${type}-${Date.now()}`, required: true, source: `Blue Origin Studio · ${draft?.creation_id || "published release"}` };
    if (type === "video") state.builder.blocks.push({ ...base, type: "video", title: draft?.title || "Studio video", minutes: 3, duration: 138, posterLabel: draft?.scenes?.[0]?.title || "Grounded Studio video" });
    else if (type === "quiz") state.builder.blocks.push({ ...base, type: "quiz", title: draft?.title || "Studio quiz", minutes: 6, questions: clone(draft?.questions || quizPractice) });
    else state.builder.blocks.push({ ...base, type: "simulation", title: draft?.title || "Studio simulation", minutes: 22, scenarioIndex: 0 });
    state.builderStep = 2;
  }

  window.BlueOriginLighthouse = { routes: VALID_ROUTES, render, bind, completeSimulation, startFromStudio, state };
})();
