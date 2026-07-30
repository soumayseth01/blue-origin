import { db, demoLearnerId } from "./db.js";

const clean = (value) => JSON.parse(JSON.stringify(value ?? null));
const criterionRows = (attempt) => [
  ...(attempt.post_call_evaluation?.processing_criteria || []).map((item) => ({ ...item, category: "processing", id: item.criterion || item.id || item.label })),
  ...(attempt.post_call_evaluation?.interview_observations || []).map((item) => ({ ...item, category: "interview", id: item.criterion || item.id || item.label })),
];

export async function finalizeAttempt(attempt) {
  if (!attempt || typeof attempt !== "object") throw Object.assign(new Error("Attempt payload is required"), { statusCode: 400 });
  if (!attempt.attempt_id || !attempt.scenario_id || !attempt.mode) throw Object.assign(new Error("attempt_id, scenario_id, and mode are required"), { statusCode: 400 });
  const payloadBytes = Buffer.byteLength(JSON.stringify(attempt));
  if (payloadBytes > 1_500_000) throw Object.assign(new Error("Attempt metadata exceeds 1.5 MB"), { statusCode: 413 });
  const sql = db();
  const learner = demoLearnerId();
  const evaluation = attempt.post_call_evaluation || {};
  const completion = attempt.attempt_exit?.completion_state || "incomplete";
  const [stored] = await sql`
    INSERT INTO learning_attempts (attempt_id, learner_id, scenario_id, mode, completion_state, score, processing_score, interview_score, proficiency, critical_errors, simulation_package_id, simulation_package_version, rubric_version, duration_seconds, attempt_payload, completed_at)
    VALUES (${attempt.attempt_id}, ${learner}, ${attempt.scenario_id}, ${attempt.mode}, ${completion}, ${attempt.score ?? null}, ${attempt.processing_score ?? null}, ${attempt.interview_score ?? null}, ${evaluation.proficiency || null}, ${JSON.stringify(evaluation.critical_errors || [])}::jsonb, ${attempt.simulation_package_id || null}, ${attempt.simulation_package_version || null}, ${evaluation.rubric_version || attempt.rubric?.version || null}, ${attempt.duration_seconds || 0}, ${JSON.stringify(clean(attempt))}::jsonb, ${attempt.attempt_exit?.timestamp || new Date().toISOString()})
    ON CONFLICT (attempt_id) DO UPDATE SET updated_at = now()
    RETURNING repository_attempt_id, sync_status`;
  for (const item of criterionRows(attempt)) {
    const id = String(item.id).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const score = Number(item.score || 0); const weight = Number(item.weight || 0);
    await sql`INSERT INTO criterion_results (attempt_id, criterion_id, category, label, score, weight, evidence_refs) VALUES (${attempt.attempt_id}, ${id}, ${item.category}, ${item.label || item.criterion || id}, ${score}, ${weight}, ${JSON.stringify(item.event_ids || item.evidence || [])}::jsonb) ON CONFLICT (attempt_id, criterion_id) DO UPDATE SET score=EXCLUDED.score, weight=EXCLUDED.weight, evidence_refs=EXCLUDED.evidence_refs`;
    await sql`INSERT INTO skill_observations (attempt_id, skill_id, label, category, proficiency_impact, severity, confidence) VALUES (${attempt.attempt_id}, ${id}, ${item.label || item.criterion || id}, ${item.category}, ${weight ? score / weight * 100 : 0}, ${weight && score / weight < .5 ? "high" : weight && score / weight < .8 ? "moderate" : "strength"}, 1) ON CONFLICT (attempt_id, skill_id) DO UPDATE SET proficiency_impact=EXCLUDED.proficiency_impact, severity=EXCLUDED.severity`;
  }
  for (const event of (attempt.events || []).slice(0, 1000)) await sql`INSERT INTO attempt_events (attempt_id, event_id, event_type, event_time, event_payload) VALUES (${attempt.attempt_id}, ${event.event_id}, ${event.action || event.channel || "event"}, ${event.time || null}, ${JSON.stringify(clean(event))}::jsonb) ON CONFLICT DO NOTHING`;
  return stored;
}

export async function updateDemoProfile(attemptId) {
  const sql = db(); const learner = demoLearnerId();
  const observations = await sql`SELECT skill_id, label, category, proficiency_impact FROM skill_observations WHERE attempt_id=${attemptId}`;
  for (const item of observations) await sql`
    INSERT INTO learner_skill_profiles (learner_id, skill_id, label, category, proficiency, observation_count, trend)
    VALUES (${learner}, ${item.skill_id}, ${item.label}, ${item.category}, ${item.proficiency_impact}, 1, 'new')
    ON CONFLICT (learner_id, skill_id) DO UPDATE SET proficiency=((learner_skill_profiles.proficiency * learner_skill_profiles.observation_count) + EXCLUDED.proficiency) / (learner_skill_profiles.observation_count + 1), observation_count=learner_skill_profiles.observation_count + 1, trend=CASE WHEN EXCLUDED.proficiency > learner_skill_profiles.proficiency + 3 THEN 'improving' WHEN EXCLUDED.proficiency < learner_skill_profiles.proficiency - 3 THEN 'declining' ELSE 'steady' END, updated_at=now()`;
  await sql`DELETE FROM practice_recommendations WHERE learner_id=${learner}`;
  const gaps = await sql`SELECT skill_id, label, proficiency FROM learner_skill_profiles WHERE learner_id=${learner} ORDER BY proficiency ASC LIMIT 3`;
  let priority = 1;
  for (const gap of gaps) await sql`INSERT INTO practice_recommendations (learner_id, skill_id, scenario_id, caller_profile_id, rationale, priority) VALUES (${learner}, ${gap.skill_id}, 'BO-001', ${gap.skill_id.includes("interview") ? "benefits-guarded" : "benefits-anxious"}, ${`Practice ${gap.label} (${Math.round(gap.proficiency)}% rolling proficiency).`}, ${priority++})`;
}
