import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);

const paths = [
  ["path-foundations", "Integrated Eligibility Foundations", "Build the shared foundation for accurate, human-centered eligibility work.", "Explain the application flow, construct households, and conduct effective client interviews.", ["Integrated eligibility"], "slate", 1],
  ["path-programs", "Program Eligibility Essentials", "Understand the purpose and core eligibility pathways for the major assistance programs.", "Recognize program-specific eligibility pathways and route applications correctly.", ["SNAP", "Medicaid", "TANF"], "blue", 2],
  ["path-determination", "Eligibility Determination", "Apply financial and non-financial rules with consistent evidence and calculation practices.", "Evaluate income, resources, residency, citizenship, student, and identity requirements.", ["SNAP", "Medicaid", "TANF"], "orange", 3],
  ["path-maintenance", "Verification & Case Maintenance", "Resolve evidence, communicate decisions, and keep cases accurate over time.", "Request only necessary verification and complete notices, renewals, and maintenance work.", ["Operations", "Quality"], "green", 4],
  ["path-practice", "Practice Lab", "Turn knowledge into confident action through realistic eligibility simulations.", "Practice complete client interactions and receive evidence-linked performance feedback.", ["Simulation"], "violet", 5],
];

const modules = [
  ["mission-flow", "path-foundations", "Mission and Application Flow", "Follow an application from first contact through authorization.", ["Integrated eligibility"], "Beginner", 14],
  ["household-composition", "path-foundations", "Household Composition", "Build program groups and relationships from client statements.", ["SNAP", "Medicaid", "TANF"], "Beginner", 18],
  ["client-interview", "path-foundations", "Interview and Client Experience", "Use clear questions, active listening, and respectful closure.", ["Client experience"], "Beginner", 16],
  ["snap-essentials", "path-programs", "SNAP Essentials", "Recognize the core SNAP application and eligibility sequence.", ["SNAP"], "Intermediate", 20],
  ["medicaid-pathways", "path-programs", "Medicaid Pathways", "Distinguish MAGI and required non-MAGI screening pathways.", ["Medicaid"], "Intermediate", 22],
  ["tanf-basics", "path-programs", "TANF Basics", "Understand household, cooperation, and work-related considerations.", ["TANF"], "Intermediate", 18],
  ["financial-eligibility", "path-determination", "Income, Resources, and Deductions", "Determine what counts and document the calculation.", ["SNAP", "TANF"], "Intermediate", 28],
  ["nonfinancial-eligibility", "path-determination", "Non-Financial Eligibility", "Evaluate residency, identity, citizenship, student, and SSN requirements.", ["SNAP", "Medicaid"], "Intermediate", 24],
  ["verification-evidence", "path-maintenance", "Verification and Evidence", "Request, review, and document only the evidence needed for a supported decision.", ["Operations", "Quality"], "Intermediate", 26],
  ["case-maintenance", "path-maintenance", "Notices, Renewals, and Case Maintenance", "Communicate decisions and keep active cases accurate.", ["Operations"], "Intermediate", 22],
  ["combined-initial-practice", "path-practice", "Combined Initial Application Practice", "Complete a realistic Medicaid, SNAP, and TANF application with feedback.", ["Simulation", "SNAP", "Medicaid", "TANF"], "Advanced", 32],
  ["change-reporting-practice", "path-practice", "Change-Reporting Practice", "Process a household and earned-income change across an active case.", ["Simulation"], "Advanced", 25],
];

const questions = [
  { prompt: "What should happen before validating reported income?", options: ["Review supporting evidence", "Authorize every program", "Issue a notice"], answer: 0, explanation: "Current evidence should support the value before validation." },
  { prompt: "Can AI override a deterministic eligibility rule?", options: ["Yes", "Only in practice", "No"], answer: 2, explanation: "Formal correctness remains deterministic." },
  { prompt: "What belongs in case documentation?", options: ["The evidence and rationale", "Only the outcome", "Unrelated policy"], answer: 0, explanation: "The evidence trail and rationale make the action auditable." },
];

function blocksFor(moduleId, title) {
  if (moduleId === "verification-evidence") return [
    { id: `${moduleId}-video`, type: "video", title: "Verification that moves the case forward", required: true, minutes: 3, source: "Blue Origin Studio · grounded explainer", duration: 4, url: "/assets/lighthouse-verification.mp4", captionsUrl: "/assets/lighthouse-verification.vtt", posterLabel: "Evidence → decision → documentation" },
    { id: `${moduleId}-pdf`, type: "pdf", title: "Verification field guide", required: true, minutes: 6, url: "/AZ-How-to-Apply-Nutrition-Assistance.pdf", source: "Approved policy reference" },
    { id: `${moduleId}-aid`, type: "download", title: "Change report job aid", required: false, minutes: 2, url: "/FAA-0412A.pdf", source: "Demonstration job aid" },
    { id: `${moduleId}-quiz`, type: "quiz", title: "Verification knowledge check", required: true, minutes: 8, questions },
  ];
  if (moduleId === "combined-initial-practice") return [
    { id: `${moduleId}-brief`, type: "text", title: "Practice briefing", required: true, minutes: 4, content: "Maya Ortiz is applying for Medicaid, SNAP, and TANF after her work hours changed." },
    { id: `${moduleId}-simulation`, type: "simulation", title: "Combined initial application", required: true, minutes: 22, scenarioIndex: 0, source: "Frozen package BO-001 · v0.1" },
    { id: `${moduleId}-debrief`, type: "text", title: "Reflect and debrief", required: true, minutes: 3, content: "Compare the sequence you used with the feedback evidence." },
    { id: `${moduleId}-check`, type: "quiz", title: "Practice knowledge check", required: true, minutes: 5, questions },
  ];
  return [
    { id: `${moduleId}-intro`, type: "text", title: `Welcome to ${title}`, required: true, minutes: 4, content: "Connect approved policy knowledge to the decisions eligibility workers make every day." },
    { id: `${moduleId}-resource`, type: "pdf", title: "Policy reference and field guide", required: true, minutes: 5, url: "/AZ-How-to-Apply-Nutrition-Assistance.pdf", source: "Approved demonstration reference" },
    { id: `${moduleId}-check`, type: "quiz", title: "Knowledge check", required: true, minutes: 5, questions },
  ];
}

