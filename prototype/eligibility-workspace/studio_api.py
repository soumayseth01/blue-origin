"""Real-data API services for the Notebook-centered artifact studio.

This module never fabricates source text, AI answers, briefs, render results, or
release files. Missing upstream data and credentials are returned as explicit
errors so the browser can present a truthful unavailable state.
"""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone


BASE_DIR = pathlib.Path(__file__).resolve().parent
ARTIFACT_ROOT = BASE_DIR / "artifacts"
OPEN_NOTEBOOK_API = os.environ.get("OPEN_NOTEBOOK_API_URL", "http://127.0.0.1:5055").rstrip("/")
OPENAI_API_URL = "https://api.openai.com/v1/responses"
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.6-sol")


class StudioAPIError(RuntimeError):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def integration_status() -> dict:
    return {
        "openai": bool(os.environ.get("OPENAI_API_KEY")),
        "heygen": bool(os.environ.get("HEYGEN_API_KEY")),
        "notebook": _notebook_health(),
        "blob": bool(os.environ.get("BLOB_READ_WRITE_TOKEN")),
        "worker": _render_dependencies_available(),
    }


def _notebook_health() -> bool:
    try:
        request = urllib.request.Request(f"{OPEN_NOTEBOOK_API}/health", method="GET")
        with urllib.request.urlopen(request, timeout=2) as response:
            return 200 <= response.status < 300
    except (urllib.error.URLError, TimeoutError):
        return False


def _render_dependencies_available() -> bool:
    try:
        import docx  # noqa: F401
        import pptx  # noqa: F401
        return True
    except ImportError:
        return False


