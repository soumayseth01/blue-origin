import pptxgen from "/Users/soumayseth/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs/dist/pptxgen.es.js";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Agent Ramp";
pptx.subject = "QC platform concept and initial people requirements";
pptx.title = "QC Platform — Engineering Team Feedback";
pptx.company = "Agent Ramp";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  lang: "en-US",
};
pptx.defineSlideMaster({
  title: "FEEDBACK",
  background: { color: "FFFFFF" },
  objects: [
    { text: { text: "TEAM + CAPABILITIES", options: { x: 0.52, y: 0.28, w: 3.0, h: 0.22, fontFace: "Arial", fontSize: 10.5, bold: true, color: "3F8CFF", margin: 0, charSpacing: 0.4 } } },
    { text: { text: "02", options: { x: 12.54, y: 7.08, w: 0.36, h: 0.18, fontFace: "Arial", fontSize: 8.5, color: "4E5562", margin: 0, align: "right" } } },
  ],
  slideNumber: { x: 12.54, y: 7.08, color: "FFFFFF" },
});

const C = {
  ink: "111318",
  blue: "3F8CFF",
  blueDark: "236ED8",
  blueLight: "EAF3FF",
  text: "22262D",
  muted: "5D6571",
  line: "CBD1D9",
  panel: "F4F5F7",
  white: "FFFFFF",
};

function addText(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: options.fontFace || "Arial",
    fontSize: options.fontSize || 12,
    color: options.color || C.text,
    margin: options.margin ?? 0,
    breakLine: false,
    valign: options.valign || "mid",
    ...options,
  });
}

function addRoleRow(slide, { y, role, fte, capability, fill }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.52, y, w: 8.15, h: 0.59,
    rectRadius: 0.05,
    fill: { color: fill },
    line: { color: fill },
    radius: 0.06,
  });
  addText(slide, role, 0.72, y + 0.05, 2.20, 0.48, { fontSize: 12.2, bold: true, color: C.ink });
  addText(slide, fte, 2.96, y + 0.05, 0.55, 0.48, { fontSize: 11.5, bold: true, color: C.blueDark, align: "center" });
  addText(slide, capability, 3.68, y + 0.05, 4.73, 0.48, { fontSize: 10.9, color: C.muted });
}

function addSupportCard(slide, y, role, meta, capability) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.05, y, w: 3.76, h: 0.76,
    fill: { color: C.panel },
    line: { color: C.line, width: 0.75 },
    radius: 0.07,
  });
  addText(slide, role, 9.25, y + 0.10, 3.33, 0.22, { fontSize: 11.2, bold: true, color: C.ink });
  addText(slide, meta, 9.25, y + 0.34, 1.15, 0.20, { fontSize: 8.7, bold: true, color: C.blueDark });
  addText(slide, capability, 10.34, y + 0.32, 2.24, 0.27, { fontSize: 8.7, color: C.muted, valign: "top" });
}

// Slide 1: preserve the source presentation's slide 3 exactly as rendered.
{
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addImage({
    path: "/Users/soumayseth/Documents/BlueOrigin/work/slide-assets/systems-integration-slide-3.png",
    x: 0, y: 0, w: 13.333, h: 7.5,
  });
  slide.addNotes("Source: slide 3 of snap-qc-partnership-model.pptx. This is the product and integration concept for engineering discussion.");
}

