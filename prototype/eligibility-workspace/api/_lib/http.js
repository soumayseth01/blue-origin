const windows = new Map();

export function send(res, status, payload) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

export function allowMethod(req, res, method) {
  if (req.method === method) return true;
  res.setHeader("Allow", method);
  send(res, 405, { detail: `Use ${method}` });
  return false;
}

export function enforceSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!origin || !host) return;
  if (new URL(origin).host !== host) throw Object.assign(new Error("Cross-origin request rejected"), { statusCode: 403 });
}

export function enforceRateLimit(req, limit = 90) {
  const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "local").split(",")[0];
  const bucket = `${ip}:${Math.floor(Date.now() / 60000)}`;
  const count = (windows.get(bucket) || 0) + 1;
  windows.set(bucket, count);
  if (windows.size > 500) windows.clear();
  if (count > limit) throw Object.assign(new Error("Rate limit exceeded"), { statusCode: 429 });
}

export function assertAttemptId(id) {
  if (!/^attempt:bo-[A-Za-z0-9_-]+$/.test(String(id || ""))) throw Object.assign(new Error("Invalid attempt ID"), { statusCode: 400 });
  return String(id);
}

export function handleError(res, error) {
  console.error(error);
  send(res, error.statusCode || 500, { detail: error.statusCode ? error.message : "Request could not be completed", ...(error.statusCode && error.details ? { details: error.details } : {}) });
}
