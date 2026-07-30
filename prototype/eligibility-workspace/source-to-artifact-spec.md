# Notebook-Centered Source-to-Artifact Studio

## Product boundary

The Studio is a continuous, same-tab authoring workflow inside the existing Product Studio shell:

`Select sources → Review available content → Select blocks → Expand/ask context → Edit key points → Approve brief → Choose template → Populate → Preview → Publish`

Simulation remains a separate frozen-package workflow. Artifact creation never uses simulation fixtures as source content.

The Studio has no synthetic source, answer, brief, render, checksum, or release fallback. When Open Notebook, OpenAI, HeyGen, Blob, or the render worker is unavailable, the corresponding action returns a visible unavailable state.

## Navigation and eligibility library

Notebook and Library are first-class destinations in the left Product Studio navigation. Neither destination opens a second browser tab. Notebook contains briefs, artifact projects, and releases; Library contains source discovery, classification, ingestion, selection, and the source-understanding flow. Upload, web-source, and pasted-text controls live only in Library.

Every Library row has an author-controlled document classification. The v1 taxonomy covers policy manuals, SOPs/procedures, job aids/quick references, huddle scripts/talking points, applications/forms, notice/letter templates, policy bulletins/change memos, reference tables/charts, training/outreach material, FAQs/client guidance, system guides/release notes, QA/review tools, and other records. Huddle scripts are expected to be organization-owned uploads when no authoritative public example exists.

The built-in web catalog contains metadata and direct links for official Texas, Michigan, and Arizona agency sources across policy, procedure, form, bulletin, quick-reference, and training categories. Catalog entries are discovery records, not copied policy content and not automatic artifact inputs. An author must explicitly add a catalog record to Open Notebook and review its extracted blocks before it can support a brief.

## Notebook experience

Notebook has two same-tab surfaces:

1. An operational landing page ordered Published, In review, then Drafts, with search, filters, sorting, favorites, pagination, and grid/list views.
2. A focused authoring desk with Sources, a grounded conversation canvas, and a Creation Studio for Video, Presentation, Job Aid, and Quiz.

The structure takes inspiration from multi-panel research tools without copying their color system, component styling, language, or product identity. BlueOrigin uses its own slate, ink, warm-white, and orange visual system and keeps source approval as a visible workflow boundary.

Creating a notebook produces an author-controlled, server-backed draft in Neon. The product does not seed fictional notebooks, infer publication from an Open Notebook connection, or promote browser-local records. Open Notebook remains the source-content service; Product Studio owns notebook lifecycle, access, versions, review dates, and audit events.

Library discovery is also server-backed. `LibrarySource` registry records in Neon are the selectable source inventory for notebook setup and the notebook Source desk. The official Texas, Michigan, and Arizona entries are durable catalog records with their authoritative URLs, agency ownership, program and document classifications, organization-readable access, and independent extraction status. They are not copied policy text and are never treated as extracted merely because they are registered.

A notebook can link a registry source immediately, even when Open Notebook is unavailable. The link preserves the registry source ID and a metadata snapshot. Source understanding, AI context, brief approval, and publication remain blocked until the source has an `open_notebook_source_id` and a usable extraction status. This separates selection and governance from downstream extraction health without fabricating content.

The Sources panel selects existing Notebook sources and routes source ingestion back through Library so upload controls are not duplicated. The conversation composer is disabled until the author has reviewed and selected focused source blocks. Questions use the existing cited context endpoint and never fall back to general model knowledge. The Creation Studio remains locked until the content brief is approved; its four output choices continue through the controlled template, preview, and publication flow.

### Enterprise lifecycle and governance

`Create notebook` is a two-step in-app dialog. Details require name, purpose, audience, and access; program tags and notebook instructions are optional. Team access additionally requires a team identifier. Sources can be selected from imported Open Notebook records or added through its upload, website, and copied-text interfaces. The durable Product Studio draft is created only after setup, and all navigation remains in the current application tab.

Lifecycle values are `draft`, `in_review`, `published`, `superseded`, and `archived`. Authors can self-publish. Publishing requires a future review date, at least one usable source, and compatible source permissions. Organization publication requires organization-readable sources; team publication accepts organization sources or sources for the same team; private publication rejects explicitly restricted sources. Unknown permissions never become broader permissions implicitly.

Every publication creates an immutable `NotebookVersion` snapshot and SHA-256 checksum. Editing a published notebook changes the working record back to draft while the published version remains intact. Published records show version, owner, access, source/artifact counts, publication date, and Current/Review due/Expired freshness. `NotebookEvent` records creation, updates, source changes, review, publication, and archive actions.

Durable interfaces:

- `GET /api/studio/library-sources`
- `GET /api/studio/library-sources/:id`
- `GET/POST /api/studio/notebooks`
- `GET/PATCH /api/studio/notebooks/:id`
- `POST/DELETE /api/studio/notebooks/:id/sources`
- `POST /api/studio/notebooks/:id/review`
- `POST /api/studio/notebooks/:id/publish`
- `POST /api/studio/notebooks/:id/archive`
- `GET /api/studio/notebooks/:id/versions`
- `GET /api/studio/notebooks/:id/events`