const staticAssetIds = new Map();
for (const asset of [
  { title: "Verification that moves the case forward", kind: "video", ref: "lighthouse-verification-video", file: "lighthouse-verification.mp4", mime: "video/mp4", pathname: "/assets/lighthouse-verification.mp4" },
  { title: "Nutrition Assistance application reference", kind: "pdf", ref: "nutrition-assistance-reference", file: "AZ-How-to-Apply-Nutrition-Assistance.pdf", mime: "application/pdf", pathname: "/AZ-How-to-Apply-Nutrition-Assistance.pdf" },
  { title: "Change report job aid", kind: "download", ref: "change-report-job-aid", file: "FAA-0412A.pdf", mime: "application/pdf", pathname: "/FAA-0412A.pdf" },
]) {
  const [row] = await sql`INSERT INTO lighthouse_assets (title,kind,source,source_ref,file_name,mime_type,pathname,created_by) VALUES (${asset.title},${asset.kind},'static_seed',${asset.ref},${asset.file},${asset.mime},${asset.pathname},'lighthouse-seed') ON CONFLICT (source,source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET title=EXCLUDED.title,kind=EXCLUDED.kind,file_name=EXCLUDED.file_name,mime_type=EXCLUDED.mime_type,pathname=EXCLUDED.pathname RETURNING asset_id`;
  staticAssetIds.set(asset.pathname, row.asset_id);
}

for (const [pathId, title, summary, outcome, programs, accent, position] of paths) {
  await sql`INSERT INTO lighthouse_paths (path_id,title,summary,outcome,programs,accent,position) VALUES (${pathId},${title},${summary},${outcome},${programs},${accent},${position}) ON CONFLICT (path_id) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,outcome=EXCLUDED.outcome,programs=EXCLUDED.programs,accent=EXCLUDED.accent,position=EXCLUDED.position,updated_at=now()`;
}

for (const [index, [moduleId, pathId, title, summary, programs, difficulty, minutes]] of modules.entries()) {
  const accent = paths.find((path) => path[0] === pathId)?.[5] || "slate";
  const blocks = blocksFor(moduleId, title).map((block) => ({ ...block, assetId: staticAssetIds.get(block.url) || null }));
  const snapshot = { id: moduleId, pathId, title, summary, description: `${summary} Use approved sources, structured examples, and immediate feedback to build confidence.`, objectives: [`Explain the core decisions in ${title.toLowerCase()}.`, "Apply the workflow to a realistic case example.", "Document the rationale using approved evidence."], programs, audience: "Eligibility workers", difficulty, minutes, accent, order: index + 1, status: "published", version: 1, blocks };
  await sql`INSERT INTO lighthouse_modules (module_id,path_id,title,summary,description,objectives,programs,audience,difficulty,estimated_minutes,accent,position,status,published_version,published_snapshot,created_by,published_at) VALUES (${moduleId},${pathId},${title},${summary},${snapshot.description},${JSON.stringify(snapshot.objectives)}::jsonb,${programs},'Eligibility workers',${difficulty},${minutes},${accent},${index + 1},'published',1,${JSON.stringify(snapshot)}::jsonb,'lighthouse-seed',now()) ON CONFLICT (module_id) DO UPDATE SET path_id=EXCLUDED.path_id,title=EXCLUDED.title,summary=EXCLUDED.summary,description=EXCLUDED.description,objectives=EXCLUDED.objectives,programs=EXCLUDED.programs,audience=EXCLUDED.audience,difficulty=EXCLUDED.difficulty,estimated_minutes=EXCLUDED.estimated_minutes,accent=EXCLUDED.accent,position=EXCLUDED.position,status='published',published_snapshot=EXCLUDED.published_snapshot,updated_at=now()`;
  await sql`DELETE FROM lighthouse_blocks WHERE module_id=${moduleId}`;
  for (const [position, block] of blocks.entries()) {
    const { id, type, title: blockTitle, required, minutes: blockMinutes, assetId, ...content } = block;
    await sql`INSERT INTO lighthouse_blocks (block_id,module_id,position,block_type,title,required,estimated_minutes,content,asset_id,studio_ref) VALUES (${id},${moduleId},${position},${type},${blockTitle},${required},${blockMinutes},${JSON.stringify(content)}::jsonb,${assetId},${content.source || null})`;
  }
}

for (const moduleId of ["verification-evidence", "combined-initial-practice"]) await sql`INSERT INTO lighthouse_enrollments (learner_id,module_id,status,assigned_by,due_at) VALUES ('demo-learner-blueorigin',${moduleId},'assigned','lighthouse-seed',now()+interval '14 days') ON CONFLICT DO NOTHING`;

console.log(`Seeded ${paths.length} Lighthouse paths and ${modules.length} modules.`);
