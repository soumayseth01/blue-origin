import { allowMethod, send } from "../_lib/http.js";
import { inspectHumeConfig, REQUIRED_HUME_CONFIG } from "../_lib/hume-config.js";
import { CALLER_BRIEF_MAX_BYTES, CALLER_BRIEF_VERSION, HUME_CONTEXT_MAX_BYTES } from "../_lib/caller-brief.js";

export default async function handler(req, res) {
  if (!allowMethod(req, res, "GET")) return;
  const missing = ["HUME_API_KEY", "HUME_SECRET_KEY", "HUME_CONFIG_ID"].filter((key) => !process.env[key]);
  const base = { configured: missing.length === 0, config_id_present: Boolean(process.env.HUME_CONFIG_ID), missing, framework_version: "hume-session-envelope-v2", caller_brief_version: CALLER_BRIEF_VERSION, caller_brief_max_bytes: CALLER_BRIEF_MAX_BYTES, hume_context_max_bytes: HUME_CONTEXT_MAX_BYTES, required_tools: ["request_case_response", "request_contact_handoff", "record_callback_message"], required_settings: REQUIRED_HUME_CONFIG };
  if (missing.length) return send(res, 200, { ...base, config_health: "not_configured" });
  try {
    const { config, checks, ready } = await inspectHumeConfig(process.env.HUME_API_KEY, process.env.HUME_CONFIG_ID);
    return send(res, 200, { ...base, config_health: ready ? "ready" : "needs_update", config_version: config.version, settings_checks: checks });
  } catch {
    return send(res, 200, { ...base, config_health: "unverified", config_version: null });
  }
}