`LibrarySource`, `Notebook`, `NotebookSource`, `NotebookVersion`, `NotebookAccess`, and `NotebookEvent` are stored in Neon. Owner identity comes from server-owned `STUDIO_ACTOR_ID` and `STUDIO_ACTOR_NAME`; the browser cannot assign itself a privileged actor. Deployment Protection remains required until a production identity provider replaces the protected prototype identity.

## Source interfaces

### `SourceDocument`

- `source_id`, title, source type, source date, extraction status, and Notebook ID
- Actual page, section, table, and image counts when the upstream record provides or extraction can establish them
- Topics, policy classification, warnings, and heading outline

### `PolicyBlock`

- Stable ID derived from source ID and a SHA-256 checksum of exact extracted text
- Source ID/title, original heading path, exact extracted text, page/location, and block type
- Previous/next block IDs
- Table/image references, effective date, checksum, confidence, and optional AI ranking

Block boundaries are deterministic. Markdown headings, numbered clauses, paragraphs, lists, tables, page markers, appendices, and definitions create boundaries. AI never rewrites the authoritative `exact_text` or changes a block boundary.

The browser loads real data through:

- `GET /api/sources/:id/outline`
- `GET /api/sources/:id/blocks`

Only blocks the author selects, plus blocks the author explicitly expands, can be sent to OpenAI. Complete policies are not default AI input.

## Context questions

`POST /api/source-context/ask` accepts the question, selected source IDs, selected blocks, explicitly expanded blocks, and current objective. The server uses OpenAI Structured Outputs and requires:

- a supported/unsupported decision;
- a bounded answer;
- block/source citations;
- a separate interpretation field.

The prompt prohibits public-web access, unselected sources, other Notebooks, and outside policy knowledge. Insufficient material produces `supported: false` and no citations.

## Approved content brief

`POST /api/content-brief/generate` creates schema-constrained candidate `BriefPoint` records only from selected blocks. `POST /api/content-brief/edit` supports shorten, clarify, procedure, and split operations while reevaluating citations.

Each point records statement, intended use, priority/order, citations, provenance, AI edit history, author notes, and review state. Supported provenance values are directly sourced, AI rewrite, AI interpretation, author input, author override, and unsupported draft requiring review.

Brief approval snapshots source IDs, block IDs, and points into an immutable local version. Source, block, point, or ordering changes mark the brief and downstream project stale.

## Templates and media

Curated templates are defined for:

- one-page quick reference;
- step-by-step job aid;
- detailed reference guide;
- guided process walkthrough;
- feature or policy briefing;
- scenario-based training deck;
- grounded knowledge check.

`POST /api/projects` uses Structured Outputs to populate title, audience, objective, summary, mapped points, scenes/narration, and quiz items from the approved brief. It never resummarizes complete sources.

Image slots accept Notebook assets or author PNG/JPEG/WebP uploads. Slots expose fit/crop, caption, and required reviewed alt text. Upload data stays inside the project sent to the controlled renderer in this prototype; production should use a private Blob upload token and media-asset record.

## Rendering and publication

The local Codex server provides a real Python renderer:

- job aid → editable DOCX and matching PDF when LibreOffice is available;
- presentation → editable 16:9 PPTX with avatar-safe regions;
- quiz → HTML and JSON after OpenAI has generated approved quiz items.

`POST /api/renders` and `POST /api/releases` require `X-BlueOrigin-Approval: confirmed`. Files receive real SHA-256 checksums. Release manifests preserve brief version and source lineage.

On Vercel, `/api/renders` forwards to `ARTIFACT_WORKER_URL`; it never returns a pretend file. The external worker must immediately copy completed HeyGen downloads into private Blob storage because HeyGen download URLs expire.

Video rendering requires the external worker to:

1. generate PPTX and 16:9 slide images;
2. generate reviewed OpenAI narration/audio;
3. upload background assets and submit avatar-enabled scenes to HeyGen;
4. render non-avatar scenes locally;
5. poll HeyGen asynchronously and immediately store completed scenes privately;
6. assemble scenes, transitions, SRT, and WebVTT with FFmpeg.

No local or deployed synthetic video fallback exists.

## Credentials

Server-side variables only:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (defaults to `gpt-5.6-sol`)
- `HEYGEN_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `OPEN_NOTEBOOK_API_URL`
- `ARTIFACT_WORKER_URL`
- `ARTIFACT_WORKER_TOKEN`
- `DATABASE_URL`
- `STUDIO_ACTOR_ID`
- `STUDIO_ACTOR_NAME`

The Settings screen returns configured/not-configured health flags only. Secret values never enter browser state, projects, manifests, or logs.
