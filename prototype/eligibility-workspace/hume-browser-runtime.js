(function installBlueOriginHumeRuntime(root) {
  "use strict";

  const HUME_CONNECTION_PHASES = Object.freeze({
    IDLE: "idle",
    REQUEST_MICROPHONE: "request_microphone",
    PREPARE_AUDIO: "prepare_audio",
    CREATE_SESSION: "create_session",
    CONNECT_HUME: "connect_hume",
    CONFIRM_SESSION: "confirm_session",
    CONNECTED: "connected",
    FAILED: "failed",
    DISCONNECTED: "disconnected",
  });

  class HumeRuntimeError extends Error {
    constructor(code, phase, message, options = {}) {
      super(message, options);
      this.name = "HumeRuntimeError";
      this.code = code;
      this.phase = phase;
      this.closeCode = options.closeCode;
    }
  }

  function deadline(promise, timeoutMs, error) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(error), timeoutMs); }),
    ]).finally(() => clearTimeout(timer));
  }

  function browserFamily(userAgent = "") {
    if (/Edg\//.test(userAgent)) return "Edge";
    if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return "Chrome";
    if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
    if (/Firefox\//.test(userAgent)) return "Firefox";
    return "Other";
  }

  function safeHumeDiagnostic(input = {}) {
    const diagnostic = {
      phase: String(input.phase || "unknown").slice(0, 64),
      code: String(input.code || "unknown").slice(0, 64),
      browser_family: String(input.browserFamily || input.browser_family || "Other").slice(0, 32),
      elapsed_ms: Math.max(0, Math.min(300000, Math.round(Number(input.elapsedMs ?? input.elapsed_ms ?? 0)))),
    };
    const closeCode = Number(input.closeCode ?? input.close_code);
    if (Number.isInteger(closeCode)) diagnostic.close_code = closeCode;
    const errorName = String(input.errorName || input.error_name || "").slice(0, 80);
    if (errorName) diagnostic.error_name = errorName;
    const milestone = String(input.milestone || "").slice(0, 80);
    if (milestone) diagnostic.milestone = milestone;
    return diagnostic;
  }

  function runtimeError(error, phase) {
    if (error instanceof HumeRuntimeError) return error;
    if (phase === HUME_CONNECTION_PHASES.REQUEST_MICROPHONE) {
      if (["NotAllowedError", "SecurityError", "PermissionDeniedError"].includes(error?.name)) {
        return new HumeRuntimeError("microphone_denied", phase, "Microphone permission was not granted", { cause: error });
      }
      if (["NotFoundError", "DevicesNotFoundError"].includes(error?.name)) {
        return new HumeRuntimeError("microphone_unavailable", phase, "No microphone is available", { cause: error });
      }
      return new HumeRuntimeError("microphone_error", phase, error?.message || "The microphone could not be opened", { cause: error });
    }
    if (phase === HUME_CONNECTION_PHASES.PREPARE_AUDIO) {
      return new HumeRuntimeError("audio_activation", phase, "Caller audio needs a browser gesture before the call can connect", { cause: error });
    }
    if (phase === HUME_CONNECTION_PHASES.CREATE_SESSION) {
      const sessionCode = ["session_rate_limited", "session_temporarily_unavailable", "session_error"].includes(error?.code) ? error.code : "session_error";
      return new HumeRuntimeError(sessionCode, phase, error?.message || "The secure Hume session could not be created", { cause: error });
    }
    if (phase === HUME_CONNECTION_PHASES.CONNECT_HUME || phase === HUME_CONNECTION_PHASES.CONFIRM_SESSION) {
      return new HumeRuntimeError("socket_error", phase, error?.message || "The Hume connection could not be established", { cause: error, closeCode: error?.code });
    }
    return new HumeRuntimeError("runtime_error", phase || HUME_CONNECTION_PHASES.FAILED, error?.message || "The live call could not continue", { cause: error });
  }

  function normalizeSessionSettings(settings = {}) {
    const tools = Array.isArray(settings.tools) ? settings.tools.map((tool) => ({
      type: tool.type,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      fallbackContent: tool.fallbackContent ?? tool.fallback_content,
    })) : undefined;
    return {
      systemPrompt: settings.systemPrompt ?? settings.system_prompt,
      context: settings.context,
      tools,
      customSessionId: settings.customSessionId ?? settings.custom_session_id,
      voiceId: settings.voiceId ?? settings.voice_id,
      variables: settings.variables,
      metadata: settings.metadata,
    };
  }

  function normalizeToolResponse(message = {}) {
    return {
      toolCallId: message.toolCallId ?? message.tool_call_id,
      content: String(message.content ?? ""),
      toolName: message.toolName ?? message.tool_name,
      toolType: message.toolType ?? message.tool_type,
      customSessionId: message.customSessionId ?? message.custom_session_id,
    };
  }

  function buildHumeToolResponse(message = {}, result = {}) {
    if (message.responseRequired === false || message.response_required === false) return null;
    const toolCallId = message.toolCallId ?? message.tool_call_id ?? message.id;
    if (!toolCallId) return null;
    const responseText = String(result.response_text ?? result.responseText ?? (result.authorized ? "Authorized." : "I cannot provide that information.")).slice(0, 2400);
    return {
      type: "tool_response",
      tool_call_id: String(toolCallId),
      tool_name: String(message.name ?? message.toolName ?? message.tool_name ?? "").slice(0, 120) || undefined,
      tool_type: String(message.toolType ?? message.tool_type ?? "function").slice(0, 32),
      content: responseText,
    };
  }

  function createHumeSdkTransport(sdk) {
    if (!sdk?.HumeClient || !sdk?.EVIWebAudioPlayer) throw new Error("The Hume browser SDK bundle is unavailable");
    return {
      createPlayer: (options) => new sdk.EVIWebAudioPlayer(options),
      getBrowserSupportedMimeType: () => sdk.getBrowserSupportedMimeType(),
      ensureSingleValidAudioTrack: (stream) => sdk.ensureSingleValidAudioTrack(stream),
      convertBlobToBase64: (blob) => sdk.convertBlobToBase64(blob),
      async connect({ session, onMessage, onClose, onError }) {
        const client = new sdk.HumeClient({});
        const humeSocket = client.empathicVoice.chat.connect({
          accessToken: session.access_token,
          configId: session.config_id,
          configVersion: session.config_version,
          voiceId: session.voice_id,
          verboseTranscription: true,
          reconnectAttempts: 2,
        });
        humeSocket.on("message", onMessage);
        humeSocket.on("close", onClose);
        humeSocket.on("error", onError);
        await humeSocket.waitForOpen();
        return {
          get readyState() { return humeSocket.readyState; },
          sendSessionSettings(settings) { humeSocket.sendSessionSettings(normalizeSessionSettings(settings)); },
          sendAssistantInput(text) { humeSocket.sendAssistantInput({ text }); },
          sendAudioInput(data) { humeSocket.sendAudioInput({ data }); },
          sendPauseAssistantMessage() { humeSocket.pauseAssistant(); },
          sendResumeAssistantMessage() { humeSocket.resumeAssistant(); },
          sendToolResponse(message) { humeSocket.sendToolResponseMessage(normalizeToolResponse(message)); },
          send(payload) {
            const message = typeof payload === "string" ? JSON.parse(payload) : payload;
            if (message.type === "session_settings") return this.sendSessionSettings(message);
            if (message.type === "assistant_input") return this.sendAssistantInput(message.text);
            if (message.type === "audio_input") return this.sendAudioInput(message.data);
            if (message.type === "pause_assistant_message") return this.sendPauseAssistantMessage();
            if (message.type === "resume_assistant_message") return this.sendResumeAssistantMessage();
            if (message.type === "tool_response") return this.sendToolResponse(message);
            throw new Error(`Unsupported Hume publish event: ${message.type || "unknown"}`);
          },
          close() { humeSocket.close(); },
        };
      },
    };
  }

  class HumeBrowserClient {
    constructor(options = {}) {
      this.transport = options.transport;
      this.mediaDevices = options.mediaDevices;
      this.MediaRecorderClass = options.MediaRecorderClass;
      this.createSession = options.createSession;
      this.onPhase = options.onPhase || (() => {});
      this.onDiagnostic = options.onDiagnostic || (() => {});
      this.onMessage = options.onMessage || (() => {});
      this.onPermissionPending = options.onPermissionPending || (() => {});
      this.onFatal = options.onFatal || (() => {});
      this.userAgent = options.userAgent || "";
      this.timing = {
        permissionHintMs: 2000,
        microphoneTimeoutMs: 45000,
        sessionTimeoutMs: 15000,
        connectionTimeoutMs: 18000,
        metadataTimeoutMs: 8000,
        firstResponseTimeoutMs: 12000,
        greetingDelayMs: 650,
        ...options.timing,
      };
      this.attemptCounter = 0;
      this.attemptId = null;
      this.phase = HUME_CONNECTION_PHASES.IDLE;
      this.socket = null;
      this.player = null;
      this.stream = null;
      this.recorder = null;
      this.session = null;
      this.firstAudioReceived = false;
      this.closedIntentionally = false;
      this.fatalInProgress = false;
      this.startedAt = 0;
      this.metadataWaiter = null;
      this.greetingTimer = null;
      this.firstResponseTimer = null;
      this.permissionHintTimer = null;
      this.sessionAbortController = null;
    }

    setPhase(phase) {
      this.phase = phase;
      this.onPhase(phase, this.attemptId);
    }

    diagnostic(values) {
      const item = safeHumeDiagnostic({
        phase: this.phase,
        browserFamily: browserFamily(this.userAgent),
        elapsedMs: Date.now() - this.startedAt,
        ...values,
      });
      this.onDiagnostic(item, this.attemptId);
      return item;
    }

    isActive(attemptId) {
      return Boolean(attemptId) && this.attemptId === attemptId && !this.closedIntentionally;
    }

    async start({ request, volume = 0.8 } = {}) {
      await this.close();
      this.closedIntentionally = false;
      this.fatalInProgress = false;
      const attemptId = `hume-attempt-${Date.now()}-${++this.attemptCounter}`;
      this.attemptId = attemptId;
      this.startedAt = Date.now();
      this.firstAudioReceived = false;
      let activePhase = HUME_CONNECTION_PHASES.REQUEST_MICROPHONE;
      try {
        if (!this.transport || !this.mediaDevices?.getUserMedia || !this.MediaRecorderClass || !this.createSession) {
          throw new HumeRuntimeError("unsupported_media", activePhase, "This browser does not support secure live audio");
        }
        this.setPhase(activePhase);
        this.permissionHintTimer = setTimeout(() => {
          if (this.isActive(attemptId) && this.phase === HUME_CONNECTION_PHASES.REQUEST_MICROPHONE) this.onPermissionPending(attemptId);
        }, this.timing.permissionHintMs);
        const mediaPromise = Promise.resolve(this.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        }));
        mediaPromise.then((lateStream) => {
          if (!this.isActive(attemptId)) lateStream?.getTracks?.().forEach((track) => track.stop());
        }).catch(() => {});
        this.stream = await deadline(mediaPromise, this.timing.microphoneTimeoutMs, new HumeRuntimeError("microphone_timeout", activePhase, "Microphone permission timed out"));
        clearTimeout(this.permissionHintTimer);
        this.permissionHintTimer = null;
        this.transport.ensureSingleValidAudioTrack?.(this.stream);
        const track = this.stream.getAudioTracks()[0];
        if (!track || track.readyState !== "live") throw new HumeRuntimeError("microphone_unavailable", activePhase, "A single live microphone track is required");
        track.addEventListener?.("ended", () => {
          if (this.isActive(attemptId)) this.failAfterStart(new HumeRuntimeError("microphone_lost", HUME_CONNECTION_PHASES.CONNECTED, "The microphone disconnected"), attemptId);
        }, { once: true });

        activePhase = HUME_CONNECTION_PHASES.PREPARE_AUDIO;
        this.setPhase(activePhase);
        this.player = this.transport.createPlayer({ volume });
        this.player.on?.("error", (event) => {
          if (this.isActive(attemptId)) this.failAfterStart(new HumeRuntimeError("playback_error", HUME_CONNECTION_PHASES.CONNECTED, event?.detail?.message || "Caller audio playback failed"), attemptId);
        });
        await this.player.init();

        activePhase = HUME_CONNECTION_PHASES.CREATE_SESSION;
        this.setPhase(activePhase);
        this.sessionAbortController = typeof AbortController === "function" ? new AbortController() : null;
        this.session = await deadline(Promise.resolve(this.createSession(request, { attemptId, signal: this.sessionAbortController?.signal })), this.timing.sessionTimeoutMs, new HumeRuntimeError("session_timeout", activePhase, "The secure Hume session timed out"));

        activePhase = HUME_CONNECTION_PHASES.CONNECT_HUME;
        this.setPhase(activePhase);
        this.metadataWaiter = {};
        this.metadataWaiter.promise = new Promise((resolve, reject) => Object.assign(this.metadataWaiter, { resolve, reject }));
        this.socket = await deadline(Promise.resolve(this.transport.connect({
          session: this.session,
          onMessage: (message) => this.handleMessage(message, attemptId),
          onClose: (event) => this.handleClose(event, attemptId),
          onError: (error) => this.handleSocketError(error, attemptId),
        })), this.timing.connectionTimeoutMs, new HumeRuntimeError("socket_timeout", activePhase, "The Hume connection timed out"));
        if (!this.isActive(attemptId)) throw new HumeRuntimeError("stale_attempt", activePhase, "A newer connection attempt replaced this one");
        if (!this.session?.session_settings) throw new HumeRuntimeError("session_settings_missing", activePhase, "The server did not return validated Hume session settings");
        this.socket.sendSessionSettings(this.session.session_settings);

        activePhase = HUME_CONNECTION_PHASES.CONFIRM_SESSION;
        this.setPhase(activePhase);
        await deadline(this.metadataWaiter.promise, this.timing.metadataTimeoutMs, new HumeRuntimeError("metadata_timeout", activePhase, "Hume did not confirm the chat session"));
        if (!this.isActive(attemptId)) throw new HumeRuntimeError("stale_attempt", activePhase, "A newer connection attempt replaced this one");

        const mimeResult = this.transport.getBrowserSupportedMimeType();
        if (!mimeResult?.success || !mimeResult.mimeType) throw new HumeRuntimeError("unsupported_media", activePhase, mimeResult?.error?.message || "This browser has no supported microphone recording format");
        this.recorder = new this.MediaRecorderClass(this.stream, { mimeType: mimeResult.mimeType });
        this.recorder.addEventListener("dataavailable", (event) => {
          if (!event.data?.size || !this.isActive(attemptId) || this.socket?.readyState !== 1) return;
          void this.transport.convertBlobToBase64(event.data).then((data) => {
            if (this.isActive(attemptId) && this.socket?.readyState === 1) this.socket.sendAudioInput(data);
          }).catch((error) => this.diagnostic({ code: "audio_encode_error", errorName: error?.name }));
        });
        this.recorder.start(80);
        this.setPhase(HUME_CONNECTION_PHASES.CONNECTED);
        this.greetingTimer = setTimeout(() => {
          if (!this.isActive(attemptId) || this.socket?.readyState !== 1) return;
          this.socket.sendAssistantInput(this.session.greeting || "Hello?");
          this.diagnostic({ code: "milestone", milestone: "greeting_sent" });
          this.firstResponseTimer = setTimeout(() => {
            if (!this.firstAudioReceived && this.isActive(attemptId)) {
              this.failAfterStart(new HumeRuntimeError("response_timeout", HUME_CONNECTION_PHASES.CONNECTED, "Hume connected but returned no caller audio"), attemptId);
            }
          }, this.timing.firstResponseTimeoutMs);
        }, this.timing.greetingDelayMs);
        return { phase: this.phase, attemptId, session: this.session, socket: this.socket, stream: this.stream, recorder: this.recorder, player: this.player };
      } catch (caught) {
        const error = runtimeError(caught, activePhase);
        this.diagnostic({ code: error.code, closeCode: error.closeCode, errorName: caught?.name });
        await this.cleanup(attemptId);
        this.phase = HUME_CONNECTION_PHASES.FAILED;
        this.onPhase(this.phase, attemptId);
        throw error;
      }
    }

    handleMessage(message, attemptId) {
      if (!this.isActive(attemptId)) return;
      if (message?.type === "error") {
        const humeCode = String(message?.code || "").slice(0, 24);
        const humeDetail = String(message?.message || message?.error || "").slice(0, 240);
        const detail = [humeCode, humeDetail].filter(Boolean).join(": ");
        const error = new HumeRuntimeError(
          "hume_session_error",
          this.phase,
          detail ? `Hume rejected the live session (${detail})` : "Hume rejected the live session",
        );
        this.metadataWaiter?.reject?.(error);
        if (this.phase === HUME_CONNECTION_PHASES.CONNECTED) void this.failAfterStart(error, attemptId);
        this.onMessage(message, attemptId);
        return;
      }
      if (message?.type === "chat_metadata") {
        this.metadataWaiter?.resolve?.(message);
        this.diagnostic({ code: "milestone", milestone: "chat_metadata" });
      }
      if (message?.type === "audio_output") {
        this.firstAudioReceived = true;
        clearTimeout(this.firstResponseTimer);
        this.firstResponseTimer = null;
        void Promise.resolve(this.player?.enqueue(message)).catch((error) => this.failAfterStart(new HumeRuntimeError("playback_error", HUME_CONNECTION_PHASES.CONNECTED, error?.message || "Caller audio playback failed"), attemptId));
      }
      if (message?.type === "user_interruption" || message?.type === "user_message") this.player?.stop();
      this.onMessage(message, attemptId);
    }

    handleClose(event, attemptId) {
      if (!this.isActive(attemptId) || this.fatalInProgress) return;
      this.metadataWaiter?.reject?.(new HumeRuntimeError("socket_close", this.phase, "Hume closed before the call was ready", { closeCode: event?.code }));
      if (this.phase === HUME_CONNECTION_PHASES.CONNECTED) this.failAfterStart(new HumeRuntimeError("socket_close", this.phase, "The live Hume connection closed", { closeCode: event?.code }), attemptId);
    }

    handleSocketError(error, attemptId) {
      if (!this.isActive(attemptId) || this.fatalInProgress) return;
      this.metadataWaiter?.reject?.(runtimeError(error, this.phase));
      if (this.phase === HUME_CONNECTION_PHASES.CONNECTED) this.failAfterStart(runtimeError(error, this.phase), attemptId);
    }

    async failAfterStart(error, attemptId) {
      if (!this.isActive(attemptId) || this.fatalInProgress) return;
      this.fatalInProgress = true;
      this.diagnostic({ code: error.code, closeCode: error.closeCode, errorName: error?.name });
      await this.cleanup(attemptId);
      this.phase = HUME_CONNECTION_PHASES.FAILED;
      this.onPhase(this.phase, attemptId);
      this.onFatal(error, attemptId);
    }

    setVolume(value) { this.player?.setVolume(value); }
    mute() { this.player?.mute(); }
    unmute() { this.player?.unmute(); }
    stopPlayback() { this.player?.stop(); }

    async cleanup(attemptId = this.attemptId) {
      clearTimeout(this.permissionHintTimer);
      clearTimeout(this.greetingTimer);
      clearTimeout(this.firstResponseTimer);
      this.sessionAbortController?.abort?.();
      this.permissionHintTimer = null;
      this.greetingTimer = null;
      this.firstResponseTimer = null;
      this.sessionAbortController = null;
      try { if (this.recorder?.state !== "inactive") this.recorder?.stop(); } catch { /* already stopped */ }
      this.stream?.getTracks?.().forEach((track) => track.stop());
      try { this.socket?.close?.(); } catch { /* already closed */ }
      try { await this.player?.dispose?.(); } catch { /* already disposed */ }
      if (this.attemptId === attemptId || this.attemptId === null) {
        this.socket = null;
        this.stream = null;
        this.recorder = null;
        this.player = null;
        this.metadataWaiter = null;
      }
    }

    async close() {
      const attemptId = this.attemptId;
      this.closedIntentionally = true;
      this.attemptId = null;
      if (attemptId) await this.cleanup(attemptId);
      this.phase = HUME_CONNECTION_PHASES.DISCONNECTED;
    }
  }

  root.BlueOriginHumeRuntime = Object.freeze({
    HumeBrowserClient,
    HumeRuntimeError,
    HUME_CONNECTION_PHASES,
    browserFamily,
    buildHumeToolResponse,
    createHumeSdkTransport,
    normalizeSessionSettings,
    safeHumeDiagnostic,
  });
})(globalThis);
