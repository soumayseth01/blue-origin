/* Notebook-centered source-to-artifact studio.
   This layer intentionally reuses the existing Product Studio shell while
   leaving the eligibility simulation runtime unchanged. */

const legacyStudioRender = renderProductView;
const legacyStudioSetView = setProductView;
const legacyStudioAction = handleProductAction;

productRoutes.notebook = { label: "Workspace", title: "Notebook" };
productRoutes.library = { label: "Workspace", title: "Library" };
productRoutes.home = { label: "Home", title: "Product Studio" };

const eligibilityDocumentTypes = [
  ["policy_manual", "Policy manual"],
  ["sop_procedure", "SOP / procedure"],
  ["job_aid", "Job aid / quick reference"],
  ["huddle_script", "Huddle script / talking points"],
  ["application_form", "Application / form"],
  ["notice_template", "Notice / letter template"],
  ["policy_bulletin", "Policy bulletin / change memo"],
  ["reference_table", "Reference table / chart"],
  ["training_outreach", "Training / outreach"],
  ["faq", "FAQ / client guidance"],
  ["system_release", "System guide / release note"],
  ["quality_tool", "QA checklist / review tool"],
  ["other", "Other"],
];

const curatedArtifactTemplates = [
  { id: "doc-quick-reference", format: "job_aid", name: "One-page quick reference", description: "A concise operator reference with key facts, a short procedure, one callout, and source notes.", icon: "article", outputs: ["DOCX", "PDF"], pages: "1 page", imageSlots: 1 },
  { id: "doc-step-by-step", format: "job_aid", name: "Step-by-step job aid", description: "A task-focused guide with prerequisites, numbered actions, screenshots, warnings, and a completion checklist.", icon: "format_list_numbered", outputs: ["DOCX", "PDF"], pages: "2–4 pages", imageSlots: 3 },
  { id: "doc-reference-guide", format: "job_aid", name: "Detailed reference guide", description: "A sectioned guide with procedures, examples, tables, glossary entries, and revision history.", icon: "menu_book", outputs: ["DOCX", "PDF"], pages: "5–10 pages", imageSlots: 4 },
  { id: "ppt-process-walkthrough", format: "presentation", name: "Guided process walkthrough", description: "Title, objectives, process overview, step slides, recap, and next steps with an avatar-safe presenter region.", icon: "co_present", outputs: ["PPTX"], pages: "6–10 slides", imageSlots: 4 },
  { id: "ppt-policy-briefing", format: "presentation", name: "Feature or policy briefing", description: "Context, key changes, impact, examples, decisions, and resources for a concise briefing.", icon: "campaign", outputs: ["PPTX"], pages: "7–12 slides", imageSlots: 3 },
  { id: "ppt-scenario-training", format: "presentation", name: "Scenario-based training deck", description: "Scenario facts, decisions, walkthrough, knowledge checks, and recap for facilitated learning.", icon: "school", outputs: ["PPTX"], pages: "8–14 slides", imageSlots: 5 },
  { id: "quiz-grounded-check", format: "quiz", name: "Grounded knowledge check", description: "Five cited questions with answer keys, explanations, and deterministic scoring.", icon: "quiz", outputs: ["HTML", "JSON"], pages: "5 questions", imageSlots: 0 },
];

const artifactFormatCards = [
  { id: "job_aid", icon: "description", title: "Job aid", text: "Build an editable operator guide and matching distribution PDF.", outputs: "DOCX · PDF" },
  { id: "presentation", icon: "slideshow", title: "Presentation", text: "Create an editable deck with image and presenter-safe areas.", outputs: "PPTX" },
  { id: "quiz", icon: "quiz", title: "Knowledge check", text: "Create cited questions and explanations from the approved brief.", outputs: "HTML · JSON" },
  { id: "video", icon: "movie", title: "Video", text: "Create a narrated HeyGen video from the approved presentation.", outputs: "MP4 · captions", dependent: true },
];

state.artifactStudio = {
  notebookMode: "landing",
  notebookTab: "overview",
  activeNotebookId: null,
  notebooks: [],
  notebooksStatus: "idle",
  notebooksError: null,
  notebookQuery: "",
  notebookAccessFilter: "all",
  notebookProgramFilter: "all",
  notebookSort: "recent",
  notebookView: "grid",
  notebookFiltersOpen: false,
  notebookPages: { published: 1, in_review: 1, draft: 1 },
  notebookCreateStatus: "idle",
  notebookCreateError: null,
  notebookCreateDialog: null,
  notebookPublish: null,
  notebookAutosaveState: "saved",
  connectedNotebookChat: [],
  notebookQuestionStatus: "idle",
  notebookQuestionError: null,
  notebookChatDraft: "",
  notebookAnalysisStatus: "idle",
  notebookContentStatus: "idle",
  notebookCitation: null,
  step: "select",
  selectedBlockIds: new Set(),
  expandedBlockId: null,
  sourceFilter: "all",
  sourceStatusFilter: "all",
  sourceQuery: "",
  libraryQuery: "",
  libraryJurisdiction: "all",
  libraryProgram: "all",
  libraryType: "all",
  libraryClassifications: {},
  librarySources: [],
  librarySourcesStatus: "idle",
  librarySourcesError: null,
  libraryImportStatus: "idle",
  libraryImportError: null,
  libraryTargetNotebookId: null,
  libraryViewer: null,
  blockQuery: "",
  sourceDocuments: {},
  sourceBlocks: {},
  sourceUnderstandingStatus: "idle",
  sourceUnderstandingError: null,
  contextQuestion: "",
  contextAnswer: null,
  aiStatus: "idle",
  aiError: null,
  brief: { id: null, version: 0, status: "draft", points: [], approvedSnapshot: null },
  format: null,
  templateId: null,
  project: null,
  projects: {},
  approvedPresentation: null,
  activeProjectNotebookId: null,
  draftGenerationStatus: "idle",
  releases: [],
  integrationStatus: { openai: false, heygen: false, notebook: false, blob: false, worker: false },
};

let libraryViewerOpener = null;
let libraryViewerAbortController = null;

function handleLibraryViewerGlobalKeydown(event) {
  if (event.key === "Escape" && document.querySelector("[data-library-viewer]")) {
    event.preventDefault();
    closeLibraryDocumentViewer();
  }
}

function artifactSourceDocument(source) {
  const id = recordId(source);
  const loaded = state.artifactStudio.sourceDocuments[id] || {};
  const metadata = source.metadata || source.asset || {};
  const sourceType = loaded.source_type || source.source_type || source.type || metadata.type || "Source";
  return {
    source_id: id,
    title: sourceTitle(source),
    source_type: sourceType,
    extraction_status: loaded.extraction_status || source.extraction_status || source.status || "not reviewed",
    pages: loaded.page_count ?? source.page_count ?? metadata.page_count ?? null,
    sections: loaded.section_count ?? null,
    tables: loaded.table_count ?? null,
    images: loaded.image_count ?? null,
    topics: loaded.topics || topicList(source, []),
    is_policy: Boolean(loaded.is_policy ?? /policy/i.test(sourceType)),
    warning: loaded.warning || null,
  };
}

function artifactBlocksForSource(source) {
  return state.artifactStudio.sourceBlocks[recordId(source)] || [];
}

function selectedArtifactSources() {
  return libraryRecords().filter((source) => state.selectedSourceIds.has(recordId(source)));
}

function artifactSourceMatchesFilters(source) {
  const studio = state.artifactStudio;
  const doc = artifactSourceDocument(source);
  const topics = doc.topics.map((topic) => String(topic).toLowerCase());
  const haystack = [doc.title, doc.source_type, doc.extraction_status, ...topics].join(" ").toLowerCase();
  if (studio.sourceQuery && !haystack.includes(studio.sourceQuery.toLowerCase())) return false;
  if (studio.sourceStatusFilter !== "all" && String(doc.extraction_status).toLowerCase().replaceAll(" ", "_") !== studio.sourceStatusFilter) return false;
  if (studio.sourceFilter === "policy" && !(doc.is_policy || /policy|eligibility|medicaid|snap|tanf/.test(haystack))) return false;
  if (studio.sourceFilter === "product" && !topics.some((topic) => ["product-baseline", "ui-ux", "design-reference", "implementation", "architecture-decision"].includes(topic))) return false;
  if (studio.sourceFilter === "screen" && !/screen|screenshot|image|ui-ux/.test(haystack)) return false;
  if (studio.sourceFilter === "transcript" && !/transcript|meeting|interview/.test(haystack)) return false;
  return true;
}

function selectedArtifactBlocks() {
  return selectedArtifactSources().flatMap(artifactBlocksForSource).filter((block) => state.artifactStudio.selectedBlockIds.has(block.block_id));
}

function allAvailableArtifactBlocks() {
  return selectedArtifactSources().flatMap(artifactBlocksForSource);
}

function libraryTypeLabel(value) {
  return eligibilityDocumentTypes.find(([id]) => id === value)?.[1] || "Other";
}

function inferredLibraryType(title, sourceType = "", topics = []) {
  const text = `${title} ${sourceType} ${topics.join(" ")}`.toLowerCase();
  if (/application|form\b|change report|renewal/.test(text)) return "application_form";
  if (/quick reference|job aid|desk guide|checklist/.test(text)) return "job_aid";
  if (/bulletin|change memo|policy letter/.test(text)) return "policy_bulletin";
  if (/procedure|administrative manual|workflow/.test(text)) return "sop_procedure";
  if (/training|webinar|video|outreach/.test(text)) return "training_outreach";
  if (/faq|frequently asked|client guidance/.test(text)) return "faq";
  if (/table|schedule|chart/.test(text)) return "reference_table";
  if (/policy|handbook|manual|regulation/.test(text)) return "policy_manual";
  return "other";
}

function eligibilityPrograms(source) {
  const text = `${sourceTitle(source)} ${(topicList(source, []) || []).join(" ")}`.toLowerCase();
  const programs = [];
  if (/snap|food|nutrition/.test(text)) programs.push("SNAP");
  if (/tanf|cash|family independence/.test(text)) programs.push("TANF");
  if (/medicaid|medical|ahcccs|michild|chip/.test(text)) programs.push("Medicaid");
  return programs.length ? programs : ["Integrated eligibility"];
}

function libraryRecords() {
  const registryRecords = state.artifactStudio.librarySources.map((source) => ({
    ...source,
    source_kind: "registry",
    source_type: source.document_type,
  }));
  const registryIds = new Set(registryRecords.map((source) => source.id));
  const notebookRecords = state.openNotebook.sources.filter((source) => !registryIds.has(recordId(source))).map((source) => {
    const id = recordId(source);
    const doc = artifactSourceDocument(source);
    return {
      id,
      title: doc.title,
      jurisdiction: source.jurisdiction || "Notebook",
      owner: source.owner || "Open Notebook",
      document_type: inferredLibraryType(doc.title, doc.source_type, doc.topics),
      programs: eligibilityPrograms(source),
      format: doc.source_type,
      effective_date: source.updated || source.created || source.date || "Not provided",
      status: doc.extraction_status,
      url: source.asset?.url || source.url || null,
      description: source.description || "Notebook source available for source understanding and artifact creation.",
      source_kind: "open_notebook",
      notebook_source: source,
    };
  });
  return [...registryRecords, ...notebookRecords];
}

function currentLibraryType(record) {
  return state.artifactStudio.libraryClassifications[record.id] || record.document_type || "other";
}

function filteredLibraryRecords() {
  const studio = state.artifactStudio;
  return libraryRecords().filter((record) => {
    const type = currentLibraryType(record);
    const searchable = [record.title, record.owner, record.jurisdiction, record.description, record.format, ...record.programs].join(" ").toLowerCase();
    if (studio.libraryQuery && !searchable.includes(studio.libraryQuery.toLowerCase())) return false;
    if (studio.libraryJurisdiction !== "all" && record.jurisdiction !== studio.libraryJurisdiction) return false;
    if (studio.libraryProgram !== "all" && !record.programs.includes(studio.libraryProgram)) return false;
    if (studio.libraryType !== "all" && type !== studio.libraryType) return false;
    return true;
  });
}

function markArtifactBriefStale(reason) {
  const brief = state.artifactStudio.brief;
  if (brief.status === "approved") {
    brief.status = "stale";
    brief.staleReason = reason;
    if (state.artifactStudio.project) state.artifactStudio.project.status = "stale";
  }
}

function notebookStatusLabel() {
  if (state.openNotebook.loading) return "Connecting to Open Notebook";
  return state.openNotebook.live ? "Connected to Open Notebook" : "Open Notebook unavailable";
}

function sourceMetric(value, label) {
  return value === null || value === undefined ? null : `${value} ${label}`;
}

