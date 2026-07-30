import { randomUUID } from "node:crypto";
import { allowMethod, enforceRateLimit, enforceSameOrigin, handleError, send } from "../_lib/http.js";
import { ensureHumeNaturalConfig } from "../_lib/hume-config.js";
import { assertHumeContextBudget } from "../_lib/caller-brief.js";
import {
  authorizeCallbackMessage,
  authorizeCaseFact,
  authorizeContactHandoff,
  buildAuthoritativeHumeSession,
  buildHumeClientContext,
  HUME_TOOL_DEFINITIONS,
  sanitizeHumeClientDiagnostic,
  signSessionEnvelope,
  verifySessionEnvelope,
} from "../_lib/hume-session.js";

function requestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { throw Object.assign(new Error("Invalid JSON request"), { statusCode: 400 }); }
  }
  return req.body;
}

function assertCurrentRevision(session, body) {
  const current = Number(session.context?.context_revision || 0);
  const supplied = Number(body.context_revision ?? current);
  if (supplied !== current) throw Object.assign(new Error("Stale Hume context revision"), { statusCode: 409 });
}

async function createHumeAccessToken(key, secret) {
  const response = await fetch("https://api.hume.ai/oauth2-cc/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || data.error || "Hume rejected the configured credentials"), { statusCode: 502 });
  return data;
}

let voiceCatalogCache = { expiresAt: 0, voices: [] };

function normalizeVoiceTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.slice(0, 20).map((tag) => typeof tag === "string" ? tag : `${tag.name || tag.type || "Tag"}:${tag.value || tag.label || ""}`);
  if (typeof tags === "object") return Object.entries(tags).slice(0, 20).flatMap(([keyName, values]) => (Array.isArray(values) ? values : [values]).map((value) => `${keyName}:${value}`));
  return [];
}

async function listHumeVoices(key) {
  if (voiceCatalogCache.expiresAt > Date.now() && voiceCatalogCache.voices.length) return voiceCatalogCache.voices;
  const response = await fetch("https://api.hume.ai/v0/tts/voices?provider=HUME_AI&page_size=100&ascending_order=true", { headers: { "X-Hume-Api-Key": key } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || "Hume voice catalog is unavailable"), { statusCode: 502 });
  const voices = (data.voices_page || []).map((voice) => ({
    voice_id: String(voice.id || ""),
    name: String(voice.name || "Unnamed voice").slice(0, 120),
    provider: "HUME_AI",
    tags: normalizeVoiceTags(voice.tags),
  })).filter((voice) => voice.voice_id);
  voiceCatalogCache = { expiresAt: Date.now() + 10 * 60 * 1000, voices };
  return voices;
}

function tagValue(voice, category, fallback = "") {
  const prefix = `${category.toLowerCase()}:`;
  const match = voice.tags.find((tag) => tag.toLowerCase().startsWith(prefix));
  return match ? match.slice(match.indexOf(":") + 1) : fallback;
}

function publicVoice(voice) {
  return {
    voice_id: voice.voice_id,
    name: voice.name,
    provider: voice.provider,
    tags: voice.tags,
    gender: tagValue(voice, "gender", "Unspecified"),
    language: tagValue(voice, "language", "English"),
    accent: tagValue(voice, "accent", ""),
    age: tagValue(voice, "age", ""),
    description: tagValue(voice, "description", "Hume Voice Library"),
  };
}

