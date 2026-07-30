import crypto from "node:crypto";
import { db, studioActor } from "./db.js";
import { getLibrarySourceContent } from "./library-sources.js";
import { briefPointSchema, citationSchema, structuredOpenAI, understandSource } from "./studio.js";

const STATUSES = new Set(["draft", "in_review", "published", "superseded", "archived"]);
const SCOPES = new Set(["organization", "team", "private"]);
const PROGRAMS = new Set(["Medicaid", "SNAP", "TANF", "Integrated eligibility"]);
const USABLE_EXTRACTION = new Set(["complete", "partial", "verified"]);
const OUTPUT_FORMATS = new Set(["microlearning", "video", "quiz", "job_aid", "presentation"]);
const AI_PROVENANCE = new Set(["directly_sourced", "ai_rewritten_from_sources", "ai_interpretation"]);
const EMPTY_SUMMARY = { status: "idle", text: "", citations: [], source_signature: "", generated_at: null, error: null };
const EMPTY_BRIEF = { status: "draft", version: 0, points: [], source_signature: "", finalized_at: null };

function fail(message, statusCode = 400, details = null) {
  const error = Object.assign(new Error(message), { statusCode });
  if (details) error.details = details;
  throw error;
}

function cleanText(value, label, { required = false, max = 2000 } = {}) {
  const text = String(value ?? "").trim();
  if (required && !text) fail(`${label} is required`);
  if (text.length > max) fail(`${label} is too long`);
  return text;
}

function cleanPrograms(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).filter((item) => PROGRAMS.has(item)))];
}

function cleanScope(value) {
  const scope = String(value || "private");
  if (!SCOPES.has(scope)) fail("Invalid notebook access scope");
  return scope;
}

function uuid(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""))) fail("Invalid notebook ID");
  return String(value);
}

function reviewState(value) {
  if (!value) return "not_scheduled";
  const due = new Date(value).getTime();
  const now = Date.now();
  if (due < now) return "expired";
  if (due - now <= 30 * 24 * 60 * 60 * 1000) return "review_due";
  return "current";
}

function mapNotebook(row, sources = [], { includeContent = false } = {}) {
  const released = row.published_snapshot?.notebook;
  const publishedRelease = released ? {
    title: released.title,
    purpose: released.purpose,
    programs: released.programs || [],
    audience: released.audience,
    owner: { id: released.owner_id, name: released.owner_name },
    access_scope: released.access_scope,
    team_id: released.team_id,
    source_count: Array.isArray(row.published_snapshot.sources) ? row.published_snapshot.sources.length : 0,
    artifact_count: 0,
    review_due_at: row.version_review_due_at || row.published_snapshot.review_due_at,
    review_state: reviewState(row.version_review_due_at || row.published_snapshot.review_due_at),
    published_at: row.version_published_at || row.published_at,
  } : null;
  const mapped = {
    id: row.notebook_id,
    title: row.title,
    purpose: row.purpose,
    objective: row.purpose,
    programs: row.programs || [],
    audience: row.audience,
    instructions: row.instructions,
    owner: { id: row.owner_id, name: row.owner_name },
    status: row.status,
    access_scope: row.access_scope,
    team_id: row.team_id,
    favorite: row.favorite,
    review_due_at: row.review_due_at,
    review_state: reviewState(row.review_due_at),
    published_version: Number(row.published_version || 0),
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_opened_at: row.last_opened_at,
    source_count: Number(row.source_count ?? sources.length),
    artifact_count: Number(row.artifact_count || 0),
    source_ids: sources.map((source) => source.source_id),
    sources,
    published_release: publishedRelease,
  };
  if (includeContent) Object.assign(mapped, {
    source_summary: { ...EMPTY_SUMMARY, ...(row.source_summary || {}) },
    content_brief: { ...EMPTY_BRIEF, ...(row.content_brief || {}), points: row.content_brief?.points || [] },
    selected_output: row.selected_output || null,
    chat_messages: Array.isArray(row.chat_messages) ? row.chat_messages : [],
  });
  return mapped;
}

