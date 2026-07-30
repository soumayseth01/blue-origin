import crypto from "node:crypto";
import { db } from "./db.js";

const MAX_DOCUMENT_BYTES = 30 * 1024 * 1024;
const MAX_UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_CHARACTERS = 8_000_000;
const FETCH_HEADERS = {
  Accept: "application/pdf,text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
  "User-Agent": "BlueOrigin-Policy-Library/1.0 (+document archival for authoring)",
};

function mapSource(row) {
  return {
    id: row.source_id,
    source_id: row.source_id,
    title: row.title,
    source_kind: row.source_kind,
    document_type: row.document_type,
    jurisdiction: row.jurisdiction,
    owner: row.owner_name,
    programs: row.programs || [],
    format: row.format_label,
    effective_date: row.effective_label,
    status: row.source_status,
    extraction_status: row.extraction_status,
    permission_status: row.permission_status,
    access_scope: row.access_scope,
    team_id: row.team_id,
    url: row.source_url,
    description: row.description,
    open_notebook_source_id: row.open_notebook_source_id,
    checksum_sha256: row.checksum_sha256,
    storage_status: row.storage_status || "not_imported",
    storage_error: row.storage_error || null,
    stored_from_url: row.stored_from_url || null,
    content_type: row.content_type || null,
    file_name: row.file_name || null,
    byte_size: row.byte_size == null ? null : Number(row.byte_size),
    fetched_at: row.fetched_at || null,
    has_document: Boolean(row.has_document),
    has_extracted_text: Boolean(row.has_extracted_text),
    document_url: row.has_document ? `/api/studio/library-sources/${encodeURIComponent(row.source_id)}/document` : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listLibrarySources(query = {}) {
  const sql = db();
  const rows = await sql`SELECT source_id,title,source_kind,document_type,jurisdiction,owner_name,programs,format_label,effective_label,source_status,extraction_status,permission_status,access_scope,team_id,source_url,description,open_notebook_source_id,checksum_sha256,storage_status,storage_error,stored_from_url,content_type,file_name,byte_size,fetched_at,(content_bytes IS NOT NULL) AS has_document,(content_text IS NOT NULL AND length(content_text) > 0) AS has_extracted_text,created_at,updated_at FROM library_sources WHERE source_status <> 'retired' ORDER BY jurisdiction,title`;
  let items = rows.map(mapSource);
  const q = String(query.q || "").trim().toLowerCase();
  if (q) items = items.filter((item) => [item.title,item.owner,item.jurisdiction,item.description,item.format,...item.programs].join(" ").toLowerCase().includes(q));
  if (query.jurisdiction && query.jurisdiction !== "all") items = items.filter((item) => item.jurisdiction === query.jurisdiction);
  if (query.program && query.program !== "all") items = items.filter((item) => item.programs.includes(query.program));
  if (query.document_type && query.document_type !== "all") items = items.filter((item) => item.document_type === query.document_type);
  if (query.extraction_status && query.extraction_status !== "all") items = items.filter((item) => item.extraction_status === query.extraction_status);
  if (query.storage_status && query.storage_status !== "all") items = items.filter((item) => item.storage_status === query.storage_status);
  const pageSize = Math.min(Math.max(Number(query.page_size) || 100, 1), 200);
  const page = Math.max(Number(query.page) || 1, 1);
  const total = items.length;
  items = items.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, page_size: pageSize };
}

export async function getLibrarySource(id, { optional = false } = {}) {
  const sql = db();
  const rows = await sql`SELECT source_id,title,source_kind,document_type,jurisdiction,owner_name,programs,format_label,effective_label,source_status,extraction_status,permission_status,access_scope,team_id,source_url,description,open_notebook_source_id,checksum_sha256,storage_status,storage_error,stored_from_url,content_type,file_name,byte_size,fetched_at,(content_bytes IS NOT NULL) AS has_document,(content_text IS NOT NULL AND length(content_text) > 0) AS has_extracted_text,created_at,updated_at FROM library_sources WHERE source_id=${String(id || "")}`;
  if (!rows.length) {
    if (optional) return null;
    throw Object.assign(new Error("Library source not found"), { statusCode: 404 });
  }
  return mapSource(rows[0]);
}

export async function getLibrarySourceContent(id, { optional = false } = {}) {
  const sql = db();
  const rows = await sql`SELECT source_id,title,document_type,source_status,content_type,file_name,byte_size,content_bytes,content_text,checksum_sha256,fetched_at FROM library_sources WHERE source_id=${String(id || "")}`;
  if (!rows.length || !rows[0].content_bytes) {
    if (optional) return null;
    throw Object.assign(new Error("Stored Library document not found"), { statusCode: 404 });
  }
  return rows[0];
}

export async function archiveLibrarySource(id) {
  const sql = db();
  const rows = await sql`UPDATE library_sources SET source_status='retired',updated_at=now() WHERE source_id=${String(id || "")} AND source_status <> 'retired' RETURNING source_id`;
  if (!rows.length) throw Object.assign(new Error("Library source not found"), { statusCode: 404 });
  return { source_id: rows[0].source_id, status: "archived" };
}

export async function deleteLibrarySource(id) {
  const sourceId = String(id || "");
  const sql = db();
  const references = await sql`SELECT count(*)::int AS count FROM notebook_sources WHERE registry_source_id=${sourceId}`;
  if (Number(references[0]?.count || 0) > 0) {
    throw Object.assign(new Error("Remove this document from its notebooks before deleting it"), { statusCode: 409 });
  }
  const rows = await sql`DELETE FROM library_sources WHERE source_id=${sourceId} RETURNING source_id`;
  if (!rows.length) throw Object.assign(new Error("Library source not found"), { statusCode: 404 });
  return { source_id: rows[0].source_id, status: "deleted" };
}

function assertOfficialRemoteUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw Object.assign(new Error("Library source URL is invalid"), { statusCode: 422 }); }
  const hostname = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || !(hostname.endsWith(".gov") || hostname.endsWith(".gov.us"))) {
    throw Object.assign(new Error("Only HTTPS documents hosted on official government domains can be imported"), { statusCode: 422 });
  }
  if (parsed.username || parsed.password || parsed.port) throw Object.assign(new Error("Library source URL contains unsupported credentials or a port"), { statusCode: 422 });
  return parsed;
}