def _open_notebook_json(path: str) -> dict:
    request = urllib.request.Request(f"{OPEN_NOTEBOOK_API}{path}", headers={"Accept": "application/json"}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise StudioAPIError(error.code, f"Open Notebook rejected the source request ({error.code}).") from error
    except urllib.error.URLError as error:
        raise StudioAPIError(502, f"Open Notebook is unavailable: {error.reason}") from error
    except json.JSONDecodeError as error:
        raise StudioAPIError(502, "Open Notebook returned an unreadable source record.") from error


def _unwrap_source(payload: dict) -> dict:
    for key in ("source", "result", "data"):
        if isinstance(payload.get(key), dict):
            return payload[key]
    return payload


TEXT_KEYS = ("full_text", "extracted_text", "markdown", "text", "content", "transcription", "body")


def _extract_text(record: dict) -> str:
    for key in TEXT_KEYS:
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            nested = _extract_text(value)
            if nested:
                return nested
    asset = record.get("asset")
    if isinstance(asset, dict):
        nested = _extract_text(asset)
        if nested:
            return nested
    return ""


def _source_title(record: dict) -> str:
    asset = record.get("asset") if isinstance(record.get("asset"), dict) else {}
    return str(record.get("title") or record.get("name") or asset.get("title") or "Untitled source")


def _source_id(record: dict, requested_id: str) -> str:
    return str(record.get("id") or record.get("source_id") or requested_id)


def _topic_values(record: dict) -> list[str]:
    raw = record.get("topics") or record.get("tags") or []
    if isinstance(raw, str):
        raw = [part.strip() for part in raw.split(",")]
    return [str(item) for item in raw if str(item).strip()] if isinstance(raw, list) else []


def _page_number_from_line(line: str) -> int | None:
    match = re.search(r"(?:page|p\.)\s*(\d+)", line, re.IGNORECASE)
    return int(match.group(1)) if match else None


def _classify_block(line: str, body: str) -> str:
    if re.match(r"^\s*(?:table\s+\d+|\|.+\|)\s*$", line, re.IGNORECASE) or "\n|" in body:
        return "table"
    if re.match(r"^\s*(?:appendix|definition)s?\b", line, re.IGNORECASE):
        return "appendix" if "appendix" in line.lower() else "definition"
    if re.match(r"^\s*\d+(?:\.\d+)*[.)]?\s+", line):
        return "numbered_clause"
    if re.match(r"^\s*[-*+]\s+", body):
        return "list"
    return "section" if line.startswith("#") else "paragraph"


def _segment_text(source_id: str, title: str, text: str) -> list[dict]:
    """Segment without rewriting source text.

    Markdown headings, numbered clauses, page markers, paragraphs, lists, and
    tables create boundaries. Exact block text is copied from the source.
    """
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    heading_path: list[str] = [title]
    page = 1
    chunks: list[tuple[list[str], str, int, str]] = []
    buffer: list[str] = []
    buffer_heading = list(heading_path)
    buffer_page = page
    buffer_type = "paragraph"

    def flush() -> None:
        nonlocal buffer
        exact = "\n".join(buffer).strip()
        if exact:
            chunks.append((list(buffer_heading), exact, buffer_page, buffer_type))
        buffer = []

    for raw_line in lines:
        line = raw_line.rstrip()
        marker_page = _page_number_from_line(line) if re.match(r"^\s*(?:[-=]{2,}\s*)?(?:page|p\.)\s*\d+", line, re.IGNORECASE) else None
        heading = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        numbered = re.match(r"^\s*(\d+(?:\.\d+){0,5}[.)]?)\s+(.+)$", line)
        if marker_page is not None:
            flush()
            page = marker_page
            continue
        if "\f" in line:
            flush()
            page += line.count("\f")
            line = line.replace("\f", "").strip()
            if not line:
                continue
        if heading:
            flush()
            level = len(heading.group(1))
            heading_path = heading_path[:level]
            heading_path.append(heading.group(2).strip())
            buffer_heading = list(heading_path)
            buffer_page = page
            buffer_type = "section"
            buffer = [line]
            continue
        if numbered and buffer:
            flush()
            buffer_heading = list(heading_path) + [numbered.group(0).strip()[:160]]
            buffer_page = page
            buffer_type = "numbered_clause"
            buffer = [line]
            continue
        if not line.strip():
            flush()
            buffer_heading = list(heading_path)
            buffer_page = page
            buffer_type = "paragraph"
            continue
        if not buffer:
            buffer_heading = list(heading_path)
            buffer_page = page
            buffer_type = _classify_block(line, line)
        buffer.append(line)
        if sum(len(item) + 1 for item in buffer) >= 4000:
            flush()
            buffer_heading = list(heading_path)
            buffer_page = page
            buffer_type = "paragraph"
    flush()

    blocks: list[dict] = []
    for index, (path, exact, block_page, block_type) in enumerate(chunks):
        checksum = hashlib.sha256(exact.encode("utf-8")).hexdigest()
        block_id = f"block:{source_id.replace(':', '-')}-{checksum[:16]}"
        title_text = next((part.lstrip("#").strip() for part in reversed(path) if part.strip()), f"Block {index + 1}")
        if title_text == title:
            title_text = exact.splitlines()[0].lstrip("#-* ")[:120] or f"Block {index + 1}"
        blocks.append({
            "block_id": block_id,
            "source_id": source_id,
            "source_title": title,
            "heading_path": path,
            "title": title_text,
            "exact_text": exact,
            "location": f"p. {block_page}" if block_page else f"Block {index + 1}",
            "block_type": block_type,
            "preceding_block_id": None,
            "following_block_id": None,
            "table_references": [],
            "image_references": [],
            "effective_date": None,
            "checksum": f"sha256:{checksum}",
            "extraction_confidence": None,
            "relevance_score": None,
            "relevance_explanation": None,
        })
    for index, block in enumerate(blocks):
        block["preceding_block_id"] = blocks[index - 1]["block_id"] if index else None
        block["following_block_id"] = blocks[index + 1]["block_id"] if index + 1 < len(blocks) else None
    return blocks


def source_understanding(source_id: str) -> tuple[dict, list[dict]]:
    payload = _open_notebook_json(f"/api/sources/{urllib.parse.quote(source_id, safe='')}")
    record = _unwrap_source(payload)
    text = _extract_text(record)
    if not text:
        raise StudioAPIError(422, "The selected Notebook source does not contain extracted text yet.")
    wrapped_markdown = re.search(r"(?:^|\n)Markdown Content:\s*(.+)\Z", text, re.DOTALL | re.IGNORECASE)
    if wrapped_markdown:
        text = wrapped_markdown.group(1).strip()
    actual_id = _source_id(record, source_id)
    title = _source_title(record)
    blocks = _segment_text(actual_id, title, text)
    if not blocks:
        raise StudioAPIError(422, "No reviewable blocks could be extracted from the selected source.")
    metadata = record.get("metadata") if isinstance(record.get("metadata"), dict) else {}
    page_count = record.get("page_count") or metadata.get("page_count")
    if page_count is None:
        detected_pages = [int(match) for match in re.findall(r"(?:page|p\.)\s*(\d+)", text, re.IGNORECASE)]
        page_count = max(detected_pages) if detected_pages else None
    source_type = str(record.get("source_type") or record.get("type") or metadata.get("type") or "Source")
    is_policy = bool(record.get("is_policy") or metadata.get("is_policy") or re.search(r"\b(policy|regulation|statute|manual)\b", f"{source_type} {title}", re.IGNORECASE))
    outline = {
        "source_id": actual_id,
        "title": title,
        "source_type": source_type,
        "date": record.get("date") or record.get("created_at") or metadata.get("date"),
        "status": record.get("status"),
        "notebook_id": record.get("notebook_id"),
        "extraction_status": "complete",
        "page_count": page_count,
        "section_count": len({tuple(block["heading_path"]) for block in blocks}),
        "table_count": sum(block["block_type"] == "table" for block in blocks),
        "image_count": len(record.get("images") or metadata.get("images") or []),
        "topics": _topic_values(record),
        "is_policy": is_policy,
        "warning": None,
        "headings": [block["heading_path"] for block in blocks if block["block_type"] == "section"],
    }
    return outline, blocks


def source_outline(source_id: str) -> dict:
    outline, _ = source_understanding(source_id)
    return {"source": outline}


def source_blocks(source_id: str) -> dict:
    _, blocks = source_understanding(source_id)
    return {"source_id": source_id, "blocks": blocks}


def _output_text(response: dict) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]
    for item in response.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]
            if content.get("type") == "refusal":
                raise StudioAPIError(422, content.get("refusal") or "The model refused the request.")
    raise StudioAPIError(502, "OpenAI returned no structured output.")


