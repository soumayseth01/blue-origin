ALTER TABLE notebooks
  ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'setup',
  ADD COLUMN IF NOT EXISTS artifact_projects jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS artifact_releases jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notebook_assets jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE notebooks DROP CONSTRAINT IF EXISTS notebooks_workflow_stage_check;
ALTER TABLE notebooks ADD CONSTRAINT notebooks_workflow_stage_check CHECK (workflow_stage IN (
  'setup','empty','sources','summary','brief','studio','generating','outputs','release','published'
));