async function studioJSON(path, options = {}) {
  const response = await fetch(path, options);
  let payload = null;
  try { payload = await response.json(); } catch { /* error body may not be JSON */ }
  if (!response.ok) {
    const error = new Error(payload?.detail || `${response.status} ${response.statusText}`);
    error.details = payload?.details || null;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function libraryViewerKind(source) {
  const contentType = String(source?.content_type || "").toLowerCase();
  const fileName = String(source?.file_name || "").toLowerCase();
  if (contentType === "application/pdf" || fileName.endsWith(".pdf")) return "pdf";
  if (contentType.includes("wordprocessingml") || fileName.endsWith(".docx")) return "docx";
  if (contentType.includes("html") || /\.html?$/.test(fileName)) return "html";
  if (contentType.startsWith("text/") || /\.(txt|md)$/.test(fileName)) return "text";
  return "unsupported";
}

function renderLibraryDocumentViewer(source) {
  const size = source.byte_size ? `${Math.max(1, Math.round(Number(source.byte_size) / 1024)).toLocaleString()} KB` : "Stored original";
  return `<section class="library-document-viewer" role="dialog" aria-modal="true" aria-labelledby="libraryViewerTitle" data-library-viewer>
    <header class="library-viewer-header">
      <button type="button" data-close-library-viewer aria-label="Close document viewer">${materialIcon("close")}</button>
      <span class="library-viewer-file-icon">${materialIcon(source.content_type === "application/pdf" ? "picture_as_pdf" : "description")}</span>
      <div><h2 id="libraryViewerTitle">${escapeHTML(source.title)}</h2><p>${escapeHTML(source.file_name || source.format || "Document")} · ${escapeHTML(size)}</p></div>
    </header>
    <main class="library-viewer-stage" data-library-viewer-stage>
      <div class="library-viewer-loading" role="status">${materialIcon("progress_activity")}<strong>Opening original document…</strong><span>The stored file is being prepared for private viewing.</span></div>
    </main>
  </section>`;
}

function closeLibraryDocumentViewer({ restoreFocus = true } = {}) {
  libraryViewerAbortController?.abort();
  libraryViewerAbortController = null;
  document.querySelector("[data-library-viewer]")?.remove();
  document.querySelector(".library-drive-shell")?.removeAttribute("inert");
  document.body.classList.remove("library-viewer-open");
  document.removeEventListener("keydown", handleLibraryViewerGlobalKeydown, true);
  state.artifactStudio.libraryViewer = null;
  if (restoreFocus && libraryViewerOpener?.isConnected) libraryViewerOpener.focus();
  libraryViewerOpener = null;
}

function showLibraryViewerError(source, error) {
  const stage = document.querySelector("[data-library-viewer-stage]");
  if (!stage || state.artifactStudio.libraryViewer?.sourceId !== source.id) return;
  state.artifactStudio.libraryViewer.status = "error";
  state.artifactStudio.libraryViewer.error = error.message;
  stage.innerHTML = `<div class="library-viewer-error" role="alert">${materialIcon("error")}<h3>This original document could not be displayed.</h3><p>${escapeHTML(error.message || "The viewer encountered an unexpected error.")}</p><div><button class="button button-primary" type="button" data-retry-library-viewer>Retry</button><button class="button button-secondary" type="button" data-close-library-viewer>Close</button></div></div>`;
  stage.querySelector("[data-retry-library-viewer]")?.addEventListener("click", () => loadLibraryDocumentViewer(source));
  stage.querySelector("[data-close-library-viewer]")?.addEventListener("click", () => closeLibraryDocumentViewer());
  stage.querySelector("[data-retry-library-viewer]")?.focus();
}

async function loadLibraryDocumentViewer(source) {
  const stage = document.querySelector("[data-library-viewer-stage]");
  if (!stage) return;
  libraryViewerAbortController?.abort();
  libraryViewerAbortController = new AbortController();
  const { signal } = libraryViewerAbortController;
  const kind = libraryViewerKind(source);
  state.artifactStudio.libraryViewer = { sourceId: source.id, status: "loading", error: null };
  stage.innerHTML = `<div class="library-viewer-loading" role="status">${materialIcon("progress_activity")}<strong>Opening original document…</strong><span>The stored file is being prepared for private viewing.</span></div>`;
  try {
    if (kind === "pdf" || kind === "html") {
      const frame = document.createElement("iframe");
      frame.className = `library-viewer-frame ${kind}`;
      frame.title = `${source.title} original document`;
      if (kind === "html") frame.setAttribute("sandbox", "");
      frame.addEventListener("load", () => {
        if (signal.aborted) return;
        stage.querySelector(".library-viewer-loading")?.remove();
        state.artifactStudio.libraryViewer.status = "ready";
        const viewer = document.querySelector("[data-library-viewer]");
        if (viewer && !viewer.contains(document.activeElement)) viewer.querySelector("[data-close-library-viewer]")?.focus();
      }, { once: true });
      frame.src = source.document_url;
      stage.append(frame);
      return;
    }
    if (kind === "unsupported") throw new Error("This file format does not have a private in-app renderer.");
    const response = await fetch(source.document_url, { headers: { Accept: source.content_type || "application/octet-stream" }, signal });
    if (!response.ok) throw new Error(`The stored original returned ${response.status}.`);
    const bytes = await response.arrayBuffer();
    if (signal.aborted) return;
    stage.innerHTML = "";
    if (kind === "docx") {
      if (!window.docx?.renderAsync) throw new Error("The private Word viewer did not load.");
      const styleHost = document.createElement("div");
      styleHost.className = "library-docx-styles";
      const host = document.createElement("div");
      host.className = "library-docx-host";
      stage.append(styleHost, host);
      await window.docx.renderAsync(bytes, host, styleHost, {
        className: "library-docx",
        inWrapper: true,
        breakPages: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        useBase64URL: true,
      });
    } else {
      const pre = document.createElement("pre");
      pre.className = "library-text-original";
      pre.textContent = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      stage.append(pre);
    }
    if (!signal.aborted) {
      state.artifactStudio.libraryViewer.status = "ready";
      const viewer = document.querySelector("[data-library-viewer]");
      if (viewer && !viewer.contains(document.activeElement)) viewer.querySelector("[data-close-library-viewer]")?.focus();
    }
  } catch (error) {
    if (error.name !== "AbortError") showLibraryViewerError(source, error);
  }
}

function bindLibraryViewerEvents(source) {
  const viewer = document.querySelector("[data-library-viewer]");
  if (!viewer) return;
  viewer.querySelector("[data-close-library-viewer]")?.addEventListener("click", () => closeLibraryDocumentViewer());
  viewer.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...viewer.querySelectorAll('button:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  viewer.querySelector("[data-close-library-viewer]")?.focus();
  loadLibraryDocumentViewer(source);
}

function openLibraryDocument(sourceId, opener = null) {
  const source = libraryRecords().find((record) => record.id === sourceId && record.document_url);
  if (!source) return showToast("Document unavailable", "The original file is not stored in the Library.", "!");
  closeLibraryDocumentViewer({ restoreFocus: false });
  libraryViewerOpener = opener;
  state.artifactStudio.libraryViewer = { sourceId, status: "loading", error: null };
  dom.screenContent.insertAdjacentHTML("beforeend", renderLibraryDocumentViewer(source));
  document.querySelector(".library-drive-shell")?.setAttribute("inert", "");
  document.body.classList.add("library-viewer-open");
  document.addEventListener("keydown", handleLibraryViewerGlobalKeydown, true);
  bindLibraryViewerEvents(source);
}

function libraryChunkBase64(bytes) {
  let binary = "";
  const stride = 32 * 1024;
  for (let offset = 0; offset < bytes.length; offset += stride) binary += String.fromCharCode(...bytes.subarray(offset, offset + stride));
  return btoa(binary);
}

async function createLibraryDocument({ type, title, url = "", content = "", file = null, onProgress = () => {} }) {
  if (type !== "upload") {
    return await studioJSON("/api/studio/library-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, url, content }),
    });
  }
  if (!file?.size) throw new Error("Choose a non-empty document to upload.");
  if (file.size > 30 * 1024 * 1024) throw new Error("Library uploads are limited to 30 MB.");
  let source = null;
  try {
    source = await studioJSON("/api/studio/library-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "upload", title, file_name: file.name, file_size: file.size, content_type: file.type }),
    });
    const chunkSize = 2 * 1024 * 1024;
    let result = null;
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, file.size);
      const bytes = new Uint8Array(await file.slice(offset, end).arrayBuffer());
      result = await studioJSON(`/api/studio/library-sources/${encodeURIComponent(source.id)}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset, expected_size: file.size, complete: end === file.size, chunk_base64: libraryChunkBase64(bytes) }),
      });
      onProgress(Math.round((end / file.size) * 100));
    }
    return result?.source || source;
  } catch (error) {
    if (source?.id) await studioJSON(`/api/studio/library-sources/${encodeURIComponent(source.id)}`, { method: "DELETE" }).catch(() => {});
    throw error;
  }
}

async function loadLibraryRegistry({ quiet = false } = {}) {
  const studio = state.artifactStudio;
  if (!quiet) studio.librarySourcesStatus = "loading";
  try {
    const payload = await studioJSON("/api/studio/library-sources?page_size=200");
    studio.librarySources = payload.items || [];
    studio.librarySourcesStatus = "ready";
    studio.librarySourcesError = null;
  } catch (error) {
    studio.librarySources = [];
    studio.librarySourcesStatus = "error";
    studio.librarySourcesError = error.message;
  }
  if (["library", "notebook", "home"].includes(state.route)) renderProductView();
}

async function importLibraryDocuments() {
  const studio = state.artifactStudio;
  const sourceIds = studio.librarySources.filter((source) => source.url && source.storage_status !== "stored").map((source) => source.id);
  if (!sourceIds.length) return showToast("Library is current", "Every registered official source has a stored document snapshot.");
  studio.libraryImportStatus = "loading";
  studio.libraryImportError = null;
  renderProductView();
  try {
    const result = await studioJSON("/api/studio/library-sources/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_ids: sourceIds }),
    });
    studio.libraryImportStatus = result.failed ? "partial" : "ready";
    studio.libraryImportError = result.failed ? `${result.failed} document${result.failed === 1 ? "" : "s"} could not be fetched from the official site.` : null;
    await loadLibraryRegistry({ quiet: true });
    showToast("Library documents imported", `${result.imported} official document${result.imported === 1 ? "" : "s"} stored in the database${result.failed ? ` · ${result.failed} need attention` : ""}.`, result.failed ? "!" : "✓");
  } catch (error) {
    studio.libraryImportStatus = "error";
    studio.libraryImportError = error.message;
    renderProductView();
    showToast("Document import unavailable", error.message, "!");
  }
}

async function archiveLibraryDocument(sourceId) {
  const source = libraryRecords().find((record) => record.id === sourceId);
  if (!source || !window.confirm(`Archive “${source.title}”? It will be removed from the active Library but its stored file will not be deleted.`)) return;
  try {
    await studioJSON(`/api/studio/library-sources/${encodeURIComponent(sourceId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    state.selectedSourceIds.delete(sourceId);
    await loadLibraryRegistry({ quiet: true });
    showToast("Document archived", `${source.title} was removed from the active Library.`, "✓");
  } catch (error) {
    showToast("Archive unavailable", error.message, "!");
  }
}

async function deleteLibraryDocument(sourceId) {
  const source = libraryRecords().find((record) => record.id === sourceId);
  if (!source || !window.confirm(`Delete “${source.title}”? The stored original file and extracted Notebook text will be permanently removed.`)) return;
  try {
    await studioJSON(`/api/studio/library-sources/${encodeURIComponent(sourceId)}`, { method: "DELETE" });
    state.selectedSourceIds.delete(sourceId);
    await loadLibraryRegistry({ quiet: true });
    showToast("Document deleted", `${source.title} and its stored content were removed.`, "✓");
  } catch (error) {
    showToast("Delete unavailable", error.message, "!");
  }
}

async function loadSelectedSourceUnderstanding() {
  const studio = state.artifactStudio;
  const sources = selectedArtifactSources();
  if (!sources.length) return;
  studio.sourceUnderstandingStatus = "loading";
  studio.sourceUnderstandingError = null;
  studio.step = "review";
  renderProductView();
  try {
    const results = await Promise.all(sources.map(async (source) => {
      const id = recordId(source);
      const [outline, blocks] = await Promise.all([
        studioJSON(`/api/studio/sources/${encodeURIComponent(id)}/outline`),
        studioJSON(`/api/studio/sources/${encodeURIComponent(id)}/blocks`),
      ]);
      return { id, outline, blocks };
    }));
    results.forEach(({ id, outline, blocks }) => {
      studio.sourceDocuments[id] = outline.source || outline;
      studio.sourceBlocks[id] = blocks.blocks || [];
    });
    studio.sourceUnderstandingStatus = "ready";
  } catch (error) {
    studio.sourceUnderstandingStatus = "error";
    studio.sourceUnderstandingError = error.message;
  }
  renderProductView();
}

function renderArtifactHome() {
  const studio = state.artifactStudio;
  const draftCount = studio.project && studio.project.status !== "published" ? 1 : 0;
  if (state.role === "learner") return `<div class="product-page artifact-home learner-home">
    <section class="home-heading"><div><span class="page-kicker">Learner workspace</span><h2>Learn, practice, and improve.</h2><p>Continue assigned learning, choose a published scenario, and use your results to focus the next attempt.</p></div><div class="artifact-connection"><span></span><div><strong>Practice workspace ready</strong><small>${state.assignments.length} assignments · ${state.attemptHistory?.length || 0} completed attempts</small></div></div></section>
    <section class="artifact-hero"><div><span class="page-kicker">Recommended next step</span><h3>Practice the combined initial application.</h3><p>Review the case brief, configure the applicant, complete the eligibility application, and use the scored replay to improve your next attempt.</p><div class="artifact-hero-actions"><button class="button button-primary" data-view-link="scenario-library">Choose a scenario</button><button class="button button-secondary" data-view-link="assignments">View assignments</button></div></div><ol>${["Choose a scenario", "Review the case brief", "Complete the application", "Submit the attempt", "Review feedback"].map((item, index) => `<li><span>${index + 1}</span>${item}</li>`).join("")}</ol></section>
    <div class="section-bar"><div><h3>Your learning</h3><span>One clear path from preparation to feedback</span></div></div>
    <section class="recent-grid">
      <button class="recent-card featured" data-view-link="lighthouse"><span class="card-icon">${materialIcon("school")}</span><div><strong>Lighthouse</strong><small>Guided modules and learning paths</small></div><span class="status-chip">Open</span></button>
      <button class="recent-card" data-view-link="assignments"><span class="card-icon">${materialIcon("assignment")}</span><div><strong>Assignments</strong><small>${state.assignments.length} practice activities</small></div><span class="status-chip neutral">Continue</span></button>
      <button class="recent-card" data-view-link="attempts"><span class="card-icon">${materialIcon("analytics")}</span><div><strong>Attempts &amp; Results</strong><small>Scores, replay, and targeted practice</small></div><span class="status-chip neutral">Review</span></button>
    </section>
  </div>`;
  return `<div class="product-page artifact-home">
    <section class="home-heading"><div><span class="page-kicker">Author workspace</span><h2>Turn trusted knowledge into finished learning.</h2><p>Review source content, approve the key points that matter, then create a document, presentation, video, or quiz without leaving the Studio.</p></div><div class="artifact-connection"><span></span><div><strong>${notebookStatusLabel()}</strong><small>${state.openNotebook.sources.length} sources · ${state.openNotebook.notes.length} notes</small></div></div></section>
    <section class="artifact-hero"><div><span class="page-kicker">One grounded flow</span><h3>Source understanding comes before generation.</h3><p>Select evidence in the Library, work with focused policy blocks, approve the content brief, and manage the resulting projects in Notebook.</p><div class="artifact-hero-actions"><button class="button button-primary" data-action="open-library">Browse Library</button><button class="button button-secondary" data-action="open-notebook-workspace">Open Notebook</button></div></div><ol>${["Select sources", "Review policy blocks", "Approve key points", "Choose a template", "Preview & publish"].map((item, index) => `<li><span>${index + 1}</span>${item}</li>`).join("")}</ol></section>
    <div class="section-bar"><div><h3>Continue working</h3><span>${draftCount} active content project${draftCount === 1 ? "" : "s"}</span></div><button class="view-button" data-action="open-create-tab">Create content</button></div>
    <section class="recent-grid">
      <button class="recent-card featured" data-action="open-notebook-workspace"><span class="card-icon">${materialIcon("menu_book")}</span><div><strong>${escapeHTML(state.openNotebook.notebook?.name || "BlueOrigin Product Baseline")}</strong><small>Notebook · content briefs, projects, and releases</small></div><span class="status-chip">Open</span></button>
      <button class="recent-card" data-action="open-library"><span class="card-icon">${materialIcon("local_library")}</span><div><strong>Eligibility document library</strong><small>${libraryRecords().length} server registry records</small></div><span class="status-chip neutral">Browse</span></button>
      <button class="recent-card" data-view-link="simulation-builder"><span class="card-icon">${materialIcon("smart_toy")}</span><div><strong>Combined initial application</strong><small>Simulation · separate frozen-package workflow</small></div><span class="status-chip neutral">Continue</span></button>
    </section>
  </div>`;
}

function notebookRecords() {
  return state.artifactStudio.notebooks;
}

function activeNotebookRecord() {
  return notebookRecords().find((notebook) => notebook.id === state.artifactStudio.activeNotebookId) || null;
}

function notebookMessages(notebook) {
  if (!notebook) return [];
  notebook.chat_messages ||= [];
  return notebook.chat_messages;
}

let notebookAutosaveTimer = null;
let notebookAutosavePending = {};
let notebookAutosaveNotebookId = null;

async function loadNotebookRecords({ quiet = false } = {}) {
  const studio = state.artifactStudio;
  if (!quiet) { studio.notebooksStatus = "loading"; studio.notebooksError = null; renderProductView(); }
  try {
    const payload = await studioJSON("/api/studio/notebooks?page_size=100");
    studio.notebooks = payload.items || [];
    studio.notebooksStatus = "ready";
    studio.notebooksError = null;
  } catch (error) {
    studio.notebooksStatus = "error";
    studio.notebooksError = error.message;
  }
  if (state.route === "notebook" && studio.notebookMode === "landing") renderProductView();
}

function useSelectedLibrarySourcesInNotebook() {
  const studio = state.artifactStudio;
  if (!state.selectedSourceIds.size) return;
  const targetNotebook = notebookRecords().find((item) => item.id === studio.libraryTargetNotebookId) || null;
  if (targetNotebook) {
    studio.libraryTargetNotebookId = null;
    setProductView("notebook");
    return openNotebookWorkspace(targetNotebook.id);
  }
  const selectedSourceIds = [...state.selectedSourceIds];
  studio.notebookMode = "landing";
  setProductView("notebook");
  openNotebookCreateDialog(selectedSourceIds);
}

function notebookSourceLinkPayload(source) {
  const id = recordId(source);
  if (source?.source_kind === "registry") return { source_id: id };
  const doc = artifactSourceDocument(source || {});
  const metadata = source?.metadata || source?.asset || {};
  return {
    source_id: id,
    source_title: doc.title,
    source_type: doc.source_type,
    extraction_status: String(doc.extraction_status || "not reviewed").toLowerCase().replaceAll(" ", "_"),
    permission_status: metadata.permission_status || "unknown",
    source_access_scope: metadata.access_scope || "private",
    source_team_id: metadata.team_id || null,
  };
}

function openNotebookCreateDialog(initialSourceIds = []) {
  const studio = state.artifactStudio;
  studio.notebookCreateError = null;
  studio.notebookCreateDialog = { prompt: "", sourceIds: [...new Set(initialSourceIds)] };
  renderProductView();
}

function inferNotebookSetup(prompt) {
  const cleaned = String(prompt || "").trim().replace(/\s+/g, " ");
  const programs = [
    [/\bsnap\b|food assistance|nutrition assistance/i, "SNAP"],
    [/\bmedicaid\b|medical assistance|chip|michild/i, "Medicaid"],
    [/\btanf\b|cash assistance|family independence/i, "TANF"],
  ].filter(([pattern]) => pattern.test(cleaned)).map(([, program]) => program);
  const audienceMatch = cleaned.match(/(?:for|used by|train)\s+([^,.]+?)(?:\s+(?:on|about|to|using|so that)\b|[,.]|$)/i);
  const audience = audienceMatch?.[1]?.trim() || "Eligibility operations staff";
  const topic = cleaned
    .replace(/^(create|build|draft|make|prepare|help me create)\s+(a|an|the)?\s*/i, "")
    .replace(/\s+(for|used by|that helps|so that)\s+.*$/i, "")
    .trim();
  const shortTopic = (topic || "Operational knowledge").split(/\s+/).slice(0, 7).join(" ");
  const title = shortTopic.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 160);
  return {
    title,
    purpose: cleaned,
    audience,
    programs: programs.length ? programs : ["Integrated eligibility"],
    instructions: "Create a grounded job aid, presentation, and knowledge check. Create video only from an approved presentation version.",
    access_scope: "private",
  };
}

function renderNotebookCreateDialog() {
  const dialog = state.artifactStudio.notebookCreateDialog;
  if (!dialog) return "";
  const creating = state.artifactStudio.notebookCreateStatus === "creating";
  return `<div class="notebook-dialog-backdrop"><section class="notebook-create-dialog notebook-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="notebookCreateHeading" data-notebook-dialog><header><div><span>New notebook</span><h2 id="notebookCreateHeading">What are you creating today?</h2></div><button type="button" data-action="close-notebook-create" aria-label="Close create notebook dialog">${materialIcon("close")}</button></header><form id="notebookCreateForm"><div class="notebook-prompt-body"><label for="notebookCreatePrompt">Describe the outcome in your own words</label><textarea id="notebookCreatePrompt" autofocus required minlength="8" placeholder="Example: Create SNAP reporting training for eligibility workers using the latest policy sources.">${escapeHTML(dialog.prompt)}</textarea><div class="notebook-prompt-hint">${materialIcon("auto_awesome")} We’ll infer the title, audience, purpose, and source plan. You can edit them in the notebook.</div><section><strong>Your notebook will prepare</strong><div><span>${materialIcon("description")} Job aid</span><span>${materialIcon("slideshow")} Presentation</span><span>${materialIcon("quiz")} Knowledge check</span><span class="dependent">${materialIcon("movie")} Video after presentation approval</span></div></section>${state.artifactStudio.notebookCreateError ? `<div class="notebook-dialog-error" role="alert">${materialIcon("error")}<strong>${escapeHTML(state.artifactStudio.notebookCreateError)}</strong></div>` : ""}</div><footer><span>${dialog.sourceIds.length ? `${dialog.sourceIds.length} selected Library source${dialog.sourceIds.length === 1 ? "" : "s"} will be attached.` : "Start with the outcome; add or change sources next."}</span><div><button type="button" class="button button-secondary" data-action="close-notebook-create">Cancel</button><button class="button button-primary" ${creating ? "disabled" : ""}>${creating ? "Creating…" : "Create notebook"}</button></div></footer></form></section></div>`;
}

async function createNotebookWorkspace(initialSourceIds = [], prompt = "") {
  const studio = state.artifactStudio;
  if (studio.notebookCreateStatus === "creating") return;
  const selectedSourceIds = [...new Set(initialSourceIds)];
  const setup = inferNotebookSetup(prompt);
  studio.notebookCreateStatus = "creating";
  studio.notebookCreateError = null;
  renderProductView();
  try {
    let notebook = await studioJSON("/api/studio/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setup),
    });
    const sourceErrors = [];
    for (const sourceId of selectedSourceIds) {
      const source = libraryRecords().find((item) => recordId(item) === sourceId);
      if (!source) continue;
      try {
        notebook = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notebookSourceLinkPayload(source)),
        });
      } catch (error) { sourceErrors.push(sourceTitle(source)); }
    }
    studio.notebooks.unshift(notebook);
    studio.activeNotebookId = notebook.id;
    studio.activeProjectNotebookId = notebook.id;
    studio.projects = {};
    studio.approvedPresentation = null;
    studio.notebookMode = "workspace";
    studio.notebookCreateStatus = "idle";
    studio.notebookCreateDialog = null;
    state.selectedSourceIds = new Set(notebook.source_ids || []);
    syncArtifactBriefFromNotebook(notebook);
    renderProductView();
    queueMicrotask(() => {
      const title = document.querySelector("[data-notebook-title]");
      title?.focus();
    });
    if (sourceErrors.length) showToast("Notebook created", `${sourceErrors.length} selected source${sourceErrors.length === 1 ? " was" : "s were"} not attached. Add them again from the source panel.`, "!");
    else showToast("Notebook created", "Your outcome, audience, and three initial draft types are ready to review.");
    if (notebook.source_ids?.length) analyzeNotebookContent("replace");
  } catch (error) {
    studio.notebookCreateStatus = "idle";
    studio.notebookCreateError = error.message;
    renderProductView();
    showToast("Notebook creation failed", error.message, "!");
  }
}

async function openNotebookWorkspace(id) {
  if (state.artifactStudio.activeProjectNotebookId !== id) {
    state.artifactStudio.projects = {};
    state.artifactStudio.approvedPresentation = null;
    state.artifactStudio.activeProjectNotebookId = id;
  }
  state.artifactStudio.activeNotebookId = id;
  state.artifactStudio.notebookMode = "workspace";
  state.artifactStudio.notebookQuestionError = null;
  renderProductView();
  dom.screenContent.scrollTop = 0;
  try {
    const notebook = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(id)}`);
    const index = state.artifactStudio.notebooks.findIndex((item) => item.id === id);
    if (index >= 0) state.artifactStudio.notebooks[index] = notebook; else state.artifactStudio.notebooks.unshift(notebook);
    state.selectedSourceIds = new Set(notebook.source_ids || []);
    syncArtifactBriefFromNotebook(notebook);
    renderProductView();
    dom.screenContent.scrollTop = 0;
    if (notebook.source_ids?.length && ["idle", "stale"].includes(notebook.source_summary?.status || "idle")) analyzeNotebookContent("replace");
  } catch (error) {
    state.artifactStudio.notebookMode = "landing";
    state.artifactStudio.notebooksError = error.message;
    renderProductView();
  }
}

function syncArtifactBriefFromNotebook(notebook) {
  const persisted = notebook?.content_brief || {};
  state.artifactStudio.brief = {
    id: persisted.id || `brief:${notebook?.id || "notebook"}`,
    version: Number(persisted.version || 0),
    status: persisted.status === "approved" ? "approved" : persisted.status === "stale" ? "stale" : "draft",
    points: (persisted.points || []).map((point, order) => ({ ...point, order, ai_edit_history: point.ai_edit_history || [] })),
    approvedSnapshot: persisted.approved_snapshot || null,
    staleReason: persisted.status === "stale" ? "The selected source set changed." : null,
  };
}

async function analyzeNotebookContent(mode = "replace") {
  const studio = state.artifactStudio;
  const notebook = activeNotebookRecord();
  if (!notebook?.source_ids?.length || studio.notebookAnalysisStatus === "loading") return;
  studio.notebookAnalysisStatus = "loading";
  notebook.source_summary = { ...(notebook.source_summary || {}), status: "analyzing", error: null };
  renderProductView();
  try {
    const updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: mode === "expand" ? "expand" : "replace" }),
    });
    Object.assign(notebook, updated);
    syncArtifactBriefFromNotebook(notebook);
    showToast(mode === "expand" ? "More key points ready" : "Source summary ready", `${notebook.content_brief?.points?.length || 0} cited key points are available for review.`);
  } catch (error) {
    notebook.source_summary = { ...(notebook.source_summary || {}), status: "error", error: error.message };
    showToast("Source analysis unavailable", error.message, "!");
  }
  studio.notebookAnalysisStatus = "idle";
  renderProductView();
}

async function saveNotebookContent(action, payload = {}) {
  const studio = state.artifactStudio;
  const notebook = activeNotebookRecord();
  if (!notebook || studio.notebookContentStatus === "saving") return null;
  studio.notebookContentStatus = "saving";
  try {
    const updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/content`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    Object.assign(notebook, updated);
    syncArtifactBriefFromNotebook(notebook);
    studio.notebookContentStatus = "idle";
    renderProductView();
    return notebook;
  } catch (error) {
    studio.notebookContentStatus = "idle";
    showToast("Notebook content was not saved", error.message, "!");
    renderProductView();
    return null;
  }
}

