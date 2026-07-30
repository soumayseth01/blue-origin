const { chromium } = require("playwright");
const fs = require("node:fs");

(async () => {
  const output = process.env.QA_OUTPUT || "/tmp/blueorigin-hume-start.json";
  const scenarioIndex = Number(process.env.QA_SCENARIO_INDEX || 0);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.env.QA_BASE_URL || "http://127.0.0.1:8112", { waitUntil: "networkidle" });
  const result = await page.evaluate((index) => {
    selectScenario(index);
    return { request: buildLiveHumeStartRequest(), preview: buildDemoCallerBriefPreview(getScenario()) };
  }, scenarioIndex);
  const { request, preview } = result;
  fs.writeFileSync(output, JSON.stringify(request));
  console.log(JSON.stringify({ output, scenario_id: request.scenario_id, submitted_fact_count: request.application_context.facts.length, interview_fact_count: request.application_context.interview_facts.length, route_id: request.contact_sequence.route_id, caller_brief_version: request.caller_brief.version, caller_brief_size_bytes: preview.validation.size_bytes, caller_brief_fact_count: preview.validation.fact_count, caller_brief_valid: preview.validation.valid }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
