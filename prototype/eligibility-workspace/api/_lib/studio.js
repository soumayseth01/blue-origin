import crypto from "node:crypto";

function fail(message, statusCode = 500) {
  throw Object.assign(new Error(message), { statusCode });
}

export function requireApproval(req) {
  if (req.headers["x-blueorigin-approval"] !== "confirmed") fail("Explicit approval is required", 428);
}

export function requestBody(req) {
  if (!req.body) fail("JSON request body required", 400);
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function notebookBase() {
  const value = process.env.OPEN_NOTEBOOK_API_URL;
  if (!value) fail("OPEN_NOTEBOOK_API_URL is not configured", 503);
  return value.replace(/\/$/, "");
}

export async function fetchNotebookSource(sourceId) {
  const response = await fetch(`${notebookBase()}/api/sources/${encodeURIComponent(sourceId)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) fail(`Open Notebook source request failed (${response.status})`, 502);
  const payload = await response.json();
  return payload.source || payload.result || payload.data || payload;
}

function firstText(record) {
  for (const key of ["full_text", "extracted_text", "markdown", "text", "content", "transcription", "body"]) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = firstText(value);
      if (nested) return nested;
    }
  }
  return record?.asset && typeof record.asset === "object" ? firstText(record.asset) : "";
}

function blockType(line, body) {
  if (/^\s*(table\s+\d+|\|.+\|)/i.test(line) || body.includes("\n|")) return "table";
  if (/^\s*\d+(?:\.\d+)*[.)]?\s+/.test(line)) return "numbered_clause";
  if (/^\s*[-*+]\s+/.test(body)) return "list";
  return line.startsWith("#") ? "section" : "paragraph";
}

export function understandSource(record, requestedId) {
  let text = firstText(record);
  if (!text) fail("The selected Notebook source does not contain extracted text yet", 422);
  const wrappedMarkdown = text.match(/(?:^|\n)Markdown Content:\s*([\s\S]+)$/i);
  if (wrappedMarkdown) text = wrappedMarkdown[1].trim();
  const sourceId = String(record.id || record.source_id || requestedId);
  const title = String(record.title || record.name || record.asset?.title || "Untitled source");
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const chunks = [];
  let path = [title];
  let page = 1;
  let buffer = [];
  let startPath = [...path];
  let startPage = page;
  const flush = () => {
    const exact = buffer.join("\n").trim();
    if (exact) chunks.push({ exact, path: [...startPath], page: startPage, type: blockType(buffer[0] || "", exact) });
    buffer = [];
  };
  for (let line of lines) {
    const pageMatch = line.match(/^\s*(?:page|p\.)\s*(\d+)/i);
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    const numbered = line.match(/^\s*\d+(?:\.\d+){0,5}[.)]?\s+.+/);
    if (pageMatch) { flush(); page = Number(pageMatch[1]); continue; }
    if (line.includes("\f")) { flush(); page += (line.match(/\f/g) || []).length; line = line.replace(/\f/g, "").trim(); }
    if (heading) {
      flush();
      path = path.slice(0, heading[1].length);
      path.push(heading[2].trim());
      startPath = [...path]; startPage = page; buffer = [line];
      continue;
    }
    if (numbered && buffer.length) { flush(); startPath = [...path, line.trim().slice(0, 160)]; startPage = page; buffer = [line]; continue; }
    if (!line.trim()) { flush(); startPath = [...path]; startPage = page; continue; }
    if (!buffer.length) { startPath = [...path]; startPage = page; }
    buffer.push(line.replace(/\s+$/, ""));
    if (buffer.reduce((sum, value) => sum + value.length + 1, 0) >= 4000) flush();
  }
  flush();
  const blocks = chunks.map((chunk, index) => {
    const checksum = crypto.createHash("sha256").update(chunk.exact).digest("hex");
    return {
      block_id: `block:${sourceId.replace(/:/g, "-")}-${checksum.slice(0, 16)}`,
      source_id: sourceId,
      source_title: title,
      heading_path: chunk.path,
      title: (chunk.path.at(-1) === title ? chunk.exact.split("\n")[0] : chunk.path.at(-1)).replace(/^#+\s*/, "").slice(0, 160),
      exact_text: chunk.exact,
      location: `p. ${chunk.page}`,
      block_type: chunk.type,
      preceding_block_id: null,
      following_block_id: null,
      table_references: [], image_references: [], effective_date: null,
      checksum: `sha256:${checksum}`,
      extraction_confidence: null, relevance_score: null, relevance_explanation: null,
    };
  });
  blocks.forEach((block, index) => {
    block.preceding_block_id = blocks[index - 1]?.block_id || null;
    block.following_block_id = blocks[index + 1]?.block_id || null;
  });
  const metadata = record.metadata && typeof record.metadata === "object" ? record.metadata : {};
  const sourceType = String(record.source_type || record.type || metadata.type || "Source");
  const topics = record.topics || record.tags || [];
  return {
    source: {
      source_id: sourceId, title, source_type: sourceType,
      date: record.date || record.created_at || metadata.date || null,
      status: record.status || null, notebook_id: record.notebook_id || null,
      extraction_status: "complete", page_count: record.page_count || metadata.page_count || null,
      section_count: new Set(blocks.map(block => block.heading_path.join(" > "))).size,
      table_count: blocks.filter(block => block.block_type === "table").length,
      image_count: Array.isArray(record.images || metadata.images) ? (record.images || metadata.images).length : 0,
      topics: Array.isArray(topics) ? topics.map(String) : [],
      is_policy: Boolean(record.is_policy || metadata.is_policy || /\b(policy|regulation|statute|manual)\b/i.test(`${sourceType} ${title}`)),
      warning: null,
      headings: blocks.filter(block => block.block_type === "section").map(block => block.heading_path),
    },
    blocks,
  };
}

export const citationSchema = {
  type: "object",
  properties: { block_id: { type: "string" }, source_id: { type: "string" }, label: { type: "string" } },
  required: ["block_id", "source_id", "label"], additionalProperties: false,
};

export const briefPointSchema = {
  type: "object",
  properties: {
    point_id: { type: "string" }, statement: { type: "string" },
    intended_use: { type: "string", enum: ["key_fact", "procedure", "warning", "objective", "example", "quiz_concept", "supporting_detail"] },
    priority: { type: "string", enum: ["required", "optional", "supporting"] },
    citations: { type: "array", items: citationSchema },
    provenance: { type: "string", enum: ["directly_sourced", "ai_rewritten_from_sources", "ai_interpretation", "author_input", "author_override", "unsupported_draft_requiring_review"] },
    author_notes: { type: "string" }, review_status: { type: "string", enum: ["candidate", "edited", "reviewed"] },
  },
  required: ["point_id", "statement", "intended_use", "priority", "citations", "provenance", "author_notes", "review_status"],
  additionalProperties: false,
};

function responseText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const output of payload.output || []) for (const item of output.content || []) {
    if (item.type === "output_text") return item.text;
    if (item.type === "refusal") fail(item.refusal || "OpenAI refused the request", 422);
  }
  fail("OpenAI returned no structured output", 502);
}

function validateStructuredValue(value, schema, path = "$") {
  if (schema.const !== undefined && value !== schema.const) fail(`OpenAI output did not match ${path}`, 502);
  if (schema.enum && !schema.enum.includes(value)) fail(`OpenAI output did not match ${path}`, 502);
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(`OpenAI output did not match ${path}`, 502);
    for (const key of schema.required || []) if (!(key in value)) fail(`OpenAI output is missing ${path}.${key}`, 502);
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!Object.hasOwn(schema.properties || {}, key)) fail(`OpenAI output added unsupported field ${path}.${key}`, 502);
    }
    for (const [key, childSchema] of Object.entries(schema.properties || {})) if (key in value) validateStructuredValue(value[key], childSchema, `${path}.${key}`);
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) fail(`OpenAI output did not match ${path}`, 502);
    value.forEach((item, index) => validateStructuredValue(item, schema.items || {}, `${path}[${index}]`));
  } else if (schema.type === "string" && typeof value !== "string") fail(`OpenAI output did not match ${path}`, 502);
  else if (schema.type === "boolean" && typeof value !== "boolean") fail(`OpenAI output did not match ${path}`, 502);
  else if (schema.type === "number" && typeof value !== "number") fail(`OpenAI output did not match ${path}`, 502);
  else if (schema.type === "integer" && !Number.isInteger(value)) fail(`OpenAI output did not match ${path}`, 502);
}

let discoveredOpenAIModel = null;

async function openAIModel() {
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  if (discoveredOpenAIModel) return discoveredOpenAIModel;
  const preferred = ["luna", "gpt-5-nano", "gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"];
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    if (response.ok) {
      const payload = await response.json();
      const modelIds = (payload.data || []).map((model) => String(model.id || "")).filter(Boolean);
      const available = new Set(modelIds);
      discoveredOpenAIModel = preferred.find((model) => available.has(model)) || null;
      if (!discoveredOpenAIModel) {
        const eligible = modelIds.filter((id) => /^(gpt-|o[1-9]|luna)/i.test(id) && !/(audio|image|realtime|search|transcri|tts|moderation|embedding|codex)/i.test(id));
        eligible.sort((left, right) => {
          const rank = (id) => /luna/i.test(id) ? 0 : /nano/i.test(id) ? 1 : /mini/i.test(id) ? 2 : /^gpt-/i.test(id) ? 3 : 4;
          return rank(left) - rank(right) || left.localeCompare(right);
        });
        discoveredOpenAIModel = eligible[0] || null;
      }
    }
  } catch {}
  discoveredOpenAIModel ||= "gpt-5-nano";
  return discoveredOpenAIModel;
}

export async function structuredOpenAI(name, instructions, payload, schema) {
  if (!process.env.OPENAI_API_KEY) fail("OPENAI_API_KEY is not configured", 503);
  const model = await openAIModel();
  const strictSchemaSupported = !/^gpt-3\.5(?:-|$)/i.test(model);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, store: false,
      input: [{ role: "system", content: strictSchemaSupported ? instructions : `${instructions}\nReturn one JSON object that matches this schema exactly: ${JSON.stringify(schema)}` }, { role: "user", content: JSON.stringify(payload) }],
      text: { format: strictSchemaSupported ? { type: "json_schema", name, strict: true, schema } : { type: "json_object" } },
    }),
  });
  if (!response.ok) {
    const providerPayload = await response.json().catch(() => ({}));
    const providerCode = String(providerPayload?.error?.code || providerPayload?.error?.type || "unknown_error")
      .replace(/[^a-zA-Z0-9_.-]/g, "_")
      .slice(0, 120);
    const providerMessage = String(providerPayload?.error?.message || "Provider rejected the request")
      .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
      .slice(0, 500);
    if (response.status === 401) {
      fail(`OpenAI rejected the server credential (401 · ${providerCode}). Replace the Production API key, then retry.`, 503);
    }
    if (response.status === 403) {
      fail(`OpenAI denied this project or model access (403 · ${providerCode} · ${model}). Check the API project's permissions and model availability, then retry.`, 502);
    }
    fail(`OpenAI request failed (${response.status} · ${providerCode} · ${model}): ${providerMessage}`, 502);
  }
  const structured = JSON.parse(responseText(await response.json()));
  validateStructuredValue(structured, schema);
  return structured;
}

export async function proxyRender(payload) {
  if (!process.env.ARTIFACT_WORKER_URL) fail("ARTIFACT_WORKER_URL is not configured", 503);
  const response = await fetch(`${process.env.ARTIFACT_WORKER_URL.replace(/\/$/, "")}/renders`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ARTIFACT_WORKER_TOKEN || ""}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) fail(`Artifact worker failed (${response.status})`, 502);
  return response.json();
}