function saveNotebookRecord(notebook, changes) {
  if (!notebook) return;
  Object.assign(notebook, changes, { updated_at: new Date().toISOString() });
  if (notebookAutosaveNotebookId !== notebook.id) {
    notebookAutosavePending = {};
    notebookAutosaveNotebookId = notebook.id;
  }
  Object.assign(notebookAutosavePending, changes);
  state.artifactStudio.notebookAutosaveState = "saving";
  document.querySelector("[data-notebook-save-state]")?.replaceChildren(document.createTextNode("Saving…"));
  window.clearTimeout(notebookAutosaveTimer);
  notebookAutosaveTimer = window.setTimeout(async () => {
    const pendingChanges = { ...notebookAutosavePending };
    notebookAutosavePending = {};
    try {
      const updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pendingChanges) });
      Object.assign(notebook, updated);
      state.artifactStudio.notebookAutosaveState = "saved";
      document.querySelector("[data-notebook-save-state]")?.replaceChildren(document.createTextNode("Saved to workspace"));
    } catch (error) {
      Object.assign(notebookAutosavePending, pendingChanges);
      state.artifactStudio.notebookAutosaveState = "error";
      document.querySelector("[data-notebook-save-state]")?.replaceChildren(document.createTextNode("Save failed"));
      showToast("Autosave failed", error.message, "!");
    }
  }, 550);
}

function openNotebookPublish() {
  const notebook = activeNotebookRecord();
  if (!notebook) return;
  const reviewDate = new Date(); reviewDate.setFullYear(reviewDate.getFullYear() + 1);
  state.artifactStudio.notebookPublish = { status: "idle", error: null, issues: [], review_due_at: reviewDate.toISOString().slice(0, 10) };
  renderProductView();
}

async function publishNotebookWorkspace() {
  const notebook = activeNotebookRecord();
  const publish = state.artifactStudio.notebookPublish;
  if (!notebook || !publish) return;
  publish.status = "publishing"; publish.error = null; publish.issues = [];
  renderProductView();
  try {
    const updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review_due_at: publish.review_due_at }) });
    Object.assign(notebook, updated);
    state.artifactStudio.notebookPublish = null;
    state.artifactStudio.notebookMode = "landing";
    await loadNotebookRecords({ quiet: true });
    renderProductView();
    showToast("Notebook published", `${notebook.title} version ${notebook.published_version} is now available.`);
  } catch (error) {
    publish.status = "error";
    publish.error = error.message;
    publish.issues = error.details?.issues || [];
    renderProductView();
  }
}

function notebookDate(value) {
  if (!value) return "Not yet published";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function notebookReviewLabel(notebook) {
  if (notebook.review_state === "expired") return ["Expired", "danger"];
  if (notebook.review_state === "review_due") return ["Review due", "warning"];
  if (notebook.review_state === "current") return ["Current", "current"];
  return ["Not scheduled", "neutral"];
}

function renderNotebookCard(notebook, kind = "published") {
  const sourceCount = Number(notebook.source_count || 0);
  const artifactCount = Number(notebook.artifact_count || 0);
  const [review, reviewClass] = notebookReviewLabel(notebook);
  const access = notebook.access_scope === "organization" ? "Organization" : notebook.access_scope === "team" ? notebook.team_id || "Team" : "Private";
  return `<article class="notebook-enterprise-card ${kind}">
    <header><span class="notebook-card-symbol">${materialIcon(kind === "published" ? "auto_stories" : kind === "in_review" ? "rate_review" : "edit_note")}</span><button class="notebook-favorite ${notebook.favorite ? "active" : ""}" data-notebook-favorite="${escapeHTML(notebook.id)}" aria-label="${notebook.favorite ? "Remove from" : "Add to"} favorites" aria-pressed="${Boolean(notebook.favorite)}">${materialIcon(notebook.favorite ? "star" : "star_outline")}</button></header>
    <div class="notebook-card-status"><span>${kind === "published" ? `Published · v${notebook.published_version}` : kind === "in_review" ? "In review" : notebook.published_version ? "Draft changes" : "Draft"}</span>${kind === "published" ? `<span class="notebook-review-chip ${reviewClass}">${review}</span>` : ""}</div>
    <h3>${escapeHTML(notebook.title)}</h3><p>${escapeHTML(notebook.purpose || notebook.objective)}</p>
    <div class="notebook-program-tags">${(notebook.programs || []).map((program) => `<span>${escapeHTML(program)}</span>`).join("") || `<span>General operations</span>`}</div>
    <dl><div><dt>Owner</dt><dd>${escapeHTML(notebook.owner?.name || "Unassigned")}</dd></div><div><dt>Access</dt><dd>${escapeHTML(access)}</dd></div><div><dt>Sources</dt><dd>${sourceCount}</dd></div><div><dt>Artifacts</dt><dd>${artifactCount}</dd></div></dl>
    <footer><span>${kind === "published" ? `Published ${notebookDate(notebook.published_at)}` : `Updated ${notebookDate(notebook.updated_at)}`}</span><button data-open-notebook-id="${escapeHTML(notebook.id)}">${kind === "published" ? "Open" : "Continue"} ${materialIcon("arrow_forward")}</button></footer>
  </article>`;
}

function renderNotebookSkeletons() {
  return `<div class="notebook-record-grid notebook-skeleton-grid">${Array.from({ length: 3 }, () => `<article><span></span><i></i><i></i><i></i></article>`).join("")}</div>`;
}

function renderNotebookCollection(title, description, kind, records) {
  const studio = state.artifactStudio;
  const creating = studio.notebookCreateStatus === "creating";
  const pageSize = 6;
  const page = studio.notebookPages[kind] || 1;
  const pages = Math.max(1, Math.ceil(records.length / pageSize));
  const visible = records.slice((page - 1) * pageSize, page * pageSize);
  return `<section class="notebook-collection enterprise ${kind}" aria-labelledby="notebook-${kind}-heading"><header><div><h2 id="notebook-${kind}-heading">${title}</h2><p>${description}</p></div><span>${records.length}</span></header>${visible.length ? `<div class="notebook-record-grid ${studio.notebookView === "list" ? "list-view" : ""}">${visible.map((item) => renderNotebookCard(item, kind)).join("")}</div>${pages > 1 ? `<nav class="notebook-pagination" aria-label="${title} pages"><button data-notebook-page="${kind}" data-page-value="${page - 1}" ${page <= 1 ? "disabled" : ""}>Previous</button><span>Page ${page} of ${pages}</span><button data-notebook-page="${kind}" data-page-value="${page + 1}" ${page >= pages ? "disabled" : ""}>Next</button></nav>` : ""}` : `<div class="notebook-section-empty"><span>${materialIcon(kind === "published" ? "verified" : kind === "in_review" ? "rate_review" : "edit_note")}</span><div><strong>No ${title.toLowerCase()}.</strong><p>${kind === "published" ? "Published notebooks will appear here after an author completes the readiness checks." : kind === "in_review" ? "Move a draft into review when its sources and purpose are ready for a final check." : "Create a notebook to begin a grounded authoring workspace."}</p></div>${kind === "draft" ? `<button class="button button-secondary" data-action="create-notebook-workspace" ${creating ? "disabled" : ""}>${creating ? "Creating…" : "Create notebook"}</button>` : ""}</div>`}</section>`;
}

function renderNotebookPublishDialog(notebook) {
  const publish = state.artifactStudio.notebookPublish;
  if (!publish) return "";
  return `<div class="notebook-dialog-backdrop"><section class="notebook-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="notebookPublishHeading" data-notebook-dialog><header><div><span>Immutable release</span><h2 id="notebookPublishHeading">Publish ${escapeHTML(notebook.title)}</h2></div><button data-action="close-notebook-publish" aria-label="Close publish dialog">${materialIcon("close")}</button></header><div class="notebook-publish-summary"><p>Publishing creates version ${Number(notebook.published_version || 0) + 1}. Future edits will create draft changes without altering this release.</p><dl><div><dt>Owner</dt><dd>${escapeHTML(notebook.owner?.name || "Current author")}</dd></div><div><dt>Access</dt><dd>${escapeHTML(notebook.access_scope)}</dd></div><div><dt>Sources</dt><dd>${Number(notebook.source_count || notebook.source_ids?.length || 0)}</dd></div></dl><label>Required review date<input type="date" data-notebook-review-date value="${escapeHTML(publish.review_due_at)}" required /></label>${publish.error ? `<div class="notebook-dialog-error" role="alert">${materialIcon("error")}<div><strong>${escapeHTML(publish.error)}</strong>${publish.issues.length ? `<ul>${publish.issues.map((issue) => `<li>${escapeHTML(issue)}</li>`).join("")}</ul>` : ""}</div></div>` : ""}</div><footer><span>Source access is checked before publication.</span><div><button class="button button-secondary" data-action="close-notebook-publish">Cancel</button><button class="button button-primary" data-action="confirm-notebook-publish" ${publish.status === "publishing" ? "disabled" : ""}>${publish.status === "publishing" ? "Publishing…" : "Publish version"}</button></div></footer></section></div>`;
}

function renderNotebookLanding() {
  const studio = state.artifactStudio;
  let records = notebookRecords();
  const query = studio.notebookQuery.trim().toLowerCase();
  if (query) records = records.filter((notebook) => [notebook.title, notebook.purpose, notebook.audience, notebook.owner?.name, ...(notebook.programs || [])].join(" ").toLowerCase().includes(query));
  if (studio.notebookAccessFilter !== "all") records = records.filter((notebook) => notebook.access_scope === studio.notebookAccessFilter);
  if (studio.notebookProgramFilter !== "all") records = records.filter((notebook) => (notebook.programs || []).includes(studio.notebookProgramFilter));
  records = [...records].sort(studio.notebookSort === "title" ? (a,b) => a.title.localeCompare(b.title) : studio.notebookSort === "published" ? (a,b) => new Date(b.published_at || 0) - new Date(a.published_at || 0) : (a,b) => Number(b.favorite) - Number(a.favorite) || new Date(b.last_opened_at || b.updated_at) - new Date(a.last_opened_at || a.updated_at));
  const published = records.filter((notebook) => Number(notebook.published_version) > 0).map((notebook) => ({
    ...notebook,
    ...(notebook.published_release || {}),
    id: notebook.id,
    favorite: notebook.favorite,
    published_version: notebook.published_version,
  }));
  const review = records.filter((notebook) => notebook.status === "in_review");
  const drafts = records.filter((notebook) => notebook.status === "draft");
  return `<div class="product-page notebook-landing-page">
    <header class="notebook-enterprise-header"><div><span class="page-kicker">Knowledge workspace</span><h1>Notebooks</h1><p>Published operational knowledge and active source-grounded authoring work.</p></div><button class="button button-primary notebook-create-button" data-action="create-notebook-workspace" ${studio.notebookCreateStatus === "creating" ? "disabled" : ""}>${materialIcon(studio.notebookCreateStatus === "creating" ? "progress_activity" : "add")} ${studio.notebookCreateStatus === "creating" ? "Creating…" : "Create notebook"}</button></header>
    ${studio.notebookCreateError ? `<section class="notebook-load-error notebook-create-error" role="alert">${materialIcon("error")}<div><strong>Notebook creation failed</strong><p>${escapeHTML(studio.notebookCreateError)}</p></div><button class="button button-secondary" data-action="create-notebook-workspace">Retry</button></section>` : ""}
    <section class="notebook-command-bar"><label class="notebook-global-search">${materialIcon("search")}<input id="notebookGlobalSearch" value="${escapeHTML(studio.notebookQuery)}" placeholder="Search notebooks, programs, owners, or purpose" aria-label="Search notebooks" /></label><button class="notebook-mobile-filter" data-notebook-mobile-filter aria-expanded="${studio.notebookFiltersOpen}">${materialIcon("filter_list")} Filters</button><div class="notebook-filters ${studio.notebookFiltersOpen ? "open" : ""}"><select data-notebook-filter="program" aria-label="Filter by program"><option value="all">All programs</option>${["Medicaid", "SNAP", "TANF", "Integrated eligibility"].map((value) => `<option value="${value}" ${studio.notebookProgramFilter === value ? "selected" : ""}>${value}</option>`).join("")}</select><select data-notebook-filter="access" aria-label="Filter by access"><option value="all">All access</option><option value="organization" ${studio.notebookAccessFilter === "organization" ? "selected" : ""}>Organization</option><option value="team" ${studio.notebookAccessFilter === "team" ? "selected" : ""}>Team</option><option value="private" ${studio.notebookAccessFilter === "private" ? "selected" : ""}>Private</option></select><select data-notebook-sort aria-label="Sort notebooks"><option value="recent" ${studio.notebookSort === "recent" ? "selected" : ""}>Recently active</option><option value="published" ${studio.notebookSort === "published" ? "selected" : ""}>Recently published</option><option value="title" ${studio.notebookSort === "title" ? "selected" : ""}>Title A–Z</option></select><div class="notebook-view-toggle" role="group" aria-label="Notebook view"><button data-notebook-view="grid" class="${studio.notebookView === "grid" ? "active" : ""}" aria-pressed="${studio.notebookView === "grid"}">${materialIcon("grid_view")}</button><button data-notebook-view="list" class="${studio.notebookView === "list" ? "active" : ""}" aria-pressed="${studio.notebookView === "list"}">${materialIcon("view_list")}</button></div></div></section>
    ${studio.notebooksStatus === "loading" || studio.notebooksStatus === "idle" ? `<section class="notebook-loading"><header><h2>Published notebooks</h2><span>Loading workspace…</span></header>${renderNotebookSkeletons()}</section>` : studio.notebooksStatus === "error" ? `<section class="notebook-load-error" role="alert">${materialIcon("cloud_off")}<div><strong>Notebook workspace unavailable</strong><p>${escapeHTML(studio.notebooksError || "The notebook service could not be reached.")}</p></div><button class="button button-secondary" data-action="retry-notebook-load">Retry</button></section>` : `${renderNotebookCollection("Published notebooks", "Current, reusable knowledge released by notebook authors.", "published", published)}${renderNotebookCollection("In review", "Work undergoing an author-led readiness and source check.", "in_review", review)}${renderNotebookCollection("Drafts", "Private working copies and changes to previously published notebooks.", "draft", drafts)}`}
    ${renderNotebookCreateDialog()}
  </div>`;
}

function renderNotebookCitations(citations = []) {
  return citations.length ? `<div class="notebook-grounded-citations">${citations.map((citation) => `<button type="button" data-notebook-citation-block="${escapeHTML(citation.block_id)}" data-notebook-citation-source="${escapeHTML(citation.source_id)}">${materialIcon("link")} ${escapeHTML(citation.label)}</button>`).join("")}</div>` : "";
}

function renderNotebookChat(notebook) {
  const messages = notebookMessages(notebook);
  if (!messages.length) return `<div class="notebook-chat-welcome compact"><span>${materialIcon("forum")}</span><small>Grounded conversation</small><h3>Chat with your selected documents</h3><p>Ask a question or request additional key points. Answers stay inside the selected sources and retain exact citations.</p></div>`;
  return `<div class="notebook-message-list">${messages.map((message) => `<article class="notebook-message ${message.role}"><span>${message.role === "author" ? "You" : "BlueOrigin AI"}</span><p>${escapeHTML(message.text)}</p>${renderNotebookCitations(message.citations || [])}${message.interpretation ? `<small>Interpretation: ${escapeHTML(message.interpretation)}</small>` : ""}${message.role === "assistant" ? `<footer><button type="button" data-copy-notebook-message="${escapeHTML(message.id)}">${materialIcon("content_copy")} Copy</button>${message.supported ? `<button type="button" data-add-message-point="${escapeHTML(message.id)}">${materialIcon("add")} Add to key points</button>` : ""}</footer>` : ""}</article>`).join("")}</div>`;
}

function renderNotebookPoint(point, index, total) {
  return `<article class="notebook-key-point ${point.review_status === "needs_review" ? "needs-review" : ""}" data-notebook-point="${escapeHTML(point.point_id)}"><header><span>${index + 1}</span><div><strong>${escapeHTML(point.priority || "supporting")}</strong><small>${escapeHTML((point.provenance || "author_input").replaceAll("_", " "))}</small></div><div><button type="button" data-move-notebook-point="${escapeHTML(point.point_id)}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move key point up">${materialIcon("arrow_upward")}</button><button type="button" data-move-notebook-point="${escapeHTML(point.point_id)}" data-direction="1" ${index === total - 1 ? "disabled" : ""} aria-label="Move key point down">${materialIcon("arrow_downward")}</button><button type="button" data-copy-notebook-point="${escapeHTML(point.point_id)}" aria-label="Copy key point">${materialIcon("content_copy")}</button><button type="button" data-remove-notebook-point="${escapeHTML(point.point_id)}" aria-label="Remove key point">${materialIcon("delete")}</button></div></header><textarea data-notebook-point-text="${escapeHTML(point.point_id)}" aria-label="Key point ${index + 1}">${escapeHTML(point.statement)}</textarea>${point.review_status === "needs_review" ? `<p class="notebook-point-warning">${materialIcon("warning")} This point cites a removed source and needs review.</p>` : ""}${renderNotebookCitations(point.citations || [])}</article>`;
}

function renderNotebookCitationDrawer() {
  const citation = state.artifactStudio.notebookCitation;
  if (!citation) return "";
  return `<aside class="notebook-citation-drawer" role="dialog" aria-modal="true" aria-labelledby="notebookCitationHeading"><header><div><span>Exact source context</span><h3 id="notebookCitationHeading">${escapeHTML(citation.title || "Source citation")}</h3></div><button type="button" data-action="close-notebook-citation" aria-label="Close citation">${materialIcon("close")}</button></header>${citation.status === "loading" ? `<div class="notebook-citation-loading">${materialIcon("progress_activity")} Loading the cited source block…</div>` : citation.error ? `<div class="notebook-citation-error" role="alert"><strong>Citation unavailable</strong><p>${escapeHTML(citation.error)}</p></div>` : `<div class="notebook-citation-body"><small>${escapeHTML(citation.source_title || "")} · ${escapeHTML(citation.location || "")}</small><pre>${escapeHTML(citation.exact_text || "")}</pre></div>`}</aside>`;
}

function renderNotebookStudioWorkspace() {
  const notebook = activeNotebookRecord();
  if (!notebook) return renderNotebookLanding();
  const selectedIds = new Set(notebook.source_ids || []);
  const availableSources = libraryRecords();
  const selectedSources = availableSources.filter((source) => selectedIds.has(recordId(source)));
  const summary = notebook.source_summary || { status: "idle", text: "", citations: [] };
  const brief = notebook.content_brief || { status: "draft", version: 0, points: [] };
  const points = brief.points || [];
  const asking = state.artifactStudio.notebookQuestionStatus === "asking";
  const analyzing = summary.status === "analyzing" || state.artifactStudio.notebookAnalysisStatus === "loading";
  const canChat = selectedSources.length && summary.status === "current" && !asking;
  const statusLabel = notebook.status === "published" ? `Published · v${notebook.published_version}` : notebook.status === "in_review" ? "In review" : notebook.published_version ? `Draft changes · published v${notebook.published_version}` : "Draft";
  const projects = state.artifactStudio.projects;
  const presentationVersion = state.artifactStudio.approvedPresentation?.version || null;
  return `<div class="notebook-desk-page grounded">
    <header class="notebook-desk-header"><div class="notebook-desk-title"><button data-action="back-to-notebook-landing" aria-label="Back to notebooks">${materialIcon("arrow_back")}</button><span class="notebook-desk-emblem">${materialIcon("auto_stories")}</span><div><input data-notebook-title value="${escapeHTML(notebook.title)}" aria-label="Notebook title"/><span><i class="${notebook.status}"></i>${escapeHTML(statusLabel)} · <b data-notebook-save-state>${state.artifactStudio.notebookAutosaveState === "saving" ? "Saving…" : state.artifactStudio.notebookAutosaveState === "error" ? "Save failed" : "Saved to workspace"}</b></span></div></div><div class="notebook-desk-actions"><button class="button button-secondary" data-action="open-library">${materialIcon("local_library")} Library</button><button class="button button-secondary" data-action="open-releases">${materialIcon("inventory_2")} Releases</button>${notebook.status === "draft" ? `<button class="button button-secondary" data-action="move-notebook-to-review">${materialIcon("rate_review")} Move to review</button>` : ""}<button class="button button-primary" data-action="publish-notebook-workspace">${materialIcon("publish")} ${notebook.published_version ? "Publish new version" : "Publish notebook"}</button></div></header>
    <section class="notebook-desk-grid">
      <aside class="notebook-desk-panel notebook-sources-panel"><header><div><span>Source desk</span><h3>Sources</h3></div><strong>${selectedSources.length}</strong></header><button class="notebook-add-source" data-action="open-library">${materialIcon("add")} Add from Library</button><label class="notebook-source-search">${materialIcon("search")}<input id="notebookSourceSearch" placeholder="Filter Library sources…" /></label><div class="notebook-source-list">${availableSources.map((source) => { const id = recordId(source); const selected = selectedIds.has(id); return `<label data-notebook-source-row data-title="${escapeHTML(sourceTitle(source).toLowerCase())}" class="${selected ? "selected" : ""}"><input type="checkbox" data-notebook-source="${escapeHTML(id)}" ${selected ? "checked" : ""}/><span>${materialIcon(artifactSourceDocument(source).is_policy ? "policy" : "description")}</span><div><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(source.jurisdiction || "Organization")} · ${escapeHTML(artifactSourceDocument(source).extraction_status)}</small></div></label>`; }).join("") || `<div class="notebook-panel-empty"><span>${materialIcon("docs")}</span><strong>No Library sources available.</strong><p>${escapeHTML(state.artifactStudio.librarySourcesError || "Add an approved document to the Library first.")}</p></div>`}</div><footer><button data-action="start-artifact-flow" ${selectedSources.length ? "" : "disabled"}>${materialIcon("fact_check")} Review extracted content</button></footer></aside>
      <main class="notebook-desk-panel notebook-conversation-panel grounded"><header><div><span>Content workspace</span><h3>Sources, key points, and chat</h3></div><label><span>Purpose</span><input data-notebook-objective value="${escapeHTML(notebook.purpose || notebook.objective || "")}" placeholder="What should this notebook help create?" /></label></header><div class="notebook-grounded-scroll">
        <section class="notebook-summary-card ${summary.status}"><header><div><span>${materialIcon("summarize")}</span><div><small>Source summary</small><strong>${summary.status === "current" ? "Grounded in selected documents" : summary.status === "stale" ? "Sources changed" : summary.status === "error" ? "Summary unavailable" : selectedSources.length ? "Preparing source summary" : "Select sources to begin"}</strong></div></div>${selectedSources.length ? `<button type="button" data-action="retry-notebook-analysis" ${analyzing ? "disabled" : ""}>${analyzing ? "Analyzing…" : summary.status === "current" ? "Refresh" : "Retry"}</button>` : ""}</header>${analyzing ? `<div class="notebook-analysis-loading">${materialIcon("progress_activity")} Reading extracted source content and building cited key points…</div>` : summary.status === "error" ? `<div class="notebook-analysis-error" role="alert">${escapeHTML(summary.error || "The summary could not be generated.")}</div>` : summary.text ? `<p>${escapeHTML(summary.text)}</p>${renderNotebookCitations(summary.citations || [])}` : `<p>Add one or more stored Library documents. Their extracted content will be summarized automatically.</p>`}</section>
        <section class="notebook-key-points"><header><div><small>Content brief</small><h3>Key points</h3><span>${points.length} point${points.length === 1 ? "" : "s"} · ${brief.status === "approved" ? `finalized v${brief.version}` : brief.status === "stale" ? "needs review" : "draft"}</span></div><div><button type="button" data-action="add-notebook-key-point">${materialIcon("add")} Add</button><button type="button" data-action="expand-notebook-key-points" ${!selectedSources.length || analyzing ? "disabled" : ""}>${materialIcon("auto_awesome")} Find more</button></div></header><div class="notebook-key-point-list">${points.map((point, index) => renderNotebookPoint(point, index, points.length)).join("") || `<div class="notebook-key-point-empty">Candidate key points will appear after source analysis.</div>`}</div><footer><button class="button button-primary" type="button" data-action="finalize-notebook-content" ${!points.length || state.artifactStudio.notebookContentStatus === "saving" ? "disabled" : ""}>${brief.status === "approved" ? `Finalize new version` : "Finalize key points"}</button></footer></section>
        <section class="notebook-grounded-chat"><header><div><small>Source chat</small><h3>Ask your documents</h3></div><span>${notebook.chat_messages?.length || 0} messages</span></header><div class="notebook-conversation-body">${renderNotebookChat(notebook)}</div><form class="notebook-chat-composer" id="notebookChatForm"><div><textarea id="notebookChatInput" placeholder="Ask a question or request more key points…" ${canChat ? "" : "disabled"}>${escapeHTML(state.artifactStudio.notebookChatDraft)}</textarea><button aria-label="Ask selected sources" ${canChat ? "" : "disabled"}>${materialIcon(asking ? "progress_activity" : "arrow_upward")}</button></div><footer><span>${selectedSources.length} selected source${selectedSources.length === 1 ? "" : "s"}</span>${state.artifactStudio.notebookQuestionError ? `<strong>${escapeHTML(state.artifactStudio.notebookQuestionError)}</strong>` : `<small>${canChat ? "Answers use only attached source content and include citations." : "Complete source analysis to enable chat."}</small>`}</footer></form></section>
      </div></main>
      <aside class="notebook-desk-panel notebook-output-panel"><header><div><span>Creation studio</span><h3>Your editable drafts</h3></div><span class="brief-readiness ${brief.status}">${brief.status === "approved" ? `Brief v${brief.version}` : "Finalize content"}</span></header><p class="notebook-output-guidance">Finalize the shared content once, then review each draft. Video begins with an approved presentation.</p><div class="notebook-output-grid">${artifactFormatCards.map((format) => { const locked = format.dependent && !presentationVersion; const project = projects[format.id]; const status = locked ? "After presentation approval" : project ? project.status === "approved" ? `Approved v${project.version}` : "Editable draft" : format.dependent ? `From Presentation v${presentationVersion}` : "Ready to create"; return `<button type="button" data-open-notebook-draft="${format.id}" class="${project ? "has-draft" : ""} ${locked ? "locked" : ""}" ${locked ? "disabled" : ""}><span>${materialIcon(locked ? "lock" : format.icon)}</span><div><strong>${escapeHTML(format.title)}</strong><small>${escapeHTML(status)}</small></div>${materialIcon(project ? "edit" : locked ? "link" : "chevron_right")}</button>`; }).join("")}</div><section class="notebook-brief-card"><span>${materialIcon(brief.status === "approved" ? "verified" : "fact_check")}</span><div><strong>${brief.status === "approved" ? `Content finalized · v${brief.version}` : "Finalize the shared content first"}</strong><p>${brief.status === "approved" ? `${points.length} controlled key points can populate all three initial drafts.` : "Sources, summary, and key points stay shared across every deliverable."}</p></div>${brief.status === "approved" && !projects.job_aid ? `<button data-action="create-all-notebook-drafts">Create all 3 drafts</button>` : brief.status === "approved" ? `<button data-open-notebook-draft="presentation">Review presentation</button>` : ""}</section><section class="notebook-output-shelf"><header><div><span>Published outputs</span><strong>${state.artifactStudio.releases.length}</strong></div><button data-action="open-releases">View all</button></header>${state.artifactStudio.releases.slice(0, 3).map((release) => `<article><span>${materialIcon(release.format === "job_aid" ? "description" : release.format === "quiz" ? "quiz" : release.format === "video" ? "movie" : "slideshow")}</span><div><strong>${escapeHTML(release.title)}</strong><small>${escapeHTML(release.format.replaceAll("_", " "))}${release.derived_from?.version ? ` · from Presentation v${release.derived_from.version}` : ""}</small></div></article>`).join("") || `<div class="notebook-output-empty">Approved files will appear here with their source and version history.</div>`}</section></aside>
    </section>${renderNotebookCitationDrawer()}${renderNotebookPublishDialog(notebook)}
  </div>`;
}
function renderNotebookHeader() {
  const studio = state.artifactStudio;
  const briefState = studio.brief.status === "approved" ? "Brief approved" : studio.brief.status === "stale" ? "Brief needs reapproval" : "Brief in progress";
  return `<section class="notebook-workspace-header">
    <div><span class="page-kicker">Primary Notebook</span><h2>${escapeHTML(state.openNotebook.notebook?.name || "BlueOrigin Product Baseline")}</h2><p>Canonical knowledge, approved content briefs, artifact projects, and releases in one workspace.</p></div>
    <div class="notebook-workspace-meta"><span class="connection-dot ${state.openNotebook.live ? "live" : ""}"></span><div><strong>${notebookStatusLabel()}</strong><small>${state.openNotebook.sources.length} sources · ${state.openNotebook.notes.length} notes · ${briefState}</small></div></div>
  </section>
  <nav class="notebook-tabs" aria-label="Notebook sections">${[["overview", "Notebooks"], ["create", "Create"], ["releases", "Releases"]].map(([id, label]) => `<button role="tab" aria-selected="${studio.notebookTab === id}" class="${studio.notebookTab === id ? "active" : ""}" data-notebook-tab="${id}">${label}${id === "releases" && studio.releases.length ? `<span>${studio.releases.length}</span>` : ""}</button>`).join("")}</nav>`;
}

