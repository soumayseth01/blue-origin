import crypto from "node:crypto";
import { db, demoLearnerId, studioActor } from "./db.js";

const statuses = new Set(["draft", "published", "archived"]);
const blockTypes = new Set(["video", "pdf", "download", "text", "quiz", "simulation", "link", "embed"]);
const difficulties = new Set(["Beginner", "Intermediate", "Advanced"]);
const enrollmentStatuses = new Set(["assigned", "in_progress", "completed"]);
const progressStatuses = new Set(["not_started", "in_progress", "completed"]);

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function array(value) { return Array.isArray(value) ? value.map(String).filter(Boolean) : []; }
function id(value, prefix) { const cleaned = String(value || "").trim(); return cleaned || `${prefix}-${crypto.randomUUID()}`; }
function blockContent(block) {
  const { id: _id, block_id: _blockId, type: _type, block_type: _blockType, title: _title, required: _required, minutes: _minutes, estimated_minutes: _estimated, asset_id: _asset, studio_ref: _studio, ...content } = block;
  return content;
}

function normalizeBlock(row) {
  return { id: row.block_id, type: row.block_type, title: row.title, required: row.required, minutes: row.estimated_minutes, assetId: row.asset_id, studioRef: row.studio_ref, ...(row.content || {}) };
}

function normalizeModule(row, blocks = []) {
  return {
    id: row.module_id, pathId: row.path_id, title: row.title, summary: row.summary, description: row.description,
    objectives: row.objectives || [], programs: row.programs || [], audience: row.audience, difficulty: row.difficulty,
    minutes: row.estimated_minutes, accent: row.accent, order: row.position, status: row.status,
    version: row.published_version, blocks,
  };
}

export async function listLighthouseCatalog() {
  const sql = db();
  const learner = demoLearnerId();
  const [pathRows, moduleRows, progressRows, enrollmentRows] = await Promise.all([
    sql`SELECT * FROM lighthouse_paths WHERE published=true ORDER BY position,title`,
    sql`SELECT * FROM lighthouse_modules WHERE status='published' ORDER BY path_id,position,title`,
    sql`SELECT * FROM lighthouse_progress WHERE learner_id=${learner}`,
    sql`SELECT module_id,status,due_at FROM lighthouse_enrollments WHERE learner_id=${learner}`,
  ]);
  const modules = moduleRows.map((row) => row.published_snapshot || normalizeModule(row));
  return {
    paths: pathRows.map((row) => ({ id: row.path_id, title: row.title, summary: row.summary, outcome: row.outcome, programs: row.programs, accent: row.accent, position: row.position })),
    modules,
    progress: progressRows,
    enrollments: enrollmentRows,
  };
}

export async function getLighthouseModule(moduleId, { publishedOnly = false } = {}) {
  const sql = db();
  const rows = await sql`SELECT * FROM lighthouse_modules WHERE module_id=${moduleId} LIMIT 1`;
  const row = rows[0];
  if (!row || (publishedOnly && row.status !== "published")) fail("Lighthouse module not found", 404);
  if (publishedOnly && row.published_snapshot) return row.published_snapshot;
  const blocks = await sql`SELECT * FROM lighthouse_blocks WHERE module_id=${moduleId} ORDER BY position`;
  return normalizeModule(row, blocks.map(normalizeBlock));
}

function validateModule(payload) {
  if (!String(payload.title || "").trim()) fail("Module title is required");
  if (!String(payload.summary || "").trim()) fail("Module summary is required");
  if (!String(payload.pathId || payload.path_id || "").trim()) fail("Learning path is required");
  if (!difficulties.has(payload.difficulty || "Beginner")) fail("Invalid module difficulty");
  if (payload.status && !statuses.has(payload.status)) fail("Invalid module status");
  for (const block of payload.blocks || []) if (!blockTypes.has(block.type || block.block_type)) fail(`Unsupported Lighthouse block type: ${block.type || block.block_type}`);
}

async function replaceBlocks(moduleId, blocks = []) {
  const sql = db();
  await sql`DELETE FROM lighthouse_blocks WHERE module_id=${moduleId}`;
  for (const [position, block] of blocks.entries()) {
    const blockId = id(block.id || block.block_id, `block-${moduleId}`);
    const type = block.type || block.block_type;
    await sql`INSERT INTO lighthouse_blocks (block_id,module_id,position,block_type,title,required,estimated_minutes,content,asset_id,studio_ref)
      VALUES (${blockId},${moduleId},${position},${type},${String(block.title || "Untitled lesson")},${block.required !== false},${Number(block.minutes || block.estimated_minutes || 3)},${JSON.stringify(blockContent(block))}::jsonb,${block.assetId || block.asset_id || null},${block.studioRef || block.studio_ref || block.source || null})`;
  }
}

