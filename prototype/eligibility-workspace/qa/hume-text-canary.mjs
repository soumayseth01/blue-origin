import assert from "node:assert/strict";
import fs from "node:fs";
import { HumeClient } from "hume";

const sessionPath = process.env.HUME_SESSION_FILE || "/tmp/blueorigin-hume-session.json";
const evidencePath = process.env.HUME_CANARY_EVIDENCE || new URL("./evidence/hume-text-canary.json", import.meta.url).pathname;
const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
assert.ok(session.access_token && session.session_settings && session.session_id, "A valid temporary Hume session is required");

const client = new HumeClient({});
const socket = client.empathicVoice.chat.connect({
  accessToken: session.access_token,
  configId: session.config_id,
  configVersion: session.config_version,
  voiceId: session.voice_id,
  verboseTranscription: true,
  reconnectAttempts: 1,
});

const milestones = [];
const assistantMessages = [];
let audioChunks = 0;
let learnerQuestionSent = false;
let completed = false;

function settings(value) {
  return {
    systemPrompt: value.system_prompt,
    context: value.context,
    tools: value.tools?.map((tool) => ({ type: tool.type, name: tool.name, description: tool.description, parameters: tool.parameters, fallbackContent: tool.fallback_content })),
    customSessionId: value.custom_session_id,
    voiceId: value.voice_id,
  };
}

const finished = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error(`Hume text canary timed out after: ${milestones.join(", ")}`)), 45000);
  socket.on("message", (message) => {
    milestones.push(message.type);
    if (message.type === "chat_metadata") {
      socket.sendAssistantInput({ text: session.greeting || "Hello?" });
      return;
    }
    if (message.type === "audio_output") audioChunks += 1;
    if (message.type === "assistant_message") {
      const content = String(message.message?.content || message.content || "").trim();
      if (content) assistantMessages.push(content);
      if (!learnerQuestionSent) {
        learnerQuestionSent = true;
        socket.sendUserInput("Are you currently married?");
      } else if (assistantMessages.length >= 2 && !completed) {
        completed = true;
        clearTimeout(timeout);
        resolve();
      }
    }
    if (message.type === "tool_call" && (message.name || message.tool_name) === "request_case_response") {
      socket.sendToolResponseMessage({
        toolCallId: message.toolCallId || message.tool_call_id || message.id,
        toolName: message.name || message.tool_name,
        toolType: message.toolType || message.tool_type || "function",
        content: "I’m separated. My husband does not live with us right now.",
      });
    }
    if (message.type === "error") reject(new Error(`${message.code || "Hume error"}: ${message.message || message.error || "Unknown error"}`));
  });
  socket.on("error", reject);
});

await socket.waitForOpen();
socket.sendSessionSettings(settings(session.session_settings));
await finished;
socket.close();

const interviewAnswer = assistantMessages.at(-1) || "";
assert.ok(interviewAnswer.split(/\s+/).length >= 5, `Caller answer was not communicative: ${interviewAnswer}`);
assert.doesNotMatch(interviewAnswer, /not in (the )?(application|payload|system)/i);
assert.match(interviewAnswer, /separat|husband.*does not live|doesn't live/i);
assert.ok(audioChunks > 0, "Hume returned no caller audio chunks");

const evidence = {
  generated_at: new Date().toISOString(),
  session_id_suffix: session.session_id.slice(-8),
  scenario_id: "BO-001",
  config_version: session.config_version,
  caller_brief_size_bytes: session.caller_brief_size_bytes,
  hume_context_size_bytes: session.hume_context_size_bytes,
  voice_id_suffix: session.voice_id.slice(-8),
  milestones,
  audio_chunk_count: audioChunks,
  assistant_message_count: assistantMessages.length,
  greeting: assistantMessages[0],
  interview_answer: interviewAnswer,
  communicative_answer: true,
  forbidden_system_language_absent: true,
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
