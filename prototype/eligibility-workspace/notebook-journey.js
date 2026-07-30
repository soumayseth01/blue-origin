/* Approved 15-screen Notebook authoring journey. Loaded after artifact-studio.js. */

state.notebookJourney = {
  screen: null,
  modal: null,
  busy: null,
  error: null,
  selectedEvidencePoint: 0,
  selectedAssetId: null,
  assetFilter: "all",
  assetQuery: "",
  assetDraft: { fit: "cover", zoom: 1, x: 50, y: 50 },
  libraryProgram: "all",
  libraryAccess: "all",
  librarySort: "recent",
  libraryView: "grid",
  createPrompt: "",
  editorTab: "content",
  generation: { job_aid: 0, presentation: 0, quiz: 0 },
  saveTimer: null,
  savePromise: null,
  saveStatus: "saved",
  videoPoll: null,
};

const njLegacyRenderWorkspace = renderNotebookWorkspace;
const njLegacyBindEvents = bindNotebookStudioEvents;

function njIcon(name) { return materialIcon(name); }
function njNotebook() { return activeNotebookRecord(); }
function njProjects(notebook = njNotebook()) { return notebook?.artifact_projects || {}; }
function njProject(format) { return njProjects()[format] || null; }
function njSetScreen(screen) { state.notebookJourney.screen = screen; state.notebookJourney.modal = null; state.notebookJourney.error = null; renderProductView(); }
function njStatus(notebook) { return notebook?.status === "published" ? `Published · v${notebook.published_version}` : notebook?.status === "in_review" ? "In review" : "Draft"; }
function njStageScreen(notebook) {
  if (!notebook) return "library";
  const stage = notebook.workflow_stage || (notebook.source_ids?.length ? "summary" : "empty");
  return ({ setup: "empty", empty: "empty", sources: "sources", summary: "summary", brief: "brief", studio: "studio", generating: "generating", outputs: "studio", release: "release", published: "release" })[stage] || "empty";
}
function njCurrentScreen() { return state.notebookJourney.screen || njStageScreen(njNotebook()); }
function njUpdateNotebook(updated) {
  const current = njNotebook();
  if (current) Object.assign(current, updated);
  else state.artifactStudio.notebooks.unshift(updated);
  state.selectedSourceIds = new Set(updated.source_ids || []);
  syncArtifactBriefFromNotebook(updated);
  return updated;
}
async function njArtifactAction(action, payload = {}) {
  const notebook = njNotebook();
  if (!notebook) throw new Error("Notebook unavailable");
  return njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/artifacts`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) }));
}
function njPill(text, tone = "") { return `<span class="nj-pill ${tone}">${escapeHTML(text)}</span>`; }
function njButton(label, action, tone = "", extra = "") { return `<button class="nj-btn ${tone}" data-nj-action="${action}" ${extra}>${label}</button>`; }
function njNotebookBar(notebook) {
  return `<div class="nj-notebookbar"><button class="nj-back" data-nj-action="library" aria-label="Back to notebooks">${njIcon("arrow_back")}</button><span class="nj-notebookicon">${njIcon("menu_book")}</span><div class="nj-notebooktitle"><strong>${escapeHTML(notebook.title)}</strong><small>${njPill(njStatus(notebook), notebook.status === "in_review" ? "amber" : "")} <span>· All changes saved</span></small></div><div class="nj-notebookactions">${njButton(`${njIcon("local_library")} Library`, "open-library")} ${njButton(`${njIcon("inventory_2")} Releases`, "release")} ${notebook.status === "draft" ? njButton("Move to review", "review") : ""}</div></div>`;
}
function njWorkspace(notebook, columns, className = "") { return `<div class="nj-workspace ${className}">${njNotebookBar(notebook)}<div class="nj-triptych">${columns}</div></div>`; }
function njColumn(kicker, title, body, right = "", cls = "") { return `<section class="nj-column ${cls}"><header><div><span class="nj-eyebrow">${escapeHTML(kicker)}</span><h3>${escapeHTML(title)}</h3></div>${right}</header><div class="nj-colbody">${body}</div></section>`; }
function njEmpty(icon, title, text, actions = "") { return `<div class="nj-empty"><span>${njIcon(icon)}</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p>${actions}</div>`; }

function njRenderLibrary() {
  let records = notebookRecords().filter((item)=>(state.notebookJourney.libraryProgram==="all"||(item.programs||[]).includes(state.notebookJourney.libraryProgram))&&(state.notebookJourney.libraryAccess==="all"||item.access_scope===state.notebookJourney.libraryAccess));
  records=[...records].sort(state.notebookJourney.librarySort==="title"?(a,b)=>a.title.localeCompare(b.title):state.notebookJourney.librarySort==="published"?(a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0):(a,b)=>new Date(b.last_opened_at||b.updated_at||0)-new Date(a.last_opened_at||a.updated_at||0));
  const recent = records.slice(0, 4);
  const programs=[...new Set(notebookRecords().flatMap((item)=>item.programs||[]))].sort();
  return `<div class="nj-page nj-library"><div class="nj-pagehead"><div><span class="nj-eyebrow">Knowledge workspace</span><h2>Notebooks</h2><p>Source-grounded authoring work and published operational knowledge.</p></div>${njButton(`${njIcon("add")} Create notebook`, "create", "orange")}</div><div class="nj-toolbar"><label>${njIcon("search")}<input data-nj-library-search placeholder="Search notebooks, programs, owners, or purpose" /></label><select data-nj-library-filter="program" aria-label="Filter by program"><option value="all">All programs</option>${programs.map((value)=>`<option value="${escapeHTML(value)}" ${state.notebookJourney.libraryProgram===value?"selected":""}>${escapeHTML(value)}</option>`).join("")}</select><select data-nj-library-filter="access" aria-label="Filter by access"><option value="all">All access</option>${["organization","team","private"].map((value)=>`<option value="${value}" ${state.notebookJourney.libraryAccess===value?"selected":""}>${value[0].toUpperCase()+value.slice(1)}</option>`).join("")}</select><select data-nj-library-sort aria-label="Sort notebooks"><option value="recent" ${state.notebookJourney.librarySort==="recent"?"selected":""}>Recently active</option><option value="published" ${state.notebookJourney.librarySort==="published"?"selected":""}>Recently published</option><option value="title" ${state.notebookJourney.librarySort==="title"?"selected":""}>Title A–Z</option></select><button data-nj-library-view="grid" class="${state.notebookJourney.libraryView==="grid"?"on":""}" aria-label="Grid view">${njIcon("grid_view")}</button><button data-nj-library-view="list" class="${state.notebookJourney.libraryView==="list"?"on":""}" aria-label="List view">${njIcon("view_list")}</button></div><div class="nj-railhead"><div><h3>Recently viewed</h3><span>Continue from where you left off</span></div></div><div class="nj-coverrail ${state.notebookJourney.libraryView}">${recent.map((item, index) => `<button class="nj-covercard" data-open-notebook-id="${escapeHTML(item.id)}"><div class="nj-cover c${index}"><span>NOTEBOOK</span><h4>${escapeHTML(item.title)}</h4></div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(njStatus(item))} · ${Number(item.source_count || 0)} sources</small></button>`).join("") || njEmpty("menu_book", "No notebooks found", "Change the filters or create a new workspace.")}</div><div class="nj-railhead"><div><h3>Active notebooks</h3><span>${records.filter((item) => item.status !== "published").length} workspaces</span></div></div><div class="nj-activegrid ${state.notebookJourney.libraryView}">${records.filter((item) => item.status !== "published").map((item) => `<button data-open-notebook-id="${escapeHTML(item.id)}"><div><span class="nj-fileicon">${njIcon("description")}</span>${njPill(njStatus(item), item.status === "in_review" ? "blue" : "orange")}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.purpose || "Grounded authoring workspace")}</p><footer><span>${Number(item.source_count || 0)} sources</span><span>${item.content_brief?.points?.length || 0} key points</span><span>${Object.keys(item.artifact_projects || {}).length} outputs</span></footer></button>`).join("")}</div>${njRenderModal() || ""}</div>`;
}

function njRenderModal() {
  const journey = state.notebookJourney;
  const notebook = njNotebook();
  if (journey.modal === "create") {
    const promptLength = String(journey.createPrompt || "").length;
    const promptValid = promptLength >= 8 && promptLength <= 500;
    return `<div class="nj-modalshade"><form class="nj-modal" id="njCreateForm"><header><div><span class="nj-eyebrow">New notebook</span><h2>What are you creating today?</h2><p>Describe the outcome in one sentence. We will suggest the title, audience, and starting structure.</p></div><button type="button" data-nj-action="close-modal">×</button></header><main><label>What should this notebook help someone do?<textarea id="njCreatePrompt" required minlength="8" maxlength="500" aria-describedby="njCreatePromptHelp" placeholder="Example: Help eligibility workers understand when and how households must report changes.">${escapeHTML(journey.createPrompt || "")}</textarea><small id="njCreatePromptHelp" class="nj-field-help"><span>Enter at least 8 characters. Your description is retained if the service needs to retry.</span><span id="njCreatePromptCount" aria-live="polite">${promptLength} of 500 characters</span></small></label><section><div><span class="nj-eyebrow">We will set up</span><h4>A grounded authoring workspace</h4></div>${njPill("Editable later", "blue")}<footer>${["Suggested title","Audience","Purpose","Source plan"].map((x) => njPill(x)).join("")}</footer></section>${journey.error ? `<p class="nj-error" role="alert"><strong>Notebook could not be created.</strong><span>${escapeHTML(journey.error)}</span></p>` : ""}</main><footer><span>Nothing is published until you approve it.</span><div>${njButton("Cancel", "close-modal")}<button class="nj-btn primary" ${journey.busy === "create" || !promptValid ? "disabled" : ""}>${journey.busy === "create" ? "Creating…" : "Create notebook →"}</button></div></footer></form></div>`;
  }
  if (journey.modal === "finalize" && notebook) {
    const points = notebook.content_brief?.points || [];
    const citationCount = points.reduce((count, point) => count + (point.citations?.length || 0), 0);
    const checks = [["Program differences remain explicit", true],["Synthesized statements reviewed", !points.some((p) => p.review_status === "needs_review")],["Images and tables identified for reuse", true],["Notebook purpose and audience confirmed", Boolean(notebook.purpose && notebook.audience)]];
    return `<div class="nj-modalshade"><section class="nj-modal large"><header><div><span class="nj-eyebrow">Approve content brief</span><h2>Finalize version ${Number(notebook.content_brief?.version || 0) + 1}</h2><p>This snapshot will become the source for all four output drafts.</p></div><button data-nj-action="close-modal">×</button></header><main><div class="nj-grid2"><section class="nj-summary"><span class="nj-eyebrow">Coverage</span><h4>${points.length} approved key points</h4><p>All required topics are represented.</p>${njPill("Complete", "green")}</section><section class="nj-summary"><span class="nj-eyebrow">Grounding</span><h4>${citationCount} source citations</h4><p>Evidence remains connected to the brief.</p>${njPill(citationCount ? "Complete" : "Review", citationCount ? "green" : "amber")}</section></div><h3 class="nj-subhead">Final checks</h3>${checks.map(([label, ok]) => `<div class="nj-checkrow"><span class="${ok ? "ok" : "warn"}">${ok ? "✓" : "!"}</span><div><strong>${label}</strong><small>${ok ? "Ready" : "Needs attention"}</small></div></div>`).join("")}<div class="nj-callout">Later source changes will mark derived outputs as stale, but will not overwrite author edits.</div>${journey.error ? `<p class="nj-error">${escapeHTML(journey.error)}</p>` : ""}</main><footer>${njPill(`Brief v${Number(notebook.content_brief?.version || 0) + 1} · immutable snapshot`, "blue")}<div>${njButton("Keep editing", "close-modal")} ${njButton("Finalize and create outputs →", "confirm-finalize", "primary")}</div></footer></section></div>`;
  }
  return "";
}

function njRenderEmpty(notebook) {
  return njWorkspace(notebook,
    njColumn("Source desk", "Sources", njEmpty("library_add", "Add your source material", "Select approved library content or upload documents to begin grounding this notebook.", `${njButton("Add from Library", "sources", "primary")} ${njButton("Upload files", "open-library")}`), njPill("0")) +
    njColumn("Content workspace", "Summary and key points", njEmpty("auto_awesome", "Your grounded draft starts here", "Once sources are selected, AI will prepare a source summary and suggested key points with citations.", `<div class="nj-callout">Purpose: ${escapeHTML(notebook.purpose)}</div>`)) +
    njColumn("Creation studio", "Outputs", njEmpty("dashboard_customize", "Finalize content first", "Job aid, presentation, quiz, and video drafts become available after the content brief is approved."), njPill("Locked")));
}

function njSourceRows(notebook) {
  const selected = new Set(notebook.source_ids || []);
  return libraryRecords().map((source) => { const id = recordId(source); const doc = artifactSourceDocument(source); return `<label class="nj-sourceitem ${selected.has(id) ? "selected" : ""}"><input type="checkbox" data-nj-source="${escapeHTML(id)}" ${selected.has(id) ? "checked" : ""}/><span class="nj-check">${selected.has(id) ? "✓" : ""}</span><span class="nj-fileicon">${njIcon(doc.is_policy ? "policy" : "description")}</span><div><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(source.jurisdiction || "Organization")} · ${escapeHTML(doc.extraction_status)}</small></div></label>`; }).join("");
}
function njRenderSources(notebook) {
  const sources = notebook.sources || [];
  const ready = sources.length && sources.every((source) => ["complete","partial","verified"].includes(source.extraction_status));
  const coverage = ["Reporting obligations","Reporting deadlines","Verification exceptions","Consequences of non-reporting"];
  return njWorkspace(notebook,
    njColumn("Source desk", "Sources", `${njButton(`${njIcon("add")} Add from Library`, "open-library")}<label class="nj-search">${njIcon("search")}<input data-nj-source-search placeholder="Filter notebook sources…" /></label><div class="nj-sourcelist">${njSourceRows(notebook)}</div>`, njPill(`${sources.length} selected`, "orange")) +
    njColumn("Source review", "Selected evidence", `<section class="nj-summary"><div><span class="nj-eyebrow">Ingestion status</span><h4>${sources.length} sources are ready</h4></div>${njPill(ready ? "Complete" : "Processing", ready ? "green" : "amber")}<p>Pages, headings, tables, and image references are checked before summarization.</p><footer>${[`${Math.max(1,sources.length*18)} pages`,`${sources.length*3} tables`,`${sources.length*2} images`,`${new Set(sources.map((s)=>s.jurisdiction)).size || 1} jurisdictions`].map((x)=>njPill(x)).join("")}</footer></section><h3 class="nj-subhead">Source coverage</h3>${coverage.map((x) => `<div class="nj-step done"><span>✓</span><div><strong>${x}</strong><small>Covered in selected sources</small></div>${njPill("Grounded", "green")}</div>`).join("")}`, njButton("Refresh extraction", "refresh-sources")) +
    njColumn("Readiness", "Before summarizing", `<div class="nj-callout">Program-specific differences will remain explicit instead of being combined into one rule.</div>${["Confirm selected sources","Check extraction quality","Review coverage","Generate source summary"].map((x,i)=>`<div class="nj-step ${i<3&&ready?"done":""}"><span>${i<3&&ready?"✓":i+1}</span><div><strong>${x}</strong><small>${i<3&&ready?"Complete":"Ready when you are"}</small></div></div>`).join("")}${njButton(state.notebookJourney.busy === "analysis" ? "Generating…" : "Generate source summary →", "generate-summary", "primary", ready ? "" : "disabled")}`));
}

function njCitationChips(citations = []) { return `<div class="nj-chips">${citations.map((c) => njPill(c.label || "Source", "blue")).join("")}</div>`; }
function njRenderSummary(notebook) {
  const summary = notebook.source_summary || {};
  const messages = notebook.chat_messages || [];
  return njWorkspace(notebook,
    njColumn("Source desk", "Sources", `<div class="nj-sourcelist">${njSourceRows(notebook)}</div>`, njPill(String(notebook.source_ids?.length || 0), "orange")) +
    njColumn("Content workspace", "Source summary and chat", `<section class="nj-summary"><div><span class="nj-eyebrow">Source summary</span><h4>Grounded in selected documents</h4></div>${njPill(`${summary.citations?.length || 0} citations`, "green")}<p>${escapeHTML(summary.text || "Generate a summary from the selected sources.")}</p>${njCitationChips(summary.citations)}</section><section class="nj-chat"><div>${messages.length ? messages.map((m)=>`<div class="nj-bubble ${m.role === "author" ? "user" : ""}">${escapeHTML(m.text)}${m.citations?.length ? njCitationChips(m.citations) : ""}${m.role==="assistant"&&m.supported?njButton(`${njIcon("add")} Add to key points`,`add-chat-point:${m.id}`):""}</div>`).join("") : `<div class="nj-bubble">Ask questions across the selected sources. Answers include exact citations.</div>`}</div><form id="njChatForm"><input id="njChatInput" placeholder="Ask a follow-up about these sources…"/><button aria-label="Ask selected sources">${njIcon("send")}</button></form></section>`, njButton("Regenerate", "generate-summary")) +
    njColumn("Next step", "Build the content brief", `<section class="nj-summary"><span class="nj-eyebrow">AI recommendation</span><h4>${notebook.content_brief?.points?.length || 0} key points suggested</h4><p>The source summary supports an operational, worker-facing notebook with visible program differences.</p>${njButton("Draft key points →", "brief", "primary")}</section><h3 class="nj-subhead">Brief readiness</h3>${["Purpose defined","Sources selected","Summary reviewed","Key points drafted"].map((x,i)=>`<div class="nj-step ${i<3?"done":""}"><span>${i<3?"✓":i+1}</span><div><strong>${x}</strong><small>${i<3?"Complete":"Next"}</small></div></div>`).join("")}`));
}

function njRenderBrief(notebook) {
  const points = notebook.content_brief?.points || [];
  const activeIndex = Math.min(state.notebookJourney.selectedEvidencePoint, Math.max(0, points.length - 1));
  const active = points[activeIndex];
  return njWorkspace(notebook,
    njColumn("Brief outline", `${points.length} key points`, `<div class="nj-outlineitems">${points.map((p,i)=>`<button class="${i===activeIndex?"on":""}" data-nj-point-index="${i}"><span>${i+1}</span>${escapeHTML(p.statement.slice(0,48))}</button>`).join("")}</div>`, njButton(`${njIcon("add")} Add`, "add-point")) +
    njColumn("Content brief", "Edit key points", `<div class="nj-points">${points.map((point,index)=>`<article class="nj-point ${point.review_status === "needs_review" ? "review" : ""}"><header><span>${index+1}</span><strong>${escapeHTML(point.priority)} · ${escapeHTML((point.provenance || "author_input").replaceAll("_"," "))}</strong>${njPill(point.review_status === "needs_review" ? "Review" : "Verified", point.review_status === "needs_review" ? "amber" : "green")}</header><textarea data-nj-point-text="${escapeHTML(point.point_id)}">${escapeHTML(point.statement)}</textarea>${njCitationChips(point.citations)}</article>`).join("")}</div><div class="nj-stickyaction">${njButton("Finalize content brief →", "finalize", "primary", points.length ? "" : "disabled")}</div>`, njButton(`${njIcon("auto_awesome")} Find more`, "find-more")) +
    njColumn("Evidence inspector", active ? `Point ${activeIndex+1} citations` : "Evidence", active ? `${(active.citations||[]).map((c)=>`<article class="nj-evidence"><strong>${escapeHTML(c.label)}</strong><p>This approved source passage supports the selected key point.</p><small>${escapeHTML(c.source_id)}</small></article>`).join("") || `<div class="nj-callout">This author-added point has no source citation yet.</div>`}<div class="nj-callout">Keep program distinctions visible. Combining different requirements into one universal rule can be misleading.</div>` : njEmpty("link", "Select a key point", "Its supporting evidence will appear here.")) + (njRenderModal() || ""));
}

function njTopics(notebook) { return (notebook.content_brief?.points || []).slice(0,6).map((point) => point.statement.split(/[.;]/)[0]); }
function njRenderStudio(notebook) {
  const projects = njProjects(notebook);
  const hasDrafts = Boolean(projects.job_aid);
  const topics = njTopics(notebook);
  return njWorkspace(notebook,
    njColumn("Approved brief", "Content foundation", `<section class="nj-summary"><h4>${escapeHTML(notebook.title)}</h4><p>${notebook.content_brief?.points?.length || 0} approved key points grounded in ${notebook.source_ids?.length || 0} sources, written for ${escapeHTML(notebook.audience)}.</p><footer>${njPill(`${(notebook.content_brief?.points||[]).reduce((n,p)=>n+(p.citations?.length||0),0)} citations`)}${njPill(`${notebook.notebook_assets?.length || 0} reusable images`)}</footer></section><h3 class="nj-subhead">Included topics</h3>${topics.map((x)=>`<div class="nj-step done"><span>✓</span><div><strong>${escapeHTML(x)}</strong></div></div>`).join("")}`, njPill(`v${notebook.content_brief?.version || 1}`, "green")) +
    njColumn("Creation studio", "Create editable drafts", `<div class="nj-outputgrid">${[["job_aid","description","Job aid","Concise worker reference with citations and images.","DOCX + PDF"],["presentation","slideshow","Presentation","Editable slide deck that later becomes a presenter-led video.","PPTX"],["quiz","quiz","Knowledge check","Grounded questions, explanations, and citations.","HTML + JSON"],["video","movie","Instructional video","Unlocks after the presentation is reviewed and approved.","From presentation"]].map(([id,icon,title,text,output])=>{const locked=id==="video"&&!projects.video;return `<button class="nj-outputcard ${id!=="video"?"selected":""} ${locked?"locked":""}" data-nj-open-output="${id}" ${locked?"disabled":""}><span>${njIcon(locked?"lock":icon)}</span><h4>${title}</h4><p>${text}</p><footer>${njPill(projects[id]?"Editable draft":output)}<b>›</b></footer></button>`}).join("")}</div><h3 class="nj-subhead">Recommended templates</h3><div class="nj-templaterail">${["Quick reference","Guided process","Grounded check"].map(x=>`<div><span></span><strong>${x}</strong></div>`).join("")}</div>`, hasDrafts ? njPill("3 drafts ready", "green") : njButton(`${njIcon("auto_awesome")} Create all 3`, "generate-drafts", "orange")) +
    njColumn("Ready to draft", "We inferred the setup", `<section class="nj-summary"><span class="nj-eyebrow">Audience</span><h4>${escapeHTML(notebook.audience)}</h4><p>Clear, operational language with moderate visual density.</p><footer>${njPill("Source images suggested")}${njPill("Citations visible")}</footer></section><section class="nj-summary"><span class="nj-eyebrow">Output plan</span><h4>3 drafts now, video later</h4><p>The approved presentation becomes the visual source for the HeyGen video.</p></section><div class="nj-callout">Refine titles, layouts, images and tone inside each dedicated editor.</div>${hasDrafts ? njButton("Open presentation →", "open-presentation", "primary") : njButton("Create 3 editable drafts →", "generate-drafts", "primary")}`));
}

function njRenderGenerating(notebook) {
  const projects = njProjects(notebook);
  const rows = [["job_aid","description","Job aid"],["presentation","slideshow","Presentation"],["quiz","quiz","Knowledge check"]];
  return njWorkspace(notebook,
    njColumn("Approved brief", "Source foundation", `<section class="nj-summary"><h4>${escapeHTML(notebook.title)}</h4><p>Three editable drafts are created from the same approved content snapshot.</p></section><div class="nj-callout">Open a draft as soon as it is ready. Video becomes available after presentation approval.</div>`, njPill(`v${notebook.content_brief?.version || 1}`, "green")) +
    njColumn("Generation status", "Creating 3 editable drafts", `<div class="nj-generation">${rows.map(([id,icon,title])=>`<div><span>${njIcon(icon)}</span><section><strong>${title}</strong><small>${projects[id]?"Ready to review":"Creating grounded structure"}</small><i><b style="width:${projects[id]?100:state.notebookJourney.generation[id]}%"></b></i></section>${projects[id]?`<button data-nj-open-output="${id}">Open</button>`:njPill("Working")}</div>`).join("")}</div><section class="nj-summary dashed"><div><span class="nj-eyebrow">Dependent output</span><h4>Instructional video</h4></div>${njPill("Waiting for presentation")}<p>Approve the presentation first. Its slide titles, images, citations and speaker notes seed the video scenes.</p></section>`, njPill(`${Object.keys(projects).filter((x)=>x!=="video").length} of 3 ready`, "orange")) +
    njColumn("Project health", "All drafts grounded", `${["Brief snapshot locked","Citations mapped","Output schemas valid","No unsupported claims"].map(x=>`<div class="nj-step done"><span>✓</span><div><strong>${x}</strong><small>Complete</small></div></div>`).join("")}<h3 class="nj-subhead">Recommended next</h3><section class="nj-summary"><h4>Review the presentation</h4><p>Once approved, create video without rebuilding the slides.</p>${njButton("Open presentation →", "open-presentation", "primary", projects.presentation?"":"disabled")}</section>`));
}

function njSaveStatusLabel(fallback = "All changes saved") {
  if (state.notebookJourney.saveStatus === "saving") return "Saving changes…";
  if (state.notebookJourney.saveStatus === "error") return "Save failed · retrying on next edit";
  return fallback;
}
function njEditorBar(title, status, actions) { return `<div class="nj-editbar">${njButton("‹ Outputs", "studio")}<strong>${escapeHTML(title)}</strong><span class="nj-save ${state.notebookJourney.saveStatus}">● ${escapeHTML(njSaveStatusLabel(status))}</span><div>${actions}</div></div>`; }
function njOutline(items, selectedId, type) {
  const singular = type.slice(0,-1);
  return `<aside class="nj-outline"><header><strong>${items.length} ${type}</strong>${njButton("＋", `add-${singular}`, "", `aria-label="Add ${singular}"`)}</header><div>${items.map((item,index)=>`<article class="nj-outlineitem ${item.id===selectedId?"on":""}"><button data-nj-select-item="${escapeHTML(item.id)}"><span class="${type==="slides"||type==="scenes"?"nj-thumb":""}">${type==="slides"||type==="scenes"?"":index+1}</span><b>${escapeHTML(item.title || item.prompt || `Item ${index+1}`)}</b></button><footer><button data-nj-item-op="up" data-nj-item-id="${escapeHTML(item.id)}" ${index===0?"disabled":""} aria-label="Move up">${njIcon("arrow_upward")}</button><button data-nj-item-op="down" data-nj-item-id="${escapeHTML(item.id)}" ${index===items.length-1?"disabled":""} aria-label="Move down">${njIcon("arrow_downward")}</button><button data-nj-item-op="duplicate" data-nj-item-id="${escapeHTML(item.id)}" aria-label="Duplicate">${njIcon("content_copy")}</button><button data-nj-item-op="delete" data-nj-item-id="${escapeHTML(item.id)}" ${items.length===1?"disabled":""} aria-label="Delete">${njIcon("delete")}</button></footer></article>`).join("")}</div></aside>`;
}
function njEditorShell(project, outline, canvas, inspector, actions, status = "All changes saved") { return `<div class="nj-editor">${njEditorBar(project.title,status,actions)}${outline}<main class="nj-canvas">${canvas}</main><aside class="nj-inspector">${inspector}</aside></div>`; }
function njSelected(project, collection, selectedField) { return (project[collection] || []).find((item)=>item.id===project[selectedField]) || project[collection]?.[0]; }
function njInspectorTabs(tabs, fallback) {
  const allowed=tabs.map(([id])=>id);
  const active=allowed.includes(state.notebookJourney.editorTab)?state.notebookJourney.editorTab:fallback;
  return { active, html:`<nav>${tabs.map(([id,label])=>`<button class="${active===id?"on":""}" data-nj-editor-tab="${id}">${label}</button>`).join("")}</nav>` };
}
function njImageStyle(image) {
  const crop=image?.crop||{};
  const fit=crop.fit==="contain"?"contain":"cover";
  const x=Math.max(0,Math.min(100,Number(crop.x??50)));
  const y=Math.max(0,Math.min(100,Number(crop.y??50)));
  const zoom=Math.max(1,Math.min(3,Number(crop.zoom||1)));
  return `object-fit:${fit};object-position:${x}% ${y}%;transform:scale(${zoom})`;
}

function njRenderJobAid(notebook) {
  const project = njProject("job_aid"); if (!project) return njRenderStudio(notebook);
  const section = njSelected(project,"sections","selected_section_id") || {};
  const tabs=njInspectorTabs([["content","Content"],["images","Images"],["citations","Citations"]],"content");
  const canvas = `<article class="nj-docpage"><span>BlueOrigin · Job aid</span><h1>${escapeHTML(project.title.replace(/ — .*/,""))}</h1><p class="lead">${escapeHTML(notebook.purpose)}</p><section><h3>${escapeHTML(section.title || "Overview")}</h3><p contenteditable="true" data-nj-contenteditable="body">${escapeHTML(section.body || "")}</p></section>${section.layout==="text_image"?`<button class="nj-imageplaceholder" data-nj-action="assets">${section.image?.url?`<img src="${escapeHTML(section.image.url)}" alt="${escapeHTML(section.image.alt_text)}" style="${njImageStyle(section.image)}"/>`:`${njIcon("add_photo_alternate")} Add a source image or upload`}</button>${section.image?.caption?`<small class="nj-imagecaption">${escapeHTML(section.image.caption)}</small>`:""}`:""}<footer>Grounded in approved brief v${project.brief_version}</footer></article>`;
  const panels={content:`<h4>Selected section</h4><label>Section title<input data-nj-item-field="title" value="${escapeHTML(section.title||"")}"/></label><label>Layout<select data-nj-item-field="layout"><option value="text" ${section.layout==="text"?"selected":""}>Text</option><option value="text_image" ${section.layout==="text_image"?"selected":""}>Text + image</option></select></label><div class="nj-callout">Grounded in brief v${project.brief_version}. Unsupported author claims will be flagged.</div>`,images:`<h4>Section image</h4>${section.image?`<div class="nj-callout"><strong>${escapeHTML(section.image.title||"Notebook image")}</strong><br/>${escapeHTML(section.image.caption||"Caption required before release")}</div>`:"<p>No image is assigned to this section.</p>"}${njButton(section.image?"Replace image":"Choose from notebook","assets","primary")}`,citations:`<h4>Connected evidence</h4>${njCitationChips(section.citations||[])}${(section.citations||[]).length?"":`<div class="nj-callout">This section inherits the approved brief and needs a direct citation before release if it makes an instructional claim.</div>`}`};
  const inspector = `${tabs.html}<div>${panels[tabs.active]}</div>`;
  return njEditorShell(project,njOutline(project.sections,section.id,"sections"),canvas,inspector,`${njButton("Preview","preview-job")} ${njButton("Export DOCX / PDF","export-job","primary")}`) + (state.notebookJourney.modal==="assets"?njRenderAssetDrawer(notebook,"job_aid",section.id):"");
}

function njRenderPresentation(notebook) {
  const project = njProject("presentation"); if (!project) return njRenderStudio(notebook);
  const slide = njSelected(project,"slides","selected_slide_id") || {};
  const tabs=njInspectorTabs([["layout","Layout"],["assets","Assets"],["notes","Notes"]],"layout");
  const canvas = `<article class="nj-slide"><span>${escapeHTML(slide.title||"Slide")}</span><h2 contenteditable="true" data-nj-contenteditable="title">${escapeHTML(slide.title||"")}</h2><p contenteditable="true" data-nj-contenteditable="body">${escapeHTML(slide.body||"")}</p><footer>${njPill(`${slide.citations?.length||0} citations`,"blue")}${njPill(slide.notes?"Speaker notes added":"Add speaker notes")}</footer><button class="nj-slideimage" data-nj-action="assets">${slide.image?.url?`<img src="${escapeHTML(slide.image.url)}" alt="${escapeHTML(slide.image.alt_text)}" style="${njImageStyle(slide.image)}"/>`:""}</button>${slide.image?.caption?`<small class="nj-imagecaption slide">${escapeHTML(slide.image.caption)}</small>`:""}</article>`;
  const panels={layout:`<h4>Selected slide</h4><label>Layout<select data-nj-item-field="layout"><option value="statement_image_right" ${slide.layout==="statement_image_right"?"selected":""}>Statement + image right</option><option value="full_image" ${slide.layout==="full_image"?"selected":""}>Full image</option><option value="title" ${slide.layout==="title"?"selected":""}>Title only</option></select></label><label>Title<textarea data-nj-item-field="title">${escapeHTML(slide.title||"")}</textarea></label><label>Video presenter area<select data-nj-item-field="presenter_area"><option value="right" ${slide.presenter_area==="right"?"selected":""}>Right side reserved</option><option value="left" ${slide.presenter_area==="left"?"selected":""}>Left side reserved</option></select></label>`,assets:`<h4>Slide visual</h4>${slide.image?`<div class="nj-callout"><strong>${escapeHTML(slide.image.title||"Notebook image")}</strong><br/>${escapeHTML(slide.image.caption||"Caption required before release")}</div>`:"<p>No image is assigned to this slide.</p>"}${njButton(slide.image?"Replace image":"Choose image","assets","primary")}`,notes:`<h4>Speaker notes</h4><label>Narration source<textarea data-nj-item-field="notes">${escapeHTML(slide.notes||"")}</textarea></label><div class="nj-callout"><strong>Ready for video</strong><br/>Approval freezes a Presentation version. Video inherits this slide order, imagery, citations and notes.</div>`};
  const inspector = `${tabs.html}<div>${panels[tabs.active]}</div>`;
  return njEditorShell(project,njOutline(project.slides,slide.id,"slides"),canvas,inspector,`${njButton("Export PPTX","export-presentation")} ${njButton("Approve & create video →","approve-presentation","primary")}`,project.status==="approved"?`Approved v${project.version}`:"Ready to approve") + (state.notebookJourney.modal==="assets"?njRenderAssetDrawer(notebook,"presentation",slide.id):"");
}

function njRenderAssetDrawer(notebook, format, itemId) {
  const assets = notebook.notebook_assets || [];
  const selected=assets.find((asset)=>asset.id===state.notebookJourney.selectedAssetId) || null;
  const query=state.notebookJourney.assetQuery.trim().toLowerCase();
  const filter=state.notebookJourney.assetFilter;
  const usedIds=new Set(Object.values(njProjects(notebook)).flatMap((project)=>[...(project.sections||[]),...(project.slides||[])]).map((item)=>item.image?.id).filter(Boolean));
  const visible=assets.filter((asset)=>{
    if(filter==="source"&&asset.source!=="source")return false;
    if(filter==="upload"&&asset.source!=="upload")return false;
    if(filter==="used"&&!usedIds.has(asset.id))return false;
    return !query||`${asset.title} ${asset.caption} ${asset.alt_text}`.toLowerCase().includes(query);
  });
  const draft=state.notebookJourney.assetDraft;
  const previewStyle=`object-fit:${draft.fit};object-position:${draft.x}% ${draft.y}%;transform:scale(${draft.zoom})`;
  return `<div class="nj-assetshade" data-nj-action="close-modal"></div><aside class="nj-assetdrawer"><header><div><span class="nj-eyebrow">Notebook assets</span><h2>Choose and crop an image</h2><p>Reuse an uploaded image, set its crop, caption and accessible description.</p></div><button data-nj-action="close-modal">×</button></header><main><div class="nj-assettoolbar"><label>${njIcon("search")}<input data-nj-asset-search value="${escapeHTML(state.notebookJourney.assetQuery)}" placeholder="Search images"/></label><label class="nj-btn">Upload<input type="file" data-nj-upload accept="image/png,image/jpeg,image/webp" hidden/></label></div><nav>${[["all","All"],["source","From sources"],["upload","Uploads"],["used","Used"]].map(([id,label])=>`<button class="${filter===id?"on":""}" data-nj-asset-filter="${id}">${label}</button>`).join("")}</nav><div class="nj-assetgrid">${visible.map((asset,index)=>`<button class="${selected?.id===asset.id?"on":""}" data-nj-asset-id="${escapeHTML(asset.id)}"><span class="a${index}"><img src="${escapeHTML(asset.url)}" alt=""/></span><strong>${escapeHTML(asset.title)}</strong><small>${escapeHTML(asset.source)}</small></button>`).join("") || njEmpty("image_search","No matching images",assets.length?"Change the filter or search.":"Upload a PNG, JPEG, or WebP image to continue.")}</div><section class="nj-cropbox"><div><span class="nj-eyebrow">Selected</span><h4>${escapeHTML(selected?.title || "Choose an image")}</h4></div><div class="nj-cropstage">${selected?.url?`<img src="${escapeHTML(selected.url)}" alt="" style="${previewStyle}"/>`:njIcon("image")}</div><div class="nj-cropcontrols"><label>Fit<select data-nj-crop="fit"><option value="cover" ${draft.fit==="cover"?"selected":""}>Fill frame</option><option value="contain" ${draft.fit==="contain"?"selected":""}>Fit entire image</option></select></label><label>Zoom <output>${Number(draft.zoom).toFixed(1)}×</output><input type="range" min="1" max="3" step="0.1" value="${draft.zoom}" data-nj-crop="zoom"/></label><label>Horizontal position <output>${draft.x}%</output><input type="range" min="0" max="100" value="${draft.x}" data-nj-crop="x"/></label><label>Vertical position <output>${draft.y}%</output><input type="range" min="0" max="100" value="${draft.y}" data-nj-crop="y"/></label></div><label>Caption<input id="njAssetCaption" value="${escapeHTML(selected?.caption||"")}" placeholder="Describe why this image is relevant"/></label><label>Alt text <span aria-hidden="true">Required</span><input id="njAssetAlt" required value="${escapeHTML(selected?.alt_text||"")}" placeholder="Describe what is visible"/></label>${njButton(`Use image in ${format==="presentation"?"selected slide":"selected section"}`,`use-asset:${format}:${itemId}`,"primary",selected?.url?"":"disabled")}</section></main></aside>`;
}

function njRenderQuiz(notebook) {
  const project = njProject("quiz"); if (!project) return njRenderStudio(notebook);
  const q = njSelected(project,"questions","selected_question_id") || {};
  const tabs=njInspectorTabs([["question","Question"],["rules","Rules"],["citations","Citations"]],"question");
  const canvas = `<div class="nj-questioncanvas"><section><span>${njPill(`Question ${(project.questions||[]).indexOf(q)+1} of ${project.questions?.length||0} · Multiple choice`,"blue")}</span><h3 contenteditable="true" data-nj-contenteditable="prompt">${escapeHTML(q.prompt||"")}</h3>${(q.options||[]).map((option,index)=>`<label class="${index===q.correct_index?"correct":""}"><input type="radio" name="correct" data-nj-correct="${index}" ${index===q.correct_index?"checked":""}/><span contenteditable="true" data-nj-option="${index}">${escapeHTML(option)}</span>${index===q.correct_index?njPill("Correct","green"):""}</label>`).join("")}</section><section><span class="nj-eyebrow">Answer explanation</span><p contenteditable="true" data-nj-contenteditable="explanation">${escapeHTML(q.explanation||"")}</p>${njCitationChips(q.citations)}</section></div>`;
  const panels={question:`<h4>Question settings</h4><label>Type<select data-nj-item-field="type"><option value="multiple_choice">Multiple choice</option></select></label><label>Difficulty<select data-nj-item-field="difficulty"><option value="applied" ${q.difficulty==="applied"?"selected":""}>Applied knowledge</option><option value="recall" ${q.difficulty==="recall"?"selected":""}>Recall</option></select></label><label>Points<input type="number" min="1" max="20" data-nj-item-field="points" value="${Number(q.points||1)}"/></label>`,rules:`<h4>Learner rules</h4><label>Shuffle choices<select data-nj-item-field="shuffle"><option value="true" ${q.shuffle!==false?"selected":""}>Yes</option><option value="false" ${q.shuffle===false?"selected":""}>No</option></select></label><div class="nj-callout">One answer must be marked correct and every explanation must be complete before approval.</div>`,citations:`<h4>Answer evidence</h4>${njCitationChips(q.citations||[])}<div class="nj-callout">Every correct answer and explanation must remain supported by an approved citation.</div>`};
  const inspector = `${tabs.html}<div>${panels[tabs.active]}</div>`;
  return njEditorShell(project,njOutline(project.questions,q.id,"questions"),canvas,inspector,`${njButton("Export HTML + JSON","export-quiz")} ${njButton("Preview learner view","preview-quiz")} ${njButton("Approve quiz","approve-quiz","primary")}`);
}

function njRenderVideo(notebook) {
  const project = njProject("video"); if (!project) return njRenderStudio(notebook);
  const scene = njSelected(project,"scenes","selected_scene_id") || {};
  const heygen = state.artifactStudio.integrationStatus || {};
  const heygenUnavailable = heygen.heygen === false;
  const avatars=heygen.heygen_avatars||[];
  const voices=heygen.heygen_voices||[];
  const tabs=njInspectorTabs([["presenter","Presenter"],["narration","Narration"],["captions","Captions"]],"presenter");
  const canvas = `<article class="nj-slide video"><span>Scene ${(project.scenes||[]).indexOf(scene)+1} · ${escapeHTML(scene.title||"")}</span><h2>${escapeHTML(scene.title||"")}</h2><p>${escapeHTML(scene.body||"")}</p><div class="nj-slideimage"><div class="nj-safebox"></div>${scene.avatar_enabled?`<div class="nj-avatarfigure"><span></span><b></b></div>`:""}</div>${njPill(`HeyGen presenter · ${scene.avatar_position||"right"}`,"green")}</article>`;
  const panels={presenter:`<h4>Scene presenter</h4><label>Avatar<select data-nj-item-field="avatar_id">${avatars.length?avatars.map((avatar)=>`<option value="${escapeHTML(avatar.id)}" ${scene.avatar_id===avatar.id?"selected":""}>${escapeHTML(avatar.name)}</option>`).join(""):`<option value="">Account default avatar</option>`}</select></label><div class="nj-avatarchoices">${avatars.slice(0,3).map((avatar)=>avatar.preview_image_url?`<button data-nj-avatar-id="${escapeHTML(avatar.id)}" aria-label="Use ${escapeHTML(avatar.name)}"><img src="${escapeHTML(avatar.preview_image_url)}" alt=""/></button>`:`<span></span>`).join("")||"<span></span><span></span><span></span>"}</div><label>Placement<select data-nj-item-field="avatar_position"><option value="right" ${scene.avatar_position==="right"?"selected":""}>Right safe area</option><option value="left" ${scene.avatar_position==="left"?"selected":""}>Left safe area</option></select></label>`,narration:`<h4>Scene narration</h4><label>Voice<select data-nj-item-field="voice_id">${voices.length?voices.map((voice)=>`<option value="${escapeHTML(voice.id)}" ${scene.voice_id===voice.id?"selected":""}>${escapeHTML(voice.name)} · ${escapeHTML(voice.language||"")}</option>`).join(""):`<option value="">Account default voice</option>`}</select></label><label>Narration · ${(scene.narration||"").split(/\s+/).filter(Boolean).length} words<textarea data-nj-item-field="narration">${escapeHTML(scene.narration||"")}</textarea></label>`,captions:`<h4>Captions</h4><label>Include SRT captions<select data-nj-item-field="captions_enabled"><option value="true" ${scene.captions_enabled!==false?"selected":""}>Yes</option><option value="false" ${scene.captions_enabled===false?"selected":""}>No</option></select></label><div class="nj-callout">HeyGen v3 creates a sidecar SRT file and a captioned MP4 for the complete scene sequence.</div>`};
  const integrationCallout=heygenUnavailable?`<div class="nj-callout nj-error"><strong>HeyGen needs attention</strong><br/>${escapeHTML(heygen.heygen_error || "Add a valid HeyGen API key in Settings before generating the MP4.")}</div>`:`<div class="nj-callout">Video-only settings do not change Presentation v${project.derived_from?.version}. HeyGen v3 renders the approved scene order and narration.</div>`;
  const inspector = `${tabs.html}<div>${panels[tabs.active]}${integrationCallout}</div>`;
  const videoLabel = heygenUnavailable ? "HeyGen unavailable" : project.status === "ready" ? "Video ready" : project.status === "generating" ? "Check rendering status" : project.status === "failed" ? "Retry HeyGen" : "Generate with HeyGen";
  return njEditorShell(project,njOutline(project.scenes,scene.id,"scenes"),canvas,inspector,`${project.download_url?njButton("Download MP4 + SRT","download-video"):""} ${njButton("Preview timing","preview-video")} ${njButton(videoLabel,project.status==="generating"?"refresh-video":"generate-video","primary",project.status==="ready"||heygenUnavailable?"disabled":"")}`,project.status === "generating" ? "HeyGen is rendering · edits are saved" : heygenUnavailable ? "Presentation approved · HeyGen credential required" : `Synced with approved deck v${project.derived_from?.version}`);
}

function njRenderRelease(notebook) {
  const projects = njProjects(notebook);
  const approvedBriefVersion = notebook.content_brief?.version || projects.presentation?.brief_version || projects.job_aid?.brief_version || 0;
  const outputs = [["description","Job aid","DOCX + PDF",projects.job_aid,"download-job"],["slideshow","Presentation",`PPTX · v${projects.presentation?.version||0}`,projects.presentation,"download-presentation"],["quiz","Knowledge check","HTML + JSON",projects.quiz,"download-quiz"],["movie","Instructional video",`MP4 + SRT · From Presentation v${projects.video?.derived_from?.version||0}`,projects.video,"download-video"]];
  const visualItems=[...(projects.job_aid?.sections||[]),...(projects.presentation?.slides||[])].filter((item)=>item.image);
  const citationItems=[...(projects.presentation?.slides||[]).filter((item,index)=>index>0&&item.body),...(projects.quiz?.questions||[])];
  const quizValid=projects.quiz?.status==="approved"&&(projects.quiz.questions||[]).length>0&&(projects.quiz.questions||[]).every((q)=>q.prompt&&q.explanation&&q.options?.length>=2&&Number.isInteger(q.correct_index)&&q.correct_index>=0&&q.correct_index<q.options.length&&(q.citations||[]).length>0);
  const checks = [["All artifacts use approved brief",approvedBriefVersion>0&&outputs.every(([, , ,p])=>p?.brief_version===approvedBriefVersion)],["Citations remain connected",citationItems.length>0&&citationItems.every((item)=>(item.citations||[]).length>0)],["Images include captions and alt text",visualItems.every((item)=>item.image.caption?.trim()&&item.image.alt_text?.trim())],["Quiz answers are validated",Boolean(quizValid)],["Video references approved Presentation",projects.presentation?.status==="approved"&&projects.video?.derived_from?.project_id===projects.presentation?.project_id&&projects.video?.derived_from?.version===projects.presentation?.version],["HeyGen scenes generated",projects.video?.status==="ready"&&Boolean(projects.video?.download_url)]];
  const ready=outputs.every(([, , ,p])=>p)&&checks.every(([,ok])=>ok);
  const defaultReviewDate=new Date(Date.now()+180*86400000).toISOString().slice(0,10);
  const reviewDate=(notebook.review_due_at||defaultReviewDate).slice(0,10);
  return `<div class="nj-workspace">${njNotebookBar(notebook)}<div class="nj-release"><div class="nj-pagehead"><div><span class="nj-eyebrow">Notebook release</span><h2>${notebook.status === "published" ? "Published release" : "Ready to publish"}</h2><p>Review the four deliverables, grounding checks and release notes.</p></div>${notebook.status === "published" ? njPill(`Published v${notebook.published_version}`,"green") : njButton("Publish notebook and outputs","publish-release","primary",ready?"":"disabled")}</div><div class="nj-releasegrid"><section><h3>${escapeHTML(notebook.title)} · Release ${Math.max(1,(notebook.artifact_releases?.length||0)+(notebook.status === "published"?0:1))}</h3><p>Derived from approved content brief v${approvedBriefVersion} · Presentation v${projects.presentation?.version||0}</p>${outputs.map(([icon,title,meta,p,action])=>{const downloadable=p&&(action!=="download-video"||p.status==="ready"&&p.download_url);return `<article><span>${njIcon(icon)}</span><div><strong>${title}</strong><small>${meta}</small></div>${downloadable?njButton("Download",action):njPill(p?"Awaiting HeyGen":"Missing","amber")}</article>`}).join("")}<label>Release notes<textarea id="njReleaseNotes">${escapeHTML(notebook.artifact_releases?.[0]?.notes||"Initial release for eligibility worker onboarding. Includes grounded guidance, visual presentation, knowledge check and presenter-led video.")}</textarea></label></section><aside><h3>Release checklist</h3>${checks.map(([label,ok])=>`<div class="nj-checkrow"><span class="${ok?"ok":"warn"}">${ok?"✓":"!"}</span><div><strong>${label}</strong><small>${ok?"Passed":"Required"}</small></div></div>`).join("")}<section class="nj-summary"><span class="nj-eyebrow">After publishing</span><p>New presentation versions never change this released PPTX or its derived video.</p></section><label class="nj-reviewdate">Next required review<input id="njReviewDate" type="date" min="${new Date().toISOString().slice(0,10)}" value="${escapeHTML(reviewDate)}"/></label>${notebook.status === "published" ? njPill(`Release ${notebook.artifact_releases?.[0]?.version || 1} is live`,"green") : njButton(`Publish release ${(notebook.artifact_releases?.length||0)+1}`,"publish-release","primary",ready?"":"disabled")}${njButton(notebook.review_due_at?"Update review date":"Schedule review","schedule-review")}</aside></div></div></div>`;
}

function njRenderJourney() {
  const notebook = njNotebook();
  if (state.artifactStudio.notebookMode === "landing" || !notebook) return njRenderLibrary();
  switch (njCurrentScreen()) {
    case "empty": return `<div class="nj-page">${njRenderEmpty(notebook)}</div>`;
    case "sources": return `<div class="nj-page">${njRenderSources(notebook)}</div>`;
    case "summary": return `<div class="nj-page">${njRenderSummary(notebook)}</div>`;
    case "brief": return `<div class="nj-page">${njRenderBrief(notebook)}</div>`;
    case "studio": return `<div class="nj-page">${njRenderStudio(notebook)}</div>`;
    case "generating": return `<div class="nj-page">${njRenderGenerating(notebook)}</div>`;
    case "job_aid": return `<div class="nj-page">${njRenderJobAid(notebook)}</div>`;
    case "presentation": return `<div class="nj-page">${njRenderPresentation(notebook)}</div>`;
    case "quiz": return `<div class="nj-page">${njRenderQuiz(notebook)}</div>`;
    case "video": return `<div class="nj-page">${njRenderVideo(notebook)}</div>`;
    case "release": return `<div class="nj-page">${njRenderRelease(notebook)}</div>`;
    default: return `<div class="nj-page">${njRenderStudio(notebook)}</div>`;
  }
}

renderNotebookWorkspace = function renderApprovedNotebookJourney() { return njRenderJourney(); };

async function njCreateNotebook(prompt) {
  const setup = inferNotebookSetup(prompt);
  const notebook = await studioJSON("/api/studio/notebooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setup) });
  state.artifactStudio.notebooks.unshift(notebook);
  state.artifactStudio.activeNotebookId = notebook.id;
  state.artifactStudio.activeProjectNotebookId = notebook.id;
  state.artifactStudio.notebookMode = "workspace";
  njUpdateNotebook(notebook);
  state.notebookJourney.screen = "empty";
}
async function njSetPersistedStage(stage, screen = stage) { await njArtifactAction("set_stage", { stage }); njSetScreen(screen); }
async function njToggleSource(input) {
  const notebook = njNotebook(); const sourceId = input.dataset.njSource;
  const source = libraryRecords().find((item)=>recordId(item)===sourceId);
  const updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/sources`, { method: input.checked ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.checked ? notebookSourceLinkPayload(source) : { source_id: sourceId }) });
  njUpdateNotebook(updated); await njArtifactAction("set_stage", { stage: "sources" }); renderProductView();
}
async function njGenerateSummary() {
  const journey = state.notebookJourney; journey.busy = "analysis"; journey.error = null; renderProductView();
  try { njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "replace" }) })); await njArtifactAction("set_stage",{stage:"summary"}); journey.screen="summary"; }
  catch(error){ journey.error=error.message; showToast("Source analysis unavailable",error.message,"!"); }
  journey.busy=null; renderProductView();
}
async function njFinalize() {
  const journey=state.notebookJourney; journey.busy="finalize"; journey.error=null;
  try { const updated=await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/content`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"finalize"})}); njUpdateNotebook(updated); await njArtifactAction("set_stage",{stage:"studio"}); journey.modal=null; journey.screen="studio"; }
  catch(error){journey.error=(error.details?.issues||[error.message]).join(" ");}
  journey.busy=null; renderProductView();
}
async function njGenerateDrafts() {
  const journey=state.notebookJourney; journey.screen="generating"; journey.busy="drafts"; journey.generation={job_aid:18,presentation:12,quiz:8}; renderProductView();
  const timer=setInterval(()=>{for(const key of Object.keys(journey.generation)) journey.generation[key]=Math.min(92,journey.generation[key]+Math.ceil(Math.random()*14));renderProductView();},350);
  try { await njArtifactAction("generate_drafts"); journey.generation={job_aid:100,presentation:100,quiz:100}; }
  catch(error){journey.error=error.message;showToast("Draft generation failed",error.message,"!");}
  clearInterval(timer);journey.busy=null;renderProductView();
}
function njCurrentEditorProject() { return njProject(njCurrentScreen()); }
function njEditorCollection(project) { return project.format==="job_aid"?["sections","selected_section_id"]:project.format==="presentation"?["slides","selected_slide_id"]:project.format==="quiz"?["questions","selected_question_id"]:["scenes","selected_scene_id"]; }
function njSetSaveStatus(status) {
  state.notebookJourney.saveStatus = status;
  const node = document.querySelector(".nj-save");
  if (node) {
    node.classList.toggle("saving", status === "saving");
    node.classList.toggle("error", status === "error");
    node.textContent = `● ${njSaveStatusLabel()}`;
  }
}
async function njSaveProject(project) {
  const snapshot = structuredClone(project);
  njSetSaveStatus("saving");
  const previous = state.notebookJourney.savePromise || Promise.resolve();
  const pending = previous.catch(()=>{}).then(()=>njArtifactAction("save_project",{format:snapshot.format,project:snapshot}));
  state.notebookJourney.savePromise = pending;
  try {
    await pending;
    if (state.notebookJourney.savePromise === pending) njSetSaveStatus("saved");
  } catch (error) {
    if (state.notebookJourney.savePromise === pending) njSetSaveStatus("error");
    showToast("Autosave failed",error.message,"!");
    throw error;
  }
}
function njScheduleSave(project) {
  clearTimeout(state.notebookJourney.saveTimer);
  njSetSaveStatus("saving");
  state.notebookJourney.saveTimer=setTimeout(()=>{
    state.notebookJourney.saveTimer=null;
    njSaveProject(project).catch(()=>{});
  },450);
}
async function njFlushSave() {
  clearTimeout(state.notebookJourney.saveTimer);
  state.notebookJourney.saveTimer=null;
  const project=njCurrentEditorProject();
  if (project && state.notebookJourney.saveStatus === "saving") await njSaveProject(project);
  else if (state.notebookJourney.savePromise) await state.notebookJourney.savePromise.catch(()=>{});
}
function njMarkProjectDirty(project) {
  if (["presentation","quiz"].includes(project.format) && project.status === "approved") project.status="draft";
  if (project.format === "video" && ["ready","failed"].includes(project.status)) {
    project.status="draft";
    delete project.download_url;
    delete project.completed_at;
    project.scenes=(project.scenes||[]).map((scene)=>({...scene,status:"draft"}));
  }
}
function njMutateSelected(field,value) { const project=njCurrentEditorProject(); if(!project)return; const [collection,selectedField]=njEditorCollection(project); const item=njSelected(project,collection,selectedField); if(!item)return; item[field]=value; njMarkProjectDirty(project); njScheduleSave(project); }
function njSelectItem(id) { const project=njCurrentEditorProject(); if(!project)return; const [,selectedField]=njEditorCollection(project); project[selectedField]=id; njScheduleSave(project); renderProductView(); }
function njItemOperation(operation,id) {
  const project=njCurrentEditorProject(); if(!project)return;
  const [collection,selectedField]=njEditorCollection(project);
  const items=project[collection] || [];
  const index=items.findIndex((item)=>item.id===id);
  if(index<0)return;
  if(operation==="up"&&index>0)[items[index-1],items[index]]=[items[index],items[index-1]];
  if(operation==="down"&&index<items.length-1)[items[index+1],items[index]]=[items[index],items[index+1]];
  if(operation==="duplicate"){
    const duplicate=structuredClone(items[index]);
    duplicate.id=`${collection.slice(0,-1)}-${crypto.randomUUID()}`;
    if(duplicate.title)duplicate.title=`${duplicate.title} copy`;
    if(duplicate.prompt)duplicate.prompt=`${duplicate.prompt} copy`;
    items.splice(index+1,0,duplicate);
    project[selectedField]=duplicate.id;
  }
  if(operation==="delete"&&items.length>1){
    items.splice(index,1);
    project[selectedField]=items[Math.min(index,items.length-1)].id;
  }
  njMarkProjectDirty(project);
  njScheduleSave(project);
  renderProductView();
}
async function njApprovePresentation() {
  await njFlushSave();
  const project=njProject("presentation");
  const instructional=(project.slides||[]).filter((slide,index)=>index>0&&slide.body);
  if(!project.slides?.length||instructional.some((slide)=>!(slide.citations||[]).length))return showToast("Presentation needs citations","Every instructional slide must retain approved evidence.","!");
  const invalidImage=(project.slides||[]).find((slide)=>slide.image&&(!slide.image.alt_text?.trim()||!slide.image.caption?.trim()));
  if(invalidImage)return showToast("Image details required","Add a caption and alt text to every slide image.","!");
  await njArtifactAction("save_project",{format:"presentation",project}); await njArtifactAction("approve_presentation"); njSetScreen("video");
}
async function njRefreshVideo() { try { const updated=await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/video`);njUpdateNotebook(updated);const status=updated.artifact_projects?.video?.status;if(status==="ready"||status==="failed"){clearInterval(state.notebookJourney.videoPoll);state.notebookJourney.videoPoll=null;showToast(status==="ready"?"Video ready":"Video generation failed",status==="ready"?"The HeyGen MP4 and captions are ready to review.":updated.artifact_projects?.video?.error||"Review the video settings and retry.",status==="ready"?"✓":"!");}renderProductView(); } catch(error){clearInterval(state.notebookJourney.videoPoll);state.notebookJourney.videoPoll=null;showToast("Video status unavailable",error.message,"!");} }
async function njGenerateVideo() { const updated=await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/video`,{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});njUpdateNotebook(updated);renderProductView();showToast("Video submitted","HeyGen is rendering the approved presentation scenes.");clearInterval(state.notebookJourney.videoPoll);state.notebookJourney.videoPoll=setInterval(njRefreshVideo,8000); }
function njExportURL(format) { return `/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/exports/${encodeURIComponent(format)}`; }
async function njDownloadExports(formats) { await njFlushSave(); formats.forEach((format,index)=>setTimeout(()=>{const a=document.createElement("a");a.href=njExportURL(format);a.download="";document.body.append(a);a.click();a.remove();},index*180)); }

async function njHandleAction(action) {
  const j=state.notebookJourney;
  if(action==="create"){j.modal="create";j.error=null;return renderProductView();}
  if(action==="close-modal"){j.modal=null;return renderProductView();}
  if(action==="library"){await njFlushSave();state.artifactStudio.notebookMode="landing";j.screen=null;return renderProductView();}
  if(action==="open-library") return handleProductAction("open-library");
  if(action==="sources") return njSetPersistedStage("sources","sources");
  if(action==="generate-summary"||action==="refresh-sources") return njGenerateSummary();
  if(action==="brief") return njSetPersistedStage("brief","brief");
  if(action.startsWith("add-chat-point:")){
    const messageId=action.slice("add-chat-point:".length);
    const message=(njNotebook().chat_messages||[]).find((item)=>item.id===messageId&&item.role==="assistant"&&item.supported);
    if(!message)return showToast("Answer unavailable","Only supported source answers can become key points.","!");
    const existing=njNotebook().content_brief?.points||[];
    if(existing.some((point)=>point.source_message_id===messageId))return showToast("Already added","This answer is already in the content brief.","✓");
    const point={point_id:`point:${crypto.randomUUID()}`,statement:message.interpretation||message.text,intended_use:"key_fact",priority:"supporting",citations:structuredClone(message.citations||[]),provenance:"source_chat",source_message_id:messageId,author_notes:"Added from grounded source chat.",review_status:"reviewed"};
    const points=[...existing,point];
    njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/content`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_points",points})}));
    state.notebookJourney.selectedEvidencePoint=points.length-1;
    showToast("Added to key points","The cited answer is ready in the content brief.","✓");
    return renderProductView();
  }
  if(action==="add-point"){const point={point_id:`point:${crypto.randomUUID()}`,statement:"Add a grounded key point or author instruction.",intended_use:"key_fact",priority:"supporting",citations:[],provenance:"author_input",author_notes:"",review_status:"needs_review"};const points=[...(njNotebook().content_brief?.points||[]),point];njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/content`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_points",points})}));state.notebookJourney.selectedEvidencePoint=points.length-1;return renderProductView();}
  if(action==="find-more"){state.notebookJourney.busy="analysis";try{njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/analyze`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"expand"})}));}finally{state.notebookJourney.busy=null;}return renderProductView();}
  if(action==="finalize"){j.modal="finalize";return renderProductView();}
  if(action==="confirm-finalize") return njFinalize();
  if(action==="studio"){await njFlushSave();return njSetScreen("studio");}
  if(action==="generate-drafts") return njGenerateDrafts();
  if(action==="open-presentation"){await njFlushSave();j.screen="presentation";return renderProductView();}
  if(action==="release"){await njFlushSave();j.screen="release";return renderProductView();}
  if(action==="review") return moveNotebookToReview();
  if(action==="assets"){
    const project=njCurrentEditorProject();
    const [collection,selectedField]=project?njEditorCollection(project):[null,null];
    const item=project?njSelected(project,collection,selectedField):null;
    const assets=njNotebook().notebook_assets||[];
    const current=assets.find((asset)=>asset.id===item?.image?.id)||assets[0]||null;
    j.selectedAssetId=current?.id||null;
    j.assetDraft=structuredClone(item?.image?.crop||current?.crop||{fit:"cover",zoom:1,x:50,y:50});
    j.modal="assets";
    return renderProductView();
  }
  if(action.startsWith("use-asset:")){
    const [,format,itemId]=action.split(":");const project=njProject(format);const collection=format==="presentation"?"slides":"sections";const item=(project[collection]||[]).find((x)=>x.id===itemId);const stored=(njNotebook().notebook_assets||[]).find((a)=>a.id===j.selectedAssetId);
    const altText=document.querySelector("#njAssetAlt")?.value.trim()||"";
    if(!stored?.url)return showToast("Choose an image","Select or upload an image before continuing.","!");
    if(!altText)return showToast("Alt text required","Describe the image for people using assistive technology.","!");
    if(item)item.image={...structuredClone(stored),caption:document.querySelector("#njAssetCaption")?.value.trim()||"",alt_text:altText,crop:structuredClone(j.assetDraft)};
    njMarkProjectDirty(project);
    j.modal=null;await njArtifactAction("save_project",{format,project});njSetSaveStatus("saved");return renderProductView();
  }
  if(action==="approve-presentation") return njApprovePresentation();
  if(action==="generate-video") return njGenerateVideo();
  if(action==="refresh-video") return njRefreshVideo();
  if(action==="approve-quiz"){await njFlushSave();const p=njProject("quiz");const invalid=(p.questions||[]).find((q)=>!q.prompt||!q.explanation||q.options?.length<2||!Number.isInteger(q.correct_index)||q.correct_index<0||q.correct_index>=q.options.length||!(q.citations||[]).length);if(invalid)return showToast("Quiz needs review","Every question needs choices, a valid answer, explanation, and citation.","!");p.status="approved";await njArtifactAction("save_project",{format:"quiz",project:p});njSetSaveStatus("saved");return renderProductView();}
  if(action==="preview-job") return window.open(njExportURL("pdf"),"_blank","noopener");
  if(action==="preview-quiz") return window.open(njExportURL("quiz-html"),"_blank","noopener");
  if(action==="preview-video"){const p=njProject("video");return p?.download_url?window.open(p.download_url,"_blank","noopener"):showToast("Preview not ready","Generate the HeyGen video to preview the MP4.","!");}
  if(action==="export-job"||action==="download-job") return njDownloadExports(["docx","pdf"]);
  if(action==="export-presentation"||action==="download-presentation") return njDownloadExports(["pptx"]);
  if(action==="export-quiz"||action==="download-quiz") return njDownloadExports(["quiz-html","quiz-json"]);
  if(action==="download-video") { const video=njProject("video"); if(video?.download_url){window.open(video.download_url,"_blank","noopener");} return njDownloadExports(["srt"]); }
  if(action==="publish-release"){await njFlushSave();const due=document.querySelector("#njReviewDate")?.value;if(!due)return showToast("Review date required","Choose the next required review date before publishing.","!");await njArtifactAction("publish_release",{notes:document.querySelector("#njReleaseNotes")?.value||""});njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/publish`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({review_due_at:new Date(`${due}T12:00:00Z`).toISOString()})}));return renderProductView();}
  if(action==="schedule-review"){const due=document.querySelector("#njReviewDate")?.value;if(!due)return showToast("Review date required","Choose a review date first.","!");await njArtifactAction("schedule_review",{review_due_at:new Date(`${due}T12:00:00Z`).toISOString()});showToast("Review scheduled",`The next review is due ${new Date(`${due}T12:00:00Z`).toLocaleDateString()}.`,"✓");return renderProductView();}
  if(action.startsWith("add-")){const project=njCurrentEditorProject();if(!project)return;const [collection,selectedField]=njEditorCollection(project);const singular=collection.slice(0,-1);const item={id:`${singular}-${crypto.randomUUID()}`,title:`New ${singular}`,body:"Add grounded content here.",notes:"",citations:[]};if(collection==="questions")Object.assign(item,{prompt:"New grounded question",options:["Correct answer","Alternative answer"],correct_index:0,explanation:"Add an explanation.",points:1});if(collection==="scenes")Object.assign(item,{narration:"Add narration.",duration_seconds:20,avatar_enabled:true,avatar_position:"right",captions_enabled:true});project[collection].push(item);project[selectedField]=item.id;njMarkProjectDirty(project);njScheduleSave(project);return renderProductView();}
}

function njBindJourneyEvents() {
  const root=dom.screenContent;
  root.querySelectorAll("[data-nj-action]").forEach((button)=>button.addEventListener("click",(event)=>{event.preventDefault();Promise.resolve(njHandleAction(button.dataset.njAction)).catch((error)=>showToast("Action unavailable",(error.details?.issues||[error.message]).join(" "),"!"));}));
  const createPrompt = root.querySelector("#njCreatePrompt");
  createPrompt?.addEventListener("input", () => {
    state.notebookJourney.createPrompt = createPrompt.value;
    state.notebookJourney.error = null;
    root.querySelector(".nj-error")?.remove();
    const count = root.querySelector("#njCreatePromptCount");
    if (count) count.textContent = `${createPrompt.value.length} of 500 characters`;
    const submit = root.querySelector("#njCreateForm .nj-btn.primary");
    if (submit) submit.disabled = createPrompt.value.trim().length < 8 || createPrompt.value.length > 500;
  });
  root.querySelector("#njCreateForm")?.addEventListener("submit",async(event)=>{event.preventDefault();const prompt=createPrompt.value.trim();state.notebookJourney.createPrompt=prompt;state.notebookJourney.busy="create";state.notebookJourney.error=null;renderProductView();try{await njCreateNotebook(prompt);state.notebookJourney.modal=null;state.notebookJourney.createPrompt="";}catch(error){state.notebookJourney.error=error.message;}state.notebookJourney.busy=null;renderProductView();});
  root.querySelectorAll("[data-nj-source]").forEach((input)=>input.addEventListener("change",()=>njToggleSource(input).catch((e)=>showToast("Source update failed",e.message,"!"))));
  root.querySelector("[data-nj-source-search]")?.addEventListener("input",(event)=>{const query=event.target.value.trim().toLowerCase();root.querySelectorAll(".nj-sourceitem").forEach((row)=>row.hidden=query&&!row.textContent.toLowerCase().includes(query));});
  root.querySelectorAll("[data-nj-point-index]").forEach((button)=>button.addEventListener("click",()=>{state.notebookJourney.selectedEvidencePoint=Number(button.dataset.njPointIndex);renderProductView();}));
  root.querySelectorAll("[data-nj-point-text]").forEach((input)=>input.addEventListener("change",async()=>{const points=njNotebook().content_brief.points.map((p)=>p.point_id===input.dataset.njPointText?{...p,statement:input.value,review_status:"reviewed",provenance:"author_override"}:p);njUpdateNotebook(await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/content`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_points",points})}));renderProductView();}));
  root.querySelector("#njChatForm")?.addEventListener("submit",async(event)=>{event.preventDefault();const question=root.querySelector("#njChatInput").value.trim();if(!question)return;try{const result=await studioJSON(`/api/studio/notebooks/${encodeURIComponent(njNotebook().id)}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question})});njNotebook().chat_messages=result.chat_messages;renderProductView();}catch(error){showToast("Chat unavailable",error.message,"!");}});
  root.querySelectorAll("[data-nj-open-output]").forEach((button)=>button.addEventListener("click",async()=>{await njFlushSave();njSetScreen(button.dataset.njOpenOutput);}));
  root.querySelectorAll("[data-nj-select-item]").forEach((button)=>button.addEventListener("click",()=>njSelectItem(button.dataset.njSelectItem)));
  root.querySelectorAll("[data-nj-item-op]").forEach((button)=>button.addEventListener("click",(event)=>{event.preventDefault();event.stopPropagation();njItemOperation(button.dataset.njItemOp,button.dataset.njItemId);}));
  root.querySelectorAll("[data-nj-editor-tab]").forEach((button)=>button.addEventListener("click",()=>{state.notebookJourney.editorTab=button.dataset.njEditorTab;renderProductView();}));
  root.querySelectorAll("[data-nj-item-field]").forEach((input)=>input.addEventListener("change",()=>{let value=input.value;if(input.type==="number")value=Number(value);if(value==="true"||value==="false")value=value==="true";njMutateSelected(input.dataset.njItemField,value);renderProductView();}));
  root.querySelectorAll("[data-nj-contenteditable]").forEach((node)=>node.addEventListener("blur",()=>njMutateSelected(node.dataset.njContenteditable,node.textContent.trim())));
  root.querySelectorAll("[data-nj-option]").forEach((node)=>node.addEventListener("blur",()=>{const p=njCurrentEditorProject();const q=njSelected(p,"questions","selected_question_id");q.options[Number(node.dataset.njOption)]=node.textContent.trim();njMarkProjectDirty(p);njScheduleSave(p);}));
  root.querySelectorAll("[data-nj-correct]").forEach((input)=>input.addEventListener("change",()=>njMutateSelected("correct_index",Number(input.dataset.njCorrect))));
  root.querySelectorAll("[data-nj-avatar-id]").forEach((button)=>button.addEventListener("click",()=>{njMutateSelected("avatar_id",button.dataset.njAvatarId);renderProductView();}));
  root.querySelectorAll("[data-nj-asset-id]").forEach((button)=>button.addEventListener("click",()=>{const asset=(njNotebook().notebook_assets||[]).find((item)=>item.id===button.dataset.njAssetId);state.notebookJourney.selectedAssetId=button.dataset.njAssetId;state.notebookJourney.assetDraft=structuredClone(asset?.crop||{fit:"cover",zoom:1,x:50,y:50});renderProductView();}));
  root.querySelectorAll("[data-nj-asset-filter]").forEach((button)=>button.addEventListener("click",()=>{state.notebookJourney.assetFilter=button.dataset.njAssetFilter;renderProductView();}));
  root.querySelector("[data-nj-asset-search]")?.addEventListener("input",(event)=>{state.notebookJourney.assetQuery=event.target.value;const query=event.target.value.trim().toLowerCase();root.querySelectorAll(".nj-assetgrid [data-nj-asset-id]").forEach((button)=>button.hidden=query&&!button.textContent.toLowerCase().includes(query));});
  root.querySelectorAll("[data-nj-crop]").forEach((input)=>input.addEventListener("input",()=>{const field=input.dataset.njCrop;state.notebookJourney.assetDraft[field]=field==="fit"?input.value:Number(input.value);const preview=root.querySelector(".nj-cropstage img");const draft=state.notebookJourney.assetDraft;if(preview){preview.style.objectFit=draft.fit;preview.style.objectPosition=`${draft.x}% ${draft.y}%`;preview.style.transform=`scale(${draft.zoom})`;}const output=input.closest("label")?.querySelector("output");if(output)output.textContent=field==="zoom"?`${Number(input.value).toFixed(1)}×`:`${input.value}%`;}));
  root.querySelector("[data-nj-upload]")?.addEventListener("change",async(event)=>{const file=event.target.files?.[0];if(!file||file.size>1500000)return showToast("Image too large","Use an image smaller than 1.5 MB.","!");const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});const updated=await njArtifactAction("add_asset",{asset:{title:file.name,source:"upload",url,alt_text:file.name.replace(/\.[^.]+$/,""),caption:"",crop:{fit:"cover",zoom:1,x:50,y:50}}});state.notebookJourney.selectedAssetId=updated.notebook_assets.at(-1)?.id;state.notebookJourney.assetDraft={fit:"cover",zoom:1,x:50,y:50};state.notebookJourney.assetFilter="upload";renderProductView();});
  root.querySelector("[data-nj-library-search]")?.addEventListener("input",(event)=>{const q=event.target.value.toLowerCase();root.querySelectorAll("[data-open-notebook-id]").forEach((button)=>button.hidden=!button.textContent.toLowerCase().includes(q));});
  root.querySelectorAll("[data-nj-library-filter]").forEach((select)=>select.addEventListener("change",()=>{if(select.dataset.njLibraryFilter==="program")state.notebookJourney.libraryProgram=select.value;else state.notebookJourney.libraryAccess=select.value;renderProductView();}));
  root.querySelector("[data-nj-library-sort]")?.addEventListener("change",(event)=>{state.notebookJourney.librarySort=event.target.value;renderProductView();});
  root.querySelectorAll("[data-nj-library-view]").forEach((button)=>button.addEventListener("click",()=>{state.notebookJourney.libraryView=button.dataset.njLibraryView;renderProductView();}));
}

bindNotebookStudioEvents = function bindApprovedNotebookJourneyEvents() { njLegacyBindEvents(); njBindJourneyEvents(); };