async function sourcesFor(sql, notebookId) {
  return sql`SELECT ns.source_id,ns.registry_source_id,ns.source_title,ns.source_type,ns.extraction_status,ns.permission_status,ns.source_access_scope,ns.source_team_id,ns.added_at,
      ls.document_type,ls.jurisdiction,ls.owner_name,ls.programs,ls.format_label,ls.effective_label,ls.source_url,ls.description,ls.open_notebook_source_id,ls.checksum_sha256
    FROM notebook_sources ns LEFT JOIN library_sources ls ON ls.source_id=ns.registry_source_id
    WHERE ns.notebook_id=${notebookId} ORDER BY ns.added_at`;
}

async function getRow(sql, notebookId) {
  const rows = await sql`SELECT n.*, (SELECT count(*) FROM notebook_sources s WHERE s.notebook_id=n.notebook_id)::int AS source_count, 0::int AS artifact_count,
      released.snapshot AS published_snapshot, released.published_at AS version_published_at, released.review_due_at AS version_review_due_at
    FROM notebooks n LEFT JOIN LATERAL (
      SELECT snapshot,published_at,review_due_at FROM notebook_versions v WHERE v.notebook_id=n.notebook_id ORDER BY version_number DESC LIMIT 1
    ) released ON true WHERE n.notebook_id=${notebookId}`;
  if (!rows.length) fail("Notebook not found", 404);
  return rows[0];
}

async function event(sql, notebookId, type, actorId, payload = {}) {
  await sql`INSERT INTO notebook_events (notebook_id,event_type,actor_id,event_payload) VALUES (${notebookId},${type},${actorId},${JSON.stringify(payload)}::jsonb)`;
}

function sourceSignature(sources) {
  const values = sources.map((source) => `${source.source_id}:${source.checksum_sha256 || "unversioned"}`).sort();
  return crypto.createHash("sha256").update(values.join("|")).digest("hex");
}

function boundedBlocks(groups, { question = "", maxCharacters = 24_000, maxBlocks = 18 } = {}) {
  const terms = [...new Set(String(question).toLowerCase().match(/[a-z0-9]{3,}/g) || [])];
  const scored = groups.flatMap(({ source, blocks }) => blocks.map((block, index) => ({
    ...block,
    exact_text: block.exact_text.slice(0, 2400),
    _sourceOrder: index,
    _score: terms.reduce((score, term) => score + (`${block.title} ${block.exact_text}`.toLowerCase().includes(term) ? 1 : 0), 0),
    _sourceTitle: source.source_title,
  })));
  if (question) scored.sort((a, b) => b._score - a._score || a._sourceOrder - b._sourceOrder);
  else scored.sort((a, b) => a._sourceOrder - b._sourceOrder);
  const chosen = [];
  const covered = new Set();
  let characters = 0;
  for (const block of scored) {
    if (chosen.length >= maxBlocks) break;
    const value = block.exact_text.length;
    if (characters + value > maxCharacters && covered.has(block.source_id)) continue;
    chosen.push(block); characters += value; covered.add(block.source_id);
  }
  return chosen.map(({ _score, _sourceOrder, _sourceTitle, ...block }) => block);
}

async function notebookSourceContext(sql, notebookId, { question = "" } = {}) {
  const sources = await sourcesFor(sql, notebookId);
  if (!sources.length) fail("Add at least one source before using source AI", 422);
  const groups = [];
  const unavailable = [];
  for (const source of sources) {
    const sourceId = source.registry_source_id || source.source_id;
    const stored = await getLibrarySourceContent(sourceId, { optional: true });
    if (!stored?.content_text) { unavailable.push(source.source_title); continue; }
    const understood = understandSource({ id: source.source_id, title: source.source_title, source_type: source.source_type, content: stored.content_text }, source.source_id);
    groups.push({ source, blocks: understood.blocks });
  }
  if (unavailable.length) fail("Every selected source must finish text extraction before AI analysis", 422, { sources: unavailable });
  const blocks = boundedBlocks(groups, { question });
  if (!blocks.length) fail("The selected sources do not contain usable extracted text", 422);
  return { sources, blocks, signature: sourceSignature(sources) };
}