def _call_openai(name: str, instructions: str, payload: dict, schema: dict) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise StudioAPIError(503, "OPENAI_API_KEY is not configured on the server.")
    body = {
        "model": OPENAI_MODEL,
        "store": False,
        "input": [
            {"role": "system", "content": instructions},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        "text": {"format": {"type": "json_schema", "name": name, "strict": True, "schema": schema}},
    }
    request = urllib.request.Request(
        OPENAI_API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:1000]
        raise StudioAPIError(502, f"OpenAI request failed ({error.code}): {detail}") from error
    except urllib.error.URLError as error:
        raise StudioAPIError(502, f"OpenAI is unavailable: {error.reason}") from error
    except json.JSONDecodeError as error:
        raise StudioAPIError(502, "OpenAI returned an unreadable response.") from error
    try:
        return json.loads(_output_text(raw))
    except json.JSONDecodeError as error:
        raise StudioAPIError(502, "OpenAI output did not match the requested JSON schema.") from error


CITATION_SCHEMA = {
    "type": "object",
    "properties": {
        "block_id": {"type": "string"},
        "source_id": {"type": "string"},
        "label": {"type": "string"},
    },
    "required": ["block_id", "source_id", "label"],
    "additionalProperties": False,
}


BRIEF_POINT_SCHEMA = {
    "type": "object",
    "properties": {
        "point_id": {"type": "string"},
        "statement": {"type": "string"},
        "intended_use": {"type": "string", "enum": ["key_fact", "procedure", "warning", "objective", "example", "quiz_concept", "supporting_detail"]},
        "priority": {"type": "string", "enum": ["required", "optional", "supporting"]},
        "citations": {"type": "array", "items": CITATION_SCHEMA},
        "provenance": {"type": "string", "enum": ["directly_sourced", "ai_rewritten_from_sources", "ai_interpretation", "author_input", "author_override", "unsupported_draft_requiring_review"]},
        "author_notes": {"type": "string"},
        "review_status": {"type": "string", "enum": ["candidate", "edited", "reviewed"]},
    },
    "required": ["point_id", "statement", "intended_use", "priority", "citations", "provenance", "author_notes", "review_status"],
    "additionalProperties": False,
}


def _schema_object(properties: dict) -> dict:
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties.keys()),
        "additionalProperties": False,
    }