function renderNotebookOverview() {
  const studio = state.artifactStudio;
  return `<section class="notebook-overview-grid">
    <article class="notebook-overview-card lead"><span class="card-icon">${materialIcon("local_library")}</span><small>Eligibility Library</small><strong>${libraryRecords().length} source records</strong><p>Notebook sources and official Texas, Michigan, and Arizona references are classified in the Library.</p><button class="button button-secondary" data-view-link="library">Open Library</button></article>
    <article class="notebook-overview-card"><small>Content brief</small><strong>${studio.brief.status === "approved" ? `Approved · v${studio.brief.version}` : studio.brief.status === "stale" ? "Needs reapproval" : `${studio.brief.points.length} draft points`}</strong><p>${studio.brief.status === "approved" ? "This immutable brief can populate curated templates." : "Review focused blocks and approve the key points before creating an artifact."}</p><button class="row-action" data-action="resume-brief">${studio.brief.points.length ? "Resume brief" : "Start source review"}</button></article>
    <article class="notebook-overview-card"><small>Artifact releases</small><strong>${studio.releases.length} published</strong><p>Document, presentation, video, and quiz versions remain connected to their source lineage.</p><button class="row-action" data-notebook-tab="releases">View releases</button></article>
    <article class="notebook-activity-card"><div class="panel-title"><div><span>Recent activity</span><h3>Notebook timeline</h3></div><strong>Traceable</strong></div>${[
      ["Knowledge synchronized", `${state.openNotebook.sources.length} source records available`, "Today"],
      [studio.brief.points.length ? "Content brief updated" : "Source review ready", studio.brief.points.length ? `${studio.brief.points.length} key points in review` : "Select sources to begin", "Today"],
      ["Simulation package preserved", "Eligibility training remains a separate workflow", "Yesterday"],
    ].map((item) => `<div class="activity-row"><span></span><div><strong>${item[0]}</strong><small>${item[1]}</small></div><time>${item[2]}</time></div>`).join("")}</article>
  </section>`;
}

function libraryDateLabel(value) {
  if (!value || value === "Not provided") return "Not provided";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) || /edition|updated|form/i.test(String(value)) ? String(value) : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderLibraryWorkspace() {
  const studio = state.artifactStudio;
  if (studio.step === "review") return renderSourceUnderstanding();
  if (studio.step === "brief") return renderBriefEditor();
  const allRecords = libraryRecords();
  const records = filteredLibraryRecords();
  const notebookCount = allRecords.filter((record) => record.source_kind === "open_notebook").length;
  const webCount = allRecords.filter((record) => record.source_kind === "registry" && record.url).length;
  const storedWebCount = allRecords.filter((record) => record.source_kind === "registry" && record.url && record.has_document).length;
  const storedCount = allRecords.filter((record) => record.source_kind === "registry" && record.has_document).length;
  const importRemaining = Math.max(0, webCount - storedWebCount);
  const targetNotebook = notebookRecords().find((item) => item.id === studio.libraryTargetNotebookId) || null;
  const notebookActionLabel = targetNotebook ? "Return to Notebook" : "Use in Notebook";
  const typeOptions = eligibilityDocumentTypes.map(([value, label]) => `<option value="${value}">${escapeHTML(label)}</option>`).join("");
  const folderOptions = [
    ["all", "All documents", "folder_open", allRecords.length],
    ["Notebook", "My Notebook", "folder", notebookCount],
    ["Texas", "Texas", "folder", allRecords.filter((record) => record.jurisdiction === "Texas").length],
    ["Michigan", "Michigan", "folder", allRecords.filter((record) => record.jurisdiction === "Michigan").length],
    ["Arizona", "Arizona", "folder", allRecords.filter((record) => record.jurisdiction === "Arizona").length],
  ];
  return `<div class="product-page library-page">
    <section class="library-drive-shell">
      <header class="library-command-bar">
        <div class="library-title-block"><button class="library-mobile-menu" type="button" data-open-library-nav aria-label="Open navigation">${materialIcon("menu")}</button><span class="library-title-icon">${materialIcon("local_library")}</span><div><h2>Library</h2><p>${allRecords.length} trusted documents for eligibility work</p></div></div>
        <label class="library-search">${materialIcon("search")}<input id="librarySearch" value="${escapeHTML(studio.libraryQuery)}" placeholder="Search in Library" aria-label="Search the document library" />${studio.libraryQuery ? `<button type="button" data-clear-library-search aria-label="Clear search">${materialIcon("close")}</button>` : ""}</label>
        <div class="library-command-actions"><button class="library-icon-button" type="button" data-library-help aria-label="Library help">${materialIcon("help")}</button><button class="library-icon-button" type="button" data-library-settings aria-label="Library settings">${materialIcon("settings")}</button><button class="button button-primary" data-library-add="upload">${materialIcon("add")} New document</button></div>
      </header>

      <section class="library-folder-section" aria-labelledby="libraryFoldersHeading">
        <div class="library-section-heading"><div><button class="library-collapse" type="button" aria-label="Collapse folders">${materialIcon("expand_more")}</button><h3 id="libraryFoldersHeading">Folders</h3></div><span>${notebookCount} in Notebook · ${storedCount} documents stored${importRemaining ? ` · ${importRemaining} official import${importRemaining === 1 ? "" : "s"} remaining` : ""}</span></div>
        <div class="library-folder-grid">${folderOptions.map(([value, label, icon, count]) => `<button class="library-folder-card ${studio.libraryJurisdiction === value ? "active" : ""}" type="button" data-library-folder="${value}" aria-pressed="${studio.libraryJurisdiction === value}"><span>${materialIcon(icon)}</span><div><strong>${label}</strong><small>${count} document${count === 1 ? "" : "s"}</small></div>${materialIcon("more_vert")}</button>`).join("")}</div>
      </section>

      <main class="library-main">
        <div class="library-documents-heading"><div><button class="library-collapse" type="button" aria-label="Collapse documents">${materialIcon("expand_more")}</button><div><h3>Documents</h3><span>${records.length} shown · ${state.selectedSourceIds.size} selected</span></div></div><div class="library-view-controls" role="group" aria-label="Document view"><button class="active" type="button" aria-pressed="true" data-library-view="list">${materialIcon("view_list")}</button><button type="button" aria-pressed="false" data-library-view="grid">${materialIcon("grid_view")}</button></div></div>
        <div class="library-toolbar"><select data-library-filter="jurisdiction" aria-label="Filter by jurisdiction"><option value="all">All jurisdictions</option>${["Texas", "Michigan", "Arizona", "Notebook"].map((value) => `<option value="${value}" ${studio.libraryJurisdiction === value ? "selected" : ""}>${value}</option>`).join("")}</select><select data-library-filter="program" aria-label="Filter by program"><option value="all">All programs</option>${["SNAP", "TANF", "Medicaid", "CHIP", "Integrated eligibility"].map((value) => `<option value="${value}" ${studio.libraryProgram === value ? "selected" : ""}>${value}</option>`).join("")}</select><select data-library-filter="type" aria-label="Filter by document type"><option value="all">All document types</option>${eligibilityDocumentTypes.map(([value, label]) => `<option value="${value}" ${studio.libraryType === value ? "selected" : ""}>${escapeHTML(label)}</option>`).join("")}</select><span class="library-toolbar-spacer"></span><button class="library-filter-action" type="button" data-library-import ${studio.libraryImportStatus === "loading" || importRemaining === 0 ? "disabled" : ""}>${materialIcon(studio.libraryImportStatus === "loading" ? "progress_activity" : importRemaining === 0 ? "database" : "cloud_download")}${studio.libraryImportStatus === "loading" ? " Importing…" : importRemaining === 0 ? " Documents stored" : ` Import ${importRemaining} document${importRemaining === 1 ? "" : "s"}`}</button><button class="library-filter-action" type="button" data-library-add="link">${materialIcon("add_link")} Add web source</button><button class="button button-primary library-review-button" data-action="use-selected-in-notebook" ${state.selectedSourceIds.size ? "" : "disabled"}>${escapeHTML(notebookActionLabel)}</button></div>${studio.libraryImportError ? `<div class="library-import-warning">${materialIcon("warning")} ${escapeHTML(studio.libraryImportError)}</div>` : ""}
        <div class="library-table-wrap"><table class="library-table"><thead><tr><th>Name</th><th>Type</th><th>Program</th><th>Jurisdiction</th><th>Updated</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${records.map((record) => {
          const type = currentLibraryType(record);
          const selected = state.selectedSourceIds.has(record.id);
          const searchText = [record.title, record.owner, record.jurisdiction, record.description, record.format, ...record.programs].join(" ").toLowerCase();
          const storedLabel = record.has_document ? `Stored · ${record.byte_size ? `${Math.max(1, Math.round(record.byte_size / 1024))} KB` : "database copy"}` : record.storage_status === "failed" ? "Import failed" : "Link only";
          const documentTarget = record.document_url || null;
          const documentBody = `<span class="library-source-icon ${record.source_kind}">${materialIcon(record.has_document ? "description" : record.url ? "language" : "description")}</span><span class="library-document-copy"><strong>${escapeHTML(record.title)}</strong><span>${escapeHTML(record.owner)}</span><small>${escapeHTML(record.format)} · ${escapeHTML(storedLabel)}</small></span>`;
          return `<tr data-library-row="${escapeHTML(record.id)}" data-library-search="${escapeHTML(searchText)}" ${documentTarget ? `data-library-open-row="${escapeHTML(record.id)}"` : ""}><td><div class="library-document-cell"><input type="checkbox" data-library-select-source="${escapeHTML(record.id)}" aria-label="Use ${escapeHTML(record.title)}" ${selected ? "checked" : ""}/>${documentTarget ? `<a class="library-document-link" href="${escapeHTML(documentTarget)}" data-library-open-document="${escapeHTML(record.id)}" aria-label="Open ${escapeHTML(record.title)} in document viewer">${documentBody}</a>` : `<span class="library-document-link is-disabled">${documentBody}</span>`}</div></td><td><select data-library-type="${escapeHTML(record.id)}" aria-label="Document type for ${escapeHTML(record.title)}">${typeOptions.replace(`value="${type}"`, `value="${type}" selected`)}</select></td><td><div class="library-programs">${record.programs.map((program) => `<span>${escapeHTML(program)}</span>`).join("")}</div></td><td>${escapeHTML(record.jurisdiction)}</td><td>${escapeHTML(libraryDateLabel(record.fetched_at || record.effective_date))}</td><td>${documentTarget ? `<a class="library-status stored library-status-link" href="${escapeHTML(documentTarget)}" data-library-open-document="${escapeHTML(record.id)}">Stored</a>` : `<span class="library-status ${record.source_kind}">${escapeHTML(record.storage_status === "failed" ? "Import failed" : record.extraction_status || record.status)}</span>`}</td><td><div class="library-row-actions">${record.source_kind === "registry" ? `<button type="button" data-library-archive="${escapeHTML(record.id)}" aria-label="Archive ${escapeHTML(record.title)}" title="Archive">${materialIcon("archive")}</button><button class="danger" type="button" data-library-delete="${escapeHTML(record.id)}" aria-label="Delete ${escapeHTML(record.title)}" title="Delete">${materialIcon("delete")}</button>` : ""}</div></td></tr>`;
        }).join("") || `<tr><td colspan="7"><div class="empty-state"><strong>No documents match these filters.</strong><p>Change a filter or add a document to the Library.</p></div></td></tr>`}</tbody></table></div>
        <footer class="library-table-footer"><span>${records.length} of ${allRecords.length} documents</span><span>${new Set(allRecords.map(currentLibraryType)).size} document types</span></footer>
      </main>
    </section>
  </div>`;
}