export async function createLighthouseModule(payload) {
  validateModule(payload);
  const sql = db();
  const actor = studioActor();
  const moduleId = id(payload.id || payload.module_id, "module");
  const pathId = payload.pathId || payload.path_id;
  await sql`INSERT INTO lighthouse_modules (module_id,path_id,title,summary,description,objectives,programs,audience,difficulty,estimated_minutes,accent,position,status,published_version,created_by)
    VALUES (${moduleId},${pathId},${payload.title},${payload.summary},${payload.description || ""},${JSON.stringify(array(payload.objectives))}::jsonb,${array(payload.programs)},${payload.audience || "Eligibility workers"},${payload.difficulty || "Beginner"},${Number(payload.minutes || payload.estimated_minutes || 15)},${payload.accent || "slate"},${Number(payload.order || payload.position || 0)},'draft',${Number(payload.version || 0)},${actor.id})
    ON CONFLICT (module_id) DO UPDATE SET path_id=EXCLUDED.path_id,title=EXCLUDED.title,summary=EXCLUDED.summary,description=EXCLUDED.description,objectives=EXCLUDED.objectives,programs=EXCLUDED.programs,audience=EXCLUDED.audience,difficulty=EXCLUDED.difficulty,estimated_minutes=EXCLUDED.estimated_minutes,accent=EXCLUDED.accent,position=EXCLUDED.position,status=CASE WHEN lighthouse_modules.published_snapshot IS NULL THEN 'draft' ELSE 'published' END,updated_at=now()`;
  await replaceBlocks(moduleId, payload.blocks || []);
  return getLighthouseModule(moduleId);
}

export async function updateLighthouseModule(moduleId, payload) {
  validateModule({ ...payload, id: moduleId });
  const sql = db();
  const existing = await sql`SELECT module_id FROM lighthouse_modules WHERE module_id=${moduleId}`;
  if (!existing.length) return createLighthouseModule({ ...payload, id: moduleId });
  await sql`UPDATE lighthouse_modules SET path_id=${payload.pathId || payload.path_id},title=${payload.title},summary=${payload.summary},description=${payload.description || ""},objectives=${JSON.stringify(array(payload.objectives))}::jsonb,programs=${array(payload.programs)},audience=${payload.audience || "Eligibility workers"},difficulty=${payload.difficulty || "Beginner"},estimated_minutes=${Number(payload.minutes || payload.estimated_minutes || 15)},accent=${payload.accent || "slate"},position=${Number(payload.order || payload.position || 0)},status=CASE WHEN published_snapshot IS NULL THEN 'draft' ELSE 'published' END,updated_at=now() WHERE module_id=${moduleId}`;
  await replaceBlocks(moduleId, payload.blocks || []);
  return getLighthouseModule(moduleId);
}

export async function publishLighthouseModule(moduleId) {
  const sql = db();
  const draft = await getLighthouseModule(moduleId);
  validateModule(draft);
  if (!(draft.objectives?.length && draft.blocks?.length && draft.blocks.every((block) => String(block.title || "").trim()))) fail("Module is missing objectives or content", 409);
  const rows = await sql`SELECT published_version FROM lighthouse_modules WHERE module_id=${moduleId}`;
  const version = Number(rows[0]?.published_version || 0) + 1;
  const snapshot = { ...draft, status: "published", version, publishedAt: new Date().toISOString() };
  await sql`UPDATE lighthouse_modules SET status='published',published_version=${version},published_snapshot=${JSON.stringify(snapshot)}::jsonb,published_at=now(),updated_at=now() WHERE module_id=${moduleId}`;
  return snapshot;
}

export async function assignLighthouseModule(moduleId) {
  const sql = db();
  const actor = studioActor();
  const learner = demoLearnerId();
  const module = await getLighthouseModule(moduleId, { publishedOnly: true });
  await sql`INSERT INTO lighthouse_enrollments (learner_id,module_id,status,assigned_by,due_at) VALUES (${learner},${moduleId},'assigned',${actor.id},now()+interval '14 days') ON CONFLICT (learner_id,module_id) DO UPDATE SET status=CASE WHEN lighthouse_enrollments.status='completed' THEN 'completed' ELSE 'assigned' END,due_at=EXCLUDED.due_at,assigned_by=EXCLUDED.assigned_by,assigned_at=now()`;
  return { module_id: module.id, learner_id: learner, status: "assigned" };
}

export async function archiveLighthouseModule(moduleId) {
  const sql = db();
  const rows = await sql`UPDATE lighthouse_modules SET status='archived',updated_at=now() WHERE module_id=${moduleId} RETURNING module_id,status`;
  if (!rows.length) fail("Lighthouse module not found", 404);
  return rows[0];
}

