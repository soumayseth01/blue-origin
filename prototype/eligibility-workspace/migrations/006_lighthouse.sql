CREATE TABLE IF NOT EXISTS lighthouse_paths (
  path_id text PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL,
  outcome text NOT NULL DEFAULT '',
  programs text[] NOT NULL DEFAULT '{}'::text[],
  accent text NOT NULL DEFAULT 'slate',
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lighthouse_modules (
  module_id text PRIMARY KEY,
  path_id text NOT NULL REFERENCES lighthouse_paths(path_id),
  title text NOT NULL,
  summary text NOT NULL,
  description text NOT NULL DEFAULT '',
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  programs text[] NOT NULL DEFAULT '{}'::text[],
  audience text NOT NULL DEFAULT 'Eligibility workers',
  difficulty text NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  estimated_minutes integer NOT NULL DEFAULT 15 CHECK (estimated_minutes > 0),
  accent text NOT NULL DEFAULT 'slate',
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_version integer NOT NULL DEFAULT 0,
  published_snapshot jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS lighthouse_assets (
  asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('video','pdf','download','image','embed')),
  source text NOT NULL CHECK (source IN ('upload','studio_release','static_seed')),
  source_ref text,
  file_name text,
  mime_type text,
  byte_size bigint,
  blob_url text,
  pathname text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lighthouse_blocks (
  block_id text PRIMARY KEY,
  module_id text NOT NULL REFERENCES lighthouse_modules(module_id) ON DELETE CASCADE,
  position integer NOT NULL,
  block_type text NOT NULL CHECK (block_type IN ('video','pdf','download','text','quiz','simulation','link','embed')),
  title text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  estimated_minutes integer NOT NULL DEFAULT 3,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  asset_id uuid REFERENCES lighthouse_assets(asset_id),
  studio_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, position)
);

CREATE TABLE IF NOT EXISTS lighthouse_enrollments (
  learner_id text NOT NULL,
  module_id text NOT NULL REFERENCES lighthouse_modules(module_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed')),
  due_at timestamptz,
  assigned_by text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  PRIMARY KEY (learner_id, module_id)
);

CREATE TABLE IF NOT EXISTS lighthouse_progress (
  learner_id text NOT NULL,
  module_id text NOT NULL REFERENCES lighthouse_modules(module_id) ON DELETE CASCADE,
  block_id text NOT NULL REFERENCES lighthouse_blocks(block_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  position_seconds integer NOT NULL DEFAULT 0,
  quiz_score integer CHECK (quiz_score BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (learner_id, module_id, block_id)
);

CREATE TABLE IF NOT EXISTS lighthouse_quiz_attempts (
  attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id text NOT NULL,
  module_id text NOT NULL REFERENCES lighthouse_modules(module_id) ON DELETE CASCADE,
  block_id text NOT NULL REFERENCES lighthouse_blocks(block_id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lighthouse_modules_catalog_idx ON lighthouse_modules (status, path_id, position);
CREATE INDEX IF NOT EXISTS lighthouse_blocks_module_idx ON lighthouse_blocks (module_id, position);
CREATE INDEX IF NOT EXISTS lighthouse_enrollments_learner_idx ON lighthouse_enrollments (learner_id, status);
CREATE INDEX IF NOT EXISTS lighthouse_progress_learner_idx ON lighthouse_progress (learner_id, module_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS lighthouse_assets_blob_url_uidx ON lighthouse_assets (blob_url) WHERE blob_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lighthouse_assets_source_ref_uidx ON lighthouse_assets (source, source_ref) WHERE source_ref IS NOT NULL;