function validCitations(citations, blocks) {
  const allowed = new Map(blocks.map((block) => [block.block_id, block]));
  return (Array.isArray(citations) ? citations : []).filter((citation) => {
    const block = allowed.get(citation.block_id);
    return block && block.source_id === citation.source_id;
  }).map((citation) => ({ block_id: citation.block_id, source_id: citation.source_id, label: String(citation.label || allowed.get(citation.block_id).title).slice(0, 300) }));
}

function normalizePoint(point, blocks = null, fallbackId = null) {
  const statement = cleanText(point?.statement, "Key point", { required: true, max: 4000 });
  const citations = blocks ? validCitations(point?.citations, blocks) : (Array.isArray(point?.citations) ? point.citations : []).slice(0, 20);
  return {
    point_id: cleanText(point?.point_id || fallbackId || `point:${crypto.randomUUID()}`, "Point ID", { max: 200 }),
    statement,
    intended_use: ["key_fact", "procedure", "warning", "objective", "example", "quiz_concept", "supporting_detail"].includes(point?.intended_use) ? point.intended_use : "key_fact",
    priority: ["required", "optional", "supporting"].includes(point?.priority) ? point.priority : "supporting",
    citations,
    provenance: ["directly_sourced", "ai_rewritten_from_sources", "ai_interpretation", "author_input", "author_override", "unsupported_draft_requiring_review"].includes(point?.provenance) ? point.provenance : "author_input",
    author_notes: cleanText(point?.author_notes, "Author notes", { max: 2000 }),
    review_status: ["candidate", "edited", "reviewed", "needs_review"].includes(point?.review_status) ? point.review_status : "candidate",
  };
}

function mergeGeneratedPoints(currentPoints, generatedPoints, { expand = false } = {}) {
  const preserved = expand ? currentPoints : currentPoints.filter((point) => !AI_PROVENANCE.has(point.provenance) || ["edited", "reviewed", "needs_review"].includes(point.review_status));
  const seen = new Set(preserved.map((point) => point.statement.trim().toLowerCase()));
  for (const point of generatedPoints) {
    const key = point.statement.trim().toLowerCase();
    if (!seen.has(key)) { preserved.push(point); seen.add(key); }
  }
  return preserved.slice(0, 100);
}

function staleNotebookContent(current, removedSourceId = null) {
  const sourceSummary = { ...EMPTY_SUMMARY, ...(current.source_summary || {}), status: "stale", error: null };
  const points = (current.content_brief?.points || []).map((point) => removedSourceId && point.citations?.some((citation) => citation.source_id === removedSourceId) ? { ...point, review_status: "needs_review" } : point);
  const contentBrief = { ...EMPTY_BRIEF, ...(current.content_brief || {}), status: points.length ? "stale" : "draft", points, finalized_at: null };
  return { sourceSummary, contentBrief };
}

