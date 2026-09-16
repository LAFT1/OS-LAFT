import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, FilePlus2, Settings, Search, Trash2, Plus, X,
  Printer, Pencil, Eye, Building2, Upload, ChevronLeft, Save,
  CheckCircle2, Clock, Menu, Image as ImageIcon, LogOut,
} from "lucide-react";

/* ============================== STYLES ============================== */

const CSS_TEXT = `
.osapp {
  --ink: #13203A;
  --ink-soft: #4B5A73;
  --paper: #F5F6F2;
  --surface: #FFFFFF;
  --line: #DCE0E3;
  --line-soft: #ECEEEF;
  --accent: #B8843A;
  --accent-deep: #8C6428;
  --accent-soft: #F1E6D2;
  --success: #2F6F4E;
  --success-soft: #E3EFE8;
  --danger: #A23B3B;
  --danger-soft: #F5E6E6;
  --font-sans: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SF Mono', Consolas, monospace;
  font-family: var(--font-sans);
  color: var(--ink);
  background: var(--paper);
}
.osapp .mono { font-family: var(--font-mono); }
.osapp .nav-rail { background: var(--surface); border-right: 1px solid var(--line); width: 100%; }
@media (min-width: 768px) { .osapp .nav-rail { width: 15rem; flex-shrink: 0; } }
.osapp .nav-link { display:flex; align-items:center; gap:.65rem; padding:.55rem .75rem; border-radius:7px; color:var(--ink-soft); font-size:.875rem; font-weight:500; transition: background .15s, color .15s; cursor: pointer; border: none; background: transparent; text-align: left; width: 100%; }
.osapp .nav-link:hover { background: var(--paper); color: var(--ink); }
.osapp .nav-link.active { background: var(--accent-soft); color: var(--accent-deep); }
.osapp .card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; }
.osapp .input { width:100%; border:1px solid var(--line); border-radius:6px; padding:.5rem .65rem; font-size:.875rem; background:var(--surface); color:var(--ink); font-family: var(--font-sans); }
.osapp .input:focus { outline:none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.osapp textarea.input { resize: vertical; }
.osapp .btn { display:inline-flex; align-items:center; gap:.45rem; font-size:.8125rem; font-weight:600; padding:.55rem 1rem; border-radius:6px; cursor:pointer; border:1px solid transparent; transition: all .15s; white-space:nowrap; }
.osapp .btn-primary { background: var(--ink); color:#fff; }
.osapp .btn-primary:hover { background: var(--accent-deep); }
.osapp .btn-outline { background: transparent; border-color: var(--line); color: var(--ink); }
.osapp .btn-outline:hover { border-color: var(--ink); }
.osapp .btn-danger-ghost { color: var(--danger); background: transparent; border-color: transparent; }
.osapp .btn-danger-ghost:hover { background: var(--danger-soft); }
.osapp .btn:disabled { opacity:.55; cursor:not-allowed; }
.osapp .status-pill { display:inline-flex; align-items:center; font-size:.72rem; font-weight:600; padding:.22rem .6rem; border-radius:999px; white-space: nowrap; }
.osapp .field-label { display:block; font-size:.75rem; font-weight:600; color: var(--ink-soft); margin-bottom:.3rem; }
.osapp table th, .osapp table td { vertical-align: top; }
.osapp tr.hover-row:hover { background: var(--paper); }
.osapp ::placeholder { color: #9AA5B1; }

@media print {
  .no-print { display: none !important; }
  body, .osapp, .osapp main { background: #fff !important; }
  .print-footer { position: fixed; bottom: 0; left: 0; right: 0; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  @page { margin: 16mm 14mm; }
}
`;

/* ============================== CONSTANTS ============================== */

const STATUS_OPTIONS = [
  "Atendimento concluído",
  "Atendimento parcialmente concluído",
  "Equipamento aguardando peça",
  "Necessário novo atendimento",
  "Aguardando ação do cliente",
  "Outros",
];

const STATUS_COLOR = {
  "Atendimento concluído": { bg: "var(--success-soft)", fg: "var(--success)" },
  "Atendimento parcialmente concluído": { bg: "var(--accent-soft)", fg: "var(--accent-deep)" },
  "Equipamento aguardando peça": { bg: "var(--danger-soft)", fg: "var(--danger)" },
  "Necessário novo atendimento": { bg: "var(--danger-soft)", fg: "var(--danger)" },
  "Aguardando ação do cliente": { bg: "var(--accent-soft)", fg: "var(--accent-deep)" },
  Outros: { bg: "var(--line-soft)", fg: "var(--ink-soft)" },
};

const DEFAULT_COMPANY = {
  nome: "",
  cnpj: "",
  endereco: "",
  telefone: "",
  email: "",
  site: "",
  logo: "",
  corPrimaria: "#B8843A",
};

/* ============================== HELPERS ============================== */

