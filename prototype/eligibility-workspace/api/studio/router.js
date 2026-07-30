import crypto from "node:crypto";
import { allowMethod, enforceRateLimit, enforceSameOrigin, handleError, send } from "../_lib/http.js";
import {
  briefPointSchema,
  citationSchema,
  fetchNotebookSource,
  proxyRender,
  requestBody,
  requireApproval,
  structuredOpenAI,
  understandSource,
} from "../_lib/studio.js";
import { simulationGenerationInstructions, simulationGenerationSchema, validateGeneratedSimulation, validateSimulationGenerationRequest } from "../_lib/simulation-schema.js";
import { appendLibraryUploadChunk, archiveLibrarySource, createLibrarySource, deleteLibrarySource, getLibrarySource, getLibrarySourceContent, importLibrarySources, listLibrarySources, storedDocumentBytes } from "../_lib/library-sources.js";
import {
  addNotebookSource,
  analyzeNotebook,
  archiveNotebook,
  chatWithNotebook,
  createNotebook,
  getNotebook,
  listNotebooks,
  notebookEvents,
  notebookVersions,
  publishNotebook,
  removeNotebookSource,
  setNotebookReview,
  updateNotebook,
  updateNotebookArtifacts,
  updateNotebookContent,
} from "../_lib/notebooks.js";

const briefSchema = { type: "object", properties: { points: { type: "array", items: briefPointSchema } }, required: ["points"], additionalProperties: false };

function routePath(req) {
  const actions = {
    integrations: ["integrations"],
    "source-outline": ["sources", String(req.query.id || ""), "outline"],
    "source-blocks": ["sources", String(req.query.id || ""), "blocks"],
    "source-context": ["source-context", "ask"],
    "source-review": ["source-review"],
    "brief-generate": ["content-brief", "generate"],
    "brief-edit": ["content-brief", "edit"],
    projects: ["projects"],
    renders: ["renders"],
    releases: ["releases"],
    "simulation-generate": ["simulations", "generate"],
    notebooks: ["notebooks"],
    "library-sources": ["library-sources"],
    "library-source": ["library-sources", String(req.query.id || "")],
    "library-source-document": ["library-sources", String(req.query.id || ""), "document"],
    "library-source-upload": ["library-sources", String(req.query.id || ""), "upload"],
    "library-source-import": ["library-sources", "import"],
    notebook: ["notebooks", String(req.query.id || "")],
    "notebook-sources": ["notebooks", String(req.query.id || ""), "sources"],
    "notebook-analyze": ["notebooks", String(req.query.id || ""), "analyze"],
    "notebook-chat": ["notebooks", String(req.query.id || ""), "chat"],
    "notebook-content": ["notebooks", String(req.query.id || ""), "content"],
    "notebook-artifacts": ["notebooks", String(req.query.id || ""), "artifacts"],
    "notebook-export": ["notebooks", String(req.query.id || ""), "exports", String(req.query.format || "")],
    "notebook-video": ["notebooks", String(req.query.id || ""), "video"],
    "notebook-review": ["notebooks", String(req.query.id || ""), "review"],
    "notebook-publish": ["notebooks", String(req.query.id || ""), "publish"],
    "notebook-archive": ["notebooks", String(req.query.id || ""), "archive"],
    "notebook-versions": ["notebooks", String(req.query.id || ""), "versions"],
    "notebook-events": ["notebooks", String(req.query.id || ""), "events"],
  };
  if (actions[req.query.action]) return actions[req.query.action];
  const pathname = new URL(req.url || "/", "https://studio.local").pathname;
  const marker = "/api/studio/";
  if (pathname.includes(marker)) return pathname.slice(pathname.indexOf(marker) + marker.length).split("/").filter(Boolean).map(decodeURIComponent);
  const value = req.query.path;
  return (Array.isArray(value) ? value : [value]).filter(Boolean).map(value => decodeURIComponent(String(value)));
}

