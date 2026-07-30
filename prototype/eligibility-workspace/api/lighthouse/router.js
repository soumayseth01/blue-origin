import { Readable } from "node:stream";
import { get } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { enforceRateLimit, enforceSameOrigin, handleError, send } from "../_lib/http.js";
import { requestBody, requireApproval } from "../_lib/studio.js";
import {
  archiveLighthouseModule,
  assignLighthouseModule,
  createLighthouseModule,
  getLighthouseAsset,
  getLighthouseModule,
  lighthouseAnalytics,
  lighthouseLearnerSummary,
  listLighthouseCatalog,
  publishLighthouseModule,
  registerLighthouseAsset,
  saveLighthouseQuizAttempt,
  updateLighthouseModule,
  updateLighthouseProgress,
} from "../_lib/lighthouse.js";

function routeParts(req) {
  const action = String(req.query.action || "");
  const id = String(req.query.id || "");
  const actions = {
    catalog: ["catalog"], me: ["me"], analytics: ["analytics"], modules: ["modules"], module: ["modules", id],
    publish: ["modules", id, "publish"], assign: ["modules", id, "assign"], archive: ["modules", id, "archive"],
    progress: ["progress"], "quiz-attempts": ["quiz-attempts"], "upload-token": ["assets", "upload-token"],
    "asset-register": ["assets", "register"], "asset-content": ["assets", id, "content"],
  };
  if (actions[action]) return actions[action];
  const pathname = new URL(req.url || "/", "https://lighthouse.local").pathname;
  const marker = "/api/lighthouse/";
  return pathname.includes(marker) ? pathname.slice(pathname.indexOf(marker) + marker.length).split("/").filter(Boolean).map(decodeURIComponent) : [];
}

function allow(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader("Allow", methods.join(", "));
  send(res, 405, { detail: "Unsupported Lighthouse operation" });
  return false;
}

async function serveAsset(req, res, assetId) {
  if (!allow(req, res, ["GET"])) return;
  enforceRateLimit(req, 120);
  const asset = await getLighthouseAsset(assetId);
  if (!asset.blob_url) return send(res, 409, { detail: "Asset content is not available" });
  const result = await get(asset.blob_url, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN });
  if (!result) return send(res, 404, { detail: "Asset blob not found" });
  if (result.statusCode === 304) { res.statusCode = 304; return res.end(); }
  res.statusCode = 200;
  res.setHeader("Content-Type", asset.mime_type || result.blob.contentType || "application/octet-stream");
  res.setHeader("Content-Length", String(result.blob.size));
  res.setHeader("Content-Disposition", `inline; filename="${String(asset.file_name || asset.title || "asset").replace(/[\r\n"\\]/g, "-")}"`);
  res.setHeader("Cache-Control", "private, max-age=300");
  Readable.fromWeb(result.stream).pipe(res);
}

async function uploadToken(req, res) {
  if (!allow(req, res, ["POST"])) return;
  enforceRateLimit(req, 20);
  const body = requestBody(req);
  const result = await handleUpload({
    request: req,
    body,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      enforceSameOrigin(req);
      const safeName = String(pathname || "asset").replace(/[^a-zA-Z0-9_.-]/g, "-");
      let metadata;
      try { metadata = JSON.parse(clientPayload || "{}"); } catch { throw Object.assign(new Error("Invalid Lighthouse upload metadata"), { statusCode: 400 }); }
      const allowed = new Set(["video/mp4", "video/webm", "application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg"]);
      const mimeType = String(metadata.mimeType || "");
      if (!allowed.has(mimeType)) throw Object.assign(new Error("Unsupported Lighthouse asset type"), { statusCode: 415 });
      const maximumSizeInBytes = mimeType.startsWith("video/") ? 250 * 1024 * 1024 : mimeType.startsWith("image/") ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
      if (Number(metadata.byteSize || 0) > maximumSizeInBytes) throw Object.assign(new Error(`Lighthouse asset exceeds the ${Math.round(maximumSizeInBytes / 1024 / 1024)} MB limit`), { statusCode: 413 });
      return {
        allowedContentTypes: [mimeType],
        maximumSizeInBytes,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ ...metadata, pathname: `lighthouse/${safeName}` }),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      const metadata = JSON.parse(tokenPayload || "{}");
      await registerLighthouseAsset({ title: metadata.fileName || blob.pathname.split("/").at(-1), kind: metadata.kind || (blob.contentType?.startsWith("video/") ? "video" : blob.contentType === "application/pdf" ? "pdf" : blob.contentType?.startsWith("image/") ? "image" : "download"), source: "upload", file_name: metadata.fileName || blob.pathname.split("/").at(-1), mime_type: blob.contentType, byte_size: blob.size, blob_url: blob.url, pathname: metadata.pathname || blob.pathname });
    },
  });
  return send(res, 200, result);
}