function formatDateBR(dateStr) {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function calcDuration(entrada, saida) {
  if (!entrada || !saida) return null;
  const [eh, em] = entrada.split(":").map(Number);
  const [sh, sm] = saida.split(":").map(Number);
  if ([eh, em, sh, sm].some((n) => Number.isNaN(n))) return null;
  let diff = sh * 60 + sm - (eh * 60 + em);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

function emptyOS() {
  return {
    id: null,
    createdAt: null,
    updatedAt: null,
    cliente: { nome: "", documento: "", unidade: "", endereco: "", cidadeUf: "", respNome: "", respContato: "" },
    equipamento: { tipo: "", fabricante: "", modelo: "", numeroSerie: "", patrimonio: "" },
    visita: { data: new Date().toISOString().slice(0, 10), horaEntrada: "", horaSaida: "" },
    motivoVisita: "",
    descricaoServico: "",
    itens: [],
    nenhumItem: false,
    status: STATUS_OPTIONS[0],
    observacoes: "",
    assinaturaTecnico: { nome: "", cargo: "", dataUrl: null },
    assinaturaCliente: { nome: "", cargo: "", dataUrl: null },
  };
}

function newItem() {
  return {
    id: `it-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    descricao: "",
    quantidade: "",
    observacao: "",
  };
}

/* ============================== PDF GENERATOR (from scratch, no libraries) ==============================
 * Builds a real .pdf file client-side and triggers a direct download. This deliberately avoids
 * window.print()/showModal-type dialogs, which browsers can silently block inside a sandboxed
 * embedded app (no "allow-modals" permission) — that was the cause of the "ghost button" that
 * did nothing when clicked.
 * ============================================================================================= */

const PDF_PAGE_W = 595.28; // A4 pt
const PDF_PAGE_H = 841.89;

const CP1252_EXTRA = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function pdfEscapeText(str) {
  let out = "";
  const s = String(str == null ? "" : str);
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    let byte;
    if (code <= 255) byte = code;
    else if (CP1252_EXTRA[code] != null) byte = CP1252_EXTRA[code];
    else byte = 63; // '?'
    const ch = String.fromCharCode(byte);
    if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
    else out += ch;
  }
  return out;
}

function pdfBytesToBinaryString(bytes) {
  let s = "";
  const chunk = 8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return s;
}

function pdfStringToUint8Array(str) {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xff;
  return arr;
}

function hexToRgb01(hex) {
  const fallback = [0.549, 0.392, 0.157];
  if (!hex) return fallback;
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  if ([r, g, b].some((n) => Number.isNaN(n))) return fallback;
  return [r, g, b];
}

function createPdfDoc() {
  const MARGIN = 42;
  const BOTTOM_LIMIT = 70;
  const objects = [""];
  function addObject(body) {
    objects.push(body);
    return objects.length - 1;
  }

  const fonts = {
    helv: addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    helvB: addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
    courier: addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"),
  };

  const imageObjCache = new Map();
  const pages = [];
  let page = { lines: [], images: {}, imgCounter: 0 };
  let cursorY = PDF_PAGE_H - MARGIN;

  function pushPage() {
    pages.push(page);
  }
  function newPage() {
    pushPage();
    page = { lines: [], images: {}, imgCounter: 0 };
    cursorY = PDF_PAGE_H - MARGIN;
  }
  function checkBreak(neededHeight) {
    if (cursorY - neededHeight < BOTTOM_LIMIT) newPage();
  }

  function fontTag(fontName) {
    if (fontName === "bold") return "F2";
    if (fontName === "mono") return "F3";
    return "F1";
  }

  function text(x, y, str, opts) {
    opts = opts || {};
    const size = opts.size || 9;
    const tag = fontTag(opts.font);
    const c = opts.color || [0.074, 0.125, 0.227];
    const esc = pdfEscapeText(str);
    page.lines.push(
      `q ${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} rg BT /${tag} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc}) Tj ET Q`
    );
  }

  function line(x1, y1, x2, y2, opts) {
    opts = opts || {};
    const w = opts.width == null ? 0.75 : opts.width;
    const c = opts.color || [0.863, 0.878, 0.89];
    page.lines.push(
      `q ${w} w ${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`
    );
  }

  function image(img, x, y, w, h) {
    if (!img) return;
    let objNum = imageObjCache.get(img);
    if (objNum == null) {
      const body = `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${img.bytes.length} >>\nstream\n${pdfBytesToBinaryString(img.bytes)}\nendstream`;
      objNum = addObject(body);
      imageObjCache.set(img, objNum);
    }
    let name = null;
    for (const [n, num] of Object.entries(page.images)) if (num === objNum) name = n;
    if (!name) {
      page.imgCounter += 1;
      name = `Im${page.imgCounter}`;
      page.images[name] = objNum;
    }
    page.lines.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /${name} Do Q`);
  }

  function finalize(footerLeftText) {
    pushPage();
    const total = pages.length;
    pages.forEach((p, idx) => {
      const pageNum = idx + 1;
      p.lines.push(`q 0.6 w 0.863 0.878 0.890 RG ${MARGIN} 50 m ${PDF_PAGE_W - MARGIN} 50 l S Q`);
      const leftEsc = pdfEscapeText(footerLeftText || "");
      p.lines.push(`q 0.294 0.353 0.451 rg BT /F1 7.5 Tf 1 0 0 1 ${MARGIN} 34 Tm (${leftEsc}) Tj ET Q`);
      const right = `Página ${pageNum} de ${total}`;
      const rightW = right.length * 7.5 * 0.6;
      const rightEsc = pdfEscapeText(right);
      p.lines.push(
        `q 0.294 0.353 0.451 rg BT /F3 7.5 Tf 1 0 0 1 ${(PDF_PAGE_W - MARGIN - rightW).toFixed(2)} 34 Tm (${rightEsc}) Tj ET Q`
      );
    });

    const contentNums = pages.map((p) => {
      const body = p.lines.join("\n");
      return addObject(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
    });

    const pagesRef = addObject("");
    const pageNums = pages.map((p, idx) => {
      const imgEntries = Object.entries(p.images)
        .map(([n, num]) => `/${n} ${num} 0 R`)
        .join(" ");
      const resources = `<< /Font << /F1 ${fonts.helv} 0 R /F2 ${fonts.helvB} 0 R /F3 ${fonts.courier} 0 R >> /XObject << ${imgEntries} >> >>`;
      return addObject(
        `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PDF_PAGE_W} ${PDF_PAGE_H}] /Resources ${resources} /Contents ${contentNums[idx]} 0 R >>`
      );
    });
    objects[pagesRef] = `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageNums.length} >>`;

    const catalogRef = addObject(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);

    let out = "%PDF-1.4\n";
    const offsets = new Array(objects.length).fill(0);
    for (let i = 1; i < objects.length; i++) {
      offsets[i] = out.length;
      out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefStart = out.length;
    out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i++) {
      out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${objects.length} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return pdfStringToUint8Array(out);
  }

  return {
    margin: MARGIN,
    contentWidth: PDF_PAGE_W - MARGIN * 2,
    get cursorY() {
      return cursorY;
    },
    set cursorY(v) {
      cursorY = v;
    },
    checkBreak,
    newPage,
    text,
    line,
    image,
    finalize,
  };
}

function pdfWrapText(measure, text, maxWidth, size, bold) {
  const paragraphs = String(text || "").split("\n");
  const lines = [];
  paragraphs.forEach((para) => {
    if (para.trim() === "") {
      lines.push("");
      return;
    }
    const words = para.split(/\s+/).filter(Boolean);
    let current = "";
    words.forEach((word) => {
      const test = current ? current + " " + word : word;
      if (measure(test, size, bold) <= maxWidth || !current) {
        current = test;
      } else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
  });
  return lines;
}

function pdfFitText(measure, text, maxWidth, size, bold) {
  const s = String(text || "");
  if (!s) return s;
  if (measure(s, size, bold) <= maxWidth) return s;
  for (let len = s.length - 1; len > 0; len--) {
    const candidate = s.slice(0, len).trim() + "…";
    if (measure(candidate, size, bold) <= maxWidth) return candidate;
  }
  return "…";
}

function getPdfMeasurer() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  return (text, size, bold) => {
    ctx.font = `${bold ? "bold " : ""}${size}px Arial, Helvetica, sans-serif`;
    return ctx.measureText(String(text)).width;
  };
}

function decodeImageToRgb(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 480;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const rgb = new Uint8Array(width * height * 3);
      for (let i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
        rgb[j] = imgData.data[i];
        rgb[j + 1] = imgData.data[i + 1];
        rgb[j + 2] = imgData.data[i + 2];
      }
      resolve({ width, height, bytes: rgb });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function generateOsPdfBlob(os, company) {
  const [logoImg, tecImg, cliImg] = await Promise.all([
    decodeImageToRgb(company && company.logo),
    decodeImageToRgb(os.assinaturaTecnico && os.assinaturaTecnico.dataUrl),
    decodeImageToRgb(os.assinaturaCliente && os.assinaturaCliente.dataUrl),
  ]);

  const measure = getPdfMeasurer();
  const accent = hexToRgb01(company && company.corPrimaria);
  const ink = [0.074, 0.125, 0.227];
  const inkSoft = [0.294, 0.353, 0.451];
  const lineColor = [0.863, 0.878, 0.89];

  const doc = createPdfDoc();
  const M = doc.margin;
  const CW = doc.contentWidth;

  function sectionTitle(title) {
    doc.checkBreak(26);
    doc.text(M, doc.cursorY, title.toUpperCase(), { size: 8.5, font: "bold", color: accent });
    doc.cursorY -= 4;
    doc.line(M, doc.cursorY, M + CW, doc.cursorY, { width: 0.6, color: lineColor });
    doc.cursorY -= 14;
  }

  function keyValueGrid(pairs) {
    const colW = CW / 2;
    for (let i = 0; i < pairs.length; i += 2) {
      const rowPairs = [pairs[i], pairs[i + 1]].filter(Boolean);
      const rendered = rowPairs.map((pair, idx) => {
        const [label, value] = pair;
        const x = idx === 0 ? M : M + colW;
        const labelText = `${label}:`;
        const labelW = measure(labelText, 8, false) + 4;
        const maxW = colW - labelW - 10;
        const lines = pdfWrapText(measure, value || "—", Math.max(maxW, 40), 8.5, false);
        return { x, labelText, labelW, lines };
      });
      const maxLines = Math.max.apply(Math, rendered.map((r) => r.lines.length).concat([1]));
      doc.checkBreak(maxLines * 11 + 6);
      const rowY = doc.cursorY;
      rendered.forEach((r) => {
        doc.text(r.x, rowY, r.labelText, { size: 8, color: inkSoft });
        r.lines.forEach((ln, li) => {
          doc.text(r.x + r.labelW, rowY - li * 11, ln, { size: 8.5, font: "bold", color: ink });
        });
      });
      doc.cursorY = rowY - maxLines * 11 - 6;
    }
    doc.cursorY -= 4;
  }

  function paragraph(txt, opts) {
    opts = opts || {};
    const size = opts.size || 9;
    const bold = !!opts.bold;
    const color = opts.color || ink;
    const lines = pdfWrapText(measure, txt || "—", CW, size, bold);
    lines.forEach((ln) => {
      doc.checkBreak(size + 4);
      doc.text(M, doc.cursorY, ln, { size, font: bold ? "bold" : "regular", color });
      doc.cursorY -= size + 4;
    });
    doc.cursorY -= 6;
  }

  function materialsTable(itens) {
    const cols = [
      { label: "Descrição", w: CW * 0.4 },
      { label: "Quantidade", w: CW * 0.18 },
      { label: "Observação", w: CW * 0.42 },
    ];
    doc.checkBreak(24);
    let x = M;
    cols.forEach((c) => {
      doc.text(x, doc.cursorY, c.label, { size: 8, font: "bold", color: inkSoft });
      x += c.w;
    });
    doc.cursorY -= 6;
    doc.line(M, doc.cursorY, M + CW, doc.cursorY, { width: 0.8, color: ink });
    doc.cursorY -= 12;

    itens.forEach((it) => {
      const values = [it.descricao || "—", it.quantidade || "—", it.observacao || "—"];
      const wrapped = values.map((v, i) => pdfWrapText(measure, v, cols[i].w - 8, 8.5, false));
      const maxLines = Math.max.apply(Math, wrapped.map((w) => w.length).concat([1]));
      doc.checkBreak(maxLines * 11 + 8);
      const rowY = doc.cursorY;
      let cx = M;
      wrapped.forEach((lines, i) => {
        lines.forEach((ln, li) => {
          doc.text(cx, rowY - li * 11, ln, { size: 8.5, color: ink });
        });
        cx += cols[i].w;
      });
      doc.cursorY = rowY - maxLines * 11 - 6;
      doc.line(M, doc.cursorY + 4, M + CW, doc.cursorY + 4, { width: 0.4, color: lineColor });
      doc.cursorY -= 6;
    });
    doc.cursorY -= 4;
  }

  function signatureBlock(label, data, img, x, w) {
    const imgH = 52;
    const topY = doc.cursorY;
    if (img) {
      const scale = Math.min(w / img.width, imgH / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      doc.image(img, x, topY - ih, iw, ih);
    }
    const lineY = topY - imgH - 4;
    doc.line(x, lineY, x + w, lineY, { width: 0.8, color: ink });
    doc.text(x, lineY - 12, data.nome || "_______________________", { size: 8.5, font: "bold", color: ink });
    doc.text(x, lineY - 23, data.cargo || label, { size: 7.5, color: inkSoft });
  }

  // ---- Header ----
  doc.checkBreak(140);
  const headerTop = doc.cursorY;
  let textX = M;
  if (logoImg) {
    const maxH = 40;
    const w = Math.min((logoImg.width / logoImg.height) * maxH, 130);
    doc.image(logoImg, M, headerTop - maxH, w, maxH);
    textX = M + w + 12;
  }
  const osIdText = `OS Nº ${os.id}`;
  const osIdWidth = osIdText.length * 12 * 0.62;
  const dateText = formatDateBR(os.visita.data);
  const dateWidth = dateText.length * 8 * 0.62;
  const rightColWidth = Math.max(osIdWidth, dateWidth);
  const headerGutter = 16;
  const leftMaxWidth = PDF_PAGE_W - M - rightColWidth - headerGutter - textX;

  const nameLines = pdfWrapText(measure, (company && company.nome) || "Nome da Empresa", leftMaxWidth, 13, true);
  const infoLineRaw = [company && company.cnpj, company && company.telefone, company && company.email].filter(Boolean).join("   ·   ");
  const infoLines = infoLineRaw ? pdfWrapText(measure, infoLineRaw, leftMaxWidth, 8, false) : [];
  const addressLines = company && company.endereco ? pdfWrapText(measure, company.endereco, leftMaxWidth, 8, false) : [];

  let ly = headerTop - 12;
  nameLines.forEach((ln) => {
    doc.text(textX, ly, ln, { size: 13, font: "bold", color: ink });
    ly -= 15;
  });
  infoLines.forEach((ln) => {
    doc.text(textX, ly, ln, { size: 8, color: inkSoft });
    ly -= 11;
  });
  addressLines.forEach((ln) => {
    doc.text(textX, ly, ln, { size: 8, color: inkSoft });
    ly -= 11;
  });

  doc.text(PDF_PAGE_W - M - osIdWidth, headerTop - 12, osIdText, { size: 12, font: "mono", color: ink });
  doc.text(PDF_PAGE_W - M - dateWidth, headerTop - 26, dateText, { size: 8, color: inkSoft });
  const rightBottom = headerTop - 26 - 11;
  const logoBottom = logoImg ? headerTop - 40 : headerTop;

  doc.cursorY = Math.min(ly, rightBottom, logoBottom) - 6;
  doc.line(M, doc.cursorY, M + CW, doc.cursorY, { width: 1.3, color: ink });
  doc.cursorY -= 22;

  // ---- Sections ----
  sectionTitle("Dados do Cliente");
  keyValueGrid([
    ["Cliente/Empresa", os.cliente.nome],
    ["CNPJ/CPF", os.cliente.documento],
    ["Unidade/Local", os.cliente.unidade],
    ["Cidade/UF", os.cliente.cidadeUf],
    ["Endereço", os.cliente.endereco],
    ["Responsável", os.cliente.respNome],
    ["Contato", os.cliente.respContato],
  ]);

  sectionTitle("Dados do Equipamento");
  keyValueGrid([
    ["Tipo/Nome", os.equipamento.tipo],
    ["Fabricante", os.equipamento.fabricante],
    ["Modelo", os.equipamento.modelo],
    ["Nº de Série", os.equipamento.numeroSerie],
    ["Patrimônio", os.equipamento.patrimonio],
  ]);

  sectionTitle("Dados da Visita");
  const duration = calcDuration(os.visita.horaEntrada, os.visita.horaSaida);
  keyValueGrid([
    ["Data", formatDateBR(os.visita.data)],
    ["Entrada", os.visita.horaEntrada || "—"],
    ["Saída", os.visita.horaSaida || "—"],
    ["Tempo total", duration || "—"],
  ]);
  if (os.motivoVisita) {
    doc.checkBreak(14);
    doc.text(M, doc.cursorY, "Motivo da visita:", { size: 8, font: "bold", color: inkSoft });
    doc.cursorY -= 12;
    paragraph(os.motivoVisita, { size: 8.5 });
  }

  sectionTitle("Descrição do Atendimento");
  paragraph(os.descricaoServico, { size: 9 });

  sectionTitle("Materiais / Peças / Insumos Utilizados");
  if (os.nenhumItem || !os.itens || os.itens.length === 0) {
    doc.checkBreak(20);
    doc.text(M, doc.cursorY, "Nenhum item utilizado.", { size: 9, color: ink });
    doc.cursorY -= 20;
  } else {
    materialsTable(os.itens);
  }

  sectionTitle("Resultado do Atendimento");
  doc.checkBreak(16);
  doc.text(M, doc.cursorY, os.status || "—", { size: 9.5, font: "bold", color: ink });
  doc.cursorY -= 16;
  if (os.observacoes) paragraph(os.observacoes, { size: 8.5 });

  doc.checkBreak(105);
  doc.cursorY -= 6;
  doc.line(M, doc.cursorY, M + CW, doc.cursorY, { width: 0.8, color: lineColor });
  doc.cursorY -= 20;
  const halfW = CW / 2 - 14;
  signatureBlock("Assinatura do Técnico/Visitante", os.assinaturaTecnico, tecImg, M, halfW);
  signatureBlock("Assinatura do Cliente", os.assinaturaCliente, cliImg, M + CW / 2 + 14, halfW);

  const footerRaw = [company && company.nome, company && company.site].filter(Boolean).join(" · ");
  const footerText = pdfFitText(measure, footerRaw, CW - 90, 7.5, false);
  const bytes = doc.finalize(footerText);
  return new Blob([bytes], { type: "application/pdf" });
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ============================== STORAGE ============================== */

async function fetchCompany() {
  try {
    const res = await window.storage.get("company-settings", true);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}

async function persistCompany(data) {
  await window.storage.set("company-settings", JSON.stringify(data), true);
}

async function fetchIndex() {
  try {
    const res = await window.storage.get("os-index", true);
    return res ? JSON.parse(res.value) : [];
  } catch (e) {
    return [];
  }
}

async function persistIndex(list) {
  await window.storage.set("os-index", JSON.stringify(list), true);
}

async function fetchOS(id) {
  try {
    const res = await window.storage.get(`os-record:${id}`, true);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}

async function persistOS(record) {
  await window.storage.set(`os-record:${record.id}`, JSON.stringify(record), true);
}

async function removeOSRecord(id) {
  try {
    await window.storage.delete(`os-record:${id}`, true);
  } catch (e) {
    /* ignore */
  }
}

async function getNextOSId() {
  const year = new Date().getFullYear();
  const key = `os-counter-${year}`;
  let current = 0;
  try {
    const res = await window.storage.get(key, true);
    current = res ? parseInt(res.value, 10) || 0 : 0;
  } catch (e) {
    current = 0;
  }
  const next = current + 1;
  await window.storage.set(key, String(next), true);
  return `${year}-${String(next).padStart(6, "0")}`;
}

/* ============================== SMALL UI PIECES ============================== */

function StatusPill({ status }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.Outros;
  return (
    <span className="status-pill" style={{ background: c.bg, color: c.fg }}>
      {status || "Sem status"}
    </span>
  );
}

function FormSection({ number, title, children }) {
  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="mono"
          style={{
            fontSize: ".75rem",
            color: "var(--accent-deep)",
            background: "var(--accent-soft)",
            borderRadius: "4px",
            padding: ".1rem .45rem",
          }}
        >
          {number}
        </span>
        <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, className, children }) {
  return (
    <div className={className || ""}>
      <label className="field-label">
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <p style={{ fontSize: ".7rem", color: "var(--ink-soft)", marginBottom: ".15rem" }}>{label.toUpperCase()}</p>
          <p className="text-sm" style={{ color: "var(--ink)" }}>
            {value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

function SignatureDisplay({ label, data }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="text-sm mb-1">
        {data.nome || "—"}
        {data.cargo ? ` · ${data.cargo}` : ""}
      </p>
      {data.dataUrl ? (
        <img
          src={data.dataUrl}
          alt={`Assinatura - ${label}`}
          style={{ height: "80px", border: "1px solid var(--line)", borderRadius: "6px", background: "#fff" }}
        />
      ) : (
        <div
          style={{
            height: "80px",
            border: "1px dashed var(--line)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-soft)",
            fontSize: ".75rem",
          }}
        >
          Sem assinatura
        </div>
      )}
    </div>
  );
}

/* ============================== SIGNATURE PAD ============================== */

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#13203A";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = getPos(e);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-md touch-none"
        style={{ height: "150px", border: "1px dashed var(--line)", background: "#fff", display: "block" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        type="button"
        onClick={clear}
        className="btn btn-outline mt-2"
        style={{ fontSize: ".75rem", padding: ".35rem .7rem" }}
      >
        <X size={14} /> Limpar assinatura
      </button>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ index, company, onOpen, onNew, onGoSettings }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return index
      .filter((it) => {
        const matchesQuery =
          !q ||
          it.id.toLowerCase().includes(q) ||
          (it.clienteNome || "").toLowerCase().includes(q) ||
          (it.equipamentoTipo || "").toLowerCase().includes(q);
        const matchesStatus = !statusFilter || it.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [index, query, statusFilter]);

  return (
    <div>
      {!company?.nome && (
        <div
          className="card p-3 mb-5 flex flex-wrap items-center justify-between gap-2"
          style={{ background: "var(--accent-soft)", borderColor: "var(--accent-soft)" }}
        >
          <span style={{ fontSize: ".8125rem", color: "var(--accent-deep)" }}>
            Configure os dados da sua empresa para que apareçam no cabeçalho e no PDF das OS.
          </span>
          <button onClick={onGoSettings} className="btn btn-outline" style={{ fontSize: ".75rem", padding: ".35rem .7rem" }}>
            Configurar agora
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--ink)" }}>
            Ordens de Serviço
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            {index.length} registro{index.length === 1 ? "" : "s"} no total
          </p>
        </div>
        <button onClick={onNew} className="btn btn-primary">
          <Plus size={16} /> Nova OS
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute"
            style={{ left: ".75rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-soft)" }}
          />
          <input
            className="input"
            style={{ paddingLeft: "2.3rem" }}
            placeholder="Buscar por cliente, equipamento ou número da OS"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input sm:w-64" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            {index.length === 0
              ? "Nenhuma OS registrada ainda. Crie a primeira ordem de serviço."
              : "Nenhuma OS encontrada com os filtros atuais."}
          </p>
          {index.length === 0 && (
            <button onClick={onNew} className="btn btn-primary" style={{ margin: "1rem auto 0" }}>
              <Plus size={16} /> Criar primeira OS
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th className="text-left p-3 mono" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  Nº DA OS
                </th>
                <th className="text-left p-3" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  CLIENTE
                </th>
                <th className="text-left p-3 hidden md:table-cell" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  EQUIPAMENTO
                </th>
                <th className="text-left p-3 hidden sm:table-cell" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  DATA
                </th>
                <th className="text-left p-3" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  STATUS
                </th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr
                  key={it.id}
                  className="hover-row"
                  style={{ borderBottom: "1px solid var(--line-soft)", cursor: "pointer" }}
                  onClick={() => onOpen(it.id)}
                >
                  <td className="p-3 mono" style={{ fontSize: ".8125rem" }}>
                    {it.id}
                  </td>
                  <td className="p-3 font-medium">{it.clienteNome || "—"}</td>
                  <td className="p-3 hidden md:table-cell" style={{ color: "var(--ink-soft)" }}>
                    {it.equipamentoTipo || "—"}
                  </td>
                  <td className="p-3 hidden sm:table-cell mono" style={{ fontSize: ".8125rem", color: "var(--ink-soft)" }}>
                    {formatDateBR(it.dataVisita)}
                  </td>
                  <td className="p-3">
                    <StatusPill status={it.status} />
                  </td>
                  <td className="p-3 text-right" style={{ color: "var(--ink-soft)" }}>
                    <Eye size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================== OS FORM ============================== */

function OSForm({ initial, onSaved, onCancel }) {
  const [os, setOs] = useState(() => (initial ? JSON.parse(JSON.stringify(initial)) : emptyOS()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (path, value) => {
    setOs((prev) => {
      if (path.indexOf(".") >= 0) {
        const [group, key] = path.split(".");
        return { ...prev, [group]: { ...prev[group], [key]: value } };
      }
      return { ...prev, [path]: value };
    });
  };

  const updateAssinatura = (which, key, value) => {
    setOs((prev) => ({ ...prev, [which]: { ...prev[which], [key]: value } }));
  };

  const updateItem = (id, key, value) => {
    setOs((prev) => ({
      ...prev,
      itens: prev.itens.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
    }));
  };

  const addItem = () => setOs((prev) => ({ ...prev, itens: [...prev.itens, newItem()] }));
  const removeItem = (id) => setOs((prev) => ({ ...prev, itens: prev.itens.filter((it) => it.id !== id) }));
  const toggleNenhumItem = (checked) =>
    setOs((prev) => ({ ...prev, nenhumItem: checked, itens: checked ? [] : prev.itens }));

  const duration = calcDuration(os.visita.horaEntrada, os.visita.horaSaida);

  const handleSave = async () => {
    setError("");
    if (!os.cliente.nome.trim()) return setError("Informe o nome do cliente.");
    if (!os.equipamento.tipo.trim()) return setError("Informe o tipo do equipamento.");
    if (!os.visita.data) return setError("Informe a data da visita.");

    setSaving(true);
    try {
      const now = Date.now();
      const record = { ...os };
      if (!record.id) {
        record.id = await getNextOSId();
        record.createdAt = now;
      }
      record.updatedAt = now;

      await persistOS(record);

      const idx = await fetchIndex();
      const entry = {
        id: record.id,
        clienteNome: record.cliente.nome,
        equipamentoTipo: record.equipamento.tipo,
        dataVisita: record.visita.data,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
      const pos = idx.findIndex((it) => it.id === record.id);
      if (pos >= 0) idx[pos] = entry;
      else idx.push(entry);
      await persistIndex(idx);

      onSaved(record.id);
    } catch (e) {
      setError("Não foi possível salvar a OS. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <button
          onClick={onCancel}
          className="btn btn-outline mb-3"
          style={{ fontSize: ".75rem", padding: ".35rem .7rem" }}
        >
          <ChevronLeft size={14} /> Voltar
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "var(--ink)" }}>
          {os.id ? "Editar OS" : "Nova Ordem de Serviço"}
        </h1>
        {os.id && (
          <p className="mono text-sm" style={{ color: "var(--ink-soft)" }}>
            {os.id}
          </p>
        )}
      </div>

      {error && (
        <div
          className="card p-3 mb-4"
          style={{ borderColor: "var(--danger)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: ".875rem" }}
        >
          {error}
        </div>
      )}

      <FormSection number="1" title="Dados do Cliente">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do cliente / empresa" required>
            <input className="input" value={os.cliente.nome} onChange={(e) => set("cliente.nome", e.target.value)} />
          </Field>
          <Field label="CNPJ / CPF">
            <input className="input" value={os.cliente.documento} onChange={(e) => set("cliente.documento", e.target.value)} />
          </Field>
          <Field label="Unidade / local do atendimento">
            <input className="input" value={os.cliente.unidade} onChange={(e) => set("cliente.unidade", e.target.value)} />
          </Field>
          <Field label="Cidade / UF">
            <input className="input" value={os.cliente.cidadeUf} onChange={(e) => set("cliente.cidadeUf", e.target.value)} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <input className="input" value={os.cliente.endereco} onChange={(e) => set("cliente.endereco", e.target.value)} />
          </Field>
          <Field label="Responsável pelo atendimento">
            <input className="input" value={os.cliente.respNome} onChange={(e) => set("cliente.respNome", e.target.value)} />
          </Field>
          <Field label="Telefone / e-mail do responsável">
            <input className="input" value={os.cliente.respContato} onChange={(e) => set("cliente.respContato", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection number="2" title="Dados do Equipamento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo / nome do equipamento" required>
            <input className="input" value={os.equipamento.tipo} onChange={(e) => set("equipamento.tipo", e.target.value)} />
          </Field>
          <Field label="Fabricante">
            <input className="input" value={os.equipamento.fabricante} onChange={(e) => set("equipamento.fabricante", e.target.value)} />
          </Field>
          <Field label="Modelo">
            <input className="input" value={os.equipamento.modelo} onChange={(e) => set("equipamento.modelo", e.target.value)} />
          </Field>
          <Field label="Número de série">
            <input className="input mono" value={os.equipamento.numeroSerie} onChange={(e) => set("equipamento.numeroSerie", e.target.value)} />
          </Field>
          <Field label="Patrimônio (se aplicável)">
            <input className="input" value={os.equipamento.patrimonio} onChange={(e) => set("equipamento.patrimonio", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection number="3" title="Dados da Visita">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Data da visita" required>
            <input type="date" className="input" value={os.visita.data} onChange={(e) => set("visita.data", e.target.value)} />
          </Field>
          <Field label="Horário de entrada">
            <input type="time" className="input" value={os.visita.horaEntrada} onChange={(e) => set("visita.horaEntrada", e.target.value)} />
          </Field>
          <Field label="Horário de saída">
            <input type="time" className="input" value={os.visita.horaSaida} onChange={(e) => set("visita.horaSaida", e.target.value)} />
          </Field>
        </div>
        {duration && (
          <p className="mono mt-3" style={{ fontSize: ".8125rem", color: "var(--accent-deep)" }}>
            <Clock size={14} style={{ display: "inline", marginRight: ".35rem", verticalAlign: "-2px" }} />
            Tempo total de atendimento: {duration}
          </p>
        )}
        <div className="mt-4">
          <Field label="Motivo da visita">
            <textarea className="input" rows={3} value={os.motivoVisita} onChange={(e) => set("motivoVisita", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection number="4" title="Descrição do Atendimento">
        <Field label="Diagnóstico, procedimentos, testes, ajustes, orientações, resultado e pendências">
          <textarea className="input" rows={8} value={os.descricaoServico} onChange={(e) => set("descricaoServico", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection number="5" title="Materiais / Peças / Insumos Utilizados">
        <label className="flex items-center gap-2 mb-3" style={{ fontSize: ".875rem" }}>
          <input type="checkbox" checked={os.nenhumItem} onChange={(e) => toggleNenhumItem(e.target.checked)} />
          Nenhum item utilizado
        </label>
        {!os.nenhumItem && (
          <div>
            <div
              className="hidden sm:grid sm:grid-cols-4 gap-2 mb-2"
              style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}
            >
              <span>DESCRIÇÃO</span>
              <span>QUANTIDADE</span>
              <span>OBSERVAÇÃO</span>
              <span></span>
            </div>
            {os.itens.map((it, i) => (
              <div key={it.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center mb-2">
                <input
                  className="input"
                  placeholder={`Item ${i + 1}`}
                  value={it.descricao}
                  onChange={(e) => updateItem(it.id, "descricao", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Qtd."
                  value={it.quantidade}
                  onChange={(e) => updateItem(it.id, "quantidade", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Observação"
                  value={it.observacao}
                  onChange={(e) => updateItem(it.id, "observacao", e.target.value)}
                />
                <button type="button" onClick={() => removeItem(it.id)} className="btn btn-danger-ghost" style={{ padding: ".4rem", justifySelf: "start" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="btn btn-outline mt-1" style={{ fontSize: ".8125rem" }}>
              <Plus size={15} /> Adicionar item
            </button>
          </div>
        )}
      </FormSection>

      <FormSection number="6" title="Resultado do Atendimento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Status do atendimento">
            <select className="input" value={os.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Observações / Pendências">
            <textarea className="input" rows={3} value={os.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection number="7" title="Assinaturas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="field-label">Técnico / Visitante</p>
            <input
              className="input mb-2"
              placeholder="Nome"
              value={os.assinaturaTecnico.nome}
              onChange={(e) => updateAssinatura("assinaturaTecnico", "nome", e.target.value)}
            />
            <input
              className="input mb-3"
              placeholder="Cargo / função"
              value={os.assinaturaTecnico.cargo}
              onChange={(e) => updateAssinatura("assinaturaTecnico", "cargo", e.target.value)}
            />
            <SignaturePad value={os.assinaturaTecnico.dataUrl} onChange={(v) => updateAssinatura("assinaturaTecnico", "dataUrl", v)} />
          </div>
          <div>
            <p className="field-label">Cliente</p>
            <input
              className="input mb-2"
              placeholder="Nome"
              value={os.assinaturaCliente.nome}
              onChange={(e) => updateAssinatura("assinaturaCliente", "nome", e.target.value)}
            />
            <input
              className="input mb-3"
              placeholder="Cargo / função"
              value={os.assinaturaCliente.cargo}
              onChange={(e) => updateAssinatura("assinaturaCliente", "cargo", e.target.value)}
            />
            <SignaturePad value={os.assinaturaCliente.dataUrl} onChange={(v) => updateAssinatura("assinaturaCliente", "dataUrl", v)} />
          </div>
        </div>
      </FormSection>

      <div className="flex items-center gap-3 mt-6 mb-10">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          <Save size={16} /> {saving ? "Salvando..." : "Salvar OS"}
        </button>
        <button onClick={onCancel} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function OSFormLoader({ id, onSaved, onCancel }) {
  const [state, setState] = useState({ loading: !!id, record: null, notFound: false });

  useEffect(() => {
    if (!id) {
      setState({ loading: false, record: null, notFound: false });
      return;
    }
    let active = true;
    fetchOS(id).then((rec) => {
      if (!active) return;
      if (rec) setState({ loading: false, record: rec, notFound: false });
      else setState({ loading: false, record: null, notFound: true });
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (state.loading) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;
  if (state.notFound) return <p style={{ color: "var(--ink-soft)" }}>Não foi possível carregar esta OS.</p>;
  return <OSForm initial={state.record} onSaved={onSaved} onCancel={onCancel} />;
}

/* ============================== PRINT DOCUMENT ============================== */

const docTh = { textAlign: "left", padding: ".4rem .3rem", fontSize: ".7rem", color: "#4B5A73", borderBottom: "1px solid #13203A" };
const docTd = { padding: ".4rem .3rem", borderBottom: "1px solid #ECEEEF", fontSize: ".8rem" };

function DocSection({ title, children }) {
  return (
    <div className="avoid-break" style={{ marginBottom: "1.1rem" }}>
      <p
        style={{
          fontSize: ".7rem",
          fontWeight: 700,
          letterSpacing: ".03em",
          color: "#8C6428",
          marginBottom: ".4rem",
          borderBottom: "1px solid #ECEEEF",
          paddingBottom: ".25rem",
        }}
      >
        {title.toUpperCase()}
      </p>
      {children}
    </div>
  );
}

function DocGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem 1.5rem", fontSize: ".825rem" }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ display: "flex", gap: ".4rem" }}>
          <span style={{ color: "#4B5A73", minWidth: "110px" }}>{label}:</span>
          <span style={{ fontWeight: 500 }}>{value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function SignatureBlock({ label, data }) {
  return (
    <div>
      {data.dataUrl ? (
        <img src={data.dataUrl} alt={label} style={{ height: "70px", display: "block" }} />
      ) : (
        <div style={{ height: "70px" }} />
      )}
      <div style={{ borderTop: "1px solid #13203A", paddingTop: ".3rem", marginTop: ".3rem" }}>
        <p style={{ fontSize: ".8rem", fontWeight: 600, margin: 0 }}>{data.nome || "_______________________"}</p>
        <p style={{ fontSize: ".7rem", color: "#4B5A73", margin: 0 }}>{data.cargo || label}</p>
      </div>
    </div>
  );
}

function OSDocument({ os, company, onExit, onDownload, downloading, downloadError }) {
  const duration = calcDuration(os.visita.horaEntrada, os.visita.horaSaida);

  return (
    <div className="print-page">
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-4">
        <p style={{ fontSize: ".8125rem", color: "var(--ink-soft)" }}>Revise o documento e clique em "Baixar PDF".</p>
        <div className="flex gap-2">
          <button type="button" onClick={onExit} className="btn btn-outline">
            <ChevronLeft size={15} /> Voltar
          </button>
          <button type="button" onClick={onDownload} disabled={downloading} className="btn btn-primary">
            <Printer size={15} /> {downloading ? "Gerando..." : "Baixar PDF"}
          </button>
        </div>
      </div>
      {downloadError && (
        <p className="no-print mb-3" style={{ fontSize: ".8125rem", color: "var(--danger)" }}>
          {downloadError}
        </p>
      )}

      <div style={{ background: "#fff", color: "#13203A", maxWidth: "800px", margin: "0 auto" }}>
        <div
          className="avoid-break"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #13203A",
            paddingBottom: ".9rem",
            marginBottom: "1.2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            {company?.logo ? (
              <img src={company.logo} alt="Logo" style={{ height: "48px", maxWidth: "140px", objectFit: "contain" }} />
            ) : (
              <div
                style={{
                  height: "48px",
                  width: "48px",
                  border: "1px solid #DCE0E3",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={22} color="#8C6428" />
              </div>
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0 }}>{company?.nome || "Nome da Empresa"}</p>
              <p style={{ fontSize: ".7rem", color: "#4B5A73", margin: 0 }}>
                {[company?.cnpj, company?.telefone, company?.email].filter(Boolean).join("  ·  ")}
              </p>
              {company?.endereco && <p style={{ fontSize: ".7rem", color: "#4B5A73", margin: 0 }}>{company.endereco}</p>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="mono" style={{ fontWeight: 700, fontSize: ".95rem", margin: 0 }}>
              OS Nº {os.id}
            </p>
            <p style={{ fontSize: ".75rem", color: "#4B5A73", margin: 0 }}>{formatDateBR(os.visita.data)}</p>
          </div>
        </div>

        <DocSection title="Dados do Cliente">
          <DocGrid
            items={[
              ["Cliente/Empresa", os.cliente.nome],
              ["CNPJ/CPF", os.cliente.documento],
              ["Unidade/Local", os.cliente.unidade],
              ["Cidade/UF", os.cliente.cidadeUf],
              ["Endereço", os.cliente.endereco],
              ["Responsável", os.cliente.respNome],
              ["Contato", os.cliente.respContato],
            ]}
          />
        </DocSection>

        <DocSection title="Dados do Equipamento">
          <DocGrid
            items={[
              ["Tipo/Nome", os.equipamento.tipo],
              ["Fabricante", os.equipamento.fabricante],
              ["Modelo", os.equipamento.modelo],
              ["Nº de Série", os.equipamento.numeroSerie],
              ["Patrimônio", os.equipamento.patrimonio],
            ]}
          />
        </DocSection>

        <DocSection title="Dados da Visita">
          <DocGrid
            items={[
              ["Data", formatDateBR(os.visita.data)],
              ["Entrada", os.visita.horaEntrada || "—"],
              ["Saída", os.visita.horaSaida || "—"],
              ["Tempo total de atendimento", duration || "—"],
            ]}
          />
          {os.motivoVisita && (
            <p style={{ fontSize: ".825rem", marginTop: ".5rem" }}>
              <strong>Motivo da visita:</strong> {os.motivoVisita}
            </p>
          )}
        </DocSection>

        <DocSection title="Descrição do Atendimento">
          <p style={{ fontSize: ".825rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{os.descricaoServico || "—"}</p>
        </DocSection>

        <DocSection title="Materiais / Peças / Insumos Utilizados">
          {os.nenhumItem || os.itens.length === 0 ? (
            <p style={{ fontSize: ".825rem" }}>Nenhum item utilizado.</p>
          ) : (
            <table className="avoid-break" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={docTh}>Descrição</th>
                  <th style={docTh}>Quantidade</th>
                  <th style={docTh}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {os.itens.map((it) => (
                  <tr key={it.id} className="avoid-break">
                    <td style={docTd}>{it.descricao || "—"}</td>
                    <td style={docTd}>{it.quantidade || "—"}</td>
                    <td style={docTd}>{it.observacao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DocSection>

        <DocSection title="Resultado do Atendimento">
          <p style={{ fontSize: ".85rem", fontWeight: 600 }}>{os.status}</p>
          {os.observacoes && <p style={{ fontSize: ".825rem", marginTop: ".4rem", whiteSpace: "pre-wrap" }}>{os.observacoes}</p>}
        </DocSection>

        <div
          className="avoid-break"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid #DCE0E3",
          }}
        >
          <SignatureBlock label="Assinatura do Técnico/Visitante" data={os.assinaturaTecnico} />
          <SignatureBlock label="Assinatura do Cliente" data={os.assinaturaCliente} />
        </div>

        <div
          className="print-footer"
          style={{
            marginTop: "2rem",
            paddingTop: ".6rem",
            borderTop: "1px solid #DCE0E3",
            fontSize: ".65rem",
            color: "#4B5A73",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {company?.nome || "Empresa"} {company?.site ? `· ${company.site}` : ""}
          </span>
          <span>Documento gerado eletronicamente</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== OS VIEW (DETAIL) ============================== */

function OSView({ id, company, onEdit, onBack, onDeleted }) {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchOS(id).then((rec) => {
      if (active) {
        setOs(rec);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  const handleDelete = async () => {
    await removeOSRecord(id);
    const idx = await fetchIndex();
    await persistIndex(idx.filter((it) => it.id !== id));
    onDeleted();
  };

  const handleDownloadPdf = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      const blob = await generateOsPdfBlob(os, company);
      triggerBlobDownload(blob, `OS-${os.id}.pdf`);
    } catch (e) {
      setDownloadError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;
  if (!os) return <p style={{ color: "var(--ink-soft)" }}>OS não encontrada.</p>;
  if (previewMode)
    return (
      <OSDocument
        os={os}
        company={company}
        onExit={() => setPreviewMode(false)}
        onDownload={handleDownloadPdf}
        downloading={downloading}
        downloadError={downloadError}
      />
    );

  const duration = calcDuration(os.visita.horaEntrada, os.visita.horaSaida);

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <button
            onClick={onBack}
            className="btn btn-outline mb-3"
            style={{ fontSize: ".75rem", padding: ".35rem .7rem" }}
          >
            <ChevronLeft size={14} /> Voltar
          </button>
          <h1 className="text-xl font-semibold mono" style={{ color: "var(--ink)" }}>
            OS Nº {os.id}
          </h1>
          <div className="mt-1">
            <StatusPill status={os.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onEdit(os.id)} className="btn btn-outline">
            <Pencil size={15} /> Editar
          </button>
          <button type="button" onClick={() => setPreviewMode(true)} className="btn btn-primary">
            <Printer size={15} /> Gerar PDF
          </button>
        </div>
      </div>

      <FormSection number="1" title="Dados do Cliente">
        <InfoGrid
          items={[
            ["Nome", os.cliente.nome],
            ["CNPJ/CPF", os.cliente.documento],
            ["Unidade", os.cliente.unidade],
            ["Cidade/UF", os.cliente.cidadeUf],
            ["Endereço", os.cliente.endereco],
            ["Responsável", os.cliente.respNome],
            ["Contato do responsável", os.cliente.respContato],
          ]}
        />
      </FormSection>

      <FormSection number="2" title="Dados do Equipamento">
        <InfoGrid
          items={[
            ["Tipo", os.equipamento.tipo],
            ["Fabricante", os.equipamento.fabricante],
            ["Modelo", os.equipamento.modelo],
            ["Nº de série", os.equipamento.numeroSerie],
            ["Patrimônio", os.equipamento.patrimonio],
          ]}
        />
      </FormSection>

      <FormSection number="3" title="Dados da Visita">
        <InfoGrid
          items={[
            ["Data", formatDateBR(os.visita.data)],
            ["Entrada", os.visita.horaEntrada || "—"],
            ["Saída", os.visita.horaSaida || "—"],
            ["Tempo total", duration || "—"],
          ]}
        />
        {os.motivoVisita && (
          <p className="mt-3 text-sm" style={{ color: "var(--ink-soft)" }}>
            <strong style={{ color: "var(--ink)" }}>Motivo:</strong> {os.motivoVisita}
          </p>
        )}
      </FormSection>

      <FormSection number="4" title="Descrição do Atendimento">
        <p className="text-sm" style={{ color: "var(--ink)", whiteSpace: "pre-wrap" }}>
          {os.descricaoServico || "—"}
        </p>
      </FormSection>

      <FormSection number="5" title="Materiais / Peças / Insumos Utilizados">
        {os.nenhumItem || os.itens.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Nenhum item utilizado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th className="text-left p-2" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  DESCRIÇÃO
                </th>
                <th className="text-left p-2" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  QTD.
                </th>
                <th className="text-left p-2" style={{ fontSize: ".7rem", color: "var(--ink-soft)" }}>
                  OBSERVAÇÃO
                </th>
              </tr>
            </thead>
            <tbody>
              {os.itens.map((it) => (
                <tr key={it.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td className="p-2">{it.descricao || "—"}</td>
                  <td className="p-2">{it.quantidade || "—"}</td>
                  <td className="p-2">{it.observacao || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FormSection>

      <FormSection number="6" title="Resultado do Atendimento">
        <StatusPill status={os.status} />
        {os.observacoes && (
          <p className="mt-3 text-sm" style={{ color: "var(--ink-soft)", whiteSpace: "pre-wrap" }}>
            {os.observacoes}
          </p>
        )}
      </FormSection>

      <FormSection number="7" title="Assinaturas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SignatureDisplay label="Técnico / Visitante" data={os.assinaturaTecnico} />
          <SignatureDisplay label="Cliente" data={os.assinaturaCliente} />
        </div>
      </FormSection>

      <div className="mt-6 mb-10">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="btn btn-danger-ghost" style={{ fontSize: ".8125rem" }}>
            <Trash2 size={14} /> Excluir OS
          </button>
        ) : (
          <div className="card p-3" style={{ borderColor: "var(--danger)" }}>
            <p className="text-sm mb-2">Excluir esta OS permanentemente? Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="btn" style={{ background: "var(--danger)", color: "#fff" }}>
                Sim, excluir
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn btn-outline">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== COMPANY SETTINGS ============================== */

function CompanySettingsForm({ company, onSaved }) {
  const [form, setForm] = useState(company);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => setForm(company), [company]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogo = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logo", reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistCompany(form);
      onSaved(form);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--ink)" }}>
        Configurações da Empresa
      </h1>
      <p className="text-sm mb-5" style={{ color: "var(--ink-soft)" }}>
        Essas informações aparecem automaticamente no cabeçalho e no PDF de cada OS. Os dados são compartilhados com toda a
        equipe que utiliza este aplicativo.
      </p>

      <div className="card p-5">
        <div className="flex items-center gap-4 mb-5">
          <div
            style={{
              height: "64px",
              width: "64px",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            {form.logo ? (
              <img src={form.logo} alt="Logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <ImageIcon size={22} color="var(--ink-soft)" />
            )}
          </div>
          <div>
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className="btn btn-outline" style={{ fontSize: ".8125rem" }}>
              <Upload size={14} /> Enviar logo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            {form.logo && (
              <button
                type="button"
                onClick={() => set("logo", "")}
                className="btn btn-danger-ghost"
                style={{ fontSize: ".75rem", marginLeft: ".5rem" }}
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome da empresa" className="sm:col-span-2">
            <input className="input" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <input className="input" value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <input className="input" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
          </Field>
          <Field label="E-mail">
            <input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Site">
            <input className="input" value={form.site} onChange={(e) => set("site", e.target.value)} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <input className="input" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </Field>
          <Field label="Cor principal">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.corPrimaria}
                onChange={(e) => set("corPrimaria", e.target.value)}
                style={{ height: "38px", width: "52px", border: "1px solid var(--line)", borderRadius: "6px", padding: "2px", background: "#fff" }}
              />
              <span className="mono" style={{ fontSize: ".8125rem", color: "var(--ink-soft)" }}>
                {form.corPrimaria}
              </span>
            </div>
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Save size={16} /> {saving ? "Salvando..." : "Salvar configurações"}
          </button>
          {savedMsg && (
            <span style={{ fontSize: ".8125rem", color: "var(--success)" }}>
              <CheckCircle2 size={14} style={{ display: "inline", marginRight: ".3rem", verticalAlign: "-2px" }} />
              Configurações salvas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== APP SHELL ============================== */

export default function App({ onLogout }) {
  const [view, setView] = useState("dashboard");
  const [activeId, setActiveId] = useState(null);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [index, setIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, idx] = await Promise.all([fetchCompany(), fetchIndex()]);
      setCompany(c || DEFAULT_COMPANY);
      setIndex(idx);
      setLoading(false);
    })();
  }, []);

  const refreshIndex = async () => setIndex(await fetchIndex());

  const goDashboard = async () => {
    await refreshIndex();
    setView("dashboard");
    setNavOpen(false);
  };
  const goNew = () => {
    setActiveId(null);
    setView("new");
    setNavOpen(false);
  };
  const goDetail = (id) => {
    setActiveId(id);
    setView("detail");
    setNavOpen(false);
  };
  const goEdit = (id) => {
    setActiveId(id);
    setView("edit");
  };
  const goSettings = () => {
    setView("settings");
    setNavOpen(false);
  };

  const activeNavKey =
    view === "dashboard" || view === "detail" ? "dashboard" : view === "new" || view === "edit" ? "new" : view === "settings" ? "settings" : "";

  const navItems = [
    { key: "dashboard", label: "Painel", icon: LayoutDashboard, action: goDashboard },
    { key: "new", label: "Nova OS", icon: FilePlus2, action: goNew },
    { key: "settings", label: "Configurações", icon: Settings, action: goSettings },
  ];

  return (
    <div className="osapp" style={{ "--accent": company.corPrimaria || "#B8843A", minHeight: "100vh" }}>
      <style>{CSS_TEXT}</style>
      <div className="flex flex-col md:flex-row" style={{ minHeight: "100vh" }}>
        <aside className="nav-rail no-print">
          <div className="flex items-center justify-between md:block p-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              {company.logo ? (
                <img src={company.logo} alt="Logo" style={{ height: "28px", maxWidth: "110px", objectFit: "contain" }} />
              ) : (
                <Building2 size={20} color="var(--accent-deep)" />
              )}
              <span className="font-semibold text-sm truncate" style={{ color: "var(--ink)", maxWidth: "150px" }}>
                {company.nome || "Sua Empresa"}
              </span>
            </div>
            <button className="md:hidden" onClick={() => setNavOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Menu size={20} color="var(--ink)" />
            </button>
          </div>
          <nav className={(navOpen ? "flex" : "hidden") + " md:flex flex-col gap-1 p-3"}>
            {navItems.map((item) => (
              <button key={item.key} onClick={item.action} className={"nav-link" + (item.key === activeNavKey ? " active" : "")}>
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
            {onLogout && (
              <button
                onClick={onLogout}
                className="nav-link"
                style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)", color: "var(--danger)" }}
              >
                <LogOut size={17} />
                Sair
              </button>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>
          ) : (
            <>
              {view === "dashboard" && <Dashboard index={index} company={company} onOpen={goDetail} onNew={goNew} onGoSettings={goSettings} />}
              {(view === "new" || view === "edit") && (
                <OSFormLoader key={activeId || "new"} id={view === "edit" ? activeId : null} onSaved={goDetail} onCancel={goDashboard} />
              )}
              {view === "detail" && <OSView key={activeId} id={activeId} company={company} onEdit={goEdit} onBack={goDashboard} onDeleted={goDashboard} />}
              {view === "settings" && <CompanySettingsForm company={company} onSaved={setCompany} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