function renderKnowledgeTab() {
  const sources = state.openNotebook.sources;
  const visibleSources = sources.filter(artifactSourceMatchesFilters);
  const filterOptions = [["all", "All sources"], ["policy", "Policy"], ["product", "Product"], ["screen", "Screen evidence"], ["transcript", "Transcripts"]];
  return `<section class="knowledge-workspace">
    <div class="knowledge-toolbar"><div><span class="page-kicker">Knowledge</span><h3>Select the evidence for this artifact.</h3><p>You will inspect the extracted content before any AI drafting begins.</p></div><div><label class="search-control">${materialIcon("search")}<input id="artifactSourceSearch" value="${escapeHTML(state.artifactStudio.sourceQuery)}" placeholder="Search sources…" /></label><button class="button button-primary" data-action="review-selected-sources" ${state.selectedSourceIds.size ? "" : "disabled"}>Review ${state.selectedSourceIds.size || ""} selected</button></div></div>
    <div class="knowledge-filter-row">${filterOptions.map(([id, label]) => `<button class="${state.artifactStudio.sourceFilter === id ? "active" : ""}" data-source-filter="${id}">${label}${id === "all" ? ` <span>${sources.length}</span>` : ""}</button>`).join("")}<label class="source-status-filter"><span>Status</span><select id="artifactSourceStatus"><option value="all">All statuses</option>${[["completed", "Complete"], ["partial", "Partial"], ["failed", "Failed"], ["needs_review", "Needs review"]].map(([value, label]) => `<option value="${value}" ${state.artifactStudio.sourceStatusFilter === value ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>
    <section class="artifact-source-list">${visibleSources.map((source) => {
      const doc = artifactSourceDocument(source); const id = recordId(source);
      const details = [doc.source_type, sourceMetric(doc.pages, "pages"), sourceMetric(doc.sections, "sections")].filter(Boolean).join(" · ");
      return `<label data-artifact-source-row data-title="${escapeHTML(sourceTitle(source).toLowerCase())}"><input type="checkbox" data-artifact-source="${escapeHTML(id)}" ${state.selectedSourceIds.has(id) ? "checked" : ""}/><span class="card-icon">${materialIcon(doc.is_policy ? "policy" : "description")}</span><div><strong>${escapeHTML(sourceTitle(source))}</strong><small>${escapeHTML(details || "Notebook source")}</small><div class="source-metadata-chips">${doc.topics.map((topic) => `<span>${escapeHTML(topic)}</span>`).join("")}</div></div><span class="status-chip ${doc.extraction_status === "partial" ? "warning" : ""}">${escapeHTML(doc.extraction_status)}</span></label>`;
    }).join("") || `<div class="empty-state"><strong>${sources.length ? "No sources match these filters." : "No Notebook sources are available."}</strong><p>${escapeHTML(sources.length ? "Try another source type, status, or search term." : state.openNotebook.error || "Connect Open Notebook and add sources to begin.")}</p>${sources.length ? "" : '<button class="button button-secondary" data-action="refresh-notebook">Retry connection</button>'}</div>`}</section>
  </section>`;
}

function renderCreateLanding() {
  const brief = state.artifactStudio.brief;
  return `<section class="create-landing">
    <div class="create-landing-intro"><div><span class="page-kicker">Create</span><h3>Build from reviewed knowledge.</h3><p>Every artifact begins with selected sources and an approved content brief. Simulation remains in its own controlled workflow.</p></div><span class="brief-readiness ${brief.status}">${brief.status === "approved" ? `${materialIcon("verified")} Brief v${brief.version} approved` : brief.status === "stale" ? `${materialIcon("warning")} Brief needs reapproval` : `${materialIcon("edit_note")} Brief not approved`}</span></div>
    <section class="format-card-grid">${artifactFormatCards.map((format) => `<button class="format-card" data-artifact-format="${format.id}" ${brief.status === "approved" ? "" : "data-requires-brief='true'"}><span class="card-icon">${materialIcon(format.icon)}</span><small>${escapeHTML(format.outputs)}</small><strong>${escapeHTML(format.title)}</strong><p>${escapeHTML(format.text)}</p><span class="format-card-link">${brief.status === "approved" ? "Choose format" : "Review sources first"} ${materialIcon("arrow_forward")}</span></button>`).join("")}</section>
    ${brief.status !== "approved" ? `<section class="source-first-callout"><span>${materialIcon("fact_check")}</span><div><strong>Source understanding is required.</strong><p>Select sources, inspect focused policy blocks, and approve the key points that will control the artifact.</p></div><button class="button button-primary" data-action="start-artifact-flow">Start source review</button></section>` : ""}
  </section>`;
}

function renderSourceSummary(source) {
  const doc = artifactSourceDocument(source);
  const metrics = [["Pages", doc.pages], ["Sections", doc.sections], ["Tables", doc.tables], ["Images", doc.images]].filter(([, value]) => value !== null && value !== undefined);
  return `<article class="review-source ${doc.warning ? "warning" : ""}"><span class="card-icon">${materialIcon(doc.is_policy ? "policy" : "description")}</span><div><strong>${escapeHTML(doc.title)}</strong><small>${escapeHTML(doc.source_type)} · ${escapeHTML(doc.extraction_status)}</small>${metrics.length ? `<dl>${metrics.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>` : ""}${doc.warning ? `<p>${materialIcon("warning")} ${escapeHTML(doc.warning)}</p>` : ""}</div><button aria-label="Remove ${escapeHTML(doc.title)}" data-remove-artifact-source="${escapeHTML(doc.source_id)}">${materialIcon("close")}</button></article>`;
}

function renderPolicyBlock(block) {
  const studio = state.artifactStudio;
  const selected = studio.selectedBlockIds.has(block.block_id);
  const expanded = studio.expandedBlockId === block.block_id;
  const query = studio.blockQuery.toLowerCase();
  if (query && !`${block.title} ${block.exact_text} ${block.source_title}`.toLowerCase().includes(query)) return "";
  const neighbors = allAvailableArtifactBlocks().filter((item) => [block.preceding_block_id, block.following_block_id].includes(item.block_id));
  const ranking = Number.isFinite(block.relevance_score) ? `<span class="relevance-score">${block.relevance_score}% relevant</span>` : `<span class="relevance-score">Not ranked</span>`;
  const explanation = block.relevance_explanation ? `<div class="block-relevance">${materialIcon("auto_awesome")} ${escapeHTML(block.relevance_explanation)}</div>` : "";
  const confidence = Number.isFinite(block.extraction_confidence) ? `<span>${materialIcon("verified")} ${Math.round(block.extraction_confidence * 100)}% extraction confidence</span>` : "";
  return `<article class="policy-block-card ${selected ? "selected" : ""}" data-policy-block-card="${escapeHTML(block.block_id)}"><header><label><input type="checkbox" data-policy-block="${escapeHTML(block.block_id)}" ${selected ? "checked" : ""}/><span class="block-type">${escapeHTML((block.block_type || "paragraph").replaceAll("_", " "))}</span></label>${ranking}</header><h4>${escapeHTML(block.title)}</h4><small>${escapeHTML(block.source_title)} · ${escapeHTML(block.location)}</small><p>${escapeHTML(block.exact_text)}</p>${explanation}<footer><button data-expand-block="${escapeHTML(block.block_id)}">${expanded ? "Hide" : "Expand"} context</button><button data-add-block-point="${escapeHTML(block.block_id)}">Add to key points</button></footer>${expanded ? `<section class="expanded-context"><strong>Surrounding source context</strong>${neighbors.length ? neighbors.map((neighbor) => `<div><span>${neighbor.block_id === block.preceding_block_id ? "Previous" : "Next"}</span><p>${escapeHTML(neighbor.exact_text)}</p><small>${escapeHTML(neighbor.location)}</small></div>`).join("") : "<p>No adjacent extracted block is available.</p>"}<div class="context-assets"><span>${materialIcon("table_chart")} ${(block.table_references || []).length} related tables</span><span>${materialIcon("image")} ${(block.image_references || []).length} related images</span>${confidence}</div></section>` : ""}</article>`;
}

function renderContextAnswer() {
  if (state.artifactStudio.aiStatus === "asking") return `<div class="context-empty">${materialIcon("progress_activity")} Asking only the selected source blocks…</div>`;
  if (state.artifactStudio.aiError) return `<div class="context-answer unsupported"><strong>AI request unavailable</strong><p>${escapeHTML(state.artifactStudio.aiError)}</p></div>`;
  const answer = state.artifactStudio.contextAnswer;
  if (!answer) return `<div class="context-empty">Ask a focused question about the selected sources and blocks. Answers stay inside this review scope.</div>`;
  return `<article class="context-answer ${answer.supported ? "" : "unsupported"}"><header><span>${materialIcon(answer.supported ? "auto_awesome" : "help")}</span><div><small>${answer.supported ? "Cited answer" : "Insufficient selected context"}</small><strong>${escapeHTML(answer.question)}</strong></div></header><p>${escapeHTML(answer.text)}</p><div class="answer-citations">${answer.citations.map((citation) => `<button data-jump-block="${escapeHTML(citation.block_id)}">${escapeHTML(citation.label)}</button>`).join("")}</div>${answer.supported ? '<button class="button button-secondary" data-action="add-answer-to-brief">Add answer to key points</button>' : ""}</article>`;
}

function renderBriefPoint(point, index) {
  return `<article class="brief-point" data-brief-point-card="${escapeHTML(point.point_id)}"><div class="brief-point-order"><button data-move-point="up" data-point-id="${escapeHTML(point.point_id)}" aria-label="Move up">${materialIcon("arrow_upward")}</button><span>${index + 1}</span><button data-move-point="down" data-point-id="${escapeHTML(point.point_id)}" aria-label="Move down">${materialIcon("arrow_downward")}</button></div><div class="brief-point-body"><textarea data-brief-text="${escapeHTML(point.point_id)}" aria-label="Key point ${index + 1}">${escapeHTML(point.statement)}</textarea><div class="brief-point-controls"><select data-brief-use="${escapeHTML(point.point_id)}"><option value="key_fact" ${point.intended_use === "key_fact" ? "selected" : ""}>Key fact</option><option value="procedure" ${point.intended_use === "procedure" ? "selected" : ""}>Procedure</option><option value="warning" ${point.intended_use === "warning" ? "selected" : ""}>Warning</option><option value="objective" ${point.intended_use === "objective" ? "selected" : ""}>Objective</option><option value="example" ${point.intended_use === "example" ? "selected" : ""}>Example</option><option value="quiz_concept" ${point.intended_use === "quiz_concept" ? "selected" : ""}>Quiz concept</option></select><select data-brief-priority="${escapeHTML(point.point_id)}"><option value="required" ${point.priority === "required" ? "selected" : ""}>Required</option><option value="optional" ${point.priority === "optional" ? "selected" : ""}>Optional</option><option value="supporting" ${point.priority === "supporting" ? "selected" : ""}>Supporting</option></select><span class="provenance-chip ${point.provenance.replaceAll("_", "-")}">${escapeHTML(point.provenance.replaceAll("_", " "))}</span></div><div class="brief-citations">${point.citations.map((citation) => `<span>${escapeHTML(citation.label)}</span>`).join("") || "<span class='unsupported'>Author input · no source citation</span>"}</div><div class="ai-edit-row"><span>Edit with AI</span><button data-ai-edit="shorten" data-point-id="${escapeHTML(point.point_id)}">Shorten</button><button data-ai-edit="clarify" data-point-id="${escapeHTML(point.point_id)}">Clarify</button><button data-ai-edit="procedure" data-point-id="${escapeHTML(point.point_id)}">Make a step</button><button data-ai-edit="split" data-point-id="${escapeHTML(point.point_id)}">Split</button></div></div><button class="brief-remove" data-remove-point="${escapeHTML(point.point_id)}" aria-label="Remove key point">${materialIcon("delete")}</button></article>`;
}

function renderSourceUnderstanding() {
  const studio = state.artifactStudio;
  const sources = selectedArtifactSources();
  const blocks = allAvailableArtifactBlocks();
  const brief = studio.brief;
  const blockState = studio.sourceUnderstandingStatus === "loading" ? `<div class="empty-state">${materialIcon("progress_activity")} Extracting authoritative blocks from the selected Notebook sources…</div>` : studio.sourceUnderstandingStatus === "error" ? `<div class="empty-state"><strong>Source understanding is unavailable.</strong><p>${escapeHTML(studio.sourceUnderstandingError || "The selected sources could not be read.")}</p><button class="button button-secondary" data-action="retry-source-understanding">Retry</button></div>` : blocks.map(renderPolicyBlock).join("") || '<div class="empty-state">No extracted blocks are available for the selected sources.</div>';
  return `<section class="artifact-flow"><header class="artifact-flow-header"><button class="flow-back" data-action="back-to-knowledge">${materialIcon("arrow_back")} Library</button><div><span class="page-kicker">Source understanding</span><h3>Review what is available before you create.</h3><p>Focused blocks remain authoritative. AI can rank, explain, and help edit the key points, but it cannot replace the source text.</p></div><div class="flow-status"><span>${sources.length}</span><small>sources selected</small></div></header>
    <section class="source-understanding-grid">
      <aside class="source-review-panel"><div class="panel-title"><div><span>Selected sources</span><h3>Available content</h3></div><strong>${sources.length}</strong></div><div class="source-review-list">${sources.map(renderSourceSummary).join("")}</div><button class="panel-add-action" data-action="back-to-knowledge">${materialIcon("add")} Add or change Library sources</button></aside>
      <main class="policy-review-panel"><div class="policy-review-toolbar"><div><span>Content and policy blocks</span><strong>${blocks.length} extracted blocks</strong></div><div class="policy-toolbar-actions"><label>${materialIcon("search")}<input id="policyBlockSearch" value="${escapeHTML(studio.blockQuery)}" placeholder="Search selected content…" /></label><button class="button button-secondary" data-action="rank-selected-blocks" ${studio.selectedBlockIds.size && studio.aiStatus !== "ranking" ? "" : "disabled"}>${studio.aiStatus === "ranking" ? "Ranking…" : `Rank ${studio.selectedBlockIds.size || ""} selected`}</button></div></div><div class="policy-boundary-note">${materialIcon("verified_user")} Original headings and deterministic boundaries are preserved. AI relevance never changes authoritative text.</div><div class="policy-block-list">${blockState}</div></main>
      <aside class="context-brief-panel"><section class="context-ask"><span class="page-kicker">Ask selected sources</span><form id="sourceContextForm"><textarea id="sourceContextQuestion" placeholder="What should a worker understand before taking action?">${escapeHTML(studio.contextQuestion)}</textarea><button class="button button-primary" ${blocks.length ? "" : "disabled"}>Ask with citations</button></form>${renderContextAnswer()}</section><section class="key-point-collector"><div><span class="page-kicker">Content brief</span><strong>${brief.points.length} key points</strong></div><p>Collect the facts and actions that should control the artifact.</p><button class="button button-secondary" data-action="generate-brief" ${studio.selectedBlockIds.size ? "" : "disabled"}>${brief.points.length ? "Refresh from selected blocks" : "Generate candidate key points"}</button><button class="button button-primary" data-action="review-key-points" ${brief.points.length ? "" : "disabled"}>Review key points</button></section></aside>
    </section>
  </section>`;
}

function renderBriefEditor() {
  const brief = state.artifactStudio.brief;
  return `<section class="artifact-flow brief-editor-view"><header class="artifact-flow-header"><button class="flow-back" data-action="back-to-source-review">${materialIcon("arrow_back")} Source review</button><div><span class="page-kicker">Approved content brief</span><h3>Finalize the key points that will control the artifact.</h3><p>Edit directly or use bounded AI actions. Unsupported additions remain visibly marked as author input.</p></div><div class="flow-status ${brief.status}"><span>${brief.status === "approved" ? `v${brief.version}` : brief.points.length}</span><small>${brief.status === "approved" ? "approved" : brief.status === "stale" ? "needs reapproval" : "points in review"}</small></div></header>
    ${brief.status === "stale" ? `<div class="stale-banner">${materialIcon("warning")} ${escapeHTML(brief.staleReason || "A source or key point changed after approval.")} Review and approve a new version before creating artifacts.</div>` : ""}
    <div class="brief-editor-toolbar"><div><strong>${brief.points.length} key points</strong><span>${brief.points.filter((point) => point.citations.length).length} cited · ${brief.points.filter((point) => !point.citations.length).length} author-only</span></div><button class="button button-secondary" data-action="add-manual-point">${materialIcon("add")} Add key point</button></div>
    <section class="brief-point-list">${brief.points.map(renderBriefPoint).join("") || '<div class="empty-state">No key points yet. Return to source review and select relevant blocks.</div>'}</section>
    <footer class="brief-approval-bar"><div><span>${materialIcon("lock")}</span><div><strong>Approval creates an immutable content-brief version.</strong><p>Templates use this brief—not the full policy or an unreviewed summary.</p></div></div><div><button class="button button-secondary" data-action="back-to-source-review">Continue reviewing sources</button><button class="button button-primary" data-action="approve-content-brief" ${brief.points.length ? "" : "disabled"}>${brief.status === "approved" ? "Approve new version" : "Approve brief & choose format"}</button></div></footer>
  </section>`;
}

function renderFormatSelection() {
  const presentationVersion = state.artifactStudio.approvedPresentation?.version;
  return `<section class="artifact-flow format-selection"><header class="artifact-flow-header"><button class="flow-back" data-action="back-to-brief">${materialIcon("arrow_back")} Content brief</button><div><span class="page-kicker">Creation studio</span><h3>Create once, adapt into each deliverable.</h3><p>Job aid, presentation, and knowledge check share the approved brief. Video starts from an approved presentation.</p></div><div class="flow-status approved"><span>v${state.artifactStudio.brief.version}</span><small>brief approved</small></div></header><section class="format-card-grid">${artifactFormatCards.map((format) => { const locked = format.dependent && !presentationVersion; return `<button class="format-card ${locked ? "locked" : ""}" data-select-artifact-format="${format.id}" ${locked ? "disabled" : ""}><span class="card-icon">${materialIcon(locked ? "lock" : format.icon)}</span><small>${locked ? "Approve presentation first" : escapeHTML(format.outputs)}</small><strong>${escapeHTML(format.title)}</strong><p>${escapeHTML(format.text)}</p><span class="format-card-link">${locked ? "Dependent output" : `Open editor ${materialIcon("arrow_forward")}`}</span></button>`; }).join("")}</section></section>`;
}

function templatesForFormat(format) {
  if (format === "video") return curatedArtifactTemplates.filter((template) => template.format === "presentation");
  return curatedArtifactTemplates.filter((template) => template.format === format);
}

function renderTemplateSelection() {
  const format = state.artifactStudio.format;
  const templates = templatesForFormat(format);
  return `<section class="artifact-flow template-selection"><header class="artifact-flow-header"><button class="flow-back" data-action="back-to-formats">${materialIcon("arrow_back")} Formats</button><div><span class="page-kicker">Curated templates</span><h3>Choose the structure your audience needs.</h3><p>Templates define editable text, image, citation, narration, and avatar-safe slots.</p></div><div class="flow-status"><span>${templates.length}</span><small>approved templates</small></div></header><section class="template-gallery">${templates.map((template) => `<button class="artifact-template-card" data-template-id="${template.id}"><div class="template-preview ${template.format}"><span>${materialIcon(template.icon)}</span><i></i><i></i><i></i>${template.format === "presentation" ? '<b class="avatar-safe-preview">Presenter</b>' : ""}</div><div><small>${template.outputs.join(" · ")} · ${template.pages}</small><strong>${escapeHTML(template.name)}</strong><p>${escapeHTML(template.description)}</p><span>${template.imageSlots} image slot${template.imageSlots === 1 ? "" : "s"} ${materialIcon("arrow_forward")}</span></div></button>`).join("")}</section></section>`;
}

function buildArtifactProject(templateId, formatOverride = null) {
  const template = curatedArtifactTemplates.find((item) => item.id === templateId);
  const brief = state.artifactStudio.brief;
  const points = brief.points.map((point) => point.statement);
  const format = formatOverride || state.artifactStudio.format;
  const notebook = activeNotebookRecord();
  const slideCount = template?.format === "presentation" ? Math.max(5, Math.min(8, points.length + 3)) : 0;
  return {
    project_id: `project:bo-${Date.now()}`,
    notebook_id: notebook?.id || null,
    title: notebook?.title || "",
    audience: notebook?.audience || "",
    objective: notebook?.purpose || notebook?.objective || "",
    summary: points.slice(0, 2).join(" "),
    format,
    template_id: templateId,
    brief_id: brief.id,
    brief_version: brief.version,
    source_ids: [...state.selectedSourceIds],
    status: "draft",
    version: 1,
    derived_from: null,
    key_points: points,
    image_slots: Array.from({ length: template?.imageSlots || 0 }, (_, index) => ({ id: `image-${index + 1}`, label: `Image ${index + 1}`, asset: null, caption: "", alt_text: "", fit: "cover" })),
    scenes: Array.from({ length: slideCount }, (_, index) => ({ id: `scene-${index + 1}`, title: points[index] || "", narration: points[index] || "", avatar_enabled: false, avatar_position: "right" })),
  };
}

function createInitialNotebookDrafts() {
  const studio = state.artifactStudio;
  const notebook = activeNotebookRecord();
  if (!notebook || notebook.content_brief?.status !== "approved") return;
  syncArtifactBriefFromNotebook(notebook);
  const defaults = {
    job_aid: "doc-step-by-step",
    presentation: "ppt-process-walkthrough",
    quiz: "quiz-grounded-check",
  };
  if (studio.approvedPresentation?.project?.brief_version !== studio.brief.version) {
    studio.approvedPresentation = null;
    delete studio.projects.video;
  }
  studio.draftGenerationStatus = "generating";
  Object.entries(defaults).forEach(([format, templateId]) => {
    if (!studio.projects[format] || studio.projects[format].brief_version !== studio.brief.version) {
      studio.projects[format] = buildArtifactProject(templateId, format);
    }
  });
  studio.draftGenerationStatus = "ready";
  renderProductView();
  showToast("Three editable drafts created", "Review the job aid, presentation, and knowledge check in any order.");
}

function openNotebookDraft(format) {
  const studio = state.artifactStudio;
  if (format === "video" && !studio.approvedPresentation) {
    return showToast("Approve the presentation first", "Video inherits the approved slide order, visuals, narration, and presenter-safe areas.", "!");
  }
  if (!studio.projects[format]) {
    if (format === "video") studio.projects.video = buildVideoProjectFromPresentation();
    else createInitialNotebookDrafts();
  }
  const project = studio.projects[format];
  if (!project) return;
  studio.format = format;
  studio.templateId = project.template_id;
  studio.project = project;
  studio.step = "compose";
  studio.notebookMode = "artifact";
  studio.notebookTab = "create";
  renderProductView();
}

function buildVideoProjectFromPresentation() {
  const approved = state.artifactStudio.approvedPresentation;
  if (!approved) return null;
  return {
    ...structuredClone(approved.project),
    project_id: `project:bo-${Date.now()}`,
    format: "video",
    status: "draft",
    derived_from: {
      project_id: approved.project.project_id,
      format: "presentation",
      version: approved.version,
      approved_at: approved.approved_at,
    },
  };
}

function approvePresentationAndCreateVideo() {
  const studio = state.artifactStudio;
  const project = studio.project;
  if (!project || project.format !== "presentation") return;
  const version = Number(studio.approvedPresentation?.version || 0) + 1;
  project.status = "approved";
  project.version = version;
  studio.projects.presentation = project;
  studio.approvedPresentation = { version, approved_at: new Date().toISOString(), project: structuredClone(project) };
  studio.projects.video = buildVideoProjectFromPresentation();
  showToast("Presentation approved", `Video draft created from Presentation v${version}.`);
  openNotebookDraft("video");
}

async function populateProjectWithAI() {
  const studio = state.artifactStudio;
  studio.aiStatus = "populating_project";
  studio.aiError = null;
  try {
    const populated = await studioJSON("/api/studio/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: studio.project,
        content_brief: studio.brief.approvedSnapshot,
        template: curatedArtifactTemplates.find((item) => item.id === studio.project.template_id),
      }),
    });
    Object.assign(studio.project, populated);
    studio.project.status = "draft";
    showToast("Template populated", "Review every generated slot before previewing.");
  } catch (error) {
    studio.aiError = error.message;
    showToast("AI population unavailable", error.message, "!");
  }
  studio.aiStatus = "idle";
  renderProductView();
}

function renderImageSlot(slot) {
  return `<article class="image-slot ${slot.asset ? "filled" : ""}"><div class="image-slot-preview">${slot.asset ? `<img src="${escapeHTML(slot.asset.url)}" alt="${escapeHTML(slot.alt_text || slot.label)}"/>` : materialIcon("add_photo_alternate")}</div><div><strong>${escapeHTML(slot.label)}</strong><small>Source image or PNG/JPEG/WebP upload · 16:9 recommended</small><div class="image-slot-actions"><label class="button button-secondary">Upload<input type="file" data-image-slot="${slot.id}" accept="image/png,image/jpeg,image/webp" hidden /></label><select data-image-fit="${slot.id}"><option value="cover" ${slot.fit === "cover" ? "selected" : ""}>Crop to fill</option><option value="contain" ${slot.fit === "contain" ? "selected" : ""}>Fit inside</option></select>${slot.asset ? `<button data-remove-image="${slot.id}">Remove</button>` : ""}</div><input data-image-caption="${slot.id}" value="${escapeHTML(slot.caption)}" placeholder="Caption (optional)"/><input data-image-alt="${slot.id}" value="${escapeHTML(slot.alt_text)}" placeholder="Alt text required before publish"/></div></article>`;
}

function renderComposeArtifact() {
  const project = state.artifactStudio.project;
  const template = curatedArtifactTemplates.find((item) => item.id === project.template_id);
  const presentationLike = ["presentation", "video"].includes(project.format);
  const outputLabel = project.format === "video" ? "MP4 · captions" : template.outputs.join(" · ");
  const videoLineage = project.format === "video" && project.derived_from ? `<div class="artifact-lineage-banner">${materialIcon("account_tree")} <div><strong>Video from Presentation v${project.derived_from.version}</strong><span>Slide order, visuals, and narration were copied from the approved deck. Video changes do not alter that presentation version.</span></div></div>` : "";
  return `<section class="artifact-flow compose-view"><header class="artifact-flow-header"><button class="flow-back" data-action="back-to-templates">${materialIcon("arrow_back")} Templates</button><div><span class="page-kicker">Compose · ${escapeHTML(template.name)}</span><h3>Map approved points into editable template slots.</h3><p>Source-backed values keep their citations. Author additions remain separately labeled.</p></div><div class="flow-status"><span>${project.key_points.length}</span><small>approved points mapped</small></div></header>
    ${videoLineage}<section class="compose-grid"><main class="slot-editor"><section class="slot-section"><div class="panel-title"><div><span>Project details</span><h3>Required fields</h3></div><button class="row-action" data-action="populate-project-with-ai">Populate with AI</button></div><label>Artifact title<input data-project-field="title" value="${escapeHTML(project.title)}"/></label><label>Audience<input data-project-field="audience" value="${escapeHTML(project.audience)}"/></label><label>Learning objective<textarea data-project-field="objective">${escapeHTML(project.objective)}</textarea></label><label>Summary<textarea data-project-field="summary">${escapeHTML(project.summary)}</textarea></label></section>
      <section class="slot-section"><div class="panel-title"><div><span>Approved brief</span><h3>Mapped key points</h3></div><strong>v${project.brief_version}</strong></div>${project.key_points.map((point, index) => `<label class="mapped-point"><span>${index + 1}</span><textarea data-project-point="${index}">${escapeHTML(point)}</textarea><small>Mapped from approved brief · citations retained</small></label>`).join("")}</section>
      ${project.image_slots.length ? `<section class="slot-section"><div class="panel-title"><div><span>Media</span><h3>Template image slots</h3></div><strong>${project.image_slots.length}</strong></div>${project.image_slots.map(renderImageSlot).join("")}</section>` : ""}
      ${presentationLike ? `<section class="slot-section"><div class="panel-title"><div><span>${project.format === "video" ? "HeyGen video" : "Presentation scenes"}</span><h3>${project.format === "video" ? "Presenter and narration" : "Slides, narration, and presenter-safe areas"}</h3></div><strong>${project.scenes.filter((scene) => scene.avatar_enabled).length} enabled</strong></div><div class="scene-editor-list">${project.scenes.map((scene, index) => `<article><span>${index + 1}</span><div><input data-scene-title="${scene.id}" value="${escapeHTML(scene.title)}"/><textarea data-scene-narration="${scene.id}">${escapeHTML(scene.narration)}</textarea><small>Reviewed narration · ${scene.narration.trim() ? scene.narration.trim().split(/\s+/).length : 0} words</small></div><div><label class="avatar-toggle"><input type="checkbox" data-scene-avatar="${scene.id}" ${scene.avatar_enabled ? "checked" : ""}/><span>Avatar</span></label><select data-scene-position="${scene.id}" ${scene.avatar_enabled ? "" : "disabled"}><option value="right" ${scene.avatar_position === "right" ? "selected" : ""}>Right safe area</option><option value="left" ${scene.avatar_position === "left" ? "selected" : ""}>Left safe area</option></select></div></article>`).join("")}</div></section>` : ""}</main>
      <aside class="compose-preview"><span class="page-kicker">Live structure preview</span><div class="mini-artifact-preview ${presentationLike ? "slides" : project.format}"><header><span>BlueOrigin</span><small>${escapeHTML(outputLabel)}</small></header><h4>${escapeHTML(project.title)}</h4><p>${escapeHTML(project.summary)}</p><ol>${project.key_points.slice(0, 4).map((point) => `<li>${escapeHTML(point)}</li>`).join("")}</ol>${presentationLike ? '<span class="avatar-safe-zone">Avatar-safe</span>' : ""}<footer>Grounded in approved content brief v${project.brief_version}</footer></div><div class="preview-lineage"><strong>Generation boundary</strong><p>This template is populated from the approved brief. It does not resummarize the complete selected policies.</p></div><button class="button button-primary" data-action="generate-artifact-preview">Generate watermarked preview</button></aside></section>
  </section>`;
}

function renderArtifactPreview() {
  const project = state.artifactStudio.project;
  const presentationLike = ["presentation", "video"].includes(project.format);
  const projectReady = Boolean(project.title && project.audience && project.objective) && project.image_slots.every((slot) => !slot.asset || slot.alt_text);
  return `<section class="artifact-flow artifact-preview-view"><header class="artifact-flow-header"><button class="flow-back" data-action="back-to-compose">${materialIcon("arrow_back")} Edit artifact</button><div><span class="page-kicker">Preview</span><h3>Review the rendered structure before publication.</h3><p>This review artifact is watermarked and remains editable through the project.</p></div><div class="flow-status"><span>${materialIcon("visibility")}</span><small>preview ready</small></div></header>
    <section class="render-preview-grid"><main class="render-canvas ${presentationLike ? "presentation" : project.format}"><span class="preview-watermark">REVIEW</span>${presentationLike ? `<div class="slide-filmstrip">${project.scenes.map((scene, index) => `<button class="${index === 0 ? "active" : ""}" data-preview-scene="${scene.id}"><span>${index + 1}</span>${escapeHTML(scene.title)}</button>`).join("")}</div><div class="large-slide"><span class="brand-corner">BlueOrigin</span><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.objective)}</p><div class="slide-content"><strong>${escapeHTML(project.scenes[0]?.title || "Introduction")}</strong><span>${escapeHTML(project.scenes[0]?.narration || "")}</span></div>${project.scenes[0]?.avatar_enabled ? `<div class="avatar-preview ${project.scenes[0].avatar_position}">${materialIcon("person")}<small>HeyGen presenter</small></div>` : ""}</div>` : `<div class="document-pages"><article><span class="brand-corner">BlueOrigin</span><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.summary)}</p><ol>${project.key_points.map((point) => `<li>${escapeHTML(point)}</li>`).join("")}</ol><footer>Sources and citations · approved brief v${project.brief_version}</footer></article></div>`}</main>
      <aside class="preview-review-panel"><span class="page-kicker">${project.format === "presentation" ? "Presentation approval" : "Publication checklist"}</span>${[["Source lineage", true], ["Approved brief", true], ["Required fields", Boolean(project.title && project.audience && project.objective)], ["Image alt text", project.image_slots.every((slot) => !slot.asset || slot.alt_text)], ["Avatar safe areas", true]].map(([label, done]) => `<div class="preview-check ${done ? "done" : ""}">${materialIcon(done ? "check_circle" : "radio_button_unchecked")}<span>${label}</span></div>`).join("")}<div class="render-output-list">${releaseOutputsForProject(project).map((output) => `<span>${output}</span>`).join("")}</div>${project.format === "presentation" ? `<button class="button button-primary" data-action="approve-presentation-for-video" ${projectReady ? "" : "disabled"}>Approve & create video</button><small class="approval-helper">This freezes Presentation v${Number(state.artifactStudio.approvedPresentation?.version || 0) + 1} for the video draft.</small><button class="button button-secondary" data-action="publish-artifact" ${projectReady ? "" : "disabled"}>Publish presentation only</button>` : `<button class="button button-primary" data-action="publish-artifact" ${projectReady ? "" : "disabled"}>Approve & publish release</button>`}<button class="button button-secondary" data-action="back-to-compose">Return to editor</button></aside>
    </section>
  </section>`;
}

function releaseOutputsForProject(project) {
  if (project.format === "job_aid") return ["DOCX", "PDF"];
  if (project.format === "presentation") return ["PPTX"];
  if (project.format === "video") return ["MP4", "SRT", "WebVTT"];
  return ["HTML", "JSON"];
}

function renderReleasesTab() {
  const releases = state.artifactStudio.releases;
  return `<section class="releases-view"><div class="knowledge-toolbar"><div><span class="page-kicker">Releases</span><h3>Immutable learning artifacts.</h3><p>Every version retains its approved brief, source lineage, checksums, and Notebook publication state.</p></div><button class="button button-primary" data-action="open-create-tab">Create content</button></div>${releases.length ? `<section class="release-list">${releases.map((release) => `<article><span class="card-icon">${materialIcon(release.format === "job_aid" ? "description" : release.format === "quiz" ? "quiz" : "slideshow")}</span><div><small>${escapeHTML(release.release_id)} · brief v${release.brief_version}</small><strong>${escapeHTML(release.title)}</strong><p>${release.source_ids.length} sources · published ${new Date(release.published_at).toLocaleString()}</p><div class="release-output-chips">${release.outputs.map((output) => `<button data-download-release="${release.release_id}" data-output="${output}">${output}</button>`).join("")}</div></div><div class="release-status"><span class="status-chip">Published</span><small>Notebook recorded</small><button data-download-manifest="${release.release_id}">Manifest</button></div></article>`).join("")}</section>` : `<div class="release-empty"><span>${materialIcon("inventory_2")}</span><h3>No releases yet.</h3><p>Approve a content brief, choose a template, and publish the first grounded artifact.</p><button class="button button-primary" data-action="open-create-tab">Create content</button></div>`}</section>`;
}

function renderNotebookSettings() {
  const status = state.artifactStudio.integrationStatus;
  return `<div class="product-page"><section class="list-heading"><div><span class="page-kicker">Manage</span><h2>Settings</h2><p>Server-side integration health. Secret values are never returned to the browser.</p></div><button class="button button-secondary" data-action="refresh-integration-status">Refresh status</button></section><section class="settings-list">${[["Open Notebook", status.notebook, "Source catalog, lineage, and release records"], ["OpenAI", status.openai, "Source ranking, cited answers, brief editing, and narration"], ["HeyGen", status.heygen, "Per-slide avatar rendering for presentation videos"], ["Artifact worker", status.worker, "DOCX, PDF, PPTX, captions, and media assembly"]].map(([name, configured, text]) => `<article><div><strong>${name}</strong><p>${text}</p></div><span class="status-chip ${configured ? "" : "neutral"}">${configured ? "Configured" : "Not configured"}</span></article>`).join("")}</section><section class="credential-boundary"><span>${materialIcon("lock")}</span><div><strong>Credentials stay server-side.</strong><p>OPENAI_API_KEY, HEYGEN_API_KEY, Blob, Notebook, and queue credentials are deployment secrets and are never saved in projects or release manifests.</p></div></section></div>`;
}

function renderNotebookWorkspace() {
  const studio = state.artifactStudio;
  if (studio.notebookMode === "landing") return renderNotebookLanding();
  if (studio.notebookMode === "workspace") return renderNotebookStudioWorkspace();
  let body = renderNotebookOverview();
  if (studio.notebookTab === "knowledge") body = renderKnowledgeTab();
  if (studio.notebookTab === "create") {
    if (["review", "select"].includes(studio.step) && state.selectedSourceIds.size) body = renderSourceUnderstanding();
    else if (studio.step === "brief") body = renderBriefEditor();
    else if (studio.step === "format") body = renderFormatSelection();
    else if (studio.step === "template") body = renderTemplateSelection();
    else if (studio.step === "compose" && studio.project) body = renderComposeArtifact();
    else if (studio.step === "preview" && studio.project) body = renderArtifactPreview();
    else body = renderCreateLanding();
  }
  if (studio.notebookTab === "releases") body = renderReleasesTab();
  return `<div class="product-page notebook-workspace-page">${renderNotebookHeader()}${body}</div>`;
}

function updateContextAction() {
  const button = document.querySelector("#newButton");
  const label = document.querySelector("#contextActionLabel");
  if (!button || !label) return;
  let text = "Add knowledge";
  if (state.route === "notebook" && ["create", "releases"].includes(state.artifactStudio.notebookTab)) text = "Create content";
  if (state.route === "scenario-library") text = "New simulation";
  if (state.route === "assignments") text = "Assign scenario";
  if (["lighthouse", "lighthouse-path", "lighthouse-player", "lighthouse-builder", "lighthouse-manage", "my-learning"].includes(state.route)) text = "New module";
  if (state.route === "attempts") button.hidden = true; else button.hidden = false;
  label.textContent = text;
  button.setAttribute("aria-expanded", "false");
}

function openLibraryAdd(mode, source = null) {
  const typeControl = document.querySelector("#writeType");
  if (typeControl) typeControl.value = mode;
  openWriteDialog("source");
  if (source) {
    document.querySelector("#writeTitle").value = source.title;
    document.querySelector("#writeUrl").value = source.url;
  }
}

function saveLibraryClassification(id, value) {
  state.artifactStudio.libraryClassifications[id] = value;
  try { localStorage.setItem("blueorigin-library-classifications", JSON.stringify(state.artifactStudio.libraryClassifications)); } catch { /* optional browser persistence */ }
}

async function setLibrarySourceSelected(sourceId, selected) {
  const source = libraryRecords().find((item) => recordId(item) === sourceId);
  if (!source) return;
  const notebook = notebookRecords().find((item) => item.id === state.artifactStudio.libraryTargetNotebookId) || null;
  try {
    if (notebook) {
      const updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/sources`, {
        method: selected ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected ? notebookSourceLinkPayload(source) : { source_id: sourceId }),
      });
      Object.assign(notebook, updated);
    }
    selected ? state.selectedSourceIds.add(sourceId) : state.selectedSourceIds.delete(sourceId);
    markArtifactBriefStale("The selected Library source set changed after brief approval.");
    renderProductView();
  } catch (error) {
    showToast("Source link failed", error.message, "!");
    renderProductView();
  }
}