async function synthesizeVoicePreview(key, voice, body) {
  const text = String(body.text || "Hello, I’m calling about the application I submitted and I’m ready to answer your questions.").slice(0, 280);
  const description = String(body.delivery || "Speak naturally in a realistic United States public-benefits phone call.").slice(0, 400);
  const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: { "X-Hume-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ utterances: [{ text, description, voice: { id: voice.voice_id, provider: "HUME_AI" } }], format: { type: "mp3" }, num_generations: 1 }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || data.detail || "Hume could not generate the voice preview"), { statusCode: 502 });
  const generation = data.generations?.[0] || {};
  const audio = generation.audio || generation.snippets?.flat?.()?.[0]?.audio;
  if (!audio) throw Object.assign(new Error("Hume returned no preview audio"), { statusCode: 502 });
  return { audio, mime_type: "audio/mpeg", generation_id: generation.generation_id || generation.id || null, voice: publicVoice(voice) };
}

export default async function handler(req, res) {
  if (!allowMethod(req, res, "POST")) return;
  try {
    enforceSameOrigin(req);
    enforceRateLimit(req, 30);
    const key = process.env.HUME_API_KEY;
    const secret = process.env.HUME_SECRET_KEY;
    const configId = process.env.HUME_CONFIG_ID;
    if (!key || !secret || !configId) throw Object.assign(new Error("Hume environment variables are not configured"), { statusCode: 503 });

    const body = requestBody(req);
    const action = body.action || "start";

    if (action === "voices") {
      const voices = await listHumeVoices(key);
      return send(res, 200, { voices: voices.map(publicVoice), refreshed_at: new Date().toISOString() });
    }

    if (action === "voice_preview") {
      const voices = await listHumeVoices(key);
      const voice = voices.find((item) => item.voice_id === body.voice_id);
      if (!voice) throw Object.assign(new Error("The selected Hume voice is unavailable"), { statusCode: 400 });
      return send(res, 200, await synthesizeVoicePreview(key, voice, body));
    }

    if (action === "client_diagnostic") {
      const session = verifySessionEnvelope(body.session_proof, secret);
      const diagnostic = sanitizeHumeClientDiagnostic(body.diagnostic);
      console.info("[hume-client]", JSON.stringify({ session_id: session.session_id, ...diagnostic }));
      return send(res, 202, { accepted: true });
    }

    if (action === "case_response") {
      const session = verifySessionEnvelope(body.session_proof, secret);
      assertCurrentRevision(session, body);
      const result = authorizeCaseFact(session, body);
      const nextSession = result.session || session;
      const { session: _session, ...publicResult } = result;
      return send(res, 200, { ...publicResult, context: buildHumeClientContext(nextSession), session_proof: signSessionEnvelope(nextSession, secret) });
    }

    if (action === "contact_handoff") {
      const session = verifySessionEnvelope(body.session_proof, secret);
      assertCurrentRevision(session, body);
      const result = authorizeContactHandoff(session, body);
      const nextSession = result.session || session;
      const { session: _session, ...publicResult } = result;
      return send(res, 200, { ...publicResult, system_prompt: nextSession.system_prompt, context: buildHumeClientContext(nextSession), session_proof: signSessionEnvelope(nextSession, secret) });
    }

    if (action === "callback_message") {
      const session = verifySessionEnvelope(body.session_proof, secret);
      assertCurrentRevision(session, body);
      const result = authorizeCallbackMessage(session, body);
      const nextSession = result.session || session;
      const { session: _session, ...publicResult } = result;
      return send(res, 200, { ...publicResult, context: buildHumeClientContext(nextSession), session_proof: signSessionEnvelope(nextSession, secret) });
    }

    if (action === "context_update") {
      const session = verifySessionEnvelope(body.session_proof, secret);
      const expectedRevision = Number(body.context_revision ?? session.context.context_revision ?? 0);
      if (expectedRevision !== Number(session.context.context_revision || 0)) throw Object.assign(new Error("Stale Hume context revision"), { statusCode: 409 });
      const allowedPhases = ["answering", "introduction", "purpose_established", "interview", "handoff_pending", "handoff_complete", "callback_message_recorded", "closure"];
      const context = {
        ...session.context,
        context_revision: expectedRevision + 1,
        trigger: String(body.trigger || "behavior_update").slice(0, 160),
        conversation_phase: allowedPhases.includes(body.conversation_phase) ? body.conversation_phase : session.context.conversation_phase,
        observed_behavior: body.observed_behavior && typeof body.observed_behavior === "object" ? {
          expression: String(body.observed_behavior.expression || "neutral").slice(0, 80),
          confidence: Math.max(0, Math.min(1, Number(body.observed_behavior.confidence || 0))),
          source: "hume_observation",
        } : session.context.observed_behavior,
      };
      const revised = { ...session, context };
      return send(res, 200, { context: buildHumeClientContext(revised), session_proof: signSessionEnvelope(revised, secret) });
    }

    if (action !== "start") throw Object.assign(new Error("Unsupported Hume session action"), { statusCode: 400 });
    let configState;
    try {
      configState = await ensureHumeNaturalConfig(key, configId);
    } catch (error) {
      if (error?.statusCode !== 502) throw error;
      // Hume accepts a config ID without a version and resolves its latest
      // version. A temporary read-only inspection failure must not prevent an
      // otherwise valid live call from reaching Hume.
      console.warn("[hume-config] inspection deferred for session start", { upstreamStatus: error.upstreamStatus || null });
      configState = { changed: false, version: undefined, ready: null, validation: "deferred" };
    }
    const sessionId = `session:${randomUUID()}`;
    const catalog = await listHumeVoices(key);
    const requestedCatalogVoice = body.voice_id ? catalog.find((voice) => voice.voice_id === body.voice_id) : null;
    if (body.voice_id && !requestedCatalogVoice) throw Object.assign(new Error("The selected Hume voice is unavailable"), { statusCode: 400 });
    const catalogVoice = requestedCatalogVoice ? {
      voice_id: requestedCatalogVoice.voice_id,
      label: requestedCatalogVoice.name,
      presentation: tagValue(requestedCatalogVoice, "gender", "Voice Library"),
      provider: "HUME_AI",
    } : null;
    const contactSequence = body.contact_sequence && typeof body.contact_sequence === "object" ? structuredClone(body.contact_sequence) : body.contact_sequence;
    if (contactSequence?.contacts?.length) {
      contactSequence.contacts = contactSequence.contacts.map((contact) => {
        const catalogContactVoice = catalog.find((voice) => voice.voice_id === contact.voice_id);
        if (!catalogContactVoice) throw Object.assign(new Error(`The configured voice for ${String(contact.name || "a call contact").slice(0, 120)} is unavailable`), { statusCode: 400 });
        return { ...contact, voice_id: catalogContactVoice.voice_id, voice_label: catalogContactVoice.name, voice_presentation: tagValue(catalogContactVoice, "gender", "Voice Library") };
      });
    }
    const session = buildAuthoritativeHumeSession({
      scenario_id: body.scenario_id,
      profile_id: body.profile_id,
      intensity: body.intensity,
      voice_key: body.voice_key,
      voice_override: catalogVoice,
      application_context: body.application_context,
      caller_brief: body.caller_brief,
      contact_sequence: contactSequence,
      turn_policy: body.turn_policy,
      scenario_input: body.scenario,
      session_id: sessionId,
    });
    const token = await createHumeAccessToken(key, secret);
    const proof = signSessionEnvelope(session, secret);
    const clientContext = buildHumeClientContext(session);
    const clientContextSizeBytes = assertHumeContextBudget(clientContext, session.system_prompt);
    send(res, 200, {
      access_token: token.access_token,
      expires_in: token.expires_in,
      config_id: configId,
      ...(configState.version != null ? { config_version: configState.version } : {}),
      config_validation: configState.validation || "verified",
      session_id: sessionId,
      session_proof: proof,
      voice_id: session.voice_id,
      selection: session.selection,
      active_contact_id: session.context.active_contact_id,
      contact_sequence: session.contact_sequence,
      greeting: session.contact_sequence.contacts.find((contact) => contact.contact_id === session.context.active_contact_id)?.greeting || "Hello?",
      turn_policy: session.turn_policy,
      caller_brief_version: session.caller_brief_version,
      caller_brief_fact_count: session.caller_brief_fact_count,
      caller_brief_size_bytes: session.caller_brief_size_bytes,
      hume_context_size_bytes: clientContextSizeBytes,
      session_settings: {
        type: "session_settings",
        system_prompt: session.system_prompt,
        context: { text: JSON.stringify(clientContext), type: "persistent" },
        tools: HUME_TOOL_DEFINITIONS,
        custom_session_id: sessionId,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
}