async function notebookRoute(req, res, parts) {
  enforceRateLimit(req, req.method === "GET" ? 90 : 30);
  if (req.method !== "GET") enforceSameOrigin(req);
  const id = parts[1];
  const action = parts[2];
  if (!id) {
    if (req.method === "GET") return send(res, 200, await listNotebooks(req.query || {}));
    if (req.method === "POST") return send(res, 201, await createNotebook(requestBody(req), req));
  } else if (!action) {
    if (req.method === "GET") return send(res, 200, await getNotebook(id, { touch: true }));
    if (req.method === "PATCH") return send(res, 200, await updateNotebook(id, requestBody(req)));
  } else if (action === "sources") {
    if (req.method === "POST") return send(res, 200, await addNotebookSource(id, requestBody(req)));
    if (req.method === "DELETE") return send(res, 200, await removeNotebookSource(id, requestBody(req)));
  } else if (action === "analyze" && req.method === "POST") return send(res, 200, await analyzeNotebook(id, requestBody(req)));
  else if (action === "chat" && req.method === "POST") return send(res, 200, await chatWithNotebook(id, requestBody(req)));
  else if (action === "content" && req.method === "PATCH") return send(res, 200, await updateNotebookContent(id, requestBody(req)));
  else if (action === "artifacts" && req.method === "PATCH") return send(res, 200, await updateNotebookArtifacts(id, requestBody(req)));
  else if (action === "exports" && req.method === "GET") {
    const { buildNotebookExport, sendNotebookExport } = await import("../_lib/notebook-exports.js");
    return sendNotebookExport(res, await buildNotebookExport(await getNotebook(id), parts[3]));
  }
  else if (action === "video" && req.method === "POST") {
    const { startNotebookVideo } = await import("../_lib/notebook-video.js");
    return send(res, 202, await startNotebookVideo(id));
  }
  else if (action === "video" && req.method === "GET") {
    const { refreshNotebookVideo } = await import("../_lib/notebook-video.js");
    return send(res, 200, await refreshNotebookVideo(id));
  }
  else if (action === "review" && req.method === "POST") return send(res, 200, await setNotebookReview(id));
  else if (action === "publish" && req.method === "POST") return send(res, 200, await publishNotebook(id, requestBody(req)));
  else if (action === "archive" && req.method === "POST") return send(res, 200, await archiveNotebook(id));
  else if (action === "versions" && req.method === "GET") return send(res, 200, { items: await notebookVersions(id) });
  else if (action === "events" && req.method === "GET") return send(res, 200, { items: await notebookEvents(id) });
  res.setHeader("Allow", id ? "GET, PATCH, POST, DELETE" : "GET, POST");
  return send(res, 405, { detail: "Unsupported notebook operation" });
}

function requirePost(req, res, limit = 20) {
  if (!allowMethod(req, res, "POST")) return false;
  enforceSameOrigin(req);
  enforceRateLimit(req, limit);
  return true;
}

async function sourceRoute(req, res, parts) {
  if (!allowMethod(req, res, "GET")) return;
  enforceRateLimit(req, 60);
  const id = decodeURIComponent(parts[1] || "");
  const registry = await getLibrarySource(id, { optional: true });
  let sourceRecord;
  if (registry?.open_notebook_source_id) sourceRecord = await fetchNotebookSource(registry.open_notebook_source_id);
  else if (registry?.has_extracted_text) {
    const stored = await getLibrarySourceContent(id);
    sourceRecord = { id, title: registry.title, source_type: registry.document_type, content: stored.content_text, created_at: registry.fetched_at, status: registry.status, topics: registry.programs, metadata: { is_policy: /policy|manual|bulletin/i.test(registry.document_type) } };
  } else if (registry) throw Object.assign(new Error("Import this Library document before reviewing its source content"), { statusCode: 409 });
  else sourceRecord = await fetchNotebookSource(id);
  const result = understandSource(sourceRecord, id);
  if (parts[2] === "outline") return send(res, 200, { source: result.source });
  if (parts[2] === "blocks") return send(res, 200, { source_id: id, blocks: result.blocks });
  return send(res, 404, { detail: "Studio source route not found" });
}