async function toggleNotebookSource(input) {
  const notebook = activeNotebookRecord();
  if (!notebook) return;
  const sourceId = input.dataset.notebookSource;
  input.disabled = true;
  try {
    let updated;
    if (input.checked) {
      const source = libraryRecords().find((item) => recordId(item) === sourceId);
      updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/sources`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notebookSourceLinkPayload(source)) });
    } else {
      updated = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/sources`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source_id: sourceId }) });
      (state.artifactStudio.sourceBlocks[sourceId] || []).forEach((block) => state.artifactStudio.selectedBlockIds.delete(block.block_id));
    }
    Object.assign(notebook, updated);
    state.selectedSourceIds = new Set(notebook.source_ids || []);
    markArtifactBriefStale("The notebook source set changed after brief approval.");
    renderProductView();
    if (notebook.source_ids?.length) analyzeNotebookContent("replace");
  } catch (error) {
    input.checked = !input.checked;
    input.disabled = false;
    showToast("Source update failed", error.message, "!");
  }
}

async function favoriteNotebook(id) {
  const notebook = notebookRecords().find((item) => item.id === id);
  if (!notebook) return;
  try { Object.assign(notebook, await studioJSON(`/api/studio/notebooks/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorite: !notebook.favorite }) })); renderProductView(); }
  catch (error) { showToast("Favorite unavailable", error.message, "!"); }
}

async function moveNotebookToReview() {
  const notebook = activeNotebookRecord();
  if (!notebook) return;
  try { Object.assign(notebook, await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/review`, { method: "POST" })); renderProductView(); showToast("Notebook moved to review", "The author readiness check is now active."); }
  catch (error) { showToast("Review unavailable", error.message, "!"); }
}

