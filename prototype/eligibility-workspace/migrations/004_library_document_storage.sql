ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS storage_status text NOT NULL DEFAULT 'not_imported';
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS storage_error text;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS stored_from_url text;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS byte_size bigint;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS content_bytes bytea;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS content_text text;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS fetched_at timestamptz;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS http_etag text;
ALTER TABLE library_sources ADD COLUMN IF NOT EXISTS http_last_modified text;

CREATE INDEX IF NOT EXISTS library_sources_storage_idx ON library_sources (storage_status, fetched_at DESC);