export async function listNotebooks(query = {}) {
  const sql = db();
  const rows = await sql`SELECT n.*, (SELECT count(*) FROM notebook_sources s WHERE s.notebook_id=n.notebook_id)::int AS source_count, 0::int AS artifact_count,
      released.snapshot AS published_snapshot, released.published_at AS version_published_at, released.review_due_at AS version_review_due_at
    FROM notebooks n LEFT JOIN LATERAL (
      SELECT snapshot,published_at,review_due_at FROM notebook_versions v WHERE v.notebook_id=n.notebook_id ORDER BY version_number DESC LIMIT 1
    ) released ON true WHERE n.status <> 'archived' ORDER BY n.favorite DESC, COALESCE(n.last_opened_at,n.updated_at) DESC`;
  let items = rows.map((row) => mapNotebook(row));
  const q = String(query.q || "").trim().toLowerCase();
  if (q) items = items.filter((item) => [item.title, item.purpose, item.audience, item.owner.name, ...item.programs].join(" ").toLowerCase().includes(q));
  if (query.access && query.access !== "all") items = items.filter((item) => item.access_scope === query.access);
  if (query.program && query.program !== "all") items = items.filter((item) => item.programs.includes(query.program));
  if (query.status && query.status !== "all") items = items.filter((item) => item.status === query.status);
  const sort = String(query.sort || "recent");
  if (sort === "title") items.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "published") items.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  const pageSize = Math.min(Math.max(Number(query.page_size) || 100, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const total = items.length;
  items = items.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, page_size: pageSize, counts: { published: rows.filter((row) => row.published_version > 0).length, in_review: rows.filter((row) => row.status === "in_review").length, draft: rows.filter((row) => row.status === "draft").length } };
}

export async function createNotebook(body = {}, req) {
  const sql = db();
  const actor = studioActor(req);
  const title = cleanText(body.title || "Untitled notebook", "Notebook name", { max: 160 });
  const purpose = cleanText(body.purpose, "Purpose", { max: 1000 });
  const audience = cleanText(body.audience || "Eligibility operations staff", "Audience", { max: 240 });
  const instructions = cleanText(body.instructions, "Instructions", { max: 2000 });
  const accessScope = cleanScope(body.access_scope);
  const teamId = accessScope === "team" ? cleanText(body.team_id, "Team", { required: true, max: 160 }) : null;
  const programs = cleanPrograms(body.programs);
  const [row] = await sql`INSERT INTO notebooks (title,purpose,programs,audience,instructions,owner_id,owner_name,access_scope,team_id)
    VALUES (${title},${purpose},${programs},${audience},${instructions},${actor.id},${actor.name},${accessScope},${teamId}) RETURNING *`;
  await sql`INSERT INTO notebook_access (notebook_id,principal_type,principal_id,role) VALUES (${row.notebook_id},'user',${actor.id},'owner') ON CONFLICT DO NOTHING`;
  await event(sql, row.notebook_id, "notebook.created", actor.id, { access_scope: accessScope, programs });
  return mapNotebook(row, [], { includeContent: true });
}

export async function getNotebook(id, { touch = false } = {}) {
  const sql = db();
  const notebookId = uuid(id);
  if (touch) await sql`UPDATE notebooks SET last_opened_at=now() WHERE notebook_id=${notebookId}`;
  return mapNotebook(await getRow(sql, notebookId), await sourcesFor(sql, notebookId), { includeContent: true });
}

export async function updateNotebook(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const title = body.title === undefined ? current.title : cleanText(body.title || "Untitled notebook", "Notebook name", { max: 160 });
  const purpose = body.purpose === undefined ? current.purpose : cleanText(body.purpose, "Purpose", { max: 1000 });
  const audience = body.audience === undefined ? current.audience : cleanText(body.audience, "Audience", { required: true, max: 240 });
  const instructions = body.instructions === undefined ? current.instructions : cleanText(body.instructions, "Instructions", { max: 2000 });
  const programs = body.programs === undefined ? current.programs : cleanPrograms(body.programs);
  const accessScope = body.access_scope === undefined ? current.access_scope : cleanScope(body.access_scope);
  const teamId = accessScope === "team" ? cleanText(body.team_id ?? current.team_id, "Team", { required: true, max: 160 }) : null;
  const favorite = body.favorite === undefined ? current.favorite : Boolean(body.favorite);
  const nextStatus = current.published_version > 0 && current.status === "published" && ["title", "purpose", "audience", "instructions", "programs", "access_scope", "team_id"].some((key) => body[key] !== undefined) ? "draft" : current.status;
  const [row] = await sql`UPDATE notebooks SET title=${title},purpose=${purpose},programs=${programs},audience=${audience},instructions=${instructions},access_scope=${accessScope},team_id=${teamId},favorite=${favorite},status=${nextStatus},updated_at=now() WHERE notebook_id=${notebookId} RETURNING *`;
  await event(sql, notebookId, "notebook.updated", actor.id, { fields: Object.keys(body), status: nextStatus });
  return getNotebook(row.notebook_id);
}