export default async function handler(req, res) {
  try {
    const parts = routeParts(req);
    const route = parts.join("/");
    if (route === "catalog") { if (!allow(req, res, ["GET"])) return; enforceRateLimit(req, 90); return send(res, 200, await listLighthouseCatalog()); }
    if (route === "me") { if (!allow(req, res, ["GET"])) return; enforceRateLimit(req, 90); return send(res, 200, await lighthouseLearnerSummary()); }
    if (route === "analytics") { if (!allow(req, res, ["GET"])) return; enforceRateLimit(req, 60); return send(res, 200, await lighthouseAnalytics()); }
    if (parts[0] === "modules" && parts.length === 1) {
      if (req.method === "GET") return send(res, 200, await listLighthouseCatalog());
      if (!allow(req, res, ["POST"])) return;
      enforceSameOrigin(req); enforceRateLimit(req, 30);
      return send(res, 201, await createLighthouseModule(requestBody(req)));
    }
    if (parts[0] === "modules" && parts[1] && parts.length === 2) {
      if (req.method === "GET") { enforceRateLimit(req, 90); return send(res, 200, await getLighthouseModule(parts[1], { publishedOnly: req.query.role === "learner" })); }
      if (!allow(req, res, ["PATCH"])) return;
      enforceSameOrigin(req); enforceRateLimit(req, 30);
      return send(res, 200, await updateLighthouseModule(parts[1], requestBody(req)));
    }
    if (parts[0] === "modules" && parts[2] === "publish") { if (!allow(req, res, ["POST"])) return; enforceSameOrigin(req); enforceRateLimit(req, 15); requireApproval(req); return send(res, 200, await publishLighthouseModule(parts[1])); }
    if (parts[0] === "modules" && parts[2] === "assign") { if (!allow(req, res, ["POST"])) return; enforceSameOrigin(req); enforceRateLimit(req, 20); requireApproval(req); return send(res, 200, await assignLighthouseModule(parts[1])); }
    if (parts[0] === "modules" && parts[2] === "archive") { if (!allow(req, res, ["POST"])) return; enforceSameOrigin(req); enforceRateLimit(req, 15); requireApproval(req); return send(res, 200, await archiveLighthouseModule(parts[1])); }
    if (route === "progress") { if (!allow(req, res, ["PUT"])) return; enforceSameOrigin(req); enforceRateLimit(req, 120); return send(res, 200, await updateLighthouseProgress(requestBody(req))); }
    if (route === "quiz-attempts") { if (!allow(req, res, ["POST"])) return; enforceSameOrigin(req); enforceRateLimit(req, 60); return send(res, 201, await saveLighthouseQuizAttempt(requestBody(req))); }
    if (route === "assets/upload-token") return await uploadToken(req, res);
    if (route === "assets/register") { if (!allow(req, res, ["POST"])) return; enforceSameOrigin(req); enforceRateLimit(req, 30); return send(res, 201, await registerLighthouseAsset(requestBody(req))); }
    if (parts[0] === "assets" && parts[2] === "content") return await serveAsset(req, res, parts[1]);
    return send(res, 404, { detail: "Lighthouse route not found" });
  } catch (error) { handleError(res, error); }
}
