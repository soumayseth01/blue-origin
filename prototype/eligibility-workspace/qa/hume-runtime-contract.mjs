import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../hume-browser-runtime.js", import.meta.url), "utf8");
const context = {
  console,
  globalThis: null,
  setTimeout,
  clearTimeout,
  EventTarget,
  Event,
  CustomEvent: class CustomEvent extends Event { constructor(type, init = {}) { super(type); this.detail = init.detail; } },
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "hume-browser-runtime.js" });

const {
  HumeBrowserClient,
  HumeRuntimeError,
  HUME_CONNECTION_PHASES,
  createHumeSdkTransport,
  buildHumeToolResponse,
  safeHumeDiagnostic,
} = context.BlueOriginHumeRuntime;

assert.equal(HUME_CONNECTION_PHASES.CONNECTED, "connected");
assert.equal(new HumeRuntimeError("socket_timeout", "connect_hume", "Timed out").code, "socket_timeout");

{
  const response = buildHumeToolResponse(
    { type: "tool_call", toolCallId: "call-1", toolType: "function", responseRequired: true, name: "request_case_response" },
    { authorized: true, response_text: "My full name is Maya Ortiz.", session_proof: "must-not-leak", context: { private: "must-not-leak" }, fact_ids: ["fact:name"] },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(response)), { type: "tool_response", tool_call_id: "call-1", tool_name: "request_case_response", tool_type: "function", content: "My full name is Maya Ortiz." });
  assert.equal(buildHumeToolResponse({ responseRequired: false }, { response_text: "unused" }), null);
}

{
  let constructorOptions;
  const sdkSocket = {
    readyState: 1,
    on() {},
    async waitForOpen() {},
    close() {},
  };
  class ConstructorContractHumeClient {
    constructor(options) {
      assert.ok(options && typeof options === "object", "HumeClient requires an options object");
      constructorOptions = options;
      this.empathicVoice = { chat: { connect: () => sdkSocket } };
    }
  }
  const transport = createHumeSdkTransport({
    HumeClient: ConstructorContractHumeClient,
    EVIWebAudioPlayer: class {},
    getBrowserSupportedMimeType() {},
    ensureSingleValidAudioTrack() {},
    convertBlobToBase64() {},
  });
  await transport.connect({
    session: { access_token: "temporary-token", config_id: "config-id", config_version: 3, voice_id: "voice-id" },
    onMessage() {},
    onClose() {},
    onError() {},
  });
  assert.equal(Object.keys(constructorOptions).length, 0, "the SDK client receives its required options object");
}

function fakeTrack() {
  return { kind: "audio", readyState: "live", stopped: false, stop() { this.stopped = true; } };
}

function fakeStream() {
  const track = fakeTrack();
  return { track, getAudioTracks: () => [track], getTracks: () => [track] };
}

class FakeRecorder extends EventTarget {
  static isTypeSupported(type) { return type === "audio/webm"; }
  constructor(stream, options = {}) {
    super();
    this.stream = stream;
    this.mimeType = options.mimeType || "";
    this.state = "inactive";
  }
  start(interval) { this.interval = interval; this.state = "recording"; }
  stop() { this.state = "inactive"; }
}

function makeHarness(overrides = {}) {
  const phases = [];
  const diagnostics = [];
  const fatals = [];
  const messages = [];
  const sent = [];
  const enqueued = [];
  const player = {
    initialized: false,
    stopped: 0,
    disposed: false,
    volume: 0,
    async init() { this.initialized = true; },
    async enqueue(message) { enqueued.push(message); },
    stop() { this.stopped += 1; },
    setVolume(value) { this.volume = value; },
    mute() { this.muted = true; },
    unmute() { this.muted = false; },
    async dispose() { this.disposed = true; },
  };
  const socket = {
    readyState: 1,
    sendSessionSettings(settings) { sent.push({ kind: "settings", settings }); },
    sendAssistantInput(text) { sent.push({ kind: "assistant", text }); },
    sendAudioInput(data) { sent.push({ kind: "audio", data }); },
    sendPauseAssistantMessage() { sent.push({ kind: "pause" }); },
    sendResumeAssistantMessage() { sent.push({ kind: "resume" }); },
    sendToolResponse(message) { sent.push({ kind: "tool", message }); },
    close() { this.readyState = 3; this.closed = true; },
  };
  const transport = {
    createPlayer: () => player,
    getBrowserSupportedMimeType: () => ({ mimeType: "audio/webm", success: true }),
    convertBlobToBase64: async () => "audio-base64",
    connect: async ({ onMessage, onClose, onError }) => {
      transport.onMessage = onMessage;
      transport.onClose = onClose;
      transport.onError = onError;
      return socket;
    },
    ...overrides.transport,
  };
  const stream = overrides.stream || fakeStream();
  const client = new HumeBrowserClient({
    transport,
    mediaDevices: { getUserMedia: overrides.getUserMedia || (async () => stream) },
    MediaRecorderClass: FakeRecorder,
    createSession: overrides.createSession || (async () => ({
      access_token: "temporary-token",
      config_id: "config-id",
      config_version: 3,
      session_id: "session-id",
      session_proof: "signed-proof",
      voice_id: "voice-id",
      greeting: "Hello?",
      session_settings: { type: "session_settings", system_prompt: "Applicant prompt" },
    })),
    onPhase: (phase) => phases.push(phase),
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    onFatal: (error) => fatals.push(error),
    onMessage: (message) => messages.push(message),
    timing: {
      microphoneTimeoutMs: 35,
      sessionTimeoutMs: 35,
      connectionTimeoutMs: 35,
      metadataTimeoutMs: 35,
      firstResponseTimeoutMs: 35,
      greetingDelayMs: 5,
      ...overrides.timing,
    },
  });
  return { client, phases, diagnostics, fatals, messages, sent, enqueued, player, socket, stream, transport };
}