def _schema_array(items: dict) -> dict:
    return {"type": "array", "items": items}


_STRING = {"type": "string"}


SIMULATION_GENERATION_SCHEMA = _schema_object({
    "suggested_title": _STRING,
    "short_title": _STRING,
    "description": _STRING,
    "persona": _schema_object({
        "name": _STRING, "initials": _STRING, "description": _STRING, "preferred_language": _STRING,
    }),
    "opening": _STRING,
    "facts": _schema_array(_schema_object({"id": _STRING, "label": _STRING, "question": _STRING, "caption": _STRING})),
    "case_data": _schema_object({
        "schemaVersion": {"type": "string", "enum": ["2.0.0-demo"]},
        "application": _schema_object({
            "type": _STRING, "channel": _STRING, "receivedDate": _STRING, "receivedTime": _STRING,
            "preferredLanguage": _STRING, "interpreterNeeded": _STRING, "accessibilityNeed": _STRING,
            "contactMethod": _STRING, "phone": _STRING, "email": _STRING, "bestContactTime": _STRING,
            "residentialAddress": _STRING, "cityStateZip": _STRING, "mailingAddressSame": _STRING,
            "mailingAddress": _STRING, "authorizedRepresentative": _STRING, "representativeName": _STRING,
            "urgentNeed": _STRING, "urgentNeedType": _STRING, "interviewMode": _STRING, "interviewStatus": _STRING,
        }),
        "people": _schema_array(_schema_object({
            "personId": _STRING, "name": _STRING, "dateOfBirth": _STRING, "relationship": _STRING,
            "livesAtCaseAddress": _STRING, "alternateAddress": _STRING, "temporaryAbsent": _STRING,
            "absenceReason": _STRING, "expectedReturnDate": _STRING, "sharedCustody": _STRING,
            "custodySchedule": _STRING, "maritalStatus": _STRING, "taxFilingStatus": _STRING,
            "claimedAsDependent": _STRING, "pregnant": _STRING, "dueDate": _STRING,
            "snapFoodTogether": _STRING, "tanfRole": _STRING, "medicaidParticipation": _STRING,
            "snapParticipation": _STRING, "tanfParticipation": _STRING,
        })),
        "incomeSources": _schema_array(_schema_object({
            "incomeId": _STRING, "person": _STRING, "category": _STRING, "type": _STRING,
            "employer": _STRING, "employmentStatus": _STRING, "payBasis": _STRING, "hourlyRate": _STRING,
            "hoursPerWeek": _STRING, "grossAmount": _STRING, "frequency": _STRING, "paymentDate": _STRING,
            "expectedChange": _STRING, "changeDate": _STRING, "selfEmploymentBusiness": _STRING,
            "grossReceipts": _STRING, "businessExpenses": _STRING,
        })),
        "expenses": _schema_object({
            "shelter": _schema_object({"type": _STRING, "amount": _STRING, "frequency": _STRING, "shared": _STRING, "subsidized": _STRING, "subsidyType": _STRING, "subsidyAmount": _STRING}),
            "utilitiesStatus": _STRING,
            "utilities": _schema_array(_schema_object({"type": _STRING, "arrangement": _STRING, "amount": _STRING, "frequency": _STRING, "shared": _STRING})),
            "dependentCareStatus": _STRING,
            "dependentCare": _schema_array(_schema_object({"person": _STRING, "reason": _STRING, "provider": _STRING, "amount": _STRING, "frequency": _STRING, "subsidized": _STRING})),
            "supportStatus": _STRING,
            "medicalStatus": _STRING,
            "medical": _schema_array(_schema_object({"person": _STRING, "type": _STRING, "amount": _STRING, "frequency": _STRING, "reimbursement": _STRING})),
        }),
        "resources": _schema_array(_schema_object({
            "resourceId": _STRING, "owner": _STRING, "type": _STRING, "institution": _STRING,
            "value": _STRING, "jointlyOwned": _STRING, "incomeProducing": _STRING,
            "vehicleDescription": _STRING, "vehicleUse": _STRING,
        })),
        "nonfinancial": _schema_object({
            "identityStatus": _STRING, "residency": _STRING, "citizenship": _STRING,
            "immigrationDocument": _STRING, "sponsorStatus": _STRING, "sponsorName": _STRING,
            "ssnStatus": _STRING, "studentStatus": _STRING, "disabilityClaimed": _STRING,
            "disabilityDetails": _STRING, "blindnessStatus": _STRING, "pregnancyStatus": _STRING,
            "caretakerStatus": _STRING, "healthCoverage": _STRING, "workParticipation": _STRING,
            "absentParentStatus": _STRING, "priorBenefitHistory": _STRING, "disqualificationHistory": _STRING,
        }),
        "evidence": _schema_array(_schema_object({
            "evidenceId": _STRING, "type": _STRING, "title": _STRING, "person": _STRING,
            "program": _STRING, "fact": _STRING, "receivedDate": _STRING, "status": _STRING, "discrepancy": _STRING,
        })),
        "outcomes": _schema_array(_schema_object({
            "program": _STRING, "person": _STRING, "month": _STRING, "status": _STRING,
            "benefit": _STRING, "reason": _STRING, "pendingReason": _STRING,
        })),
        "notices": _schema_array(_schema_object({
            "program": _STRING, "type": _STRING, "effectiveDate": _STRING, "delivery": _STRING,
            "language": _STRING, "verificationDueDate": _STRING, "appealRights": _STRING,
        })),
        "authorizations": _schema_array(_schema_object({"program": _STRING, "action": _STRING, "effectiveDate": _STRING})),
    }),
    "behavior": _schema_object({
        "profile_id": {"type": "string", "enum": ["benefits-calm", "benefits-anxious", "benefits-frustrated", "benefits-guarded", "benefits-confused", "benefits-distressed"]},
        "intensity": {"type": "string", "enum": ["low", "moderate", "high"]},
        "voice_key": {"type": "string", "enum": ["voice-warm-american-female", "voice-imani-carter", "voice-caring-mother", "voice-charming-cowgirl", "voice-warm-female-assistant", "voice-soft-american-male", "voice-terrence-bentley", "voice-colton-rivers", "voice-grizzled-new-yorker", "voice-spanish-instructor"]},
    }),
    "expected_actions": _schema_array(_STRING),
    "training_objectives": _schema_array(_STRING),
})