export async function updateLighthouseProgress(payload) {
  const sql = db();
  const learner = demoLearnerId();
  const moduleId = String(payload.module_id || "");
  const blockId = String(payload.block_id || "");
  const status = String(payload.status || "in_progress");
  if (!(moduleId && blockId && progressStatuses.has(status))) fail("Valid module, block, and progress status are required");
  const percent = Math.max(0, Math.min(100, Number(payload.progress ?? payload.progress_percent ?? (status === "completed" ? 100 : 0))));
  await sql`INSERT INTO lighthouse_progress (learner_id,module_id,block_id,status,progress_percent,position_seconds,quiz_score,completed_at) VALUES (${learner},${moduleId},${blockId},${status},${percent},${Number(payload.position_seconds || 0)},${payload.score ?? payload.quiz_score ?? null},${status === "completed" ? new Date().toISOString() : null}) ON CONFLICT (learner_id,module_id,block_id) DO UPDATE SET status=EXCLUDED.status,progress_percent=EXCLUDED.progress_percent,position_seconds=EXCLUDED.position_seconds,quiz_score=COALESCE(EXCLUDED.quiz_score,lighthouse_progress.quiz_score),completed_at=COALESCE(EXCLUDED.completed_at,lighthouse_progress.completed_at),updated_at=now()`;
  const requiredRows = await sql`SELECT b.block_id,COALESCE(p.status,'not_started') status FROM lighthouse_blocks b LEFT JOIN lighthouse_progress p ON p.block_id=b.block_id AND p.learner_id=${learner} WHERE b.module_id=${moduleId} AND b.required=true`;
  const completed = requiredRows.length > 0 && requiredRows.every((row) => row.status === "completed");
  const enrollmentStatus = completed ? "completed" : "in_progress";
  if (enrollmentStatuses.has(enrollmentStatus)) await sql`INSERT INTO lighthouse_enrollments (learner_id,module_id,status,assigned_by,started_at,completed_at) VALUES (${learner},${moduleId},${enrollmentStatus},'system',now(),${completed ? new Date().toISOString() : null}) ON CONFLICT (learner_id,module_id) DO UPDATE SET status=EXCLUDED.status,started_at=COALESCE(lighthouse_enrollments.started_at,EXCLUDED.started_at),completed_at=COALESCE(EXCLUDED.completed_at,lighthouse_enrollments.completed_at)`;
  return { module_id: moduleId, block_id: blockId, status, progress_percent: percent, module_completed: completed };
}

export async function saveLighthouseQuizAttempt(payload) {
  const sql = db();
  const learner = demoLearnerId();
  const score = Math.max(0, Math.min(100, Number(payload.score || 0)));
  const passed = score >= 80 && payload.passed !== false;
  const rows = await sql`INSERT INTO lighthouse_quiz_attempts (learner_id,module_id,block_id,answers,score,passed) VALUES (${learner},${payload.module_id},${payload.block_id},${JSON.stringify(payload.answers || [])}::jsonb,${score},${passed}) RETURNING attempt_id,score,passed,created_at`;
  await updateLighthouseProgress({ module_id: payload.module_id, block_id: payload.block_id, status: passed ? "completed" : "in_progress", progress: passed ? 100 : 0, score });
  return rows[0];
}

export async function lighthouseLearnerSummary() {
  const sql = db();
  const learner = demoLearnerId();
  const enrollments = await sql`SELECT e.*,m.title,m.summary,m.estimated_minutes,m.path_id FROM lighthouse_enrollments e JOIN lighthouse_modules m ON m.module_id=e.module_id WHERE e.learner_id=${learner} ORDER BY e.assigned_at DESC`;
  const progress = await sql`SELECT * FROM lighthouse_progress WHERE learner_id=${learner} ORDER BY updated_at DESC`;
  return { learner_id: learner, enrollments, progress };
}

export async function lighthouseAnalytics() {
  const sql = db();
  const [enrollments] = await sql`SELECT count(*)::int assigned,count(*) FILTER (WHERE status<>'assigned')::int started,count(*) FILTER (WHERE status='completed')::int completed,COALESCE(round(100.0*count(*) FILTER (WHERE status='completed')/NULLIF(count(*),0)),0)::int completion_rate FROM lighthouse_enrollments`;
  const [scores] = await sql`SELECT COALESCE(round(avg(score)),0)::int average_quiz_score FROM lighthouse_quiz_attempts`;
  return { ...enrollments, ...scores };
}

export async function registerLighthouseAsset(payload) {
  const sql = db();
  const actor = studioActor();
  const kind = ["video", "pdf", "download", "image", "embed"].includes(payload.kind) ? payload.kind : "download";
  const rows = await sql`INSERT INTO lighthouse_assets (title,kind,source,source_ref,file_name,mime_type,byte_size,blob_url,pathname,created_by) VALUES (${payload.title || payload.file_name || "Uploaded asset"},${kind},${payload.source || "upload"},${payload.source_ref || null},${payload.file_name || null},${payload.mime_type || null},${payload.byte_size || null},${payload.blob_url || null},${payload.pathname || null},${actor.id}) ON CONFLICT (blob_url) WHERE blob_url IS NOT NULL DO UPDATE SET title=EXCLUDED.title,kind=EXCLUDED.kind,file_name=EXCLUDED.file_name,mime_type=EXCLUDED.mime_type,byte_size=EXCLUDED.byte_size,pathname=EXCLUDED.pathname RETURNING *`;
  return rows[0];
}

export async function getLighthouseAsset(assetId) {
  const sql = db();
  const rows = await sql`SELECT * FROM lighthouse_assets WHERE asset_id=${assetId} LIMIT 1`;
  if (!rows.length) fail("Lighthouse asset not found", 404);
  return rows[0];
}
