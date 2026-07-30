const key = process.env.HUME_API_KEY;
const configId = process.env.HUME_CONFIG_ID;
if (!key || !configId) throw new Error("HUME_API_KEY and HUME_CONFIG_ID are required");

const headers = { "X-Hume-Api-Key": key, "Content-Type": "application/json" };
const listResponse = await fetch("https://api.hume.ai/v0/evi/configs?page_number=0&page_size=100&restrict_to_most_recent=true", { headers });
const listData = await listResponse.json().catch(() => ({}));
if (!listResponse.ok) throw new Error(listData.message || listData.detail || `Could not inspect Hume configurations (${listResponse.status})`);
const current = (listData.configs_page || listData.configs || []).find((item) => item.id === configId);
if (!current) throw new Error("HUME_CONFIG_ID was not found in the configured Hume account");

const ready = current.turn_detection?.end_of_turn_silence_ms === 2000
  && current.turn_detection?.speech_detection_threshold === 0.5
  && current.turn_detection?.prefix_padding_ms === 300
  && current.interruption?.min_interruption_ms === 1200
  && current.ellm_model?.allow_short_responses === false
  && ["OPEN_AI", "ANTHROPIC", "GOOGLE"].includes(current.language_model?.model_provider)
  && Boolean(current.language_model?.model_resource)
  && !(current.builtin_tools || []).some((tool) => tool.name === "hang_up")
  && current.nudges?.enabled === false
  && current.timeouts?.inactivity?.enabled === true
  && current.timeouts?.inactivity?.duration_secs === 180
  && current.timeouts?.max_duration?.enabled === true
  && current.timeouts?.max_duration?.duration_secs === 1800;

if (ready) {
  process.stdout.write(JSON.stringify({ configured: true, changed: false, config_id: configId, version: current.version }));
  process.exit(0);
}

const payload = {
  evi_version: current.evi_version || "3",
  ellm_model: { allow_short_responses: false },
  event_messages: {
    on_new_chat: { enabled: false, text: "" },
    on_inactivity_timeout: { enabled: false, text: "" },
    on_max_duration_timeout: { enabled: false, text: "" },
  },
  turn_detection: { end_of_turn_silence_ms: 2000, speech_detection_threshold: 0.5, prefix_padding_ms: 300 },
  interruption: { min_interruption_ms: 1200 },
  nudges: { enabled: false },
  timeouts: { inactivity: { enabled: true, duration_secs: 180 }, max_duration: { enabled: true, duration_secs: 1800 } },
  builtin_tools: [],
  version_description: "Natural benefits interview pacing: patient turns, controlled interruption, app-managed silence check-in",
};
payload.language_model = ["OPEN_AI", "ANTHROPIC", "GOOGLE"].includes(current.language_model?.model_provider) && current.language_model?.model_resource
  ? { model_provider: current.language_model.model_provider, model_resource: current.language_model.model_resource, temperature: current.language_model.temperature }
  : { model_provider: "OPEN_AI", model_resource: "gpt-4o-mini", temperature: 0.5 };
if (current.prompt?.id) payload.prompt = { id: current.prompt.id, version: current.prompt.version };
if (current.voice?.id) payload.voice = { id: current.voice.id, provider: current.voice.provider || "HUME_AI" };
if (Array.isArray(current.tools)) payload.tools = current.tools.map((tool) => ({ id: tool.id, version: tool.version }));
if (Array.isArray(current.webhooks)) payload.webhooks = current.webhooks.map((hook) => ({ url: hook.url, events: hook.events }));

const updateResponse = await fetch(`https://api.hume.ai/v0/evi/configs/${encodeURIComponent(configId)}`, { method: "POST", headers, body: JSON.stringify(payload) });
const updated = await updateResponse.json().catch(() => ({}));
if (!updateResponse.ok) throw new Error(updated.message || updated.detail || "Hume configuration update failed");
process.stdout.write(JSON.stringify({ configured: true, changed: true, config_id: configId, version: updated.version }));