SIMULATION_GENERATION_INSTRUCTIONS = (
    "Create one complete synthetic public-benefits training case from the supplied author setup and prompt. "
    "Return only the requested structured data. Use invented names, a 555 phone number, an email ending in .invalid, "
    "and a fictional city/state with ZIP 00000. Never reproduce a real SSN or personal identifier. Set case_data.schemaVersion "
    "to 2.0.0-demo. Include every "
    "selected program and no unselected program. Create internally consistent applicant, household, income, expense, "
    "resource, nonfinancial, evidence, notice, authorization, and illustrative outcome records. The case is not "
    "grounded in policy sources. Do not claim legal accuracy or make an official eligibility determination. Outcomes "
    "must be clearly illustrative training fixtures. Create four to eight gated interview facts with an appropriate "
    "learner question and concise natural-language applicant response. Use coherent dates and amounts, unique record "
    "identifiers, and empty strings where conditional fields do not apply. For each person, program participation must "
    "be Applying, Included, Excluded, Not applying, Pending, or an empty string."
)


def generate_simulation(payload: dict) -> dict:
    setup = payload.get("setup") if isinstance(payload.get("setup"), dict) else {}
    prompt = str(payload.get("prompt") or "").strip()
    programs = setup.get("programs") if isinstance(setup.get("programs"), list) else []
    if not str(setup.get("jurisdiction") or "").strip():
        raise StudioAPIError(400, "State or jurisdiction is required.")
    if not programs:
        raise StudioAPIError(400, "At least one program is required.")
    if any(program not in {"Medicaid", "SNAP", "TANF"} for program in programs):
        raise StudioAPIError(400, "Unsupported program.")
    if not 30 <= len(prompt) <= 3000:
        raise StudioAPIError(400, "Prompt must contain 30 to 3,000 characters.")
    if re.search(r"\b\d{3}-\d{2}-\d{4}\b", prompt):
        raise StudioAPIError(422, "Remove Social Security numbers or other real identifying information.")
    request_payload = {
        "setup": setup,
        "focus_tags": [str(value) for value in (payload.get("focus_tags") or [])][:20],
        "prompt": prompt,
    }
    generated = _call_openai("synthetic_simulation_case", SIMULATION_GENERATION_INSTRUCTIONS, request_payload, SIMULATION_GENERATION_SCHEMA)
    serialized = json.dumps(generated)
    application = ((generated.get("case_data") or {}).get("application") or {})
    if re.search(r"\b\d{3}-\d{2}-\d{4}\b", serialized):
        raise StudioAPIError(502, "AI returned a prohibited personal identifier.")
    if application.get("phone") and "555" not in str(application["phone"]):
        raise StudioAPIError(502, "AI returned a phone number that was not clearly synthetic.")
    if application.get("email") and not str(application["email"]).lower().endswith(".invalid"):
        raise StudioAPIError(502, "AI returned an email address that was not clearly synthetic.")
    if application.get("cityStateZip") and not re.search(r"\b00000\b", str(application["cityStateZip"])):
        raise StudioAPIError(502, "AI returned an address that was not clearly synthetic.")
    if not str((generated.get("persona") or {}).get("name") or "").strip():
        raise StudioAPIError(502, "AI returned an incomplete synthetic applicant.")
    case_data = generated.get("case_data") or {}
    returned_programs = {
        str(item.get("program"))
        for collection in (case_data.get("outcomes") or [], case_data.get("notices") or [], case_data.get("authorizations") or [])
        for item in collection if isinstance(item, dict)
    }
    if any(program not in returned_programs for program in programs) or any(program not in programs for program in returned_programs):
        raise StudioAPIError(502, "AI returned records for the wrong program selection.")
    return generated


