#!/usr/bin/env python3
"""Serve the prototype and proxy only approved Open Notebook API methods."""

import argparse
import base64
import http.server
import json
import os
import pathlib
import re
import tempfile
import uuid
import urllib.error
import urllib.parse
import urllib.request


OPEN_NOTEBOOK_API = "http://127.0.0.1:5055"
PROXY_PREFIX = "/open-notebook"
ALLOWED_METHODS = {"GET", "POST", "PUT"}
READ_PREFIXES = ("/api/notebooks/", "/api/sources", "/api/notes")
CREATE_PATHS = {"/api/sources", "/api/notes"}
UPDATE_PREFIXES = ("/api/sources/", "/api/notes/")
DENIED_SEGMENTS = ("/settings", "/config", "/models", "/credentials", "/auth")
HUME_TOKEN_URL = "https://api.hume.ai/oauth2-cc/token"
HUME_CONFIG_PATH = pathlib.Path(__file__).with_name(".hume-config.json")
LOCAL_ENV_PATH = pathlib.Path(__file__).with_name(".env.local")
LOCAL_ATTEMPTS = {}


def load_local_env():
    """Load simple KEY=VALUE pairs for local development without overriding the shell."""
    try:
        lines = LOCAL_ENV_PATH.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value[:1] == value[-1:] and value.startswith(("\"", "'")):
            value = value[1:-1]
        if key and key.replace("_", "").isalnum():
            os.environ.setdefault(key, value)


load_local_env()
OPEN_NOTEBOOK_API = os.environ.get("OPEN_NOTEBOOK_API_URL", OPEN_NOTEBOOK_API).rstrip("/")

import studio_api  # noqa: E402  (local env must be loaded before service configuration)


