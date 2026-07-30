import { allowMethod, enforceRateLimit, enforceSameOrigin, handleError, send } from "../../_lib/http.js";
import { finalizeAttempt } from "../../_lib/performance.js";

export default async function handler(req, res) {
  if (!allowMethod(req, res, "POST")) return;
  try { enforceSameOrigin(req); enforceRateLimit(req, 30); const stored = await finalizeAttempt(req.body?.attempt || req.body); send(res, 200, stored); }
  catch (error) { handleError(res, error); }
}
