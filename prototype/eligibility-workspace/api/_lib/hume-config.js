export const REQUIRED_HUME_CONFIG = Object.freeze({
  turn_detection: { end_of_turn_silence_ms: 2000, speech_detection_threshold: 0.5, prefix_padding_ms: 300 },
  interruption: { min_interruption_ms: 1200 },
  ellm_model: { allow_short_responses: false },
  language_model: { model_provider: "OPEN_AI", model_resource: "gpt-4o-mini", temperature: 0.5 },
  builtin_tools: [],
  nudges: { enabled: false },
  timeouts: { inactivity: { enabled: true, duration_secs: 180 }, max_duration: { enabled: true, duration_secs: 1800 } },
});

const TOOL_CAPABLE_LANGUAGE_MODEL_PROVIDERS = new Set(["OPEN_AI", "ANTHROPIC", "GOOGLE"]);

function hasToolCapableLanguageModel(config = {}) {
  return TOOL_CAPABLE_LANGUAGE_MODEL_PROVIDERS.has(config.language_model?.model_provider)
    && Boolean(config.language_model?.model_resource);
}

export function humeConfigChecks(config = {}) {
  return {
    end_of_turn_silence_ms: config.turn_detection?.end_of_turn_silence_ms === 2000,
    speech_detection_threshold: config.turn_detection?.speech_detection_threshold === 0.5,
    prefix_padding_ms: config.turn_detection?.prefix_padding_ms === 300,
    min_interruption_ms: config.interruption?.min_interruption_ms === 1200,
    quick_responses_disabled: config.ellm_model?.allow_short_responses === false,
    tool_capable_language_model: hasToolCapableLanguageModel(config),
    automatic_hangup_disabled: !(config.builtin_tools || []).some((tool) => tool.name === "hang_up"),
    nudges_disabled: config.nudges?.enabled === false,
    inactivity_timeout: config.timeouts?.inactivity?.enabled === true && config.timeouts?.inactivity?.duration_secs === 180,
    maximum_duration: config.timeouts?.max_duration?.enabled === true && config.timeouts?.max_duration?.duration_secs === 1800,
  };
}

const HUME_CONFIG_INSPECTION_URL = "https://api.hume.ai/v0/evi/configs?page_number=0&page_size=100&restrict_to_most_recent=true";

function wait(delayMs) {
  return delayMs > 0 ? new Promise((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve();
}

function isTransientHumeStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchHumeConfigList(key, { attempts = 2, timeoutMs = 4000, retryDelayMs = 180 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetch(HUME_CONFIG_INSPECTION_URL, {
        headers: { "X-Hume-Api-Key": key },
        ...(controller ? { signal: controller.signal } : {}),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;
      const error = Object.assign(
        new Error(data.message || data.detail || "Hume configuration could not be inspected"),
        { statusCode: 502, upstreamStatus: response.status },
      );
      if (!isTransientHumeStatus(response.status) || attempt === attempts) throw error;
      lastError = error;
    } catch (caught) {
      const error = caught?.statusCode
        ? caught
        : Object.assign(new Error(caught?.name === "AbortError" ? "Hume configuration inspection timed out" : "Hume configuration could not be inspected"), { statusCode: 502, cause: caught });
      if ((caught?.statusCode && !isTransientHumeStatus(caught.upstreamStatus)) || attempt === attempts) throw error;
      lastError = error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    await wait(retryDelayMs);
  }
  throw lastError || Object.assign(new Error("Hume configuration could not be inspected"), { statusCode: 502 });
}

export async function inspectHumeConfig(key, configId, options = {}) {
  const data = await fetchHumeConfigList(key, options);
  const config = (data.configs_page || data.configs || []).find((item) => item.id === configId);
  if (!config) throw Object.assign(new Error("The configured Hume configuration was not found"), { statusCode: 503 });
  const checks = humeConfigChecks(config);
  return { config, checks, ready: Object.values(checks).every(Boolean) };
}

let ensureCache = { configId: null, version: null, expiresAt: 0 };

export function resetHumeConfigCacheForTests() {
  ensureCache = { configId: null, version: null, expiresAt: 0 };
}

export async function ensureHumeNaturalConfig(key, configId) {
  if (ensureCache.configId === configId && ensureCache.expiresAt > Date.now()) return { changed: false, version: ensureCache.version, ready: true };
  const inspected = await inspectHumeConfig(key, configId);
  if (inspected.ready) {
    ensureCache = { configId, version: inspected.config.version, expiresAt: Date.now() + 10 * 60 * 1000 };
    return { changed: false, version: inspected.config.version, ready: true };
  }
  const current = inspected.config;
  const payload = {
    evi_version: current.evi_version || "3",
    ellm_model: { allow_short_responses: false },
    event_messages: { on_new_chat: { enabled: false, text: "" }, on_inactivity_timeout: { enabled: false, text: "" }, on_max_duration_timeout: { enabled: false, text: "" } },
    turn_detection: REQUIRED_HUME_CONFIG.turn_detection,
    interruption: REQUIRED_HUME_CONFIG.interruption,
    nudges: REQUIRED_HUME_CONFIG.nudges,
    timeouts: REQUIRED_HUME_CONFIG.timeouts,
    builtin_tools: [],
    version_description: "Natural benefits interview pacing: patient turns, controlled interruption, app-managed silence check-in",
  };
  payload.language_model = hasToolCapableLanguageModel(current)
    ? { model_provider: current.language_model.model_provider, model_resource: current.language_model.model_resource, temperature: current.language_model.temperature }
    : REQUIRED_HUME_CONFIG.language_model;
  if (current.prompt?.id) payload.prompt = { id: current.prompt.id, version: current.prompt.version };
  if (current.voice?.id) payload.voice = { id: current.voice.id, provider: current.voice.provider || "HUME_AI" };
  if (Array.isArray(current.tools)) payload.tools = current.tools.map((tool) => ({ id: tool.id, version: tool.version }));
  if (Array.isArray(current.webhooks)) payload.webhooks = current.webhooks.map((hook) => ({ url: hook.url, events: hook.events }));
  const response = await fetch(`https://api.hume.ai/v0/evi/configs/${encodeURIComponent(configId)}`, { method: "POST", headers: { "X-Hume-Api-Key": key, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const updated = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(updated.message || updated.detail || "Hume natural-turn configuration could not be applied"), { statusCode: 502 });
  ensureCache = { configId, version: updated.version, expiresAt: Date.now() + 10 * 60 * 1000 };
  return { changed: true, version: updated.version, ready: true };
}