async function storedDocumentRoute(req, res, id) {
  if (!allowMethod(req, res, "GET")) return;
  enforceRateLimit(req, 120);
  const stored = await getLibrarySourceContent(id);
  const bytes = storedDocumentBytes(stored.content_bytes);
  const fileName = String(stored.file_name || "document").replace(/[\r\n"\\]/g, "-");
  res.statusCode = 200;
  res.setHeader("Content-Type", stored.content_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.setHeader("Content-Length", String(bytes.length));
  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(bytes);
}

async function importLibraryRoute(req, res) {
  if (!requirePost(req, res, 5)) return;
  const body = requestBody(req);
  const sourceIds = body.source_ids || (body.source_id ? [body.source_id] : []);
  return send(res, 200, await importLibrarySources(sourceIds));
}

async function askContext(req, res) {
  if (!requirePost(req, res)) return;
  const body = requestBody(req);
  if (!(body.selected_blocks?.length || body.expanded_blocks?.length)) throw Object.assign(new Error("Selected or expanded blocks required"), { statusCode: 400 });
  const schema = { type: "object", properties: { question: { type: "string" }, supported: { type: "boolean" }, text: { type: "string" }, citations: { type: "array", items: citationSchema }, interpretation: { type: "string" } }, required: ["question", "supported", "text", "citations", "interpretation"], additionalProperties: false };
  send(res, 200, await structuredOpenAI("context_answer", "Answer only from selected and explicitly expanded blocks. Cite every factual statement with supplied IDs. Do not use outside knowledge. If insufficient, set supported=false and return no citations. Separate inference in interpretation.", body, schema));
}

async function rankBlocks(req, res) {
  if (!requirePost(req, res)) return;
  const body = requestBody(req);
  if (!body.selected_blocks?.length) throw Object.assign(new Error("Selected blocks required"), { statusCode: 400 });
  const ranking = { type: "object", properties: { block_id: { type: "string" }, relevance_score: { type: "integer", minimum: 0, maximum: 100 }, relevance_explanation: { type: "string" } }, required: ["block_id", "relevance_score", "relevance_explanation"], additionalProperties: false };
  const schema = { type: "object", properties: { rankings: { type: "array", items: ranking } }, required: ["rankings"], additionalProperties: false };
  send(res, 200, await structuredOpenAI("policy_block_ranking", "Rank only the supplied blocks against the artifact objective. Return every exact block ID with an integer relevance score and concise explanation. Never rewrite, merge, omit, or add blocks.", body, schema));
}

async function generateBrief(req, res) {
  if (!requirePost(req, res, 15)) return;
  const body = requestBody(req);
  if (!body.selected_blocks?.length) throw Object.assign(new Error("Selected blocks required"), { statusCode: 400 });
  send(res, 200, await structuredOpenAI("content_brief", "Create candidate points only from supplied authoritative blocks. Do not add outside policy knowledge. Preserve accurate citations and distinguish rewrites from interpretations. Use unique point: IDs.", body, briefSchema));
}

async function editBrief(req, res) {
  if (!requirePost(req, res)) return;
  const body = requestBody(req);
  send(res, 200, await structuredOpenAI("brief_point_edit", "Apply only the requested edit. Preserve citations only while meaning remains supported; otherwise remove them and use unsupported_draft_requiring_review. Split may return multiple points. Do not add outside facts.", body, briefSchema));
}

async function populateProject(req, res) {
  if (!requirePost(req, res, 12)) return;
  const body = requestBody(req);
  const scene = { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, narration: { type: "string" }, avatar_enabled: { type: "boolean" }, avatar_position: { type: "string", enum: ["left", "right"] } }, required: ["id", "title", "narration", "avatar_enabled", "avatar_position"], additionalProperties: false };
  const quiz = { type: "object", properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } }, correct_index: { type: "integer", minimum: 0 }, explanation: { type: "string" }, citations: { type: "array", items: citationSchema } }, required: ["question", "options", "correct_index", "explanation", "citations"], additionalProperties: false };
  const schema = { type: "object", properties: { title: { type: "string" }, audience: { type: "string" }, objective: { type: "string" }, summary: { type: "string" }, key_points: { type: "array", items: { type: "string" } }, scenes: { type: "array", items: scene }, quiz_items: { type: "array", items: quiz } }, required: ["title", "audience", "objective", "summary", "key_points", "scenes", "quiz_items"], additionalProperties: false };
  send(res, 200, await structuredOpenAI("template_slot_population", "Populate only from the immutable approved brief and author context. Never resummarize complete sources. Preserve scene IDs, keep narration faithful, create cited quiz items only for quizzes, and never enable avatars automatically.", body, schema));
}