export async function addNotebookSource(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const sourceId = cleanText(body.source_id, "Source ID", { required: true, max: 500 });
  const registryRows = await sql`SELECT * FROM library_sources WHERE source_id=${sourceId}`;
  const registry = registryRows[0] || null;
  const title = registry?.title || cleanText(body.source_title, "Source title", { required: true, max: 500 });
  const sourceType = registry?.document_type || cleanText(body.source_type || "Source", "Source type", { max: 120 });
  const extraction = cleanText(registry?.extraction_status || body.extraction_status || "not_reviewed", "Extraction status", { max: 80 }).toLowerCase().replaceAll(" ", "_");
  const permission = registry?.permission_status || (["granted", "unknown", "restricted"].includes(body.permission_status) ? body.permission_status : "unknown");
  const sourceScope = registry?.access_scope || (SCOPES.has(body.source_access_scope) ? body.source_access_scope : "private");
  const sourceTeamId = registry?.team_id || body.source_team_id || null;
  await sql`INSERT INTO notebook_sources (notebook_id,source_id,registry_source_id,source_title,source_type,extraction_status,permission_status,source_access_scope,source_team_id,added_by)
    VALUES (${notebookId},${sourceId},${registry?.source_id || null},${title},${sourceType},${extraction},${permission},${sourceScope},${sourceTeamId},${actor.id})
    ON CONFLICT (notebook_id,source_id) DO UPDATE SET registry_source_id=EXCLUDED.registry_source_id,source_title=EXCLUDED.source_title,source_type=EXCLUDED.source_type,extraction_status=EXCLUDED.extraction_status,permission_status=EXCLUDED.permission_status,source_access_scope=EXCLUDED.source_access_scope,source_team_id=EXCLUDED.source_team_id`;
  const status = current.published_version > 0 ? "draft" : current.status;
  const stale = staleNotebookContent(current);
  await sql`UPDATE notebooks SET status=${status},source_summary=${JSON.stringify(stale.sourceSummary)}::jsonb,content_brief=${JSON.stringify(stale.contentBrief)}::jsonb,updated_at=now() WHERE notebook_id=${notebookId}`;
  await event(sql, notebookId, "source.added", actor.id, { source_id: sourceId, permission_status: permission });
  return getNotebook(notebookId);
}

export async function removeNotebookSource(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const sourceId = cleanText(body.source_id, "Source ID", { required: true, max: 500 });
  await sql`DELETE FROM notebook_sources WHERE notebook_id=${notebookId} AND source_id=${sourceId}`;
  const stale = staleNotebookContent(current, sourceId);
  await sql`UPDATE notebooks SET status=${current.published_version > 0 ? "draft" : current.status},source_summary=${JSON.stringify(stale.sourceSummary)}::jsonb,content_brief=${JSON.stringify(stale.contentBrief)}::jsonb,updated_at=now() WHERE notebook_id=${notebookId}`;
  await event(sql, notebookId, "source.removed", actor.id, { source_id: sourceId });
  return getNotebook(notebookId);
}

