import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import { db, demoLearnerId } from "../../../_lib/db.js";
import { allowMethod, assertAttemptId, enforceRateLimit, enforceSameOrigin, handleError, send } from "../../../_lib/http.js";

const allowed = new Set(["image/png","image/jpeg","application/json","text/plain"]);
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (!allowMethod(req, res, "POST")) return;
  try {
    enforceSameOrigin(req); enforceRateLimit(req, 120);
    const attemptId = assertAttemptId(req.query.id); const type = String(req.headers["x-artifact-type"] || ""); const mime = String(req.headers["content-type"] || "").split(";")[0];
    if (!allowed.has(mime) || !["screenshot","transcript","replay"].includes(type)) throw Object.assign(new Error("Unsupported artifact"), { statusCode: 415 });
    const chunks=[]; let size=0; for await (const chunk of req) { size += chunk.length; if (size > 8_000_000) throw Object.assign(new Error("Artifact exceeds 8 MB"), { statusCode: 413 }); chunks.push(chunk); }
    const body=Buffer.concat(chunks); const checksum=createHash("sha256").update(body).digest("hex"); const sql=db();
    const rows=await sql`SELECT attempt_id FROM learning_attempts WHERE attempt_id=${attemptId} AND learner_id=${demoLearnerId()}`; if (!rows.length) throw Object.assign(new Error("Attempt not found"), { statusCode: 404 });
    const name=String(req.headers["x-artifact-name"] || `${type}-${checksum.slice(0,12)}`).replace(/[^a-zA-Z0-9_.-]/g,"-"); const pathname=`demo-learners/${demoLearnerId()}/${attemptId.replace(":","-")}/${name}`;
    const blob=await put(pathname, body, { access:"private", contentType:mime, addRandomSuffix:false, token:process.env.BLOB_READ_WRITE_TOKEN });
    const retention=new Date(Date.now()+180*86400000).toISOString();
    await sql`INSERT INTO attempt_artifacts (attempt_id, artifact_type, pathname, blob_url, mime_type, checksum_sha256, byte_size, retention_date) VALUES (${attemptId},${type},${pathname},${blob.url},${mime},${checksum},${size},${retention}) ON CONFLICT (pathname) DO UPDATE SET blob_url=EXCLUDED.blob_url, checksum_sha256=EXCLUDED.checksum_sha256`;
    send(res,200,{artifact_id:checksum.slice(0,16),artifact_type:type,checksum_sha256:checksum});
  } catch(error){ handleError(res,error); }
}
