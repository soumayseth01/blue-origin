import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:8106";
const browser = await chromium.launch({ headless: true });

function sessionPayload() {
  return {
    access_token: "temporary-test-token",
    config_id: "test-config",
    config_version: 3,
    session_id: "session:test-browser",
    session_proof: "test-proof",
    voice_id: "voice-test",
    selection: { profile: "Anxious", intensity: "moderate", voice: "Test voice", presentation: "Female" },
    active_contact_id: "contact:person-01",
    contact_sequence: { mode: "direct", contacts: [{ contact_id: "contact:person-01", name: "Maya Ortiz", role: "applicant", preferred_language: "English", greeting: "Hello?" }], answering_contact_id: "contact:person-01", intended_contact_id: "contact:person-01", active_contact_id: "contact:person-01" },
    greeting: "Hello?",
    turn_policy: { silence_checkin_ms: 20000 },
    session_settings: { type: "session_settings", system_prompt: "Test applicant", context: { text: "{}", type: "persistent" }, tools: [], custom_session_id: "session:test-browser" },
  };
}

async function installFakeBrowserAudio(page, { microphoneDenied = false } = {}) {
  await page.evaluate(({ microphoneDenied }) => {
    window.__humeBrowserQA = { sent: [], enqueued: [], stopped: 0, disposed: 0 };
    class FakePlayer {
      constructor({ volume }) { this.volume = volume; }
      async init() {}
      async enqueue(message) { window.__humeBrowserQA.enqueued.push(message); }
      stop() { window.__humeBrowserQA.stopped += 1; }
      setVolume(value) { this.volume = value; }
      mute() { this.muted = true; }
      unmute() { this.muted = false; }
      dispose() { window.__humeBrowserQA.disposed += 1; }
    }
    class FakeSocket {
      constructor() { this.handlers = {}; this.readyState = 1; }
      on(type, handler) { this.handlers[type] = handler; }
      async waitForOpen() {
        window.setTimeout(() => this.handlers.message?.({ type: "chat_metadata", chatId: "chat-test" }), 0);
        return this;
      }
      sendSessionSettings(settings) { window.__humeBrowserQA.sent.push({ type: "session_settings", settings }); }
      sendAssistantInput(message) { window.__humeBrowserQA.sent.push({ type: "assistant_input", ...message }); }
      sendAudioInput(message) { window.__humeBrowserQA.sent.push({ type: "audio_input", ...message }); }
      pauseAssistant() { window.__humeBrowserQA.sent.push({ type: "pause" }); }
      resumeAssistant() { window.__humeBrowserQA.sent.push({ type: "resume" }); }
      sendToolResponseMessage(message) { window.__humeBrowserQA.sent.push({ type: "tool_response", ...message }); }
      close() { this.readyState = 3; }
    }
    class FakeHumeClient {
      constructor(options) {
        if (!options || typeof options !== "object") throw new TypeError("HumeClient requires an options object");
        window.__humeBrowserQA.clientOptions = options;
        this.empathicVoice = { chat: { connect: () => (window.__humeBrowserQA.socket = new FakeSocket()) } };
      }
    }
    window.BlueOriginHumeSDK = {
      EVIWebAudioPlayer: FakePlayer,
      HumeClient: FakeHumeClient,
      getBrowserSupportedMimeType: () => ({ success: true, mimeType: "audio/webm" }),
      ensureSingleValidAudioTrack: (stream) => { if (stream.getAudioTracks().length !== 1) throw new Error("Expected one track"); },
      convertBlobToBase64: async () => "test-audio",
    };
    const track = Object.assign(new EventTarget(), { kind: "audio", readyState: "live", stop() { this.readyState = "ended"; } });
    const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => {
      if (microphoneDenied) throw Object.assign(new Error("Denied"), { name: "NotAllowedError" });
      return stream;
    } } });
    window.MediaRecorder = class FakeMediaRecorder extends EventTarget {
      constructor() { super(); this.state = "inactive"; }
      start(interval) { this.interval = interval; this.state = "recording"; }
      stop() { this.state = "inactive"; }
    };
    eval('selectScenario(0); setProductView("simulations"); state.humeSession.configured = true; renderScreen();');
  }, { microphoneDenied });
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  await page.route("**/api/hume/session", async (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "client_diagnostic") return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ accepted: true }) });
    if (body.action === "case_response") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authorized: true, response_text: "My full name is Maya Ortiz.", fact_ids: ["application:people.0.fullName"], context: { context_revision: 1, active_contact_id: "contact:person-01" }, session_proof: "updated-test-proof" }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionPayload()) });
  });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await installFakeBrowserAudio(page);
  await page.locator("#startLiveCall").click();
  await page.waitForFunction(() => eval('state.callPhase === "live" && state.humeSession.status === "connected"'), null, { timeout: 8000 }).catch(async () => {
    const runtime = await page.evaluate(() => ({ callPhase: eval("state.callPhase"), hume: eval("({ status: state.humeSession.status, phase: state.humeSession.connectionPhase, error: state.humeSession.runtimeError })"), text: document.querySelector(".hume-runtime-error")?.innerText || "" }));
    throw new Error(`Live startup did not connect: ${JSON.stringify({ runtime, browserErrors })}`);
  });
  await page.waitForTimeout(700);
  const connected = await page.evaluate(() => ({
    phase: eval("state.humeSession.connectionPhase"),
    attemptId: eval("state.humeSession.connectionAttemptId"),
    recorderState: eval("state.humeSession.recorder.state"),
    interval: eval("state.humeSession.recorder.interval"),
    greeting: window.__humeBrowserQA.sent.find((item) => item.type === "assistant_input")?.text,
  }));
  assert.equal(connected.phase, "connected");
  assert.match(connected.attemptId, /^hume-attempt-/);
  assert.equal(connected.recorderState, "recording");
  assert.equal(connected.interval, 80);
  assert.equal(connected.greeting, "Hello?");
  await page.evaluate(() => window.__humeBrowserQA.socket.handlers.message({ type: "audio_output", id: "response-1", index: 1, data: "audio-chunk" }));
  await page.waitForFunction(() => window.__humeBrowserQA.enqueued.length === 1);
  assert.deepEqual(await page.evaluate(() => window.__humeBrowserQA.enqueued[0]), { type: "audio_output", id: "response-1", index: 1, data: "audio-chunk" });
  await page.evaluate(() => window.__humeBrowserQA.socket.handlers.message({ type: "user_interruption" }));
  assert.equal(await page.evaluate(() => window.__humeBrowserQA.stopped), 1);
  const settingsBeforeTool = await page.evaluate(() => window.__humeBrowserQA.sent.filter((item) => item.type === "session_settings").length);
  await page.evaluate(() => window.__humeBrowserQA.socket.handlers.message({ type: "tool_call", toolCallId: "call-name", toolType: "function", responseRequired: true, name: "request_case_response", parameters: JSON.stringify({ active_contact_id: "contact:person-01", fact_id: "application:people.0.fullName", topic: "Full name", learner_question: "Confirm your full name" }) }));
  await page.waitForFunction(() => window.__humeBrowserQA.sent.some((item) => item.type === "tool_response"));
  const toolRoundTrip = await page.evaluate(() => ({ response: window.__humeBrowserQA.sent.find((item) => item.type === "tool_response"), settingsCount: window.__humeBrowserQA.sent.filter((item) => item.type === "session_settings").length }));
  assert.equal(toolRoundTrip.response.content, "My full name is Maya Ortiz.");
  assert.equal(toolRoundTrip.response.toolCallId, "call-name");
  assert.equal(toolRoundTrip.settingsCount, settingsBeforeTool, "case-fact tool completion must not be interrupted by a session-settings update");

  const denied = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await denied.route("**/api/hume/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionPayload()) }));
  await denied.goto(baseURL, { waitUntil: "networkidle" });
  await installFakeBrowserAudio(denied, { microphoneDenied: true });
  await denied.locator("#startLiveCall").click();
  await denied.locator(".hume-runtime-error").waitFor();
  assert.match(await denied.locator(".hume-runtime-error").innerText(), /Microphone access is blocked/i);
  assert.equal(await denied.locator("#startLiveCall").innerText(), "Retry live call");

  process.stdout.write(JSON.stringify({ ok: true, connected, orderedAudio: true, interruption: true, toolRoundTrip: true, deniedRecovery: true }, null, 2));
} finally {
  await browser.close();
}