export async function analyzeNotebook(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const expand = body.mode === "expand";
  const analyzing = { ...EMPTY_SUMMARY, ...(current.source_summary || {}), status: "analyzing", error: null };
  await sql`UPDATE notebooks SET source_summary=${JSON.stringify(analyzing)}::jsonb,updated_at=now() WHERE notebook_id=${notebookId}`;
  try {
    const context = await notebookSourceContext(sql, notebookId);
    const schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        summary_citations: { type: "array", items: citationSchema },
        points: { type: "array", items: briefPointSchema },
      },
      required: ["summary", "summary_citations", "points"],
      additionalProperties: false,
    };
    const existingStatements = (current.content_brief?.points || []).map((point) => point.statement);
    const generated = await structuredOpenAI(
      expand ? "notebook_key_point_expansion" : "notebook_source_summary",
      expand
        ? "Find additional, non-duplicate candidate key points using only the supplied source blocks. Every point must cite one or more exact supplied block IDs. Do not repeat existing statements. Return a concise source summary as well."
        : "Summarize the selected documents for an author. Create concise candidate key points using only supplied source blocks. Every factual summary and point must retain citations to exact supplied block IDs. Do not use outside knowledge.",
      { notebook: { title: current.title, purpose: current.purpose }, source_ids: context.sources.map((source) => source.source_id), blocks: context.blocks, existing_statements: existingStatements },
      schema,
    );
    const summaryCitations = validCitations(generated.summary_citations, context.blocks);
    const generatedPoints = (generated.points || []).map((point) => normalizePoint(point, context.blocks)).filter((point) => point.citations.length);
    if (!cleanText(generated.summary, "Source summary", { required: true, max: 12_000 }) || !summaryCitations.length || !generatedPoints.length) fail("OpenAI returned content without valid source citations", 502);
    const sourceSummary = { status: "current", text: generated.summary.trim(), citations: summaryCitations, source_signature: context.signature, generated_at: new Date().toISOString(), error: null };
    const points = mergeGeneratedPoints(current.content_brief?.points || [], generatedPoints, { expand });
    const contentBrief = { ...EMPTY_BRIEF, ...(current.content_brief || {}), status: "draft", points, source_signature: context.signature, finalized_at: null };
    await sql`UPDATE notebooks SET source_summary=${JSON.stringify(sourceSummary)}::jsonb,content_brief=${JSON.stringify(contentBrief)}::jsonb,updated_at=now() WHERE notebook_id=${notebookId}`;
    await event(sql, notebookId, expand ? "content.expanded" : "content.analyzed", actor.id, { source_signature: context.signature, point_count: points.length });
    return getNotebook(notebookId);
  } catch (error) {
    const failed = { ...analyzing, status: "error", error: String(error.message || "Source analysis failed").slice(0, 1000) };
    await sql`UPDATE notebooks SET source_summary=${JSON.stringify(failed)}::jsonb,updated_at=now() WHERE notebook_id=${notebookId}`;
    throw error;
  }
}

export async function chatWithNotebook(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const question = cleanText(body.question, "Question", { required: true, max: 3000 });
  const context = await notebookSourceContext(sql, notebookId, { question });
  const schema = {
    type: "object",
    properties: {
      supported: { type: "boolean" },
      text: { type: "string" },
      citations: { type: "array", items: citationSchema },
      interpretation: { type: "string" },
    },
    required: ["supported", "text", "citations", "interpretation"],
    additionalProperties: false,
  };
  const answer = await structuredOpenAI(
    "notebook_source_chat",
    "Answer only from the supplied blocks belonging to this notebook. Cite every factual statement with exact supplied block IDs. If the context is insufficient, set supported=false. Never add outside policy knowledge.",
    { question, notebook: { title: current.title, purpose: current.purpose }, source_ids: context.sources.map((source) => source.source_id), blocks: context.blocks },
    schema,
  );
  const citations = validCitations(answer.citations, context.blocks);
  if (answer.supported && !citations.length) fail("OpenAI returned an answer without valid source citations", 502);
  const now = new Date().toISOString();
  const authorMessage = { id: `message:${crypto.randomUUID()}`, role: "author", text: question, citations: [], supported: true, interpretation: "", created_at: now };
  const assistantMessage = { id: `message:${crypto.randomUUID()}`, role: "assistant", text: cleanText(answer.text, "Answer", { required: true, max: 12_000 }), citations, supported: Boolean(answer.supported), interpretation: cleanText(answer.interpretation, "Interpretation", { max: 4000 }), created_at: new Date().toISOString() };
  const messages = [...(Array.isArray(current.chat_messages) ? current.chat_messages : []), authorMessage, assistantMessage].slice(-200);
  await sql`UPDATE notebooks SET chat_messages=${JSON.stringify(messages)}::jsonb,updated_at=now() WHERE notebook_id=${notebookId}`;
  await event(sql, notebookId, "chat.answered", actor.id, { message_id: assistantMessage.id, citation_count: citations.length });
  return { answer: assistantMessage, chat_messages: messages };
}

