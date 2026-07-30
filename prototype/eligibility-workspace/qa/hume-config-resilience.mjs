import assert from "node:assert/strict";
import {
  inspectHumeConfig,
  resetHumeConfigCacheForTests,
} from "../api/_lib/hume-config.js";

const originalFetch = globalThis.fetch;

try {
  resetHumeConfigCacheForTests();
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) return new Response(JSON.stringify({ message: "temporary failure" }), { status: 503 });
    return new Response(JSON.stringify({ configs_page: [{
      id: "config-test",
      version: 4,
      turn_detection: { end_of_turn_silence_ms: 2000, speech_detection_threshold: 0.5, prefix_padding_ms: 300 },
      interruption: { min_interruption_ms: 1200 },
      ellm_model: { allow_short_responses: false },
      language_model: { model_provider: "OPEN_AI", model_resource: "gpt-4o-mini" },
      builtin_tools: [],
      nudges: { enabled: false },
      timeouts: { inactivity: { enabled: true, duration_secs: 180 }, max_duration: { enabled: true, duration_secs: 1800 } },
    }] }), { status: 200 });
  };

  const inspected = await inspectHumeConfig("test-key", "config-test", { retryDelayMs: 0 });
  assert.equal(inspected.ready, true);
  assert.equal(inspected.config.version, 4);
  assert.equal(attempts, 2, "a transient Hume configuration response is retried once");

  resetHumeConfigCacheForTests();
  attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 });
  };
  await assert.rejects(
    inspectHumeConfig("bad-key", "config-test", { retryDelayMs: 0 }),
    (error) => error.statusCode === 502 && error.upstreamStatus === 401,
  );
  assert.equal(attempts, 1, "credential failures are not retried");
} finally {
  globalThis.fetch = originalFetch;
  resetHumeConfigCacheForTests();
}

process.stdout.write("Hume configuration resilience: ok\n");