def recommend_coach_wording(payload: dict) -> dict:
    recommendation = payload.get("recommendation") if isinstance(payload.get("recommendation"), dict) else None
    allowed_actions = {"ask", "enter", "review", "correct", "navigate", "validate", "explain", "close"}
    if not recommendation or recommendation.get("action_type") not in allowed_actions:
        raise StudioAPIError(400, "A deterministic coach recommendation is required.")
    if not all(isinstance(recommendation.get(key), dict) for key in ("target", "information", "policy")):
        raise StudioAPIError(400, "Grounded target, information, and policy are required.")
    information = recommendation["information"]
    policy = recommendation["policy"]
    safe_payload = {
        "action_type": recommendation["action_type"],
        "title": str(recommendation.get("title") or "")[:240],
        "instruction": str(recommendation.get("instruction") or "")[:600],
        "target_label": str(recommendation["target"].get("label") or "Current workflow")[:180],
        "information_value": None if information.get("value") is None else str(information.get("value"))[:180],
        "information_provenance": str(information.get("provenance") or "Approved workflow source")[:180],
        "information_disclosed": bool(information.get("disclosed")),
        "policy_summary": str(policy.get("summary") or "")[:600],
        "caller_signal": str((payload.get("context") or {}).get("caller_signal") or "")[:120],
    }
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "minLength": 1, "maxLength": 240},
            "instruction": {"type": "string", "minLength": 1, "maxLength": 600},
        },
        "required": ["title", "instruction"],
        "additionalProperties": False,
    }
    wording = _call_openai(
        "grounded_coach_wording",
        "Rewrite only the supplied title and instruction as concise worker guidance. Preserve the selected action, target, value, provenance, disclosure state, and policy meaning exactly. Never add a value, policy claim, citation, eligibility conclusion, or system action. If information_disclosed is false, do not reveal or infer a value. Use plain language and no markdown.",
        safe_payload,
        schema,
    )
    return {**recommendation, "title": wording["title"], "instruction": wording["instruction"], "source": "ai_grounded_wording"}