export async function updateNotebookContent(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const action = String(body.action || "");
  let selectedOutput = current.selected_output || null;
  let contentBrief = { ...EMPTY_BRIEF, ...(current.content_brief || {}), points: current.content_brief?.points || [] };
  if (action === "select_output") {
    selectedOutput = body.output == null || body.output === "" ? null : String(body.output);
    if (selectedOutput && !OUTPUT_FORMATS.has(selectedOutput)) fail("Unsupported output format", 422);
  } else if (action === "update_points") {
    if (!Array.isArray(body.points)) fail("Key points are required", 422);
    contentBrief = { ...contentBrief, status: "draft", finalized_at: null, points: body.points.slice(0, 100).map((point) => normalizePoint(point)) };
  } else if (action === "add_point") {
    const point = normalizePoint(body.point);
    const duplicate = contentBrief.points.some((existing) => existing.statement.trim().toLowerCase() === point.statement.trim().toLowerCase());
    if (!duplicate) contentBrief = { ...contentBrief, status: "draft", finalized_at: null, points: [...contentBrief.points, point].slice(0, 100) };
  } else if (action === "finalize") {
    const sources = await sourcesFor(sql, notebookId);
    const signature = sourceSignature(sources);
    const issues = [];
    if (!sources.length) issues.push("Add at least one source.");
    if (sources.some((source) => !USABLE_EXTRACTION.has(source.extraction_status))) issues.push("Every source must finish extraction.");
    if (current.source_summary?.status !== "current" || current.source_summary?.source_signature !== signature) issues.push("Refresh the source summary.");
    if (!contentBrief.points.length) issues.push("Add at least one key point.");
    if (contentBrief.points.some((point) => point.review_status === "needs_review")) issues.push("Resolve key points that cite removed sources.");
    if (issues.length) fail("Notebook content is not ready to finalize", 409, { issues });
    contentBrief = { ...contentBrief, status: "approved", version: Number(contentBrief.version || 0) + 1, source_signature: signature, finalized_at: new Date().toISOString(), approved_snapshot: { source_ids: sources.map((source) => source.source_id), points: contentBrief.points } };
  } else fail("Unsupported notebook content action", 422);
  await sql`UPDATE notebooks SET content_brief=${JSON.stringify(contentBrief)}::jsonb,selected_output=${selectedOutput},updated_at=now() WHERE notebook_id=${notebookId}`;
  await event(sql, notebookId, `content.${action}`, actor.id, { output: selectedOutput, point_count: contentBrief.points.length, version: contentBrief.version });
  return getNotebook(notebookId);
}

export async function setNotebookReview(id) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  await getRow(sql, notebookId);
  const [row] = await sql`UPDATE notebooks SET status='in_review',updated_at=now() WHERE notebook_id=${notebookId} RETURNING *`;
  await event(sql, notebookId, "notebook.review_started", actor.id);
  return getNotebook(row.notebook_id);
}