async function emitReady(harness) {
  while (!harness.transport.onMessage) await new Promise((resolve) => setTimeout(resolve, 0));
  harness.transport.onMessage({ type: "chat_metadata", chatId: "chat-id" });
}

{
  const harness = makeHarness();
  const started = harness.client.start({ request: { action: "start" } });
  await emitReady(harness);
  const result = await started;
  assert.equal(result.phase, "connected");
  assert.deepEqual(harness.phases.slice(0, 6), [
    "request_microphone",
    "prepare_audio",
    "create_session",
    "connect_hume",
    "confirm_session",
    "connected",
  ]);
  assert.equal(harness.client.recorder.state, "recording");
  assert.equal(harness.client.recorder.interval, 80);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(harness.sent.filter((item) => item.kind === "assistant"), [{ kind: "assistant", text: "Hello?" }]);
  await harness.client.close();
  assert.equal(harness.stream.track.stopped, true);
  assert.equal(harness.player.disposed, true);
}

{
  const harness = makeHarness({ transport: { connect: () => new Promise(() => {}) } });
  await assert.rejects(harness.client.start({ request: {} }), (error) => error.code === "socket_timeout" && error.phase === "connect_hume");
  assert.equal(harness.stream.track.stopped, true);
  assert.equal(harness.player.disposed, true);
}

{
  const harness = makeHarness({ getUserMedia: () => new Promise(() => {}) });
  await assert.rejects(harness.client.start({ request: {} }), (error) => error.code === "microphone_timeout" && error.phase === "request_microphone");
  assert.ok(harness.diagnostics.some((item) => item.code === "microphone_timeout"));
}

{
  const harness = makeHarness({ getUserMedia: async () => { throw Object.assign(new Error("Denied"), { name: "NotAllowedError" }); } });
  await assert.rejects(harness.client.start({ request: {} }), (error) => error.code === "microphone_denied");
}

{
  const harness = makeHarness();
  harness.player.init = async () => { throw Object.assign(new Error("AudioContext suspended"), { name: "NotAllowedError" }); };
  await assert.rejects(harness.client.start({ request: {} }), (error) => error.code === "audio_activation" && error.phase === "prepare_audio");
  assert.equal(harness.stream.track.stopped, true);
}

{
  let close;
  const harness = makeHarness({ transport: { connect: async ({ onMessage, onClose }) => { close = onClose; harness.transport.onMessage = onMessage; onClose({ code: 1006 }); return harness.socket; } } });
  await assert.rejects(harness.client.start({ request: {} }), (error) => error.code === "socket_close" && error.closeCode === 1006);
  assert.ok(close);
}

{
  const harness = makeHarness();
  const started = harness.client.start({ request: {} });
  while (harness.client.phase !== "confirm_session") await new Promise((resolve) => setTimeout(resolve, 0));
  harness.transport.onMessage({ type: "error", code: "E0716", message: "Invalid session settings" });
  await assert.rejects(started, (error) => error.code === "hume_session_error" && error.phase === "confirm_session");
  assert.equal(harness.stream.track.stopped, true);
}

{
  const harness = makeHarness();
  const started = harness.client.start({ request: {} });
  await emitReady(harness);
  await started;
  harness.socket.close = () => {
    harness.socket.readyState = 3;
    harness.transport.onClose({ code: 1000 });
  };
  harness.transport.onMessage({ type: "error", code: "E0716", message: "Invalid session settings" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(harness.fatals.length, 1, "the first Hume failure must win over the cleanup close event");
  assert.equal(harness.fatals[0].code, "hume_session_error");
  assert.match(harness.fatals[0].message, /E0716.*Invalid session settings/);
}

{
  const harness = makeHarness();
  const started = harness.client.start({ request: {} });
  await emitReady(harness);
  await started;
  const firstAttempt = harness.client.attemptId;
  await harness.client.close();
  harness.transport.onMessage({ type: "assistant_message", message: { content: "Late response" }, attemptId: firstAttempt });
  assert.equal(harness.messages.length, 1, "only chat_metadata from the active attempt is delivered");
}

{
  const harness = makeHarness();
  const started = harness.client.start({ request: {} });
  await emitReady(harness);
  await started;
  const audio = { type: "audio_output", id: "response-1", index: 1, data: "chunk-1" };
  harness.transport.onMessage(audio);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(harness.enqueued[0], audio, "the complete Hume audio event is preserved for ordered playback");
  harness.transport.onMessage({ type: "user_interruption" });
  assert.equal(harness.player.stopped, 1);
  await harness.client.close();
}

{
  const harness = makeHarness({ timing: { firstResponseTimeoutMs: 8, greetingDelayMs: 1 } });
  const started = harness.client.start({ request: {} });
  await emitReady(harness);
  await started;
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(harness.fatals[0]?.code, "response_timeout");
  assert.equal(harness.stream.track.stopped, true);
}

{
  const diagnostic = safeHumeDiagnostic({
    phase: "connect_hume",
    code: "socket_close",
    browserFamily: "Safari",
    closeCode: 1006,
    elapsedMs: 18001,
    token: "must-not-leak",
    transcript: "must-not-leak",
    application: { name: "must-not-leak" },
  });
  assert.deepEqual(Object.keys(diagnostic).sort(), ["browser_family", "close_code", "code", "elapsed_ms", "phase"]);
}

process.stdout.write("Hume browser runtime contract: ok\n");