function bindNotebookStudioEvents() {
  const content = dom.screenContent;
  content.querySelector("#notebookCreateForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const dialog = state.artifactStudio.notebookCreateDialog;
    const prompt = content.querySelector("#notebookCreatePrompt")?.value.trim() || "";
    if (!dialog || prompt.length < 8) return;
    dialog.prompt = prompt;
    createNotebookWorkspace(dialog.sourceIds, prompt);
  });
  content.querySelector("#notebookCreatePrompt")?.addEventListener("input", (event) => {
    if (state.artifactStudio.notebookCreateDialog) state.artifactStudio.notebookCreateDialog.prompt = event.target.value;
  });
  content.querySelectorAll("[data-open-notebook-id]").forEach((button) => button.addEventListener("click", () => openNotebookWorkspace(button.dataset.openNotebookId)));
  content.querySelector("[data-notebook-title]")?.addEventListener("input", (event) => {
    const notebook = activeNotebookRecord();
    if (!notebook) return;
    saveNotebookRecord(notebook, { title: event.target.value });
  });
  content.querySelector("[data-notebook-title]")?.addEventListener("blur", (event) => {
    if (event.target.value.trim()) return;
    const notebook = activeNotebookRecord();
    if (!notebook) return;
    event.target.value = "Untitled notebook";
    saveNotebookRecord(notebook, { title: "Untitled notebook" });
  });
  content.querySelector("[data-notebook-objective]")?.addEventListener("input", (event) => {
    const notebook = activeNotebookRecord();
    if (!notebook) return;
    saveNotebookRecord(notebook, { purpose: event.target.value });
  });
  content.querySelector("#notebookSourceSearch")?.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    content.querySelectorAll("[data-notebook-source-row]").forEach((row) => { row.hidden = !row.dataset.title.includes(query); });
  });
  content.querySelectorAll("[data-notebook-source]").forEach((input) => input.addEventListener("change", () => toggleNotebookSource(input)));
  content.querySelector("#notebookGlobalSearch")?.addEventListener("input", (event) => { state.artifactStudio.notebookQuery = event.target.value; renderProductView(); queueMicrotask(() => { const input = document.querySelector("#notebookGlobalSearch"); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); }); });
  content.querySelectorAll("[data-notebook-filter]").forEach((select) => select.addEventListener("change", () => { if (select.dataset.notebookFilter === "program") state.artifactStudio.notebookProgramFilter = select.value; else state.artifactStudio.notebookAccessFilter = select.value; state.artifactStudio.notebookPages = { published: 1, in_review: 1, draft: 1 }; renderProductView(); }));
  content.querySelector("[data-notebook-sort]")?.addEventListener("change", (event) => { state.artifactStudio.notebookSort = event.target.value; renderProductView(); });
  content.querySelectorAll("[data-notebook-view]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.notebookView = button.dataset.notebookView; try { localStorage.setItem("blueorigin-notebook-view", state.artifactStudio.notebookView); } catch {} renderProductView(); }));
  content.querySelector("[data-notebook-mobile-filter]")?.addEventListener("click", () => { state.artifactStudio.notebookFiltersOpen = !state.artifactStudio.notebookFiltersOpen; renderProductView(); });
  content.querySelectorAll("[data-notebook-page]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.notebookPages[button.dataset.notebookPage] = Number(button.dataset.pageValue); renderProductView(); }));
  content.querySelectorAll("[data-notebook-favorite]").forEach((button) => button.addEventListener("click", () => favoriteNotebook(button.dataset.notebookFavorite)));
  content.querySelector("[data-notebook-review-date]")?.addEventListener("change", (event) => { state.artifactStudio.notebookPublish.review_due_at = event.target.value; });
  content.querySelector("[data-notebook-dialog]")?.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); state.artifactStudio.notebookPublish = null; state.artifactStudio.notebookCreateDialog = null; renderProductView(); } });
  const notebookDialog = content.querySelector("[data-notebook-dialog]");
  if (notebookDialog) {
    const focusNotebookDialog = () => {
      const preferred = notebookDialog.querySelector("[autofocus]")
        || notebookDialog.querySelector("[data-notebook-review-date]")
        || notebookDialog.querySelector("input:not([type=hidden]), textarea, select")
        || notebookDialog.querySelector("button");
      preferred?.focus();
    };
    focusNotebookDialog();
    requestAnimationFrame(() => { if (!notebookDialog.contains(document.activeElement)) focusNotebookDialog(); });
  }
  content.querySelector("#notebookChatForm")?.addEventListener("submit", askNotebookSources);
  content.querySelector("#notebookChatInput")?.addEventListener("input", (event) => { state.artifactStudio.notebookChatDraft = event.target.value; });
  content.querySelectorAll("[data-notebook-citation-block]").forEach((button) => button.addEventListener("click", () => showNotebookCitation(button.dataset.notebookCitationSource, button.dataset.notebookCitationBlock)));
  content.querySelectorAll("[data-copy-notebook-message]").forEach((button) => button.addEventListener("click", () => {
    const message = activeNotebookRecord()?.chat_messages?.find((item) => item.id === button.dataset.copyNotebookMessage);
    if (message) copyNotebookText(message.text);
  }));
  content.querySelectorAll("[data-add-message-point]").forEach((button) => button.addEventListener("click", () => addNotebookMessageAsPoint(button.dataset.addMessagePoint)));
  content.querySelectorAll("[data-copy-notebook-point]").forEach((button) => button.addEventListener("click", () => {
    const point = activeNotebookRecord()?.content_brief?.points?.find((item) => item.point_id === button.dataset.copyNotebookPoint);
    if (point) copyNotebookText(point.statement);
  }));
  content.querySelectorAll("[data-notebook-point-text]").forEach((input) => input.addEventListener("change", () => {
    const points = (activeNotebookRecord()?.content_brief?.points || []).map((point) => point.point_id === input.dataset.notebookPointText ? { ...point, statement: input.value, provenance: "author_override", review_status: "edited" } : point);
    persistNotebookPoints(points);
  }));
  content.querySelectorAll("[data-remove-notebook-point]").forEach((button) => button.addEventListener("click", () => persistNotebookPoints((activeNotebookRecord()?.content_brief?.points || []).filter((point) => point.point_id !== button.dataset.removeNotebookPoint))));
  content.querySelectorAll("[data-move-notebook-point]").forEach((button) => button.addEventListener("click", () => {
    const points = [...(activeNotebookRecord()?.content_brief?.points || [])];
    const index = points.findIndex((point) => point.point_id === button.dataset.moveNotebookPoint);
    const next = index + Number(button.dataset.direction);
    if (index < 0 || next < 0 || next >= points.length) return;
    [points[index], points[next]] = [points[next], points[index]];
    persistNotebookPoints(points);
  }));
  content.querySelectorAll("[data-notebook-output]").forEach((button) => button.addEventListener("click", () => saveNotebookContent("select_output", { output: button.dataset.notebookOutput })));
  content.querySelectorAll("[data-open-notebook-draft]").forEach((button) => button.addEventListener("click", () => openNotebookDraft(button.dataset.openNotebookDraft)));
  content.querySelectorAll("[data-notebook-tab]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.notebookTab === "overview") { state.artifactStudio.notebookMode = "landing"; return setProductView("notebook"); }
    state.artifactStudio.notebookTab = button.dataset.notebookTab;
    if (button.dataset.notebookTab === "create" && state.artifactStudio.step === "select") state.artifactStudio.step = "select";
    renderProductView();
  }));
  content.querySelectorAll("[data-view-link]").forEach((button) => button.addEventListener("click", () => setProductView(button.dataset.viewLink)));
  content.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleProductAction(button.dataset.action, button)));
  content.querySelector("#librarySearch")?.addEventListener("input", (event) => {
    state.artifactStudio.libraryQuery = event.target.value;
    const query = event.target.value.toLowerCase();
    content.querySelectorAll("[data-library-row]").forEach((row) => { row.hidden = !row.dataset.librarySearch.includes(query); });
  });
  content.querySelector("[data-clear-library-search]")?.addEventListener("click", () => {
    state.artifactStudio.libraryQuery = "";
    renderProductView();
  });
  content.querySelectorAll("[data-library-folder]").forEach((button) => button.addEventListener("click", () => {
    state.artifactStudio.libraryJurisdiction = button.dataset.libraryFolder;
    renderProductView();
  }));
  content.querySelectorAll("[data-library-view]").forEach((button) => button.addEventListener("click", () => {
    const grid = button.dataset.libraryView === "grid";
    content.querySelector(".library-main")?.classList.toggle("grid-view", grid);
    content.querySelectorAll("[data-library-view]").forEach((control) => {
      const active = control === button;
      control.classList.toggle("active", active);
      control.setAttribute("aria-pressed", String(active));
    });
  }));
  content.querySelector("[data-library-help]")?.addEventListener("click", () => showToast("Library help", "Search, filter, or open a folder. Add official references to Notebook before reviewing them.", "?"));
  content.querySelector("[data-library-settings]")?.addEventListener("click", () => showToast("Library settings", "Document classifications are saved locally; source content remains unchanged.", "•"));
  content.querySelector("[data-open-library-nav]")?.addEventListener("click", () => document.querySelector("#studioSidebar")?.classList.add("open"));
  content.querySelectorAll("[data-library-filter]").forEach((select) => select.addEventListener("change", () => {
    if (select.dataset.libraryFilter === "jurisdiction") state.artifactStudio.libraryJurisdiction = select.value;
    if (select.dataset.libraryFilter === "program") state.artifactStudio.libraryProgram = select.value;
    if (select.dataset.libraryFilter === "type") state.artifactStudio.libraryType = select.value;
    renderProductView();
  }));
  content.querySelectorAll("[data-library-type]").forEach((select) => select.addEventListener("change", () => saveLibraryClassification(select.dataset.libraryType, select.value)));
  content.querySelectorAll("[data-library-select-source]").forEach((input) => input.addEventListener("change", () => setLibrarySourceSelected(input.dataset.librarySelectSource, input.checked)));
  content.querySelectorAll("[data-library-open-document]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openLibraryDocument(link.dataset.libraryOpenDocument, link);
  }));
  content.querySelectorAll("[data-library-open-row]").forEach((row) => row.addEventListener("click", (event) => {
    if (event.target.closest("a,button,input,select,label")) return;
    openLibraryDocument(row.dataset.libraryOpenRow, row.querySelector("[data-library-open-document]"));
  }));
  content.querySelectorAll("[data-library-archive]").forEach((button) => button.addEventListener("click", () => archiveLibraryDocument(button.dataset.libraryArchive)));
  content.querySelectorAll("[data-library-delete]").forEach((button) => button.addEventListener("click", () => deleteLibraryDocument(button.dataset.libraryDelete)));
  content.querySelector("[data-library-import]")?.addEventListener("click", importLibraryDocuments);
  content.querySelectorAll("[data-library-review-source]").forEach((button) => button.addEventListener("click", () => {
    state.selectedSourceIds.add(button.dataset.libraryReviewSource);
    state.artifactStudio.step = "review";
    loadSelectedSourceUnderstanding();
  }));
  content.querySelectorAll("[data-library-add]").forEach((button) => button.addEventListener("click", () => openLibraryAdd(button.dataset.libraryAdd)));
  content.querySelectorAll("input[data-artifact-source]").forEach((input) => input.addEventListener("change", () => {
    input.checked ? state.selectedSourceIds.add(input.dataset.artifactSource) : state.selectedSourceIds.delete(input.dataset.artifactSource);
    markArtifactBriefStale("The selected source set changed after brief approval.");
    renderProductView();
  }));
  content.querySelector("#artifactSourceSearch")?.addEventListener("input", (event) => {
    state.artifactStudio.sourceQuery = event.target.value;
    content.querySelectorAll("[data-artifact-source-row]").forEach((row) => { row.hidden = !row.dataset.title.includes(event.target.value.toLowerCase()); });
  });
  content.querySelectorAll("[data-source-filter]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.sourceFilter = button.dataset.sourceFilter; renderProductView(); }));
  content.querySelector("#artifactSourceStatus")?.addEventListener("change", (event) => { state.artifactStudio.sourceStatusFilter = event.target.value; renderProductView(); });
  content.querySelectorAll("[data-remove-artifact-source]").forEach((button) => button.addEventListener("click", () => {
    state.selectedSourceIds.delete(button.dataset.removeArtifactSource);
    markArtifactBriefStale("A selected source was removed after brief approval.");
    if (!state.selectedSourceIds.size) { state.artifactStudio.notebookTab = "overview"; state.artifactStudio.step = "select"; }
    renderProductView();
  }));
  content.querySelectorAll("input[data-policy-block]").forEach((input) => input.addEventListener("change", () => {
    input.checked ? state.artifactStudio.selectedBlockIds.add(input.dataset.policyBlock) : state.artifactStudio.selectedBlockIds.delete(input.dataset.policyBlock);
    markArtifactBriefStale("The selected policy blocks changed after brief approval.");
    renderProductView();
  }));
  content.querySelector("#policyBlockSearch")?.addEventListener("input", (event) => { state.artifactStudio.blockQuery = event.target.value; renderProductView(); });
  content.querySelectorAll("[data-expand-block]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.expandedBlockId = state.artifactStudio.expandedBlockId === button.dataset.expandBlock ? null : button.dataset.expandBlock; renderProductView(); }));
  content.querySelectorAll("[data-add-block-point]").forEach((button) => button.addEventListener("click", () => addBlockAsBriefPoint(button.dataset.addBlockPoint)));
  content.querySelectorAll("[data-jump-block]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.expandedBlockId = button.dataset.jumpBlock; document.querySelector(`[data-policy-block-card="${CSS.escape(button.dataset.jumpBlock)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }));
  content.querySelector("#sourceContextForm")?.addEventListener("submit", askSelectedSources);
  content.querySelectorAll("[data-brief-text]").forEach((input) => input.addEventListener("input", () => updateBriefPoint(input.dataset.briefText, { statement: input.value, provenance: "author_override" })));
  content.querySelectorAll("[data-brief-use]").forEach((input) => input.addEventListener("change", () => updateBriefPoint(input.dataset.briefUse, { intended_use: input.value })));
  content.querySelectorAll("[data-brief-priority]").forEach((input) => input.addEventListener("change", () => updateBriefPoint(input.dataset.briefPriority, { priority: input.value })));
  content.querySelectorAll("[data-remove-point]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.brief.points = state.artifactStudio.brief.points.filter((point) => point.point_id !== button.dataset.removePoint); markArtifactBriefStale("An approved key point was removed."); renderProductView(); }));
  content.querySelectorAll("[data-move-point]").forEach((button) => button.addEventListener("click", () => moveBriefPoint(button.dataset.pointId, button.dataset.movePoint)));
  content.querySelectorAll("[data-ai-edit]").forEach((button) => button.addEventListener("click", () => editBriefPointWithAI(button.dataset.pointId, button.dataset.aiEdit)));
  content.querySelectorAll("[data-artifact-format]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.requiresBrief || state.artifactStudio.brief.status !== "approved") return handleProductAction("start-artifact-flow");
    state.artifactStudio.format = button.dataset.artifactFormat; state.artifactStudio.step = "template"; renderProductView();
  }));
  content.querySelectorAll("[data-select-artifact-format]").forEach((button) => button.addEventListener("click", () => {
    const format = button.dataset.selectArtifactFormat;
    if (format === "video") return openNotebookDraft("video");
    state.artifactStudio.format = format; state.artifactStudio.step = "template"; renderProductView();
  }));
  content.querySelectorAll("[data-template-id]").forEach((button) => button.addEventListener("click", () => { state.artifactStudio.templateId = button.dataset.templateId; state.artifactStudio.project = buildArtifactProject(button.dataset.templateId); state.artifactStudio.projects[state.artifactStudio.format] = state.artifactStudio.project; state.artifactStudio.step = "compose"; renderProductView(); }));
  content.querySelectorAll("[data-project-field]").forEach((input) => input.addEventListener("input", () => { state.artifactStudio.project[input.dataset.projectField] = input.value; }));
  content.querySelectorAll("[data-project-point]").forEach((input) => input.addEventListener("input", () => { state.artifactStudio.project.key_points[Number(input.dataset.projectPoint)] = input.value; }));
  content.querySelectorAll("input[data-image-slot]").forEach((input) => input.addEventListener("change", () => attachProjectImage(input.dataset.imageSlot, input.files?.[0])));
  content.querySelectorAll("[data-image-fit]").forEach((input) => input.addEventListener("change", () => projectImageSlot(input.dataset.imageFit).fit = input.value));
  content.querySelectorAll("[data-image-caption]").forEach((input) => input.addEventListener("input", () => projectImageSlot(input.dataset.imageCaption).caption = input.value));
  content.querySelectorAll("[data-image-alt]").forEach((input) => input.addEventListener("input", () => projectImageSlot(input.dataset.imageAlt).alt_text = input.value));
  content.querySelectorAll("[data-remove-image]").forEach((button) => button.addEventListener("click", () => { projectImageSlot(button.dataset.removeImage).asset = null; renderProductView(); }));
  content.querySelectorAll("[data-scene-title]").forEach((input) => input.addEventListener("input", () => projectScene(input.dataset.sceneTitle).title = input.value));
  content.querySelectorAll("[data-scene-narration]").forEach((input) => input.addEventListener("input", () => projectScene(input.dataset.sceneNarration).narration = input.value));
  content.querySelectorAll("[data-scene-avatar]").forEach((input) => input.addEventListener("change", () => { projectScene(input.dataset.sceneAvatar).avatar_enabled = input.checked; renderProductView(); }));
  content.querySelectorAll("[data-scene-position]").forEach((input) => input.addEventListener("change", () => projectScene(input.dataset.scenePosition).avatar_position = input.value));
  content.querySelectorAll("[data-preview-scene]").forEach((button) => button.addEventListener("click", () => previewScene(button.dataset.previewScene, button)));
  content.querySelectorAll("[data-download-manifest]").forEach((button) => button.addEventListener("click", () => downloadReleaseManifest(button.dataset.downloadManifest)));
  content.querySelectorAll("[data-download-release]").forEach((button) => button.addEventListener("click", () => downloadReleaseOutput(button.dataset.downloadRelease, button.dataset.output)));
}

function updateBriefPoint(pointId, patch) {
  const point = state.artifactStudio.brief.points.find((item) => item.point_id === pointId);
  if (!point) return;
  Object.assign(point, patch);
  point.review_status = "edited";
  point.ai_edit_history.push({ action: "author_edit", at: new Date().toISOString() });
  markArtifactBriefStale("An approved key point was edited.");
}

function addBlockAsBriefPoint(blockId) {
  const block = allAvailableArtifactBlocks().find((item) => item.block_id === blockId);
  if (!block) return;
  if (!state.artifactStudio.selectedBlockIds.has(blockId)) state.artifactStudio.selectedBlockIds.add(blockId);
  const existing = state.artifactStudio.brief.points.find((point) => point.citations.some((citation) => citation.block_id === blockId));
  if (existing) return showToast("Already in the brief", "This policy block already supports a key point.", "•");
  state.artifactStudio.brief.points.push({ point_id: `point:${Date.now()}`, statement: block.exact_text, intended_use: block.block_type === "procedure" ? "procedure" : "key_fact", priority: block.relevance_score > 95 ? "required" : "supporting", order: state.artifactStudio.brief.points.length, citations: [{ block_id: block.block_id, source_id: block.source_id, label: `${block.title} · ${block.location}` }], provenance: "directly_sourced", ai_edit_history: [], author_notes: "", review_status: "candidate" });
  markArtifactBriefStale("A new sourced key point was added.");
  renderProductView();
  showToast("Added to key points", block.title);
}

async function generateBriefFromBlocks() {
  const blocks = selectedArtifactBlocks();
  if (!blocks.length) return showToast("Select policy blocks", "Choose the focused source blocks that should control the brief.", "!");
  const studio = state.artifactStudio;
  studio.aiStatus = "generating_brief";
  studio.aiError = null;
  renderProductView();
  try {
    const result = await studioJSON("/api/studio/content-brief/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_ids: [...state.selectedSourceIds], selected_blocks: blocks, objective: studio.project?.objective || "" }),
    });
    const generated = result.points || result.content_brief?.points || [];
    studio.brief.points = generated.map((point, index) => ({
      point_id: point.point_id || `point:${crypto.randomUUID()}`,
      statement: point.statement,
      intended_use: point.intended_use,
      priority: point.priority,
      order: index,
      citations: point.citations || [],
      provenance: point.provenance || "ai_rewritten_from_sources",
      ai_edit_history: point.ai_edit_history || [{ action: "candidate_generation", at: new Date().toISOString() }],
      author_notes: point.author_notes || "",
      review_status: point.review_status || "candidate",
    }));
    markArtifactBriefStale("New candidate points were generated from selected blocks.");
    showToast("Candidate key points ready", `${studio.brief.points.length} points are ready for author review.`);
  } catch (error) {
    studio.aiError = error.message;
  }
  studio.aiStatus = "idle";
  renderProductView();
}

