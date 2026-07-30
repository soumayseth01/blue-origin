CREATE TABLE IF NOT EXISTS notebooks (
  notebook_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  purpose text NOT NULL,
  programs text[] NOT NULL DEFAULT '{}'::text[],
  audience text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  owner_id text NOT NULL,
  owner_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published','superseded','archived')),
  access_scope text NOT NULL DEFAULT 'private' CHECK (access_scope IN ('organization','team','private')),
  team_id text,
  favorite boolean NOT NULL DEFAULT false,
  review_due_at timestamptz,
  published_version integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (access_scope <> 'team' OR team_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS notebook_sources (
  notebook_id uuid NOT NULL REFERENCES notebooks(notebook_id) ON DELETE CASCADE,
  source_id text NOT NULL,
  source_title text NOT NULL,
  source_type text NOT NULL DEFAULT 'Source',
  extraction_status text NOT NULL DEFAULT 'not_reviewed',
  permission_status text NOT NULL DEFAULT 'unknown' CHECK (permission_status IN ('granted','unknown','restricted')),
  source_access_scope text NOT NULL DEFAULT 'private' CHECK (source_access_scope IN ('organization','team','private')),
  source_team_id text,
  added_by text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notebook_id, source_id)
);

CREATE TABLE IF NOT EXISTS notebook_versions (
  notebook_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebooks(notebook_id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  checksum_sha256 text NOT NULL,
  published_by text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  review_due_at timestamptz NOT NULL,
  UNIQUE (notebook_id, version_number)
);

CREATE TABLE IF NOT EXISTS notebook_access (
  notebook_id uuid NOT NULL REFERENCES notebooks(notebook_id) ON DELETE CASCADE,
  principal_type text NOT NULL CHECK (principal_type IN ('user','team','organization')),
  principal_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notebook_id, principal_type, principal_id)
);

CREATE TABLE IF NOT EXISTS notebook_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebooks(notebook_id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notebooks_status_updated_idx ON notebooks (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS notebooks_published_idx ON notebooks (published_at DESC) WHERE published_version > 0;
CREATE INDEX IF NOT EXISTS notebook_events_notebook_created_idx ON notebook_events (notebook_id, created_at DESC);

