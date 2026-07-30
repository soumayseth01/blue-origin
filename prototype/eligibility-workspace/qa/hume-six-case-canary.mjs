import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { HumeClient } from "hume";

const baseURL = process.env.QA_BASE_URL || "https://eligibility-workspace-nu.vercel.app";
const evidencePath = process.env.HUME_MATRIX_EVIDENCE || new URL("./evidence/hume-six-case-canary.json", import.meta.url).pathname;
const turnTimeoutMs = Number(process.env.HUME_TURN_TIMEOUT_MS || 45_000);
const forbiddenSystemLanguage = /not in (the )?(application|payload|system)|system prompt|caller_brief/i;

function sessionSettings(value) {
  return {
    systemPrompt: value.system_prompt,
    context: value.context,
    tools: value.tools?.map((tool) => ({ type: tool.type, name: tool.name, description: tool.description, parameters: tool.parameters, fallbackContent: tool.fallback_content })),
    customSessionId: value.custom_session_id,
    voiceId: value.voice_id,
  };
}

function words(value) {
  const stop = new Set(["a", "about", "and", "are", "as", "at", "be", "before", "but", "do", "for", "from", "have", "i", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "with", "you"]);
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((word) => word.length > 2 && !stop.has(word));
}

function supportScore(answer, authored) {
  const answerWords = new Set(words(answer));
  const expected = [...new Set(words(authored))];
  if (!expected.length) return 1;
  return expected.filter((word) => answerWords.has(word)).length / expected.length;
}

function integerWords(value) {
  const underTwenty = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const render = (number) => {
    if (number < 20) return underTwenty[number];
    if (number < 100) return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${underTwenty[number % 10]}` : ""}`;
    if (number < 1_000) return `${underTwenty[Math.floor(number / 100)]} hundred${number % 100 ? ` ${render(number % 100)}` : ""}`;
    if (number < 1_000_000) return `${render(Math.floor(number / 1_000))} thousand${number % 1_000 ? ` ${render(number % 1_000)}` : ""}`;
    return "";
  };
  return Number.isSafeInteger(value) && value >= 0 && value < 1_000_000 ? render(value) : "";
}

function normalizedValueSupported(answer, normalizedValue) {
  const normalizedAnswer = String(answer || "").toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim();
  const literal = String(normalizedValue ?? "").toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim();
  if (literal && normalizedAnswer.includes(literal)) return true;
  const numeric = Number(String(normalizedValue ?? "").replace(/[$,\s]/g, ""));
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return false;
  const spoken = integerWords(numeric);
  return Boolean(spoken && normalizedAnswer.includes(spoken));
}

async function extractStartRequests() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(baseURL, { waitUntil: "networkidle" });
    return await page.evaluate(() => scenarios.slice(0, 6).map((_, index) => {
      selectScenario(index);
      return {
        scenario_id: getScenario().id,
        request: buildLiveHumeStartRequest(),
        route: getScenario().contactSequence,
        facts: getScenario().truthLedger,
      };
    }));
  } finally {
    await browser.close();
  }
}

async function postSession(body) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${baseURL}/api/hume/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: JSON.stringify(body),
    });
    const raw = await response.text();
    let payload = {};
    try { payload = JSON.parse(raw); } catch { /* deployment edge errors can be HTML */ }
    if (response.ok) return payload;
    lastError = new Error(payload.detail || `Hume session request failed (${response.status})${raw && !raw.startsWith("<") ? `: ${raw.slice(0, 240)}` : ""}`);
    if (![404, 408, 429, 502, 503, 504].includes(response.status) || attempt === 3) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw lastError;
}

function createMessageQueue(socket, onMessage = () => {}) {
  const messages = [];
  const waiters = [];
  let terminalError = null;
  function settle() {
    while (waiters.length && messages.length) waiters.shift().resolve(messages.shift());
    if (terminalError) while (waiters.length) waiters.shift().reject(terminalError);
  }
  socket.on("message", (message) => {
    onMessage(message);
    if (message.type === "error") terminalError = new Error(`${message.code || "Hume error"}: ${message.message || message.error || "Unknown error"}`);
    else messages.push(message);
    settle();
  });
  socket.on("error", (error) => { terminalError = error; settle(); });
  return {
    next(timeoutMs = turnTimeoutMs) {
      if (terminalError) return Promise.reject(terminalError);
      if (messages.length) return Promise.resolve(messages.shift());
      return new Promise((resolve, reject) => {
        const waiter = { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } };
        const timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error(`Timed out waiting for Hume after ${timeoutMs} ms`));
        }, timeoutMs);
        waiters.push(waiter);
      });
    },
  };
}