async function generateSimulation(req, res) {
  if (!requirePost(req, res, 10)) return;
  const body = validateSimulationGenerationRequest(requestBody(req));
  const generated = await structuredOpenAI("synthetic_simulation_case", simulationGenerationInstructions, body, simulationGenerationSchema);
  send(res, 200, validateGeneratedSimulation(generated, body.setup.programs));
}

async function recommendCoachWording(req, res) {
  if (!requirePost(req, res)) return;
  const body = requestBody(req);
  const recommendation = body.recommendation;
  const allowedActions = new Set(["ask", "enter", "review", "correct", "navigate", "validate", "explain", "close"]);
  if (!recommendation || !allowedActions.has(recommendation.action_type)) throw Object.assign(new Error("A deterministic coach recommendation is required"), { statusCode: 400 });
  if (!recommendation.target || !recommendation.policy || !recommendation.information) throw Object.assign(new Error("Grounded target, information, and policy are required"), { statusCode: 400 });
  const safePayload = {
    action_type: recommendation.action_type,
    title: String(recommendation.title || "").slice(0, 240),
    instruction: String(recommendation.instruction || "").slice(0, 600),
    target_label: String(recommendation.target.label || "Current workflow").slice(0, 180),
    information_value: recommendation.information.value == null ? null : String(recommendation.information.value).slice(0, 180),
    information_provenance: String(recommendation.information.provenance || "Approved workflow source").slice(0, 180),
    information_disclosed: Boolean(recommendation.information.disclosed),
    policy_summary: String(recommendation.policy.summary || "").slice(0, 600),
    caller_signal: String(body.context?.caller_signal || "").slice(0, 120),
  };
  const schema = {
    type: "object",
    properties: { title: { type: "string", minLength: 1, maxLength: 240 }, instruction: { type: "string", minLength: 1, maxLength: 600 } },
    required: ["title", "instruction"], additionalProperties: false,
  };
  const wording = await structuredOpenAI(
    "grounded_coach_wording",
    "Rewrite only the supplied title and instruction as concise worker guidance. Preserve the selected action, target, value, provenance, disclosure state, and policy meaning exactly. Never add a value, policy claim, citation, eligibility conclusion, or system action. If information_disclosed is false, do not reveal or infer a value. Use plain language and no markdown.",
    safePayload,
    schema,
  );
  send(res, 200, { ...recommendation, title: wording.title, instruction: wording.instruction, source: "ai_grounded_wording" });
}

async function renderProject(req, res) {
  if (!requirePost(req, res, 10)) return;
  requireApproval(req);
  send(res, 200, await proxyRender(requestBody(req)));
}

