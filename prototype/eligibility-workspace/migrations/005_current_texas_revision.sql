UPDATE library_sources
SET source_status = 'retired', updated_at = now()
WHERE source_id = 'web:tx-bulletin-24-11';

INSERT INTO library_sources (
  source_id,title,source_kind,document_type,jurisdiction,owner_name,programs,format_label,effective_label,
  source_status,extraction_status,permission_status,access_scope,source_url,description,added_by
) VALUES (
  'web:tx-mepd-revision-26-2',
  'MEPD Handbook Revision 26-2',
  'official_web',
  'policy_bulletin',
  'Texas',
  'Texas Health and Human Services',
  ARRAY['Medicaid'],
  'Web revision notice',
  'June 1, 2026',
  'active',
  'not_started',
  'granted',
  'organization',
  'https://fhb.hhs.texas.gov/handbooks/medicaid-elderly-people-disabilities-handbook/26-2-june-quarterly-revision',
  'Current quarterly revision notice for the Medicaid for the Elderly and People with Disabilities Handbook, including incorporated 2026 policy bulletins and revised eligibility reference sections.',
  'official_catalog'
)
ON CONFLICT (source_id) DO UPDATE SET
  title=EXCLUDED.title,
  document_type=EXCLUDED.document_type,
  jurisdiction=EXCLUDED.jurisdiction,
  owner_name=EXCLUDED.owner_name,
  programs=EXCLUDED.programs,
  format_label=EXCLUDED.format_label,
  effective_label=EXCLUDED.effective_label,
  source_status='active',
  permission_status=EXCLUDED.permission_status,
  access_scope=EXCLUDED.access_scope,
  source_url=EXCLUDED.source_url,
  description=EXCLUDED.description,
  updated_at=now();