async function fetchOfficialDocument(sourceUrl) {
  let current = assertOfficialRemoteUrl(sourceUrl);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, { headers: FETCH_HEADERS, redirect: "manual", signal: AbortSignal.timeout(45_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw Object.assign(new Error("Official source returned a redirect without a destination"), { statusCode: 502 });
      current = assertOfficialRemoteUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw Object.assign(new Error(`Official source returned ${response.status}`), { statusCode: 502 });
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > MAX_DOCUMENT_BYTES) throw Object.assign(new Error("Official document is larger than the 30 MB Library limit"), { statusCode: 413 });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_DOCUMENT_BYTES) throw Object.assign(new Error("Official document is larger than the 30 MB Library limit"), { statusCode: 413 });
    return { response, bytes, finalUrl: current.toString() };
  }
  throw Object.assign(new Error("Official source redirected too many times"), { statusCode: 502 });
}

function decodeHtmlEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (named[lower]) return named[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return match;
  });
}

function htmlToText(html) {
  return decodeHtmlEntities(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<(h[1-6])\b[^>]*>/gi, (_match, tag) => `${"#".repeat(Number(tag.slice(1)))} `)
    .replace(/<\/(?:h[1-6]|p|div|section|article|li|tr|table|main|header|footer)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARACTERS);
}