function releaseProject(req, res) {
  if (!requirePost(req, res, 10)) return;
  requireApproval(req);
  const { project, render_job: render } = requestBody(req);
  if (!project || !render || render.status !== "completed") throw Object.assign(new Error("Completed render job required"), { statusCode: 409 });
  send(res, 200, { release_id: `release:${crypto.randomUUID()}`, project_id: project.project_id, notebook_id: project.notebook_id || null, title: project.title, format: project.format, version: project.version || 1, derived_from: project.derived_from || null, template_id: project.template_id, brief_id: project.brief_id, brief_version: project.brief_version, source_ids: project.source_ids || [], outputs: (render.files || []).map(file => file.format), files: render.files || [], published_at: new Date().toISOString(), status: "published", notebook_status: "pending", checksums: Object.fromEntries((render.files || []).map(file => [file.format, file.checksum])) });
}

export default async function handler(req, res) {
  try {
    const parts = routePath(req);
    const route = parts.join("/");
    if (route === "integrations") {
      if (!allowMethod(req, res, "GET")) return;
      const { notebookVideoHealth, notebookVideoOptions } = await import("../_lib/notebook-video.js");
      const video = await notebookVideoHealth();
      const options = video.healthy ? await notebookVideoOptions().catch(()=>({ avatars: [], voices: [] })) : { avatars: [], voices: [] };
      return send(res, 200, { openai: Boolean(process.env.OPENAI_API_KEY), heygen: video.healthy, heygen_configured: video.configured, heygen_error: video.error, heygen_avatars: options.avatars, heygen_voices: options.voices, notebook: Boolean(process.env.OPEN_NOTEBOOK_API_URL), blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN), worker: Boolean(process.env.ARTIFACT_WORKER_URL) });
    }
    if (parts[0] === "notebooks") return await notebookRoute(req, res, parts);
    if (parts[0] === "library-sources") {
      if (parts[1] === "import") return await importLibraryRoute(req, res);
      if (parts[2] === "document") return await storedDocumentRoute(req, res, parts[1]);
      if (parts[2] === "upload") {
        if (!requirePost(req, res, 60)) return;
        return send(res, 200, await appendLibraryUploadChunk(parts[1], requestBody(req)));
      }
      enforceRateLimit(req, req.method === "GET" ? 90 : 20);
      if (req.method === "GET") return send(res, 200, parts[1] ? await getLibrarySource(parts[1]) : await listLibrarySources(req.query || {}));
      if (!parts[1] && req.method === "POST") {
        enforceSameOrigin(req);
        return send(res, 201, await createLibrarySource(requestBody(req)));
      }
      if (parts[1] && req.method === "PATCH") {
        enforceSameOrigin(req);
        if (requestBody(req).action !== "archive") throw Object.assign(new Error("Unsupported Library action"), { statusCode: 422 });
        return send(res, 200, await archiveLibrarySource(parts[1]));
      }
      if (parts[1] && req.method === "DELETE") {
        enforceSameOrigin(req);
        return send(res, 200, await deleteLibrarySource(parts[1]));
      }
      res.setHeader("Allow", parts[1] ? "GET, PATCH, DELETE" : "GET, POST");
      return send(res, 405, { detail: "Unsupported Library operation" });
    }
    if (parts[0] === "sources" && parts.length === 3) return await sourceRoute(req, res, parts);
    if (route === "source-context/ask") return await askContext(req, res);
    if (route === "source-review") return await rankBlocks(req, res);
    if (route === "content-brief/generate") return await generateBrief(req, res);
    if (route === "content-brief/edit") return await editBrief(req, res);
    if (route === "coach/recommend") return await recommendCoachWording(req, res);
    if (route === "simulations/generate") return await generateSimulation(req, res);
    if (route === "projects") return await populateProject(req, res);
    if (route === "renders") return await renderProject(req, res);
    if (route === "releases") return releaseProject(req, res);
    return send(res, 404, { detail: "Studio route not found" });
  } catch (error) { handleError(res, error); }
}