def load_hume_config():
    stored = {}
    try:
        stored = json.loads(HUME_CONFIG_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        stored = {}
    return {
        "api_key": os.environ.get("HUME_API_KEY") or stored.get("api_key"),
        "secret_key": os.environ.get("HUME_SECRET_KEY") or stored.get("secret_key"),
        "config_id": os.environ.get("HUME_CONFIG_ID") or stored.get("config_id"),
    }


def request_hume_token(api_key, secret_key):
    credentials = base64.b64encode(f"{api_key}:{secret_key}".encode("utf-8")).decode("ascii")
    body = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode("utf-8")
    request = urllib.request.Request(
        HUME_TOKEN_URL,
        data=body,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "BlueOrigin-Hume-Client/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def store_hume_config(payload):
    descriptor, temporary_path = tempfile.mkstemp(prefix=".hume-config-", suffix=".json", dir=str(HUME_CONFIG_PATH.parent))
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(payload, handle)
            handle.write("\n")
        os.replace(temporary_path, HUME_CONFIG_PATH)
        os.chmod(HUME_CONFIG_PATH, 0o600)
    except Exception:
        try:
            os.unlink(temporary_path)
        except OSError:
            pass
        raise


class PrototypeHandler(http.server.SimpleHTTPRequestHandler):
    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _request_json(self, maximum=2_000_000):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > maximum:
            raise studio_api.StudioAPIError(400, "The request body is missing or too large.")
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise studio_api.StudioAPIError(400, "The request body must be valid JSON.") from error

    def _studio_call(self, callback, *args):
        try:
            self._json(200, callback(*args))
        except studio_api.StudioAPIError as error:
            self._json(error.status, {"detail": error.detail})
        except Exception as error:
            self._json(500, {"detail": f"Studio service failed: {error}"})

    def _studio_post(self, callback, *, approval=False):
        try:
            if approval:
                studio_api.ensure_approved_write(self.headers)
            payload = self._request_json(maximum=20_000_000)
            self._json(200, callback(payload))
        except studio_api.StudioAPIError as error:
            self._json(error.status, {"detail": error.detail})
        except Exception as error:
            self._json(500, {"detail": f"Studio service failed: {error}"})

    def _hume_health(self):
        config = load_hume_config()
        configured = bool(config["api_key"] and config["secret_key"] and config["config_id"])
        self._json(200, {"configured": configured, "config_id": config["config_id"] if configured else None})

    def _finalize_local_attempt(self):
        payload = self._request_json(maximum=1_600_000)
        attempt = payload.get("attempt") if isinstance(payload.get("attempt"), dict) else payload
        required = ("attempt_id", "scenario_id", "mode")
        if not isinstance(attempt, dict) or any(not attempt.get(key) for key in required):
            self._json(400, {"detail": "attempt_id, scenario_id, and mode are required"})
            return
        LOCAL_ATTEMPTS[attempt["attempt_id"]] = {"attempt": attempt, "artifacts": [], "sync_status": "metadata_saved"}
        self._json(200, {"repository_attempt_id": attempt["attempt_id"], "sync_status": "metadata_saved"})

    def _store_local_attempt_artifact(self, attempt_id):
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > 5_000_000:
            self._json(413, {"detail": "Attempt artifact is too large"})
            return
        self.rfile.read(length) if length else b""
        record = LOCAL_ATTEMPTS.setdefault(attempt_id, {"attempt": {}, "artifacts": [], "sync_status": "pending"})
        record["artifacts"].append({"type": self.headers.get("X-Artifact-Type"), "name": self.headers.get("X-Artifact-Name"), "bytes": length})
        self._json(200, {"stored": True, "artifact_count": len(record["artifacts"])})

    def _complete_local_attempt_sync(self, attempt_id):
        payload = self._request_json(maximum=16_384)
        record = LOCAL_ATTEMPTS.setdefault(attempt_id, {"attempt": {}, "artifacts": [], "sync_status": "pending"})
        expected = int(payload.get("expected_artifacts") or 0)
        if len(record["artifacts"]) < expected:
            self._json(409, {"detail": "Expected attempt artifacts have not all been stored"})
            return
        record["sync_status"] = "saved"
        self._json(200, {"attempt_id": attempt_id, "sync_status": "saved"})

    def _integration_health(self):
        self._studio_call(studio_api.integration_status)

    def _hume_configure(self):
        if self.client_address[0] not in {"127.0.0.1", "::1"}:
            self._json(403, {"detail": "Hume configuration is available only from localhost"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 16384:
            self._json(400, {"detail": "Invalid configuration request"})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._json(400, {"detail": "Configuration must be valid JSON"})
            return
        api_key = str(payload.get("api_key", "")).strip()
        secret_key = str(payload.get("secret_key", "")).strip()
        config_id = str(payload.get("config_id", "")).strip()
        if not api_key or not secret_key or not config_id:
            self._json(400, {"detail": "API key, Secret key, and EVI Config ID are all required"})
            return
        try:
            uuid.UUID(config_id)
        except ValueError:
            self._json(400, {"detail": "EVI Config ID must be a UUID, not an API or Secret key"})
            return
        try:
            request_hume_token(api_key, secret_key)
        except urllib.error.HTTPError as error:
            self._json(400, {"detail": f"Hume rejected the API key or Secret key (status {error.code})"})
            return
        except (urllib.error.URLError, json.JSONDecodeError) as error:
            self._json(502, {"detail": f"Hume token validation unavailable: {error}"})
            return
        store_hume_config({"api_key": api_key, "secret_key": secret_key, "config_id": config_id})
        self._json(200, {"configured": True, "config_id": config_id})

    def _hume_session(self):
        config = load_hume_config()
        api_key = config["api_key"]
        secret_key = config["secret_key"]
        if not api_key or not secret_key or not config["config_id"]:
            self._json(503, {"detail": "Hume credentials are not configured on the local server"})
            return
        try:
            token_payload = request_hume_token(api_key, secret_key)
        except urllib.error.HTTPError as error:
            self._json(502, {"detail": f"Hume token request failed with status {error.code}"})
            return
        except (urllib.error.URLError, json.JSONDecodeError) as error:
            self._json(502, {"detail": f"Hume token service unavailable: {error}"})
            return
        self._json(200, {
            "access_token": token_payload.get("access_token"),
            "expires_in": token_payload.get("expires_in"),
            "config_id": config["config_id"],
            "session_id": f"hume:blueorigin-{uuid.uuid4()}",
        })

    def _proxy(self):
        if self.command not in ALLOWED_METHODS:
            self.send_error(405, "Delete and settings-mutation methods are not exposed")
            return

        target_path = self.path[len(PROXY_PREFIX) :]
        if not target_path.startswith("/api/") and target_path != "/health":
            self.send_error(403, "Only the Open Notebook API is available")
            return

        parsed_path = urllib.parse.unquote(urllib.parse.urlsplit(target_path).path)
        if any(segment in parsed_path for segment in DENIED_SEGMENTS):
            self.send_error(403, "Settings and credential mutation tools are intentionally unavailable")
            return
        if self.command == "GET" and parsed_path != "/health" and not parsed_path.startswith(READ_PREFIXES):
            self.send_error(403, "This Open Notebook read route is not exposed")
            return
        if self.command == "POST" and parsed_path not in CREATE_PATHS:
            self.send_error(403, "Only source and note creates are exposed")
            return
        if self.command == "PUT" and not parsed_path.startswith(UPDATE_PREFIXES):
            self.send_error(403, "Only source and note updates are exposed")
            return
        if self.command in {"POST", "PUT"} and self.headers.get("X-BlueOrigin-Approval") != "confirmed":
            self.send_error(428, "Explicit create or update approval is required")
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None
        headers = {}
        if self.headers.get("Content-Type"):
            headers["Content-Type"] = self.headers["Content-Type"]
        if self.headers.get("X-BlueOrigin-Approval"):
            headers["X-BlueOrigin-Approval"] = self.headers["X-BlueOrigin-Approval"]

        request = urllib.request.Request(
            OPEN_NOTEBOOK_API + target_path,
            data=body,
            headers=headers,
            method=self.command,
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", response.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except urllib.error.HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            self.send_header("Content-Type", error.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except urllib.error.URLError as error:
            self.send_error(502, f"Open Notebook unavailable: {error.reason}")

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        studio_path = "/api/" + parsed.path[len("/api/studio/"):] if parsed.path.startswith("/api/studio/") else parsed.path
        source_route = re.match(r"^/api/sources/([^/]+)/(outline|blocks)$", studio_path)
        if parsed.path in {"/hume/health", "/api/hume/health"}:
            self._hume_health()
        elif parsed.path == "/api/studio/integrations":
            self._integration_health()
        elif source_route:
            source_id = urllib.parse.unquote(source_route.group(1))
            callback = studio_api.source_outline if source_route.group(2) == "outline" else studio_api.source_blocks
            self._studio_call(callback, source_id)
        elif self.path.startswith(PROXY_PREFIX):
            self._proxy()
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlsplit(self.path)
        studio_path = "/api/" + parsed.path[len("/api/studio/"):] if parsed.path.startswith("/api/studio/") else parsed.path
        attempt_artifact = re.match(r"^/api/performance/attempts/([^/]+)/artifacts$", parsed.path)
        attempt_sync = re.match(r"^/api/performance/attempts/([^/]+)/sync-complete$", parsed.path)
        if parsed.path == "/hume/session":
            self._hume_session()
        elif parsed.path == "/hume/configure":
            self._hume_configure()
        elif parsed.path == "/api/performance/attempts/finalize":
            self._finalize_local_attempt()
        elif attempt_artifact:
            self._store_local_attempt_artifact(urllib.parse.unquote(attempt_artifact.group(1)))
        elif attempt_sync:
            self._complete_local_attempt_sync(urllib.parse.unquote(attempt_sync.group(1)))
        elif studio_path == "/api/source-context/ask":
            self._studio_post(studio_api.ask_source_context)
        elif studio_path == "/api/source-review":
            self._studio_post(studio_api.rank_source_blocks)
        elif studio_path == "/api/content-brief/generate":
            self._studio_post(studio_api.generate_content_brief)
        elif studio_path == "/api/content-brief/edit":
            self._studio_post(studio_api.edit_content_brief)
        elif studio_path == "/api/coach/recommend":
            self._studio_post(studio_api.recommend_coach_wording)
        elif studio_path == "/api/simulations/generate":
            self._studio_post(studio_api.generate_simulation)
        elif studio_path == "/api/projects":
            self._studio_post(studio_api.populate_project)
        elif studio_path == "/api/renders":
            self._studio_post(studio_api.create_render, approval=True)
        elif studio_path == "/api/releases":
            self._studio_post(studio_api.create_release, approval=True)
        elif self.path.startswith(PROXY_PREFIX):
            self._proxy()
        else:
            self.send_error(405)

    def do_PUT(self):
        if self.path.startswith(PROXY_PREFIX):
            self._proxy()
        else:
            self.send_error(405)

    def do_DELETE(self):
        self.send_error(405, "Delete tools are intentionally unavailable")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8104)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    server = http.server.ThreadingHTTPServer((args.bind, args.port), PrototypeHandler)
    print(f"BlueOrigin prototype: http://{args.bind}:{args.port}/", flush=True)
    print(f"Open Notebook proxy: {PROXY_PREFIX}/api/*", flush=True)
    print("Hume voice boundary: /hume/health and /hume/session", flush=True)
    print("Integration health: /api/studio/integrations", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