function likelyPdfLink(html, baseUrl, source) {
  if (!(source.document_type === "application_form" || /pdf|packet/i.test(source.format || ""))) return null;
  const token = source.title.match(/\b(?:H|FAA-|MDHHS-?)?\d{3,}[A-Z]?\b/i)?.[0]?.toLowerCase();
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => {
    const href = new URL(decodeHtmlEntities(match[1]), baseUrl).toString();
    const label = htmlToText(match[2]).toLowerCase();
    let score = /\.pdf(?:$|[?#])/i.test(href) ? 10 : 0;
    if (token && `${href} ${label}`.toLowerCase().includes(token)) score += 8;
    if (/english|application|download|form/.test(label)) score += 2;
    return { href, score };
  }).filter((item) => item.score >= 10);
  links.sort((a, b) => b.score - a.score);
  return links[0]?.href || null;
}

function contentTypeFor(response, bytes, url) {
  const header = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (header) return header;
  if (/\.pdf(?:$|[?#])/i.test(url)) return "application/pdf";
  return "text/html";
}

function safeFileName(source, contentType, url) {
  const pathName = new URL(url).pathname.split("/").filter(Boolean).at(-1) || "document";
  const fallbackExtension = contentType === "application/pdf" ? ".pdf" : contentType.includes("html") ? ".html" : ".txt";
  const candidate = decodeURIComponent(pathName).replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  const title = source.title.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return (candidate.includes(".") ? candidate : `${title || "document"}${fallbackExtension}`).slice(0, 180);
}

async function extractText(bytes, contentType) {
  if (contentType === "application/pdf") {
    const [{ DOMMatrix, ImageData, Path2D }, { PDFParse }, { getData }] = await Promise.all([
      import("@napi-rs/canvas"),
      import("pdf-parse"),
      import("pdf-parse/worker"),
    ]);
    globalThis.DOMMatrix ||= DOMMatrix;
    globalThis.ImageData ||= ImageData;
    globalThis.Path2D ||= Path2D;
    PDFParse.setWorker(getData());
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    try {
      const result = await parser.getText();
      return String(result.text || "").trim().slice(0, MAX_TEXT_CHARACTERS);
    } finally { await parser.destroy(); }
  }
  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.extractRawText({ buffer: bytes });
    return String(result.value || "").trim().slice(0, MAX_TEXT_CHARACTERS);
  }
  if (!(contentType.startsWith("text/") || contentType.includes("html") || contentType === "application/xhtml+xml")) return "";
  const raw = bytes.toString("utf8");
  return contentType.includes("html") || /<html|<!doctype/i.test(raw.slice(0, 1000)) ? htmlToText(raw) : raw.trim().slice(0, MAX_TEXT_CHARACTERS);
}

function normalizeUploadContentType(value, fileName = "") {
  const requested = String(value || "").split(";")[0].trim().toLowerCase();
  const extension = String(fileName).toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  const byExtension = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".html": "text/html",
    ".htm": "text/html",
  };
  const normalized = ((requested && requested !== "application/octet-stream") ? requested : byExtension[extension]) || "application/octet-stream";
  const supported = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown", "text/html", "application/xhtml+xml"]);
  if (!supported.has(normalized)) throw Object.assign(new Error("Upload a PDF, DOCX, TXT, Markdown, or HTML document"), { statusCode: 415 });
  return normalized;
}

function normalizePrograms(programs) {
  return [...new Set((Array.isArray(programs) ? programs : []).map((value) => String(value).trim()).filter(Boolean))].slice(0, 12);
}

export async function createLibrarySource(input = {}) {
  const title = String(input.title || "").trim().slice(0, 240);
  if (!title) throw Object.assign(new Error("Document title is required"), { statusCode: 422 });
  const type = String(input.type || "upload");
  if (!new Set(["upload", "link", "text"]).has(type)) throw Object.assign(new Error("Unsupported Library document type"), { statusCode: 422 });
  const id = `${type}:${crypto.randomUUID()}`;
  const fileName = String(input.file_name || "").replace(/[\r\n"\\]/g, "-").slice(0, 180);
  const declaredSize = Math.max(0, Number(input.file_size) || 0);
  if (type === "upload" && (!fileName || !declaredSize)) throw Object.assign(new Error("Choose a non-empty document to upload"), { statusCode: 422 });
  if (declaredSize > MAX_DOCUMENT_BYTES) throw Object.assign(new Error("Library document is larger than the 30 MB upload limit"), { statusCode: 413 });
  if (type === "text" && !String(input.content || "").trim()) throw Object.assign(new Error("Document text is required"), { statusCode: 422 });
  const contentType = type === "upload" ? normalizeUploadContentType(input.content_type, fileName) : type === "text" ? "text/plain" : null;
  const sourceUrl = type === "link" ? assertOfficialRemoteUrl(input.url).toString() : null;
  const sql = db();
  await sql`INSERT INTO library_sources (
    source_id,title,source_kind,document_type,jurisdiction,owner_name,programs,format_label,effective_label,
    source_status,extraction_status,permission_status,access_scope,source_url,description,added_by,
    storage_status,content_type,file_name,byte_size,content_bytes
  ) VALUES (
    ${id},${title},${type === "upload" ? "upload" : type === "text" ? "pasted_text" : "official_web"},${String(input.document_type || "other").slice(0, 80)},
    ${String(input.jurisdiction || "Organization").slice(0, 160)},${String(input.owner || "Current author").slice(0, 240)},${normalizePrograms(input.programs)},
    ${type === "upload" ? (contentType === "application/pdf" ? "PDF" : contentType.includes("wordprocessingml") ? "Word document" : "Document") : type === "text" ? "Text document" : "Web document"},
    ${String(input.effective_label || "Added by author").slice(0, 160)},${type === "link" ? "registered" : "active"},${type === "text" ? "complete" : "not_started"},
    'granted','private',${sourceUrl},${String(input.description || "").slice(0, 2000)},'studio-author',
    ${type === "upload" ? "fetching" : type === "text" ? "stored" : "not_imported"},${contentType},${fileName || null},0,${type === "upload" ? Buffer.alloc(0) : null}
  )`;
  if (type === "text") {
    const bytes = Buffer.from(String(input.content || ""), "utf8");
    return await storeLibrarySourceDocument(id, { bytes, contentType, fileName: fileName || `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`, contentText: String(input.content) });
  }
  if (type === "link") return await importLibrarySource(id);
  return await getLibrarySource(id);
}

export async function appendLibraryUploadChunk(id, input = {}) {
  const sourceId = String(id || "");
  const offset = Number(input.offset);
  const expectedSize = Number(input.expected_size);
  const encoded = String(input.chunk_base64 || "");
  if (!Number.isSafeInteger(offset) || offset < 0) throw Object.assign(new Error("Upload offset is invalid"), { statusCode: 422 });
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw Object.assign(new Error("Upload chunk is invalid"), { statusCode: 422 });
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_UPLOAD_CHUNK_BYTES) throw Object.assign(new Error("Upload chunk must be between 1 byte and 2 MB"), { statusCode: 413 });
  if (offset + bytes.length > MAX_DOCUMENT_BYTES) throw Object.assign(new Error("Library document is larger than the 30 MB upload limit"), { statusCode: 413 });
  const sql = db();
  const rows = await sql`UPDATE library_sources SET
    content_bytes=COALESCE(content_bytes,''::bytea) || ${bytes},byte_size=${offset + bytes.length},updated_at=now()
    WHERE source_id=${sourceId} AND source_kind='upload' AND storage_status='fetching'
      AND octet_length(COALESCE(content_bytes,''::bytea))=${offset}
    RETURNING source_id,byte_size`;
  if (!rows.length) {
    const current = await getLibrarySource(sourceId, { optional: true });
    if (!current) throw Object.assign(new Error("Library upload was not found"), { statusCode: 404 });
    throw Object.assign(new Error(`Upload offset conflict; server has ${current.byte_size || 0} bytes`), { statusCode: 409 });
  }
  const uploadedBytes = Number(rows[0].byte_size);
  if (!input.complete) return { source_id: sourceId, uploaded_bytes: uploadedBytes, complete: false };
  if (!Number.isSafeInteger(expectedSize) || expectedSize !== uploadedBytes) throw Object.assign(new Error("Uploaded document size does not match the selected file"), { statusCode: 422 });
  try {
    const stored = await getLibrarySourceContent(sourceId);
    const source = await storeLibrarySourceDocument(sourceId, { bytes: storedDocumentBytes(stored.content_bytes), contentType: stored.content_type, fileName: stored.file_name });
    return { source_id: sourceId, uploaded_bytes: uploadedBytes, complete: true, source };
  } catch (error) {
    await sql`UPDATE library_sources SET storage_status='failed',storage_error=${String(error.message || error).slice(0, 1000)},updated_at=now() WHERE source_id=${sourceId}`;
    throw error;
  }
}

export async function storeLibrarySourceDocument(id, { bytes, contentType, fileName, storedFromUrl, contentText = null }) {
  const source = await getLibrarySource(id);
  const normalizedBytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  if (!normalizedBytes.length) throw Object.assign(new Error("Library document is empty"), { statusCode: 422 });
  if (normalizedBytes.length > MAX_DOCUMENT_BYTES) throw Object.assign(new Error("Library document is larger than the 30 MB Library limit"), { statusCode: 413 });
  const normalizedType = String(contentType || "application/octet-stream").split(";")[0].trim().toLowerCase();
  const extractedText = contentText == null ? await extractText(normalizedBytes, normalizedType) : String(contentText).trim().slice(0, MAX_TEXT_CHARACTERS);
  const checksum = crypto.createHash("sha256").update(normalizedBytes).digest("hex");
  const normalizedUrl = storedFromUrl ? assertOfficialRemoteUrl(storedFromUrl).toString() : source.url;
  const normalizedFileName = String(fileName || safeFileName(source, normalizedType, normalizedUrl)).replace(/[\r\n"]/g, "-").slice(0, 180);
  const sql = db();
  await sql`UPDATE library_sources SET
    storage_status='stored',storage_error=NULL,stored_from_url=${normalizedUrl},content_type=${normalizedType},file_name=${normalizedFileName},
    byte_size=${normalizedBytes.length},content_bytes=${normalizedBytes},content_text=${extractedText || null},checksum_sha256=${checksum},
    fetched_at=now(),http_etag=NULL,http_last_modified=NULL,
    extraction_status=${extractedText ? "complete" : "needs_review"},source_status='active',updated_at=now()
    WHERE source_id=${source.id}`;
  return await getLibrarySource(source.id);
}

export async function importLibrarySource(id) {
  const source = await getLibrarySource(id);
  if (!source.url) throw Object.assign(new Error("Library source has no official URL"), { statusCode: 422 });
  const sql = db();
  await sql`UPDATE library_sources SET storage_status='fetching',storage_error=NULL,updated_at=now() WHERE source_id=${source.id}`;
  try {
    let fetched = await fetchOfficialDocument(source.url);
    let contentType = contentTypeFor(fetched.response, fetched.bytes, fetched.finalUrl);
    if (contentType.includes("html")) {
      const linkedPdf = likelyPdfLink(fetched.bytes.toString("utf8"), fetched.finalUrl, source);
      if (linkedPdf) {
        try {
          const candidate = await fetchOfficialDocument(linkedPdf);
          const candidateType = contentTypeFor(candidate.response, candidate.bytes, candidate.finalUrl);
          if (candidateType === "application/pdf") { fetched = candidate; contentType = candidateType; }
        } catch { /* the official landing-page snapshot remains a valid stored document */ }
      }
    }
    const fileName = safeFileName(source, contentType, fetched.finalUrl);
    await storeLibrarySourceDocument(source.id, {
      bytes: fetched.bytes,
      contentType,
      fileName,
      storedFromUrl: fetched.finalUrl,
    });
    await sql`UPDATE library_sources SET http_etag=${fetched.response.headers.get("etag")},http_last_modified=${fetched.response.headers.get("last-modified")} WHERE source_id=${source.id}`;
    return await getLibrarySource(source.id);
  } catch (error) {
    await sql`UPDATE library_sources SET storage_status='failed',storage_error=${String(error.message || error).slice(0, 1000)},updated_at=now() WHERE source_id=${source.id}`;
    throw error;
  }
}

export async function importLibrarySources(sourceIds) {
  const ids = [...new Set((sourceIds || []).map(String).filter(Boolean))].slice(0, 20);
  if (!ids.length) {
    const { items } = await listLibrarySources({ page_size: 200 });
    ids.push(...items.filter((item) => item.url && item.storage_status !== "stored").map((item) => item.id).slice(0, 20));
  }
  const results = [];
  for (const id of ids) {
    try { results.push({ source_id: id, ok: true, source: await importLibrarySource(id) }); }
    catch (error) { results.push({ source_id: id, ok: false, error: error.message || "Import failed" }); }
  }
  return { items: results, imported: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok).length };
}

export function storedDocumentBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string" && value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
  if (typeof value === "string") return Buffer.from(value, "base64");
  return Buffer.from(value || []);
}