function toolArguments(message) {
  const raw = message.parameters || message.args || message.function?.arguments || {};
  if (typeof raw !== "string") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

function toolIdentity(message) {
  return {
    toolCallId: message.toolCallId || message.tool_call_id || message.id,
    toolName: message.name || message.tool_name || message.function?.name,
    toolType: message.toolType || message.tool_type || "function",
  };
}

async function runScenario(definition) {
  const started = await postSession(definition.request);
  let sessionProof = started.session_proof;
  let contextRevision = Number(started.session_settings?.context?.text ? JSON.parse(started.session_settings.context.text).context_revision || 0 : 0);
  let activeContactId = started.active_contact_id;
  let activeVoiceId = started.voice_id;
  const toolCalls = [];
  const answers = [];
  const milestones = [];
  let audioChunkCount = 0;
  const client = new HumeClient({});
  const socket = client.empathicVoice.chat.connect({
    accessToken: started.access_token,
    configId: started.config_id,
    configVersion: started.config_version,
    voiceId: started.voice_id,
    verboseTranscription: true,
    reconnectAttempts: 1,
  });
  const queue = createMessageQueue(socket, (message) => {
    if (message.type === "audio_output") audioChunkCount += 1;
  });

  async function authorizeTool(message) {
    const identity = toolIdentity(message);
    const args = toolArguments(message);
    let payload;
    if (identity.toolName === "request_contact_handoff") {
      payload = await postSession({ action: "contact_handoff", session_proof: sessionProof, context_revision: contextRevision, current_contact_id: activeContactId, requested_contact_id: args.requested_contact_id || definition.route.intended_contact_id, reason: args.reason || "Learner requested the intended contact" });
      if (payload.authorized) {
        assert.notEqual(payload.voice_id, activeVoiceId, `${definition.scenario_id} handoff did not change voices`);
        activeContactId = payload.active_contact_id;
        activeVoiceId = payload.voice_id;
        socket.sendSessionSettings({ systemPrompt: payload.system_prompt, context: { text: JSON.stringify(payload.context), type: "persistent" }, voiceId: payload.voice_id });
      }
    } else if (identity.toolName === "record_callback_message") {
      payload = await postSession({ action: "callback_message", session_proof: sessionProof, context_revision: contextRevision, active_contact_id: activeContactId, message: args.message || args.callback_message });
    } else {
      payload = await postSession({ action: "case_response", session_proof: sessionProof, context_revision: contextRevision, active_contact_id: activeContactId, fact_id: args.fact_id, case_path: args.case_path, topic: args.topic, learner_question: args.learner_question });
    }
    sessionProof = payload.session_proof || sessionProof;
    contextRevision = Number(payload.context?.context_revision ?? contextRevision);
    toolCalls.push({ name: identity.toolName, authorized: Boolean(payload.authorized), active_contact_id: activeContactId, voice_changed: identity.toolName === "request_contact_handoff" && Boolean(payload.authorized) });
    socket.sendToolResponseMessage({ ...identity, content: payload.response_text || (payload.authorized ? "Authorized" : "Not authorized") });
    return payload;
  }

  async function waitForAssistant() {
    while (true) {
      const message = await queue.next();
      milestones.push(message.type);
      if (message.type === "tool_call") { await authorizeTool(message); continue; }
      if (message.type === "assistant_message") {
        const content = String(message.message?.content || message.content || "").trim();
        if (content) return content;
      }
    }
  }

  async function sendTurn(text) {
    socket.sendUserInput(text);
    const answer = await waitForAssistant();
    assert.doesNotMatch(answer, forbiddenSystemLanguage, `${definition.scenario_id} exposed system-facing language`);
    answers.push({ learner: text, caller: answer });
    return answer;
  }

  try {
    await socket.waitForOpen();
    socket.sendSessionSettings(sessionSettings(started.session_settings));
    while (true) {
      const message = await queue.next();
      milestones.push(message.type);
      if (message.type === "chat_metadata") break;
    }
    socket.sendAssistantInput({ text: started.greeting || "Hello?" });
    const greeting = await waitForAssistant();
    assert.ok(greeting.split(/\s+/).length >= 1, `${definition.scenario_id} returned no greeting`);
    answers.push({ learner: null, caller: greeting });

    const intended = definition.route.contacts.find((contact) => contact.contact_id === definition.route.intended_contact_id);
    if (definition.route.mode === "screened") {
      const answer = await sendTurn(`Hello, this is Soumay calling from County Services. May I speak with ${intended.name}?`);
      if (definition.route.expected_handoff) {
        assert.ok(toolCalls.some((tool) => tool.name === "request_contact_handoff" && tool.authorized && tool.voice_changed), `${definition.scenario_id} did not complete the authored handoff. Caller response: ${answer}. Tools: ${JSON.stringify(toolCalls)}`);
        assert.equal(activeContactId, definition.route.intended_contact_id);
      } else {
        assert.match(answer, /not here|not available|cannot come|can't come|call back|later|after|between/i, `${definition.scenario_id} did not follow unavailable-contact behavior`);
        if (definition.route.message_policy === "neutral_callback_only") {
          const callbackAnswer = await sendTurn("Please tell them Soumay from County Services called. My callback number is 555-0142, and I am requesting a return call.");
          assert.ok(toolCalls.some((tool) => tool.name === "record_callback_message" && tool.authorized), `${definition.scenario_id} did not authorize the neutral callback message`);
          assert.match(callbackAnswer, /pass|message|okay|return call|tell/i);
        } else {
          const declined = await sendTurn("May I leave a message about the application?");
          assert.match(declined, /cannot|can't|do not|don't|call back|after|tomorrow/i, `${definition.scenario_id} did not decline the message`);
          assert.equal(toolCalls.some((tool) => tool.name === "record_callback_message" && tool.authorized), false);
        }
      }
    }

    if (definition.route.mode === "direct" || definition.route.expected_handoff) {
      for (const fact of definition.facts.filter((item) => item.required !== false)) {
        const question = fact.learner_question_examples?.[0] || `Can you tell me about ${fact.label}?`;
        let answer = await sendTurn(question);
        let score = supportScore(answer, fact.natural_response);
        let clarified = false;
        if (score < 0.18 && !normalizedValueSupported(answer, fact.normalized_value)) {
          clarified = true;
          answer = await sendTurn(`I want to make sure I record this correctly. Can you give me the current detail for ${fact.label.toLowerCase()}?`);
          score = supportScore(answer, fact.natural_response);
        }
        assert.ok(score >= 0.18 || normalizedValueSupported(answer, fact.normalized_value), `${definition.scenario_id}/${fact.fact_id} was not supported after clarification (score ${score.toFixed(2)}): ${answer}`);
        answers.at(-1).fact_id = fact.fact_id;
        answers.at(-1).support_score = Number(score.toFixed(3));
        answers.at(-1).clarification = clarified;
      }
    }

    assert.ok(audioChunkCount > 0, `${definition.scenario_id} produced no Hume audio output`);
    return {
      scenario_id: definition.scenario_id,
      route_id: definition.route.route_id,
      expected_terminal_state: definition.route.expected_terminal_state,
      caller_brief_size_bytes: started.caller_brief_size_bytes,
      hume_context_size_bytes: started.hume_context_size_bytes,
      initial_voice_suffix: String(started.voice_id || "").slice(-8),
      final_voice_suffix: String(activeVoiceId || "").slice(-8),
      answer_count: answers.length,
      factual_answer_count: answers.filter((answer) => answer.fact_id).length,
      audio_chunk_count: audioChunkCount,
      audio_output_observed: true,
      tools: toolCalls,
      milestones,
      answers,
      passed: true,
    };
  } finally {
    socket.close();
  }
}

const requestedIds = new Set(String(process.env.QA_SCENARIO_IDS || "").split(",").map((value) => value.trim()).filter(Boolean));
const definitions = (await extractStartRequests()).filter((definition) => !requestedIds.size || requestedIds.has(definition.scenario_id));
assert.ok(definitions.length > 0);
let existingEvidence = null;
try { existingEvidence = JSON.parse(fs.readFileSync(evidencePath, "utf8")); } catch { /* first run */ }
const results = Array.isArray(existingEvidence?.scenarios) ? existingEvidence.scenarios.filter((result) => !definitions.some((definition) => definition.scenario_id === result.scenario_id)) : [];
for (const definition of definitions) {
  process.stdout.write(`Running live Hume matrix for ${definition.scenario_id}…\n`);
  results.push(await runScenario(definition));
  fs.writeFileSync(evidencePath, `${JSON.stringify({ generated_at: new Date().toISOString(), base_url: baseURL, scenarios: results, passed: false, checkpoint: true }, null, 2)}\n`);
}

results.sort((left, right) => left.scenario_id.localeCompare(right.scenario_id));

const evidence = {
  generated_at: new Date().toISOString(),
  base_url: baseURL,
  scenarios: results,
  route_distribution: {
    direct: results.filter((result) => result.route_id.endsWith(":direct")).length,
    handoff: results.filter((result) => result.tools.some((tool) => tool.name === "request_contact_handoff" && tool.authorized)).length,
    unavailable: results.filter((result) => ["callback_message_recorded", "call_later"].includes(result.expected_terminal_state)).length,
  },
  passed: results.length === 6 && results.every((result) => result.passed),
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ generated_at: evidence.generated_at, route_distribution: evidence.route_distribution, scenarios: results.map(({ scenario_id, factual_answer_count, audio_chunk_count, tools, passed }) => ({ scenario_id, factual_answer_count, audio_chunk_count, tools, passed })) }, null, 2));