// Slide 2: role mix for feedback, excluding executive roles.
{
  const slide = pptx.addSlide("FEEDBACK");
  addText(slide, "Initial people requirements for an India-led build", 0.52, 0.62, 11.9, 0.52, {
    fontFace: "Arial", fontSize: 25.5, color: C.ink, bold: false,
  });
  addText(slide, "Working team model for review — validate the mix, seniority, availability and hiring sequence", 0.52, 1.17, 11.9, 0.30, {
    fontSize: 11.5, color: C.muted,
  });

  addText(slide, "INDIA DELIVERY CORE", 0.52, 1.66, 3.15, 0.22, { fontSize: 10.5, bold: true, color: C.muted, charSpacing: 0.35 });
  addText(slide, "ROLE", 0.72, 1.97, 2.20, 0.18, { fontSize: 8.6, bold: true, color: C.muted });
  addText(slide, "FTE", 2.96, 1.97, 0.55, 0.18, { fontSize: 8.6, bold: true, color: C.muted, align: "center" });
  addText(slide, "PRIMARY CAPABILITY", 3.68, 1.97, 4.73, 0.18, { fontSize: 8.6, bold: true, color: C.muted });

  const rows = [
    ["Engineering Lead", "1.0", "Technical design, estimation, delivery planning, team allocation and release readiness"],
    ["Full-stack Engineers", "2.0", "Application workflows, user experience, APIs and integration delivery"],
    ["AI / ML Engineer", "1.0", "AI workflows, evaluation, guardrails and model integration"],
    ["Data / Knowledge Engineer", "1.0", "Policy, document, evidence and knowledge pipelines"],
    ["QA Engineer", "1.0", "Functional, regression and automated testing"],
    ["DevOps / SRE", "0.5", "Secure deployment, observability, reliability and operational support"],
    ["Implementation Analyst", "0.5", "Customer configuration, workflow mapping and rollout support"],
  ];
  rows.forEach((r, i) => addRoleRow(slide, {
    y: 2.20 + i * 0.63,
    role: r[0], fte: r[1], capability: r[2],
    fill: i % 2 === 0 ? "F4F5F7" : "FAFAFB",
  }));

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.52, y: 6.63, w: 8.15, h: 0.43,
    fill: { color: C.blueLight }, line: { color: C.blueLight }, radius: 0.05,
  });
  addText(slide, "CORE POD", 0.72, 6.70, 1.16, 0.24, { fontSize: 9.2, bold: true, color: C.blueDark });
  addText(slide, "7.0 FTE equivalent", 1.89, 6.70, 1.50, 0.24, { fontSize: 10.7, bold: true, color: C.ink });
  addText(slide, "Add capacity only against signed backlog", 5.18, 6.70, 3.22, 0.24, { fontSize: 9.6, color: C.muted, align: "right" });

  addText(slide, "ADJACENT SUPPORT", 9.05, 1.66, 3.15, 0.22, { fontSize: 10.5, bold: true, color: C.muted, charSpacing: 0.35 });
  addSupportCard(slide, 2.04, "Production Systems Integration Engineer", "US · FRACTIONAL", "Production APIs, deployment and customer technical coordination");
  addSupportCard(slide, 2.90, "Program & Delivery Manager", "US · FRACTIONAL", "Delivery governance, financial tracking and escalation");
  addSupportCard(slide, 3.76, "Customer Success / FDE", "US · GO-LIVE", "Customer support, renewal and expansion");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.05, y: 4.82, w: 3.76, h: 2.24,
    fill: { color: C.blueLight }, line: { color: C.blue, width: 1.0 }, radius: 0.08,
  });
  addText(slide, "FEEDBACK NEEDED", 9.26, 5.03, 3.30, 0.22, { fontSize: 10.6, bold: true, color: C.blueDark, charSpacing: 0.35 });
  const questions = [
    "Is the role mix and seniority right?",
    "Which roles can initially be combined?",
    "Who is available, and how quickly?",
    "What should be contract vs full-time?",
  ];
  questions.forEach((q, i) => {
    slide.addShape(pptx.ShapeType.ellipse, { x: 9.28, y: 5.46 + i * 0.37, w: 0.12, h: 0.12, fill: { color: C.blue }, line: { color: C.blue } });
    addText(slide, q, 9.50, 5.38 + i * 0.37, 3.02, 0.30, { fontSize: 10.1, color: C.text });
  });

  slide.addNotes("Discussion goal: confirm the initial India delivery pod, identify available people, and recommend role combinations or sequencing. Executive roles are outside this staffing discussion.");
}

await pptx.writeFile({ fileName: "/Users/soumayseth/Documents/BlueOrigin/QC-platform-engineering-team-feedback.pptx" });
