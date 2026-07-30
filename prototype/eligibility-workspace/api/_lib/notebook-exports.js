import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let pptxConstructor = null;

function loadPptxGenJS() {
  if (pptxConstructor) return pptxConstructor;
  const packageName = ["pptx", "genjs"].join("");
  const loaded = require(require.resolve(packageName));
  pptxConstructor = loaded?.default || loaded;
  return pptxConstructor;
}

const MIME = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
  srt: "application/x-subrip; charset=utf-8",
};

function safeName(value) {
  return String(value || "notebook").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "notebook";
}

function lines(value, width = 86) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const output = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width && line) { output.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) output.push(line);
  return output;
}

function srtTime(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const h = String(Math.floor(value / 3600)).padStart(2, "0");
  const m = String(Math.floor((value % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(value % 60)).padStart(2, "0");
  return `${h}:${m}:${s},000`;
}

async function renderCroppedImage(image, width = 1200, height = 675) {
  if (!image?.url?.startsWith("data:image/")) return null;
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const source = await loadImage(image.url);
  const crop = image.crop || {};
  const fit = crop.fit === "contain" ? "contain" : "cover";
  const zoom = Math.max(1, Math.min(3, Number(crop.zoom || 1)));
  const positionX = Math.max(0, Math.min(100, Number(crop.x ?? 50))) / 100;
  const positionY = Math.max(0, Math.min(100, Number(crop.y ?? 50))) / 100;
  const baseScale = fit === "contain" ? Math.min(width / source.width, height / source.height) : Math.max(width / source.width, height / source.height);
  const scale = baseScale * zoom;
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#eef3f4";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, (width - drawWidth) * positionX, (height - drawHeight) * positionY, drawWidth, drawHeight);
  return canvas.toBuffer("image/png");
}

async function jobAidDocx(notebook, project) {
  const children = [
    new Paragraph({ text: notebook.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: notebook.purpose || "", italics: true, color: "52666D" })] }),
  ];
  for (const section of project.sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
    children.push(...String(section.body || "").split("\n").filter(Boolean).map((text) => new Paragraph({ text, spacing: { after: 140 } })));
    const image = await renderCroppedImage(section.image, 1120, 630);
    if (image) children.push(new Paragraph({ children: [new ImageRun({ type: "png", data: image, transformation: { width: 560, height: 315 }, altText: { title: section.image.alt_text || section.image.title || "Supporting image", description: section.image.alt_text || "Supporting image", name: section.image.title || "Notebook image" } })] }));
    if (section.image?.caption) children.push(new Paragraph({ children: [new TextRun({ text: section.image.caption, italics: true, color: "52666D" })] }));
  }
  children.push(new Paragraph({ text: `Grounded in approved content brief v${project.brief_version}.`, spacing: { before: 280 }, style: "Caption" }));
  const doc = new Document({ creator: "BlueOrigin Knowledge Studio", title: project.title, description: notebook.purpose, sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

async function jobAidPdf(notebook, project) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]);
  let y = 735;
  const add = (text, { size = 10, font = regular, color = rgb(.15, .22, .24), gap = 4 } = {}) => {
    for (const line of lines(text, size > 20 ? 42 : 88)) {
      if (y < 55) { page = pdf.addPage([612, 792]); y = 735; }
      page.drawText(line, { x: 54, y, size, font, color }); y -= size + gap;
    }
  };
  add("BLUEORIGIN · JOB AID", { size: 9, font: bold, color: rgb(1, .35, .12), gap: 8 });
  add(notebook.title, { size: 25, font: bold, gap: 8 });
  add(notebook.purpose, { size: 12, color: rgb(.32, .4, .42), gap: 8 }); y -= 18;
  for (const section of project.sections) {
    add(section.title, { size: 15, font: bold, gap: 7 }); add(section.body, { size: 10, gap: 5 }); y -= 14;
    const image = await renderCroppedImage(section.image, 1008, 504);
    if (image) {
      if (y < 320) { page = pdf.addPage([612, 792]); y = 735; }
      const embedded = await pdf.embedPng(image);
      page.drawImage(embedded, { x: 54, y: y - 252, width: 504, height: 252 });
      y -= 266;
      if (section.image.caption) add(section.image.caption, { size: 8, color: rgb(.35, .42, .44), gap: 6 });
      y -= 10;
    }
  }
  add(`Grounded in approved content brief v${project.brief_version}.`, { size: 8, color: rgb(.35, .42, .44) });
  return Buffer.from(await pdf.save());
}

