import { put } from "@vercel/blob";
import { getNotebook, updateNotebookArtifacts } from "./notebooks.js";

function failure(message, statusCode = 502, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  throw error;
}

async function heygen(path, options = {}) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) failure("HeyGen is not configured for this deployment", 503);
  const { timeoutMs = 25_000, ...fetchOptions } = options;
  let response;
  try {
    response = await fetch(`https://api.heygen.com${path}`, {
      ...fetchOptions,
      headers: { accept: "application/json", "content-type": "application/json", "x-api-key": key, ...(fetchOptions.headers || {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    failure(`HeyGen connection failed: ${error.message}`, 502);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) failure(payload.error?.message || payload.message || `HeyGen request failed (${response.status})`, response.status >= 400 && response.status < 500 ? 422 : 502, payload.error || payload);
  return payload.data || payload;
}

let healthCache = null;
let catalogCache = null;
export async function notebookVideoHealth() {
  if (!process.env.HEYGEN_API_KEY) return { configured: false, healthy: false, error: "Not configured" };
  if (healthCache && Date.now() - healthCache.checkedAt < 300_000) return healthCache.value;
  let value;
  try {
    await heygen("/v3/users/me", { method: "GET", timeoutMs: 20_000 });
    value = { configured: true, healthy: true, error: null };
  } catch (error) {
    value = { configured: true, healthy: false, error: error.message };
  }
  healthCache = { checkedAt: Date.now(), value };
  return value;
}

export async function notebookVideoOptions() {
  if (catalogCache && Date.now() - catalogCache.checkedAt < 300_000) return catalogCache.value;
  const [avatarData, voiceData] = await Promise.all([heygen("/v3/avatars/looks?ownership=public&limit=50", { method: "GET" }), heygen("/v3/voices?type=public&language=English&limit=50", { method: "GET" })]);
  const avatars = Array.isArray(avatarData) ? avatarData : avatarData.data || [];
  const voices = Array.isArray(voiceData) ? voiceData : voiceData.data || [];
  const value = {
    avatars: avatars.filter((item)=>!item.status||item.status==="completed").slice(0,20).map((item)=>({ id:item.id,name:item.name,preview_image_url:item.preview_image_url||null,default_voice_id:item.default_voice_id||null })),
    voices: voices.slice(0,30).map((item)=>({ id:item.voice_id,name:item.name,language:item.language,gender:item.gender,preview_audio_url:item.preview_audio_url||null })),
  };
  catalogCache = { checkedAt: Date.now(), value };
  return value;
}

async function presenterDefaults() {
  if (process.env.HEYGEN_AVATAR_ID && process.env.HEYGEN_VOICE_ID) return { avatarId: process.env.HEYGEN_AVATAR_ID, voiceId: process.env.HEYGEN_VOICE_ID };
  const { avatars, voices } = await notebookVideoOptions();
  const avatar = avatars.find((item) => !item.status || item.status === "completed") || avatars[0];
  const voice = voices.find((item) => /english/i.test(`${item.language || ""} ${item.name || ""}`)) || voices[0];
  if (!avatar?.id || !voice?.id) failure("No usable HeyGen avatar and voice are available for this account", 409);
  return { avatarId: avatar.id, voiceId: voice.id };
}

export async function startNotebookVideo(notebookId) {
  const notebook = await getNotebook(notebookId);
  const project = notebook.artifact_projects?.video;
  if (!project?.derived_from?.version) failure("Approve the presentation before generating video", 409);
  if (project.heygen?.video_id && ["pending", "waiting", "processing"].includes(project.heygen.status)) return notebook;
  const { avatarId, voiceId } = await presenterDefaults();
  const scenes = (project.scenes || []).map((scene) => ({
    type: "avatar_video",
    input: {
      type: "avatar",
      avatar_id: scene.avatar_id && !scene.avatar_id.includes("professional") ? scene.avatar_id : avatarId,
      script: String(scene.narration || scene.body || scene.title || "").slice(0, 4900),
      voice_id: scene.voice_id && !scene.voice_id.includes("professional") ? scene.voice_id : voiceId,
      background: { type: "color", color: scene.avatar_position === "left" ? "#385F68" : "#17343C" },
    },
  }));
  if (!scenes.length) failure("Add at least one presentation-derived video scene", 409);
  const attempt = Number(project.heygen?.attempt || 0) + 1;
  const idempotencyKey = `notebook:${notebookId}:presentation:${project.derived_from.version}:attempt:${attempt}`;
  const created = await heygen("/v3/videos", { method: "POST", headers: { "idempotency-key": idempotencyKey }, body: JSON.stringify({ type: "studio", title: project.title, aspect_ratio: "16:9", resolution: "720p", caption: { file_format: "srt", style: "default" }, scenes }) });
  if (!created.video_id) failure("HeyGen did not return a video ID");
  project.status = "generating";
  project.heygen = { api_version: "v3", attempt, video_id: created.video_id, status: created.status || "pending", submitted_at: new Date().toISOString(), avatar_id: avatarId, voice_id: voiceId };
  return updateNotebookArtifacts(notebookId, { action: "save_project", format: "video", project });
}

export async function refreshNotebookVideo(notebookId) {
  const notebook = await getNotebook(notebookId);
  const project = notebook.artifact_projects?.video;
  const videoId = project?.heygen?.video_id;
  if (!videoId) failure("Generate the HeyGen video first", 409);
  const status = await heygen(`/v3/videos/${encodeURIComponent(videoId)}`, { method: "GET" });
  project.heygen = { ...project.heygen, status: status.status, checked_at: new Date().toISOString() };
  if (status.status === "completed") {
    let downloadUrl = status.captioned_video_url || status.video_url;
    if (downloadUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const response = await fetch(downloadUrl, { signal: AbortSignal.timeout(55_000) });
        if (response.ok) {
          const blob = await put(`notebook-releases/${notebookId}/${videoId}.mp4`, response.body, { access: "public", contentType: "video/mp4", addRandomSuffix: false, token: process.env.BLOB_READ_WRITE_TOKEN });
          downloadUrl = blob.url;
        }
      } catch (error) {
        project.heygen.archive_warning = `Private archive copy failed: ${error.message}`;
      }
    }
    project.status = "ready";
    project.download_url = downloadUrl;
    project.thumbnail_url = status.thumbnail_url || null;
    project.caption_url = status.subtitle_url || null;
    project.completed_at = new Date().toISOString();
    project.scenes = (project.scenes || []).map((scene) => ({ ...scene, status: "ready" }));
  } else if (status.status === "failed") {
    project.status = "failed";
    project.error = status.failure_message || status.failure_code || "HeyGen video generation failed";
  } else project.status = "generating";
  return updateNotebookArtifacts(notebookId, { action: "save_project", format: "video", project });
}