def rank_source_blocks(payload: dict) -> dict:
    blocks = payload.get("selected_blocks") or []
    if not blocks:
        raise StudioAPIError(400, "Selected policy or source blocks are required for ranking.")
    schema = {
        "type": "object",
        "properties": {
            "rankings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "block_id": {"type": "string"},
                        "relevance_score": {"type": "integer", "minimum": 0, "maximum": 100},
                        "relevance_explanation": {"type": "string"},
                    },
                    "required": ["block_id", "relevance_score", "relevance_explanation"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["rankings"],
        "additionalProperties": False,
    }
    instructions = (
        "Rank only the supplied source blocks against the stated artifact objective. Return every supplied block ID "
        "unchanged with an integer relevance score and a concise explanation. Do not rewrite, merge, omit, or add blocks."
    )
    return _call_openai("policy_block_ranking", instructions, payload, schema)


def ask_source_context(payload: dict) -> dict:
    selected = payload.get("selected_blocks") or []
    expanded = payload.get("expanded_blocks") or []
    if not selected and not expanded:
        raise StudioAPIError(400, "At least one selected or explicitly expanded block is required.")
    schema = {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "supported": {"type": "boolean"},
            "text": {"type": "string"},
            "citations": {"type": "array", "items": CITATION_SCHEMA},
            "interpretation": {"type": "string"},
        },
        "required": ["question", "supported", "text", "citations", "interpretation"],
        "additionalProperties": False,
    }
    instructions = (
        "Answer only from the supplied selected and explicitly expanded source blocks. "
        "Every factual statement must be supported by citations using exact block_id and source_id values. "
        "Do not use outside knowledge or web search. If the material is insufficient, set supported=false, "
        "explain the gap, and return no citations. Put any inference in interpretation, not in the sourced answer."
    )
    return _call_openai("context_answer", instructions, payload, schema)


def generate_content_brief(payload: dict) -> dict:
    blocks = payload.get("selected_blocks") or []
    if not blocks:
        raise StudioAPIError(400, "Selected policy or source blocks are required.")
    schema = {
        "type": "object",
        "properties": {"points": {"type": "array", "items": BRIEF_POINT_SCHEMA}},
        "required": ["points"],
        "additionalProperties": False,
    }
    instructions = (
        "Create candidate key points only from the supplied authoritative blocks. Preserve accurate citations. "
        "Do not add policy knowledge or claims that are absent from the blocks. Distinguish direct wording, "
        "rewrites, and interpretations with the provenance enum. Use unique point IDs beginning with point:."
    )
    return _call_openai("content_brief", instructions, payload, schema)


def edit_content_brief(payload: dict) -> dict:
    point = payload.get("point")
    if not isinstance(point, dict):
        raise StudioAPIError(400, "A brief point is required.")
    schema = {
        "type": "object",
        "properties": {"points": {"type": "array", "items": BRIEF_POINT_SCHEMA}},
        "required": ["points"],
        "additionalProperties": False,
    }
    instructions = (
        "Apply only the requested edit to the brief point. Use the supplied supporting blocks to verify meaning. "
        "Preserve citations only when the edited claim remains supported. If support is lost, remove citations "
        "and label the point unsupported_draft_requiring_review. Split may return multiple points; other actions "
        "return one. Do not introduce outside facts."
    )
    return _call_openai("brief_point_edit", instructions, payload, schema)


