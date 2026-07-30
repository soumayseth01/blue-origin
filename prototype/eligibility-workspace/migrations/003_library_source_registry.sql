CREATE TABLE IF NOT EXISTS library_sources (
  source_id text PRIMARY KEY,
  title text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('official_web','upload','pasted_text','open_notebook')),
  document_type text NOT NULL DEFAULT 'other',
  jurisdiction text NOT NULL DEFAULT 'Organization',
  owner_name text NOT NULL,
  programs text[] NOT NULL DEFAULT '{}'::text[],
  format_label text NOT NULL DEFAULT 'Document',
  effective_label text,
  source_status text NOT NULL DEFAULT 'registered' CHECK (source_status IN ('registered','active','retired','failed')),
  extraction_status text NOT NULL DEFAULT 'not_started' CHECK (extraction_status IN ('not_started','queued','processing','complete','partial','failed','needs_review','verified')),
  permission_status text NOT NULL DEFAULT 'unknown' CHECK (permission_status IN ('granted','unknown','restricted')),
  access_scope text NOT NULL DEFAULT 'private' CHECK (access_scope IN ('organization','team','private')),
  team_id text,
  source_url text,
  description text NOT NULL DEFAULT '',
  open_notebook_source_id text,
  checksum_sha256 text,
  added_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (access_scope <> 'team' OR team_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS library_sources_status_idx ON library_sources (source_status, extraction_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS library_sources_jurisdiction_idx ON library_sources (jurisdiction, document_type);

ALTER TABLE notebook_sources ADD COLUMN IF NOT EXISTS registry_source_id text REFERENCES library_sources(source_id);
CREATE INDEX IF NOT EXISTS notebook_sources_registry_idx ON notebook_sources (registry_source_id);

WITH catalog AS (
  SELECT value AS item FROM jsonb_array_elements($catalog$[
    {"id":"web:tx-texas-works-handbook","title":"Texas Works Handbook","jurisdiction":"Texas","owner":"Texas Health and Human Services","type":"policy_manual","programs":["SNAP","TANF","Medicaid"],"format":"Web manual","effective":"Current web edition","url":"https://fhb.hhs.texas.gov/handbooks/texas-works-handbook","description":"Policies and procedures used to determine eligibility for SNAP, TANF, and medical programs for families and children."},
    {"id":"web:tx-mepd-handbook","title":"Medicaid for the Elderly and People with Disabilities Handbook","jurisdiction":"Texas","owner":"Texas Health and Human Services","type":"policy_manual","programs":["Medicaid"],"format":"Web manual","effective":"Current web edition","url":"https://fhb.hhs.texas.gov/handbooks/medicaid-elderly-people-disabilities-handbook","description":"Eligibility policy and procedures for Medicaid programs serving older adults and people with disabilities."},
    {"id":"web:tx-b6500-denials","title":"B-6500 — Denials and Missing Information Procedures","jurisdiction":"Texas","owner":"Texas Health and Human Services","type":"sop_procedure","programs":["Medicaid"],"format":"Web procedure","effective":"Current web edition","url":"https://fhb.hhs.texas.gov/handbooks/medicaid-elderly-people-disabilities-handbook/b-6500-denials","description":"Operational procedure for verification requests, pending periods, redeterminations, and application denials."},
    {"id":"web:tx-h1200-application","title":"Form H1200 — Application for Assistance","jurisdiction":"Texas","owner":"Texas Health and Human Services","type":"application_form","programs":["Medicaid"],"format":"Form / PDF","effective":"Current form edition","url":"https://fhb.hhs.texas.gov/forms/1000-1999/form-h1200-application-assistance-your-texas-benefits","description":"Application source used for Medicaid for older adults, people with disabilities, and related assistance."},
    {"id":"web:tx-bulletin-24-11","title":"MEPD and Texas Works Bulletin 24-11","jurisdiction":"Texas","owner":"Texas Health and Human Services","type":"policy_bulletin","programs":["Medicaid"],"format":"PDF bulletin","effective":"August 12, 2024","url":"https://www.hhs.texas.gov/sites/default/files/documents/mepd-and-tw-bulletin-24-11.pdf","description":"Staff bulletin addressing continuous eligibility for children and Medicare Savings Program policy."},
    {"id":"web:mi-bridges-manuals","title":"Michigan Bridges Policy Manuals","jurisdiction":"Michigan","owner":"Michigan Department of Health and Human Services","type":"policy_manual","programs":["SNAP","TANF","Medicaid"],"format":"Web manual collection","effective":"Current web edition","url":"https://mdhhs-pres-prod.michigan.gov/OLMWeb/exF/html/index.html","description":"Bridges Eligibility Manual, Bridges Administrative Manual, reference tables, schedules, glossaries, and update bulletins."},
    {"id":"web:mi-assistance-application","title":"MDHHS-1171 — Assistance Application","jurisdiction":"Michigan","owner":"Michigan Department of Health and Human Services","type":"application_form","programs":["SNAP","TANF","Medicaid"],"format":"Application packet","effective":"Current form edition","url":"https://www.michigan.gov/mdhhs/assistance-programs/emergency-relief/forms-pubs/forms/assistance-application-mdhhs-1171","description":"Application packet with information booklet, filing form, and program-specific supplements."},
    {"id":"web:mi-client-questions-qrg","title":"Quick Reference Guide — Answering Common Client Questions","jurisdiction":"Michigan","owner":"Michigan Department of Health and Human Services","type":"job_aid","programs":["Integrated eligibility"],"format":"PDF quick reference","effective":"Current posted edition","url":"https://www.michigan.gov/mdhhs/-/media/Project/Websites/mdhhs/Doing-Business-with-MDHHS/MI-Bridges-Partners/Community_Partner-Answering_Clients_Questions.pdf","description":"A client-question quick reference for MI Bridges community partners."},
    {"id":"web:mi-policy-letters-forms","title":"Medicaid Policy, Letters and Forms","jurisdiction":"Michigan","owner":"Michigan Department of Health and Human Services","type":"policy_bulletin","programs":["Medicaid"],"format":"Web collection","effective":"Continuously updated","url":"https://www.michigan.gov/mdhhs/assistance-programs/medicaid/portalhome/medicaid-providers/policyforms/policy-letters-and-forms","description":"Current and proposed policy bulletins, numbered letters, eligibility policy manuals, and forms."},
    {"id":"web:mi-continuous-eligibility-bulletin","title":"MMP 23-73 — Continuous Eligibility for Children","jurisdiction":"Michigan","owner":"Michigan Department of Health and Human Services","type":"policy_bulletin","programs":["Medicaid","CHIP"],"format":"PDF bulletin","effective":"January 1, 2024","url":"https://www.michigan.gov/mdhhs/-/media/Project/Websites/mdhhs/Assistance-Programs/Medicaid-BPHASA/Public-Comment/2347-Eligibility-P.pdf","description":"Policy-change bulletin for continuous eligibility for Medicaid and MIChild beneficiaries under age 19."},
    {"id":"web:az-cnap-manual","title":"Cash and Nutrition Assistance Policy Manual","jurisdiction":"Arizona","owner":"Arizona Department of Economic Security","type":"policy_manual","programs":["SNAP","TANF"],"format":"Web manual","effective":"Current web edition","url":"https://dbmefaapolicy.azdes.gov/How_To_Use_This_Manual/Customer_Info.html","description":"Family Assistance Administration policy for Arizona Cash and Nutrition Assistance programs."},
    {"id":"web:az-ahcccs-epm","title":"AHCCCS Medical Assistance Eligibility Policy Manual","jurisdiction":"Arizona","owner":"Arizona Health Care Cost Containment System","type":"policy_manual","programs":["Medicaid","CHIP"],"format":"Web manual","effective":"Current web edition","url":"https://epm.azahcccs.gov/EligibilityPolicyManual/Policy/Chapter_100_AHCCCS_Medical_Assistance/Introduction.htm","description":"Eligibility policy, definitions, and legal authorities for Arizona medical assistance programs."},
    {"id":"web:az-faa-0001a","title":"FAA-0001A — Application for Benefits","jurisdiction":"Arizona","owner":"Arizona DES and AHCCCS","type":"application_form","programs":["SNAP","TANF","Medicaid"],"format":"PDF application","effective":"February 2026","url":"https://des.az.gov/sites/default/files/dl/FAA-0001A.pdf","description":"Integrated application for Nutrition Assistance, Cash Assistance, and AHCCCS medical coverage."},
    {"id":"web:az-faa-0412a","title":"FAA-0412A — Change Report","jurisdiction":"Arizona","owner":"Arizona Department of Economic Security","type":"application_form","programs":["SNAP","TANF","Medicaid"],"format":"PDF form","effective":"April 2026","url":"https://des.az.gov/sites/default/files/dl/FAA-0412A.pdf","description":"Household change-report form with program-specific reporting guidance."},
    {"id":"web:az-how-to-apply","title":"How to Apply for Nutrition Assistance","jurisdiction":"Arizona","owner":"Arizona Department of Economic Security","type":"training_outreach","programs":["SNAP"],"format":"Web guide and video","effective":"Current web edition","url":"https://des.az.gov/node/10274","description":"Client-facing application guidance, preparation information, and how-to videos, including Spanish and ASL resources."}
  ]$catalog$::jsonb)
)
INSERT INTO library_sources (source_id,title,source_kind,document_type,jurisdiction,owner_name,programs,format_label,effective_label,source_status,extraction_status,permission_status,access_scope,source_url,description,added_by)
SELECT item->>'id',item->>'title','official_web',item->>'type',item->>'jurisdiction',item->>'owner',ARRAY(SELECT jsonb_array_elements_text(item->'programs')),item->>'format',item->>'effective','active','not_started','granted','organization',item->>'url',item->>'description','official_catalog'
FROM catalog
ON CONFLICT (source_id) DO UPDATE SET title=EXCLUDED.title,document_type=EXCLUDED.document_type,jurisdiction=EXCLUDED.jurisdiction,owner_name=EXCLUDED.owner_name,programs=EXCLUDED.programs,format_label=EXCLUDED.format_label,effective_label=EXCLUDED.effective_label,source_url=EXCLUDED.source_url,description=EXCLUDED.description,updated_at=now();