async function rankSelectedBlocks() {
  const studio = state.artifactStudio;
  const blocks = selectedArtifactBlocks();
  if (!blocks.length) return showToast("Select source blocks", "Choose the focused blocks you want ranked.", "!");
  studio.aiStatus = "ranking";
  studio.aiError = null;
  renderProductView();
  try {
    const result = await studioJSON("/api/studio/source-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_blocks: blocks, objective: studio.project?.objective || "Identify the most useful material for a training artifact." }),
    });
    const rankings = new Map((result.rankings || []).map((ranking) => [ranking.block_id, ranking]));
    Object.values(studio.sourceBlocks).flat().forEach((block) => {
      const ranking = rankings.get(block.block_id);
      if (ranking) Object.assign(block, ranking);
    });
    showToast("Relevance ranking complete", `${rankings.size} authoritative blocks were scored without changing their text.`);
  } catch (error) {
    studio.aiError = error.message;
    showToast("Ranking unavailable", error.message, "!");
  }
  studio.aiStatus = "idle";
  renderProductView();
}

async function askSelectedSources(event) {
  event.preventDefault();
  const question = document.querySelector("#sourceContextQuestion")?.value.trim();
  if (!question) return;
  const studio = state.artifactStudio;
  studio.contextQuestion = question;
  studio.contextAnswer = null;
  studio.aiStatus = "asking";
  studio.aiError = null;
  renderProductView();
  const selected = selectedArtifactBlocks();
  const expanded = allAvailableArtifactBlocks().filter((block) => block.block_id === studio.expandedBlockId || block.preceding_block_id === studio.expandedBlockId || block.following_block_id === studio.expandedBlockId);
  try {
    studio.contextAnswer = await studioJSON("/api/studio/source-context/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, source_ids: [...state.selectedSourceIds], selected_blocks: selected, expanded_blocks: expanded, objective: studio.project?.objective || "" }),
    });
  } catch (error) {
    studio.aiError = error.message;
  }
  studio.aiStatus = "idle";
  renderProductView();
}

async function askNotebookSources(event) {
  event.preventDefault();
  const notebook = activeNotebookRecord();
  const input = document.querySelector("#notebookChatInput");
  const question = input?.value.trim();
  if (!notebook || !question || state.artifactStudio.notebookQuestionStatus === "asking") return;
  state.artifactStudio.notebookChatDraft = question;
  state.artifactStudio.notebookQuestionStatus = "asking";
  state.artifactStudio.notebookQuestionError = null;
  renderProductView();
  try {
    const result = await studioJSON(`/api/studio/notebooks/${encodeURIComponent(notebook.id)}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    notebook.chat_messages = result.chat_messages || [];
    state.artifactStudio.notebookChatDraft = "";
  } catch (error) {
    state.artifactStudio.notebookQuestionError = error.message;
  }
  state.artifactStudio.notebookQuestionStatus = "idle";
  renderProductView();
}

async function copyNotebookText(text) {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    showToast("Copied", "Text copied to the clipboard.");
  } catch {
    showToast("Copy unavailable", "Select the text and copy it from your browser.", "!");
  }
}

async function showNotebookCitation(sourceId, blockId) {
  const studio = state.artifactStudio;
  studio.notebookCitation = { status: "loading", source_id: sourceId, block_id: blockId, title: "Source citation" };
  renderProductView();
  try {
    const payload = await studioJSON(`/api/studio/sources/${encodeURIComponent(sourceId)}/blocks`);
    const block = (payload.blocks || []).find((item) => item.block_id === blockId);
    if (!block) throw new Error("The cited source block is no longer available.");
    studio.notebookCitation = { status: "ready", ...block };
  } catch (error) {
    studio.notebookCitation = { status: "error", source_id: sourceId, block_id: blockId, title: "Source citation", error: error.message };
  }
  renderProductView();
}

async function addNotebookMessageAsPoint(messageId) {
  const notebook = activeNotebookRecord();
  const message = notebook?.chat_messages?.find((item) => item.id === messageId);
  if (!message?.supported) return;
  await saveNotebookContent("add_point", { point: { statement: message.text, intended_use: "supporting_detail", priority: "supporting", citations: message.citations || [], provenance: "ai_interpretation", author_notes: "", review_status: "candidate" } });
}

async function persistNotebookPoints(points) {
  const notebook = activeNotebookRecord();
  if (!notebook) return;
  notebook.content_brief = { ...(notebook.content_brief || {}), status: "draft", finalized_at: null, points };
  renderProductView();
  await saveNotebookContent("update_points", { points });
}
function addContextAnswerToBrief() {
  const answer = state.artifactStudio.contextAnswer;
  if (!answer?.supported) return;
  state.artifactStudio.brief.points.push({ point_id: `point:answer-${Date.now()}`, statement: answer.text, intended_use: "supporting_detail", priority: "supporting", order: state.artifactStudio.brief.points.length, citations: answer.citations, provenance: "ai_interpretation", ai_edit_history: [{ action: "cited_answer", at: new Date().toISOString() }], author_notes: "", review_status: "candidate" });
  markArtifactBriefStale("A cited answer was added to the content brief.");
  state.artifactStudio.step = "brief";
  renderProductView();
}

function moveBriefPoint(pointId, direction) {
  const points = state.artifactStudio.brief.points;
  const index = points.findIndex((point) => point.point_id === pointId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= points.length) return;
  [points[index], points[target]] = [points[target], points[index]];
  points.forEach((point, pointIndex) => { point.order = pointIndex; });
  markArtifactBriefStale("Approved key-point order changed.");
  renderProductView();
}

async function editBriefPointWithAI(pointId, action) {
  const point = state.artifactStudio.brief.points.find((item) => item.point_id === pointId);
  if (!point) return;
  const studio = state.artifactStudio;
  studio.aiStatus = "editing";
  studio.aiError = null;
  try {
    const result = await studioJSON("/api/studio/content-brief/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, point, supporting_blocks: allAvailableArtifactBlocks().filter((block) => point.citations.some((citation) => citation.block_id === block.block_id)) }),
    });
    const replacements = (result.points || [result.point]).filter(Boolean);
    const index = studio.brief.points.findIndex((item) => item.point_id === pointId);
    studio.brief.points.splice(index, 1, ...replacements);
    studio.brief.points.forEach((item, order) => { item.order = order; item.ai_edit_history ||= []; });
    markArtifactBriefStale("An approved key point was edited with AI.");
  } catch (error) {
    studio.aiError = error.message;
  }
  studio.aiStatus = "idle";
  renderProductView();
}

function approveContentBrief() {
  const brief = state.artifactStudio.brief;
  if (!brief.points.length) return;
  brief.id ||= `brief:bo-${Date.now()}`;
  brief.version += 1;
  brief.status = "approved";
  brief.approved_at = new Date().toISOString();
  brief.approvedSnapshot = JSON.parse(JSON.stringify({ source_ids: [...state.selectedSourceIds], block_ids: [...state.artifactStudio.selectedBlockIds], points: brief.points }));
  brief.staleReason = null;
  state.artifactStudio.step = "format";
  state.artifactStudio.project = null;
  state.artifactStudio.notebookMode = "artifact";
  state.artifactStudio.notebookTab = "create";
  setProductView("notebook");
  showToast("Content brief approved", `Version ${brief.version} is now the controlled artifact input.`);
}

function projectImageSlot(id) { return state.artifactStudio.project.image_slots.find((slot) => slot.id === id); }
function projectScene(id) { return state.artifactStudio.project.scenes.find((scene) => scene.id === id); }

async function attachProjectImage(slotId, file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) return showToast("Image unavailable", "Use a PNG, JPEG, or WebP image no larger than 10 MB.", "!");
  const slot = projectImageSlot(slotId);
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
  slot.asset = { id: `asset:${crypto.randomUUID()}`, name: file.name, type: file.type, size: file.size, url: dataUrl, data_url: dataUrl, provenance: "user_upload" };
  slot.alt_text = "";
  renderProductView();
}

function previewScene(sceneId, button) {
  const scene = projectScene(sceneId);
  const canvas = document.querySelector(".large-slide");
  if (!scene || !canvas) return;
  document.querySelectorAll("[data-preview-scene]").forEach((item) => item.classList.toggle("active", item === button));
  canvas.querySelector(".slide-content strong").textContent = scene.title;
  canvas.querySelector(".slide-content span").textContent = scene.narration;
  const oldAvatar = canvas.querySelector(".avatar-preview");
  if (oldAvatar) oldAvatar.remove();
  if (scene.avatar_enabled) canvas.insertAdjacentHTML("beforeend", `<div class="avatar-preview ${scene.avatar_position}">${materialIcon("person")}<small>HeyGen presenter</small></div>`);
}

async function publishArtifactProject() {
  const project = state.artifactStudio.project;
  project.status = "publishing";
  renderProductView();
  try {
    const renderJob = await studioJSON("/api/studio/renders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-BlueOrigin-Approval": "confirmed" },
      body: JSON.stringify({ project, content_brief: state.artifactStudio.brief.approvedSnapshot, template: curatedArtifactTemplates.find((item) => item.id === project.template_id) }),
    });
    const release = await studioJSON("/api/studio/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-BlueOrigin-Approval": "confirmed" },
      body: JSON.stringify({ project, render_job: renderJob }),
    });
    project.status = "published";
    state.artifactStudio.releases.unshift(release);
    state.artifactStudio.notebookMode = "artifact";
    state.artifactStudio.notebookTab = "releases";
    state.artifactStudio.step = "select";
    renderProductView();
    showToast("Artifact published", `${release.title} is available in Releases.`);
  } catch (error) {
    project.status = "preview_ready";
    state.artifactStudio.aiError = error.message;
    renderProductView();
    showToast("Publish unavailable", error.message, "!");
  }
}

function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

function downloadReleaseManifest(releaseId) {
  const release = state.artifactStudio.releases.find((item) => item.release_id === releaseId);
  if (release) downloadJSON(`${release.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-manifest.json`, release);
}

function downloadReleaseOutput(releaseId, output) {
  const release = state.artifactStudio.releases.find((item) => item.release_id === releaseId);
  if (!release) return;
  const file = (release.files || []).find((item) => item.format === output || item.format?.toUpperCase() === output.toUpperCase());
  if (!file?.download_url) return showToast("File unavailable", `${output} was not produced by the render worker.`, "!");
  const link = document.createElement("a");
  link.href = file.download_url;
  link.download = file.filename || "";
  link.click();
}

async function refreshIntegrationStatus({ quiet = false } = {}) {
  try {
    const response = await fetch("/api/studio/integrations");
    if (response.ok) state.artifactStudio.integrationStatus = await response.json();
  } catch { state.artifactStudio.integrationStatus.notebook = state.openNotebook.live; }
  if (!quiet) { renderProductView(); showToast("Integration status refreshed", "Only configured/not-configured states are exposed."); }
}

renderProductView = function renderArtifactProductView() {
  if (state.route === "simulations") return;
  productHeader(state.route);
  if (window.BlueOriginLighthouse?.routes.has(state.route)) {
    const context = {
      role: state.role,
      navigate: setProductView,
      rerender: renderProductView,
      showToast,
      launchSimulation: (moduleId, blockId, scenarioIndex) => {
        state.lighthouseReturn = { moduleId, blockId };
        selectScenario(scenarioIndex);
        setProductView("simulations");
      },
    };
    dom.screenContent.innerHTML = window.BlueOriginLighthouse.render(state.route, context);
    bindProductViewEvents();
    window.BlueOriginLighthouse.bind(dom.screenContent, context);
    updateContextAction();
    return;
  }
  let html;
  if (state.route === "home") html = renderArtifactHome();
  else if (state.route === "notebook") html = renderNotebookWorkspace();
  else if (state.route === "library") html = renderLibraryWorkspace();
  else if (state.route === "settings") html = renderNotebookSettings();
  else if (state.route === "simulation-builder") html = renderSimulationAuthoring();
  else {
    const renderers = { "scenario-library": renderScenarioLibraryView, "screen-packs": renderScreenPacksView, assignments: renderAssignmentsView, attempts: renderAttemptsView };
    html = (renderers[state.route] || renderArtifactHome)();
  }
  dom.screenContent.innerHTML = html;
  if (state.route === "simulation-builder") bindSimulationAuthoringEvents();
  else if (["home", "notebook", "library", "settings"].includes(state.route)) bindNotebookStudioEvents();
  else bindProductViewEvents();
  updateContextAction();
};

setProductView = function setArtifactProductView(view) {
  const aliases = { notebooks: "notebook", sources: "library", search: "library", video: "notebook", quiz: "notebook", templates: "notebook" };
  if (aliases[view]) {
    if (view === "sources" || view === "search") state.artifactStudio.step = "select";
    if (["video", "quiz", "templates"].includes(view)) { state.artifactStudio.notebookMode = "artifact"; state.artifactStudio.notebookTab = "create"; }
    view = aliases[view];
  }
  if (state.role === "learner" && ["notebook", "library", "simulation-builder", "settings", "lighthouse-builder", "lighthouse-manage"].includes(view)) view = "home";
  state.route = view;
  dom.appShell.dataset.productView = view;
  document.querySelectorAll("[data-view]").forEach((button) => {
    const lighthouseNav = ["lighthouse", "lighthouse-path", "lighthouse-player"].includes(view) ? "lighthouse" : view === "lighthouse-builder" ? "lighthouse-manage" : view;
    const active = button.dataset.view === lighthouseNav || (view === "simulations" && button.dataset.view === "scenario-library");
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  if (view === "simulations") {
    dom.appShell.classList.remove("product-view"); hydrateScenario(); addEvent("navigation", "Opened frozen-package simulation runtime", { target: `package:${getScenario().id}` });
  } else {
    dom.appShell.classList.add("product-view"); closeResponsivePanels(); renderProductView();
    dom.screenContent.scrollTop = 0;
  }
  document.querySelector("#studioSidebar")?.classList.remove("open");
};

handleProductAction = function handleArtifactProductAction(action, trigger = null) {
  const studio = state.artifactStudio;
  if (action === "add-notebook") return openNotebookCreateDialog();
  if (action === "open-notebook" || action === "open-notebook-workspace") { studio.notebookMode = "landing"; studio.notebookTab = "overview"; return setProductView("notebook"); }
  if (action === "create-notebook-workspace") return openNotebookCreateDialog();
  if (action === "close-notebook-create") { studio.notebookCreateDialog = null; studio.notebookCreateError = null; return renderProductView(); }
  if (action === "back-to-notebook-landing") { studio.notebookMode = "landing"; return setProductView("notebook"); }
  if (action === "publish-notebook-workspace") return openNotebookPublish();
  if (action === "close-notebook-publish") { studio.notebookPublish = null; return renderProductView(); }
  if (action === "confirm-notebook-publish") return publishNotebookWorkspace();
  if (action === "retry-notebook-analysis") return analyzeNotebookContent("replace");
  if (action === "expand-notebook-key-points") return analyzeNotebookContent("expand");
  if (action === "add-notebook-key-point") {
    const points = [...(activeNotebookRecord()?.content_brief?.points || []), { point_id: `point:manual-${crypto.randomUUID()}`, statement: "New key point", intended_use: "key_fact", priority: "supporting", citations: [], provenance: "author_input", author_notes: "", review_status: "edited" }];
    return persistNotebookPoints(points);
  }
  if (action === "finalize-notebook-content") return saveNotebookContent("finalize").then((notebook) => {
    if (!notebook) return;
    createInitialNotebookDrafts();
  });
  if (action === "create-all-notebook-drafts") return createInitialNotebookDrafts();
  if (action === "continue-notebook-output") {
    const notebook = activeNotebookRecord();
    if (!notebook?.selected_output || notebook.content_brief?.status !== "approved") return;
    syncArtifactBriefFromNotebook(notebook);
    studio.format = notebook.selected_output;
    studio.step = "template";
    studio.notebookMode = "artifact";
    studio.notebookTab = "create";
    return setProductView("notebook");
  }
  if (action === "close-notebook-citation") { studio.notebookCitation = null; return renderProductView(); }
  if (action === "move-notebook-to-review") return moveNotebookToReview();
  if (action === "retry-notebook-load") return loadNotebookRecords();
  if (action === "open-library") { studio.libraryTargetNotebookId = studio.notebookMode === "workspace" ? studio.activeNotebookId : null; studio.step = "select"; return setProductView("library"); }
  if (action === "use-selected-in-notebook") return useSelectedLibrarySourcesInNotebook();
  if (action === "open-create-tab") { if (studio.brief.status !== "approved") { studio.step = "select"; return setProductView("library"); } studio.notebookMode = "artifact"; studio.notebookTab = "create"; studio.step = "format"; return setProductView("notebook"); }
  if (action === "open-releases") { studio.notebookMode = "artifact"; studio.notebookTab = "releases"; return setProductView("notebook"); }
  if (action === "add-source") return openWriteDialog("source");
  if (action === "review-selected-sources" || action === "start-artifact-flow") {
    studio.step = state.selectedSourceIds.size ? "review" : "select";
    setProductView("library");
    if (state.selectedSourceIds.size) return loadSelectedSourceUnderstanding();
    return;
  }
  if (action === "retry-source-understanding") return loadSelectedSourceUnderstanding();
  if (action === "refresh-notebook") return loadOpenNotebook();
  if (action === "back-to-knowledge") { studio.step = "select"; return setProductView("library"); }
  if (action === "back-to-source-review") { studio.step = "review"; return setProductView("library"); }
  if (action === "review-key-points") { studio.step = "brief"; return renderProductView(); }
  if (action === "generate-brief") return generateBriefFromBlocks();
  if (action === "rank-selected-blocks") return rankSelectedBlocks();
  if (action === "add-answer-to-brief") return addContextAnswerToBrief();
  if (action === "add-manual-point") { studio.brief.points.push({ point_id: `point:manual-${Date.now()}`, statement: "", intended_use: "key_fact", priority: "optional", order: studio.brief.points.length, citations: [], provenance: "author_input", ai_edit_history: [], author_notes: "", review_status: "edited" }); markArtifactBriefStale("An author key point was added."); return renderProductView(); }
  if (action === "approve-content-brief") return approveContentBrief();
  if (action === "back-to-brief") { studio.step = "brief"; return renderProductView(); }
  if (action === "back-to-formats") { studio.step = "format"; return renderProductView(); }
  if (action === "back-to-templates") { studio.step = "template"; return renderProductView(); }
  if (action === "back-to-compose") { studio.step = "compose"; return renderProductView(); }
  if (action === "populate-project-with-ai") return populateProjectWithAI();
  if (action === "generate-artifact-preview") { studio.project.status = "preview_ready"; studio.step = "preview"; return renderProductView(); }
  if (action === "publish-artifact") return publishArtifactProject();
  if (action === "approve-presentation-for-video") return approvePresentationAndCreateVideo();
  if (action === "resume-brief") { studio.step = studio.brief.points.length ? "brief" : "review"; return setProductView("library"); }
  if (action === "refresh-integration-status") return refreshIntegrationStatus();
  return legacyStudioAction(action, trigger);
};

function initializeArtifactStudio() {
  try { state.artifactStudio.libraryClassifications = JSON.parse(localStorage.getItem("blueorigin-library-classifications") || "{}"); } catch { state.artifactStudio.libraryClassifications = {}; }
  try { state.artifactStudio.notebookView = localStorage.getItem("blueorigin-notebook-view") === "list" ? "list" : "grid"; } catch { state.artifactStudio.notebookView = "grid"; }
  const oldButton = document.querySelector("#newButton");
  if (oldButton) {
    const cleanButton = oldButton.cloneNode(true);
    oldButton.replaceWith(cleanButton);
    cleanButton.addEventListener("click", () => {
      const menu = document.querySelector("#newMenu");
      const open = Boolean(menu?.hidden);
      if (menu) menu.hidden = !open;
      cleanButton.setAttribute("aria-expanded", open.toString());
    });
  }
  document.querySelectorAll('[data-view="notebook"]').forEach((button) => button.addEventListener("click", () => { state.artifactStudio.notebookMode = "landing"; setProductView("notebook"); }));
  document.querySelectorAll('[data-view="library"]').forEach((button) => button.addEventListener("click", () => { state.artifactStudio.libraryTargetNotebookId = null; state.artifactStudio.step = "select"; setProductView("library"); }));
  state.artifactStudio.integrationStatus.notebook = state.openNotebook.live;
  refreshIntegrationStatus({ quiet: true });
  loadLibraryRegistry({ quiet: true });
  loadNotebookRecords({ quiet: true });
  setProductView(state.route === "home" ? "home" : state.route);
}

initializeArtifactStudio();