def populate_project(payload: dict) -> dict:
    project = payload.get("project")
    brief = payload.get("content_brief")
    template = payload.get("template")
    if not isinstance(project, dict) or not isinstance(brief, dict) or not isinstance(template, dict):
        raise StudioAPIError(400, "Project, approved content brief, and template are required.")
    quiz_item_schema = {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "options": {"type": "array", "items": {"type": "string"}},
            "correct_index": {"type": "integer", "minimum": 0},
            "explanation": {"type": "string"},
            "citations": {"type": "array", "items": CITATION_SCHEMA},
        },
        "required": ["question", "options", "correct_index", "explanation", "citations"],
        "additionalProperties": False,
    }
    scene_schema = {
        "type": "object",
        "properties": {
            "id": {"type": "string"},
            "title": {"type": "string"},
            "narration": {"type": "string"},
            "avatar_enabled": {"type": "boolean"},
            "avatar_position": {"type": "string", "enum": ["left", "right"]},
        },
        "required": ["id", "title", "narration", "avatar_enabled", "avatar_position"],
        "additionalProperties": False,
    }
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "audience": {"type": "string"},
            "objective": {"type": "string"},
            "summary": {"type": "string"},
            "key_points": {"type": "array", "items": {"type": "string"}},
            "scenes": {"type": "array", "items": scene_schema},
            "quiz_items": {"type": "array", "items": quiz_item_schema},
        },
        "required": ["title", "audience", "objective", "summary", "key_points", "scenes", "quiz_items"],
        "additionalProperties": False,
    }
    instructions = (
        "Populate the supplied curated template using only the immutable approved content brief and author-entered "
        "project context. Do not consult or summarize complete source documents. Keep all claims supported by brief "
        "points and their citations. Preserve supplied scene IDs. Narration must remain faithful to cited points. "
        "For quiz projects, create grounded questions with exactly one correct option and cited explanations; for "
        "other formats return an empty quiz_items array. Do not enable avatars automatically."
    )
    return _call_openai("template_slot_population", instructions, payload, schema)


def ensure_approved_write(headers) -> None:
    if headers.get("X-BlueOrigin-Approval") != "confirmed":
        raise StudioAPIError(428, "Explicit approval is required for render and release writes.")


def create_render(payload: dict) -> dict:
    from artifact_worker import render_project
    project = payload.get("project")
    brief = payload.get("content_brief")
    template = payload.get("template")
    if not isinstance(project, dict) or not isinstance(brief, dict) or not isinstance(template, dict):
        raise StudioAPIError(400, "Project, approved content brief, and template are required.")
    if not project.get("title") or not project.get("audience") or not project.get("objective"):
        raise StudioAPIError(422, "Title, audience, and objective must be completed before rendering.")
    for slot in project.get("image_slots", []):
        if slot.get("asset") and not str(slot.get("alt_text", "")).strip():
            raise StudioAPIError(422, "Every populated image slot requires reviewed alt text.")
    try:
        return render_project(project, brief, template, ARTIFACT_ROOT)
    except ImportError as error:
        raise StudioAPIError(503, f"Artifact render dependencies are not installed: {error}") from error
    except ValueError as error:
        raise StudioAPIError(422, str(error)) from error


def create_release(payload: dict) -> dict:
    project = payload.get("project")
    render_job = payload.get("render_job")
    if not isinstance(project, dict) or not isinstance(render_job, dict):
        raise StudioAPIError(400, "Project and completed render job are required.")
    if render_job.get("status") != "completed":
        raise StudioAPIError(409, "Only a completed render job can be published.")
    release_id = f"release:{uuid.uuid4()}"
    published_at = datetime.now(timezone.utc).isoformat()
    release = {
        "release_id": release_id,
        "project_id": project.get("project_id"),
        "title": project.get("title"),
        "format": project.get("format"),
        "template_id": project.get("template_id"),
        "brief_id": project.get("brief_id"),
        "brief_version": project.get("brief_version"),
        "source_ids": project.get("source_ids") or [],
        "outputs": [file["format"] for file in render_job.get("files", [])],
        "files": render_job.get("files", []),
        "published_at": published_at,
        "status": "published",
        "notebook_status": "pending",
        "checksums": {file["format"]: file["checksum"] for file in render_job.get("files", [])},
    }
    release_dir = ARTIFACT_ROOT / render_job["render_id"]
    manifest = release_dir / "publication-manifest.json"
    manifest.write_text(json.dumps(release, indent=2), encoding="utf-8")
    release["manifest_url"] = f"/artifacts/{render_job['render_id']}/publication-manifest.json"
    return release
