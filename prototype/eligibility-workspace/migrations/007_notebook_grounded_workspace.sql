ALTER TABLE notebooks
  ADD COLUMN IF NOT EXISTS source_summary jsonb NOT NULL DEFAULT '{"status":"idle","text":"","citations":[],"source_signature":"","generated_at":null,"error":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_brief jsonb NOT NULL DEFAULT '{"status":"draft","version":0,"points":[],"source_signature":"","finalized_at":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_output text,
  ADD COLUMN IF NOT EXISTS chat_messages jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE notebooks DROP CONSTRAINT IF EXISTS notebooks_selected_output_check;
ALTER TABLE notebooks ADD CONSTRAINT notebooks_selected_output_check
  CHECK (selected_output IS NULL OR selected_output IN ('microlearning','video','quiz','job_aid','presentation'));
