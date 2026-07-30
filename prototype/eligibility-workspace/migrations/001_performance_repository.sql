CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS learning_attempts (
  attempt_id text PRIMARY KEY,
  repository_attempt_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  learner_id text NOT NULL,
  scenario_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('practice','assessment')),
  completion_state text NOT NULL,
  score integer,
  processing_score integer,
  interview_score integer,
  proficiency text,
  critical_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  simulation_package_id text,
  simulation_package_version text,
  rubric_version text,
  duration_seconds integer NOT NULL DEFAULT 0,
  attempt_payload jsonb NOT NULL,
  sync_status text NOT NULL DEFAULT 'metadata_saved',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS criterion_results (
  attempt_id text NOT NULL REFERENCES learning_attempts(attempt_id) ON DELETE CASCADE,
  criterion_id text NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  score numeric NOT NULL,
  weight numeric NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (attempt_id, criterion_id)
);

CREATE TABLE IF NOT EXISTS skill_observations (
  attempt_id text NOT NULL REFERENCES learning_attempts(attempt_id) ON DELETE CASCADE,
  skill_id text NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  proficiency_impact numeric NOT NULL,
  severity text NOT NULL,
  confidence numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attempt_id, skill_id)
);

CREATE TABLE IF NOT EXISTS attempt_events (
  attempt_id text NOT NULL REFERENCES learning_attempts(attempt_id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_type text,
  event_time text,
  event_payload jsonb NOT NULL,
  PRIMARY KEY (attempt_id, event_id)
);

CREATE TABLE IF NOT EXISTS attempt_artifacts (
  artifact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id text NOT NULL REFERENCES learning_attempts(attempt_id) ON DELETE CASCADE,
  artifact_type text NOT NULL,
  pathname text NOT NULL UNIQUE,
  blob_url text NOT NULL,
  mime_type text NOT NULL,
  checksum_sha256 text NOT NULL,
  byte_size bigint NOT NULL,
  retention_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learner_skill_profiles (
  learner_id text NOT NULL,
  skill_id text NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  proficiency numeric NOT NULL,
  observation_count integer NOT NULL,
  trend text NOT NULL DEFAULT 'steady',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, skill_id)
);

CREATE TABLE IF NOT EXISTS practice_recommendations (
  recommendation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id text NOT NULL,
  skill_id text NOT NULL,
  scenario_id text NOT NULL,
  caller_profile_id text NOT NULL,
  rationale text NOT NULL,
  priority integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_attempts_learner_created_idx ON learning_attempts (learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS attempt_artifacts_retention_idx ON attempt_artifacts (status, retention_date);