export async function publishNotebook(id, body = {}) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  const current = await getRow(sql, notebookId);
  const sources = await sourcesFor(sql, notebookId);
  const due = new Date(body.review_due_at || current.review_due_at || "");
  const issues = [];
  if (!current.title.trim() || current.title.trim().toLowerCase() === "untitled notebook") issues.push("Replace the default notebook name before publishing.");
  if (!current.purpose.trim()) issues.push("Purpose is required.");
  if (!sources.length) issues.push("Add at least one source.");
  if (sources.length && (current.source_summary?.status !== "current" || current.source_summary?.source_signature !== sourceSignature(sources))) issues.push("Refresh the source summary.");
  if (current.content_brief?.status !== "approved") issues.push("Finalize the notebook key points.");
  if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) issues.push("Choose a future review date.");
  const incomplete = sources.filter((source) => !USABLE_EXTRACTION.has(source.extraction_status));
  if (incomplete.length) issues.push(`${incomplete.length} source${incomplete.length === 1 ? " is" : "s are"} not ready for publication.`);
  const accessConflicts = sources.filter((source) => current.access_scope === "organization" ? source.source_access_scope !== "organization" || source.permission_status !== "granted" : current.access_scope === "team" ? !((source.source_access_scope === "organization" || (source.source_access_scope === "team" && source.source_team_id === current.team_id)) && source.permission_status === "granted") : source.permission_status === "restricted");
  if (accessConflicts.length) issues.push(`${accessConflicts.length} linked source${accessConflicts.length === 1 ? " has" : "s have"} incompatible access.`);
  if (issues.length) fail("Notebook is not ready to publish", 409, { issues, source_ids: accessConflicts.map((source) => source.source_id) });
  const version = Number(current.published_version || 0) + 1;
  const snapshot = { notebook: { title: current.title, purpose: current.purpose, programs: current.programs, audience: current.audience, instructions: current.instructions, owner_id: current.owner_id, owner_name: current.owner_name, access_scope: current.access_scope, team_id: current.team_id }, sources, content_brief: current.content_brief || EMPTY_BRIEF, selected_output: current.selected_output || null, review_due_at: due.toISOString() };
  const checksum = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  await sql`INSERT INTO notebook_versions (notebook_id,version_number,snapshot,checksum_sha256,published_by,review_due_at) VALUES (${notebookId},${version},${JSON.stringify(snapshot)}::jsonb,${checksum},${actor.id},${due.toISOString()})`;
  const [row] = await sql`UPDATE notebooks SET status='published',published_version=${version},published_at=now(),review_due_at=${due.toISOString()},updated_at=now() WHERE notebook_id=${notebookId} RETURNING *`;
  await event(sql, notebookId, "notebook.published", actor.id, { version, checksum, review_due_at: due.toISOString() });
  return mapNotebook(row, sources, { includeContent: true });
}

export async function archiveNotebook(id) {
  const sql = db();
  const actor = studioActor();
  const notebookId = uuid(id);
  await getRow(sql, notebookId);
  const [row] = await sql`UPDATE notebooks SET status='archived',updated_at=now() WHERE notebook_id=${notebookId} RETURNING *`;
  await event(sql, notebookId, "notebook.archived", actor.id);
  return mapNotebook(row, await sourcesFor(sql, notebookId), { includeContent: true });
}

export async function notebookVersions(id) {
  const sql = db();
  const notebookId = uuid(id);
  await getRow(sql, notebookId);
  return sql`SELECT notebook_version_id,version_number,checksum_sha256,published_by,published_at,review_due_at FROM notebook_versions WHERE notebook_id=${notebookId} ORDER BY version_number DESC`;
}

export async function notebookEvents(id) {
  const sql = db();
  const notebookId = uuid(id);
  await getRow(sql, notebookId);
  return sql`SELECT event_id,event_type,actor_id,event_payload,created_at FROM notebook_events WHERE notebook_id=${notebookId} ORDER BY created_at DESC LIMIT 200`;
}
