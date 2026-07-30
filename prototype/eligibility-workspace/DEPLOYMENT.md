# BlueOrigin Vercel prototype

The project root is this directory. The application remains static HTML/CSS/JavaScript; files under `api/` are Node.js Vercel Functions.

## Provision once

1. Link or create a protected Vercel project with this directory as its root.
2. Install Neon Postgres from the Vercel Marketplace. Confirm `DATABASE_URL` is available to Preview and Production.
3. Create a private Vercel Blob store. Confirm `BLOB_READ_WRITE_TOKEN` is available to Preview and Production.
4. Add the Hume and prototype variables listed in `.env.example`.
5. Add `OPEN_NOTEBOOK_API_URL`, `OPENAI_API_KEY`, `HEYGEN_API_KEY`, and the protected artifact-worker variables before enabling artifact publication.
5. Enable Vercel Deployment Protection or invite-only access before collecting shared demo history.

## Migrate and deploy

```bash
vercel pull --yes --environment=preview
npm run migrate
npm run check
vercel deploy
```

Validate the preview URL, then promote the exact tested build:

```bash
vercel promote <preview-url>
```

Do not use `vercel --prod` for the validated preview; promotion avoids rebuilding.

## Runtime behavior

- Feedback renders locally before persistence starts.
- IndexedDB retains immutable attempts until metadata and all artifacts synchronize.
- `attempt_id` is the idempotency key.
- The server assigns `demo-learner-blueorigin`; the browser cannot choose a learner ID.
- Raw audio is never persisted.
- Screenshot, transcript, and replay artifacts expire after 180 days through the configured cron.
- Open Notebook is the live source catalog for artifact authoring. When it is unavailable, the Studio shows an unavailable state and does not substitute cached or synthetic sources.
- The Library also exposes a static catalog of official Texas, Michigan, and Arizona agency URLs. These are discovery metadata only; the source must be explicitly imported into Open Notebook before review or artifact creation.
- OpenAI source questions, briefs, edits, and template population use only selected/expanded blocks or the approved brief.
- Vercel forwards publication jobs to `ARTIFACT_WORKER_URL`; it does not fabricate render files when the worker is absent.