async function presentationPptx(notebook, project) {
  const PptxGenJS = loadPptxGenJS();
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "BlueOrigin Knowledge Studio";
  pptx.subject = notebook.purpose;
  pptx.title = project.title;
  pptx.company = "BlueOrigin";
  pptx.lang = "en-US";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "en-US" };
  for (const [index, item] of project.slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: index === 0 ? "17343C" : "F4F7F7" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: .12, h: 7.5, fill: { color: "FF5D27" }, line: { color: "FF5D27" } });
    slide.addText("BLUEORIGIN", { x: .55, y: .36, w: 2, h: .3, fontSize: 9, bold: true, color: index === 0 ? "DDE9EB" : "385F68", charSpacing: 1.6, margin: 0 });
    slide.addText(item.title || `Slide ${index + 1}`, { x: .65, y: index === 0 ? 2.15 : 1.05, w: item.image ? 6.3 : 11.6, h: 1.4, fontSize: index === 0 ? 30 : 25, bold: true, color: index === 0 ? "FFFFFF" : "17343C", breakLine: false, margin: 0, valign: "mid" });
    slide.addText(item.body || "", { x: .65, y: index === 0 ? 3.65 : 2.65, w: item.image ? 6.2 : 11.4, h: 2.15, fontSize: 15, color: index === 0 ? "DDE9EB" : "52666D", breakLine: false, margin: 0, valign: "top" });
    const croppedImage = await renderCroppedImage(item.image, 1020, 1220);
    if (croppedImage) slide.addImage({ data: `data:image/png;base64,${croppedImage.toString("base64")}`, x: 7.65, y: .7, w: 5.1, h: 6.1 });
    else if (item.image) slide.addShape(pptx.ShapeType.rect, { x: 7.65, y: .7, w: 5.1, h: 6.1, fill: { color: "D6E2E4" }, line: { color: "9FB6BB" } });
    slide.addText(`${index + 1}  ·  Brief v${project.brief_version}`, { x: .65, y: 7.06, w: 3, h: .2, fontSize: 8, color: index === 0 ? "B8CDD1" : "6D7B80", margin: 0 });
    if (item.notes) slide.addNotes(item.notes);
  }
  return Buffer.from(await pptx.write({ outputType: "nodebuffer" }));
}

function quizHtml(notebook, project) {
  const data = JSON.stringify({ title: project.title, questions: project.questions }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${project.title}</title><style>body{margin:0;background:#f3f6f6;color:#17252b;font:16px/1.5 system-ui}.app{max-width:780px;margin:40px auto;padding:28px;background:#fff;border:1px solid #dce4e6;border-radius:14px}button{display:block;width:100%;margin:8px 0;padding:13px;text-align:left;border:1px solid #cbd7da;border-radius:9px;background:#fff}button:hover{background:#edf5f5}.result{margin-top:16px;padding:14px;border-radius:9px;background:#edf5f5}.next{width:auto;color:#fff;background:#17252b}</style></head><body><main class="app"><small>BLUEORIGIN · KNOWLEDGE CHECK</small><h1>${notebook.title}</h1><div id="quiz"></div></main><script>const project=${data};let i=0,score=0;const root=document.querySelector('#quiz');function draw(){const q=project.questions[i];root.innerHTML='<p>Question '+(i+1)+' of '+project.questions.length+'</p><h2>'+q.prompt+'</h2>'+q.options.map((x,n)=>'<button data-answer="'+n+'">'+x+'</button>').join('');root.querySelectorAll('button').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));}function answer(n){const q=project.questions[i];if(n===q.correct_index)score++;root.innerHTML+='<div class="result"><strong>'+(n===q.correct_index?'Correct':'Review')+'</strong><p>'+q.explanation+'</p><button class="next">'+(i+1===project.questions.length?'See result':'Next question')+'</button></div>';root.querySelector('.next').onclick=()=>{i++;if(i<project.questions.length)draw();else root.innerHTML='<h2>'+score+' / '+project.questions.length+'</h2><p>Knowledge check complete.</p>'};}draw();</script></body></html>`;
}

export async function buildNotebookExport(notebook, format) {
  const projects = notebook.artifact_projects || {};
  const base = safeName(notebook.title);
  if (format === "docx" && projects.job_aid) return { body: await jobAidDocx(notebook, projects.job_aid), mime: MIME.docx, filename: `${base}-job-aid.docx` };
  if (format === "pdf" && projects.job_aid) return { body: await jobAidPdf(notebook, projects.job_aid), mime: MIME.pdf, filename: `${base}-job-aid.pdf` };
  if (format === "pptx" && projects.presentation) return { body: await presentationPptx(notebook, projects.presentation), mime: MIME.pptx, filename: `${base}-presentation.pptx` };
  if (format === "quiz-html" && projects.quiz) return { body: Buffer.from(quizHtml(notebook, projects.quiz)), mime: MIME.html, filename: `${base}-knowledge-check.html` };
  if (format === "quiz-json" && projects.quiz) return { body: Buffer.from(JSON.stringify(projects.quiz, null, 2)), mime: MIME.json, filename: `${base}-knowledge-check.json` };
  if (format === "srt" && projects.video) {
    let cursor = 0;
    const text = projects.video.scenes.map((scene, index) => { const start = cursor; cursor += Number(scene.duration_seconds || 28); return `${index + 1}\n${srtTime(start)} --> ${srtTime(cursor)}\n${scene.narration || scene.body || ""}\n`; }).join("\n");
    return { body: Buffer.from(text), mime: MIME.srt, filename: `${base}-captions.srt` };
  }
  throw Object.assign(new Error(`The ${format} output is not ready`), { statusCode: 409 });
}

export function sendNotebookExport(res, artifact) {
  res.statusCode = 200;
  res.setHeader("Content-Type", artifact.mime);
  res.setHeader("Content-Disposition", `attachment; filename="${artifact.filename}"`);
  res.setHeader("Content-Length", String(artifact.body.length));
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(artifact.body);
}
