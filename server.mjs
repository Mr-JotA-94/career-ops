import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat,
  TabStopType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3131;
const CONFIG_FILE    = path.join(__dirname, 'config.json');
const PIPELINE_FILE  = path.join(__dirname, 'pipeline.json');

// ── Load config (null if not set up yet) ──────────────────────────────────
function loadConfig() {
  try { return fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : null; }
  catch { return null; }
}

// ── Pure-Node ZIP extractor (cross-platform, no shell commands) ──────────────
function extractFromZip(buffer, targetPath) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
    if (buffer[i]===0x50 && buffer[i+1]===0x4b && buffer[i+2]===0x05 && buffer[i+3]===0x06) {
      eocd = i; break;
    }
  }
  if (eocd === -1) throw new Error('Not a valid ZIP/DOCX file');
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  const cdSize   = buffer.readUInt32LE(eocd + 12);
  let pos = cdOffset;
  while (pos < cdOffset + cdSize && pos + 46 <= buffer.length) {
    if (buffer.readUInt32LE(pos) !== 0x02014b50) break;
    const compMethod  = buffer.readUInt16LE(pos + 10);
    const compSize    = buffer.readUInt32LE(pos + 20);
    const fnLen       = buffer.readUInt16LE(pos + 28);
    const extraLen    = buffer.readUInt16LE(pos + 30);
    const commentLen  = buffer.readUInt16LE(pos + 32);
    const localOffset = buffer.readUInt32LE(pos + 42);
    const filename    = buffer.slice(pos + 46, pos + 46 + fnLen).toString('utf8');
    if (filename === targetPath) {
      const lh = localOffset;
      if (buffer.readUInt32LE(lh) !== 0x04034b50) throw new Error('Bad local file header');
      const lFnLen    = buffer.readUInt16LE(lh + 26);
      const lExtraLen = buffer.readUInt16LE(lh + 28);
      const dataStart = lh + 30 + lFnLen + lExtraLen;
      const data      = buffer.slice(dataStart, dataStart + compSize);
      if (compMethod === 0) return data;
      if (compMethod === 8) return zlib.inflateRawSync(data);
      throw new Error('Unsupported ZIP compression method: ' + compMethod);
    }
    pos += 46 + fnLen + extraLen + commentLen;
  }
  throw new Error('Entry not found in DOCX: ' + targetPath);
}

// ── API key — env > .env file > config.json (from setup wizard) ──────────
function getGroqKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const [k, v] = line.split('=');
      if (k?.trim() === 'GROQ_API_KEY' && v?.trim()) return v.trim().replace(/['"]/g, '');
    }
  }
  const cfg = loadConfig();
  if (cfg?.groq_api_key) return cfg.groq_api_key;
  return null;
}

// ── Colours ────────────────────────────────────────────────────────────────
const NAVY  = "1B3A5C";
const TEAL  = "1A7A6E";
const DARK  = "1A1A2E";
const WHITE = "FFFFFF";
const LIGHT = "EAF0F6";

// ── DOCX helpers ───────────────────────────────────────────────────────────
const noBorder  = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 1 } },
    spacing: { before: 0, after: 80 },
  });
}

function sectionHeader(text) {
  return [
    new Paragraph({
      spacing: { before: 280, after: 30 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: NAVY, font: "Calibri", characterSpacing: 20 })],
    }),
    rule(),
  ];
}

function jobHeader(title, company, location, dates) {
  // Two-line layout: title bold on first line, company · location + tab → dates on second
  return [
    new Paragraph({
      spacing: { before: 200, after: 16 },
      children: [
        new TextRun({ text: title, bold: true, size: 22, color: NAVY, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 44 },
      tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
      children: [
        new TextRun({ text: company, size: 19, color: TEAL, font: "Calibri", bold: true }),
        ...(location ? [
          new TextRun({ text: "  ·  ", size: 19, color: "999999", font: "Calibri" }),
          new TextRun({ text: location, size: 19, color: "666666", font: "Calibri" }),
        ] : []),
        new TextRun({ text: "\t" }),
        new TextRun({ text: dates, size: 18, color: "777777", italics: true, font: "Calibri" }),
      ],
    }),
  ];
}

function bullet(text) {
  // Plain inline bullet — reliable across Word versions, no numbering XML dependency
  return new Paragraph({
    spacing: { before: 36, after: 36 },
    indent: { left: 300, hanging: 200 },
    children: [
      new TextRun({ text: "▸  ", size: 19, color: TEAL, font: "Calibri", bold: true }),
      new TextRun({ text, size: 19, font: "Calibri", color: DARK }),
    ],
  });
}

function profileParagraph(text) {
  return new Paragraph({
    spacing: { before: 60, after: 140 },
    children: [new TextRun({ text: text || '', size: 20, font: "Calibri", color: DARK })],
  });
}

function splitSkills(raw) {
  return (raw || '')
    .split(/[,\n]+/)
    .map(x => x.trim().replace(/^[-•▸·*]+\s*/, ''))
    .filter(Boolean);
}

function buildSkillColumns(cfg, keywords_to_add = []) {
  const s = cfg.skills || {};
  const technical = splitSkills(s.technical);
  const tools     = splitSkills(s.tools);
  const langs     = splitSkills(s.languages);
  const certs     = splitSkills(s.certifications);

  // Inject AI-suggested keywords not already present (up to 3)
  const existing = new Set([...technical, ...tools].map(x => x.toLowerCase()));
  const newKw = (keywords_to_add || []).filter(k => !existing.has(k.toLowerCase())).slice(0, 3);
  const technicalFinal = [...technical, ...newKw].slice(0, 10);

  const credItems = [
    ...certs.slice(0, 6),
    ...langs.map(l => `🌐 ${l}`),
  ];

  return [
    {
      header: "Technical Skills",
      items: technicalFinal.length ? technicalFinal : ["Technical skills not specified"],
    },
    {
      header: "Tools & Software",
      items: tools.slice(0, 8).length ? tools.slice(0, 8) : ["See profile for details"],
    },
    {
      header: "Credentials & Languages",
      items: credItems.length ? credItems : ["See profile"],
    },
  ];
}

function skillTable(columns) {
  const colWidth = Math.floor(9360 / columns.length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: columns.map(() => colWidth),
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [new TableRow({
      children: columns.map(col => new TableCell({
        borders: noBorders,
        shading: { fill: LIGHT, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 100, left: 200, right: 200 },
        width: { size: colWidth, type: WidthType.DXA },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 1 } },
            children: [new TextRun({ text: col.header.toUpperCase(), bold: true, size: 17, color: TEAL, font: "Calibri", characterSpacing: 15 })],
          }),
          ...col.items.map(item => new Paragraph({
            spacing: { before: 50, after: 40 },
            children: [
              new TextRun({ text: "· ", size: 18, color: TEAL, font: "Calibri" }),
              new TextRun({ text: item, size: 18, color: DARK, font: "Calibri" }),
            ],
          })),
        ],
      })),
    })],
  });
}

// ── Flatten AI bullets: rewrites first, keeps, deprioritised last ────────────
function getBullets(experience_bullets, jobKey) {
  const b = experience_bullets?.[jobKey];
  if (!b) return null;
  const result = [
    ...(b.rewrite || []).map(r => r.improved || r.original || ''),
    ...(b.keep || []),
    ...(b.deprioritise || []),
  ].filter(Boolean);
  return result.length ? result : null;
}

// ── Build fallback bullets from config experience entry ────────────────────
function fallbackBullets(expEntry) {
  if (!expEntry) return ["Contributed to team objectives and operational outcomes."];
  const bullets = expEntry.bullets || [];
  return bullets.length
    ? bullets
    : [`${expEntry.title} at ${expEntry.company} — contributed to operational and analytical outcomes.`];
}

// ── Build DOCX from config + AI tailoring data ────────────────────────────
async function buildDocx(data, company, cfg = null, targetTitle = null) {
  if (!cfg) cfg = loadConfig() || {};
  const p   = cfg.personal   || {};
  const exp = cfg.experience || [];
  const edu = cfg.education  || [];
  const s   = cfg.skills     || {};

  const fullName = `${p.first_name || 'Candidate'} ${p.last_name || ''}`.trim();
  const tagline  = targetTitle || p.tagline || 'Professional';
  const contact  = [p.location, p.phone, p.email].filter(Boolean).join('  |  ');
  const linkedin = p.linkedin || '';

  const { tailored_profile, experience_bullets, keywords_to_add = [] } = data;

  // Match AI bullet keys to config experience entries by position
  const expBulletsForDoc = exp.map((job, i) => {
    const aiKey = Object.keys(experience_bullets || {})[i];
    const aiBullets = aiKey ? getBullets(experience_bullets, aiKey) : null;
    return aiBullets || fallbackBullets(job);
  });

  // ── Education paragraphs ──────────────────────────────────────────────
  const eduParagraphs = [];
  edu.forEach((e, i) => {
    eduParagraphs.push(
      new Paragraph({
        spacing: { before: i === 0 ? 100 : 140, after: 16 },
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        children: [
          new TextRun({ text: e.degree || '', bold: true, size: 20, color: NAVY, font: "Calibri" }),
          new TextRun({ text: "\t" }),
          new TextRun({ text: `${e.start || ''} – ${e.end || ''}`, size: 18, italics: true, color: "777777", font: "Calibri" }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: e.focus ? 16 : 100 },
        children: [new TextRun({ text: `${e.institution || ''}${e.location ? '  ·  ' + e.location : ''}`, size: 19, color: "555555", font: "Calibri" })],
      }),
      ...(e.focus ? [new Paragraph({
        spacing: { before: 0, after: 100 },
        children: [new TextRun({ text: `Focus: ${e.focus}`, size: 18, italics: true, color: "777777", font: "Calibri" })],
      })] : [])
    );
  });

  // ── Document children ─────────────────────────────────────────────────
  const children = [

    // Header
    new Paragraph({
      spacing: { before: 0, after: 20 },
      children: [new TextRun({ text: fullName.toUpperCase(), bold: true, size: 56, color: NAVY, font: "Calibri" })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 50 },
      children: [new TextRun({ text: tagline, size: 22, color: TEAL, font: "Calibri" })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 8 },
      children: [
        new TextRun({ text: contact, size: 17, color: "666666", font: "Calibri" }),
        ...(linkedin ? [
          new TextRun({ text: "    ·    ", size: 17, color: "999999", font: "Calibri" }),
          new TextRun({ text: linkedin, size: 17, color: TEAL, font: "Calibri" }),
        ] : []),
      ],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: NAVY, space: 1 } },
      spacing: { before: 40, after: 0 },
    }),

    // Professional Summary
    ...sectionHeader("Professional Summary"),
    profileParagraph(tailored_profile),

    // Core Skills — keywords_to_add injected into technical column
    ...sectionHeader("Core Skills"),
    skillTable(buildSkillColumns(cfg, keywords_to_add)),
    ...(s.differentiator ? [
      new Paragraph({
        spacing: { before: 80, after: 0 },
        children: [new TextRun({ text: s.differentiator, size: 17, italics: true, color: "888888", font: "Calibri" })],
      }),
    ] : []),

    // Professional Experience
    ...sectionHeader("Professional Experience"),
    ...exp.flatMap((job, i) => [
      ...jobHeader(job.title || '', job.company || '', job.location || '', `${job.start || ''} – ${job.end || ''}`),
      ...(expBulletsForDoc[i] || []).map(b => bullet(b)),
    ]),

    // Education
    ...sectionHeader("Education"),
    ...eduParagraphs,
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 20, color: DARK } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 800, right: 1000, bottom: 800, left: 1000 },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}



// ── Filename: [FirstLast]_CV_[Company]_[MMYY].docx ─────────────────────────
function makeFilename(company) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const co = (company || 'Company').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  const cfg = loadConfig() || {};
  const p = cfg.personal || {};
  const name = `${p.first_name || ''}${p.last_name || 'User'}`.replace(/[^a-zA-Z0-9]/g,'');
  return `${name}_CV_${co}_${mm}${yy}.docx`;
}

// ── MIME map ───────────────────────────────────────────────────────────────
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

// ── /about → serve about.html (no auth required) ──────────────────────────
// Registered as an explicit route so it works even before setup is complete.

// ── HTTP server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'X-Saved-Filename');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /api/claude → Groq
  if (req.method === 'POST' && req.url === '/api/claude') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch { res.writeHead(400); res.end('Bad JSON'); return; }

      // Accept setup_key from body during onboarding (before config.json exists)
      const groqKey = getGroqKey() || parsed.setup_key || '';
      if (!groqKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'No API key found. Enter and test your Groq key on Step 2 of setup.' } }));
        return;
      }

      const payload = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: parsed.max_tokens || 4000,
        messages: parsed.messages,
      });

      const opts = {
        hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const apiReq = https.request(opts, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          try {
            const groq = JSON.parse(data);
            if (groq.error) {
              // Surface rate limit message cleanly to the browser
              const msg = groq.error.message || 'Groq API error';
              res.writeHead(429, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { message: msg } }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content: [{ type: 'text', text: groq.choices?.[0]?.message?.content || '' }] }));
          } catch {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: 'Bad response from Groq' } }));
          }
        });
      });

      apiReq.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message } }));
      });

      apiReq.write(payload);
      apiReq.end();
    });
    return;
  }
  // POST /api/generate-cv → save to resumes/ + stream download
  if (req.method === 'POST' && req.url === '/api/generate-cv') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch { res.writeHead(400); res.end('Bad JSON'); return; }
      try {
        const cfg = loadConfig();
        const buffer = await buildDocx(parsed.data, parsed.company, cfg, parsed.title || null);
        const filename = makeFilename(parsed.company);

        // Save a copy to resumes/ subfolder
        const resumesDir = path.join(__dirname, 'resumes');
        if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir);
        fs.writeFileSync(path.join(resumesDir, filename), buffer);

        res.writeHead(200, {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length,
          'X-Saved-Filename': filename,   // pipeline.html reads this
        });
        res.end(buffer);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /api/resumes → list saved CV files
  if (req.method === 'GET' && req.url === '/api/resumes') {
    const resumesDir = path.join(__dirname, 'resumes');
    if (!fs.existsSync(resumesDir)) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify([])); return; }
    const files = fs.readdirSync(resumesDir).filter(f => f.endsWith('.docx')).sort().reverse();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    return;
  }

  // GET /api/resumes/:filename → open/download a saved CV
  if (req.method === 'GET' && req.url.startsWith('/api/resumes/')) {
    const filename = decodeURIComponent(req.url.replace('/api/resumes/', ''));
    const filePath = path.join(__dirname, 'resumes', filename);
    if (!filePath.startsWith(path.join(__dirname, 'resumes')) || !fs.existsSync(filePath)) {
      res.writeHead(404); res.end('Not found'); return;
    }
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // GET / → redirect to setup if not configured, else index
  if (req.method === 'GET' && req.url.split('?')[0] === '/') {
    const cfg = loadConfig();
    if (!cfg || !cfg.setup_complete) {
      res.writeHead(302, { Location: '/setup.html' }); res.end(); return;
    }
    res.writeHead(302, { Location: '/pipeline.html' }); res.end(); return;
  }

  // Redirect to setup if any tool page loaded without config
  const toolPages = ['/jd-analyser.html','/cv-tailor.html','/pipeline.html','/search-kit.html','/compass.html'];
  if (req.method === 'GET' && toolPages.includes(req.url.split('?')[0])) {
    const cfg = loadConfig();
    if (!cfg || !cfg.setup_complete) {
      res.writeHead(302, { Location: '/setup.html' }); res.end(); return;
    }
  }

  // POST /api/test-key → verify Groq key works
  if (req.method === 'POST' && req.url === '/api/test-key') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch { res.writeHead(400); res.end('{}'); return; }
      const testPayload = JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] });
      const opts = {
        hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${parsed.key}`, 'Content-Length': Buffer.byteLength(testPayload) },
      };
      const apiReq = https.request(opts, apiRes => {
        let data = '';
        apiRes.on('data', c => data += c);
        apiRes.on('end', () => {
          const ok = apiRes.statusCode === 200;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok }));
        });
      });
      apiReq.on('error', () => { res.writeHead(200); res.end(JSON.stringify({ ok: false })); });
      apiReq.write(testPayload); apiReq.end();
    });
    return;
  }

  // POST /api/save-config → write config.json
  if (req.method === 'POST' && req.url === '/api/save-config') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        console.log(`  ✓ Config saved for ${data.personal?.first_name} ${data.personal?.last_name}`);
      } catch(err) {
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /api/pipeline → return persisted pipeline.json (array)
  if (req.method === 'GET' && req.url === '/api/pipeline') {
    try {
      const data = fs.existsSync(PIPELINE_FILE)
        ? JSON.parse(fs.readFileSync(PIPELINE_FILE, 'utf8'))
        : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Array.isArray(data) ? data : []));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/pipeline → overwrite pipeline.json with full array
  if (req.method === 'POST' && req.url === '/api/pipeline') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!Array.isArray(data)) throw new Error('Payload must be a JSON array');
        fs.writeFileSync(PIPELINE_FILE, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, count: data.length }));
        console.log(`  ✓ Pipeline saved — ${data.length} entr${data.length === 1 ? 'y' : 'ies'}`);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/parse-resume → extract text from uploaded DOCX, return structured JSON via AI
  if (req.method === 'POST' && req.url === '/api/parse-resume') {
    let chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) throw new Error('No multipart boundary');

        const body = Buffer.concat(chunks);
        const boundaryBuf = Buffer.from('--' + boundary);

        // Extract file data from multipart
        let fileBuffer = null;
        let pos = 0;
        while (pos < body.length) {
          const boundaryPos = body.indexOf(boundaryBuf, pos);
          if (boundaryPos === -1) break;
          const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), boundaryPos);
          if (headerEnd === -1) break;
          const header = body.slice(boundaryPos, headerEnd).toString();
          if (header.includes('filename=') && header.includes('.docx')) {
            const dataStart = headerEnd + 4;
            const nextBoundary = body.indexOf(boundaryBuf, dataStart);
            const dataEnd = nextBoundary !== -1 ? nextBoundary - 2 : body.length;
            fileBuffer = body.slice(dataStart, dataEnd);
            break;
          }
          pos = boundaryPos + boundaryBuf.length;
        }

        if (!fileBuffer || fileBuffer.length < 100) {
          throw new Error('No DOCX file received — make sure you selected a .docx file');
        }

        // Extract word/document.xml from DOCX buffer — pure Node, no shell commands
        let rawText = '';
        try {
          const xmlBuf = extractFromZip(fileBuffer, 'word/document.xml');
          rawText = xmlBuf.toString('utf8')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'").replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ').trim();
        } catch (zipErr) {
          throw new Error('Could not read this DOCX file. Make sure it is a valid .docx (not .doc or PDF). Detail: ' + zipErr.message);
        }

        if (!rawText || rawText.length < 100) {
          throw new Error('Could not extract text from this DOCX. Try copying your CV content into the manual form instead.');
        }

        // Truncate to ~6000 chars to stay within token budget
        const truncated = rawText.length > 6000 ? rawText.slice(0, 6000) + '...' : rawText;

        // Now send to Groq to extract structured profile
        // Accept x-setup-key header as fallback during onboarding (before config.json is saved)
        const groqKey = getGroqKey() || (req.headers['x-setup-key'] || '').trim() || null;
        if (!groqKey) throw new Error('No API key configured — enter your Groq key in Step 1 and click Next first');

        const parsePrompt = `You are parsing a CV/resume into a structured JSON profile. Extract the information exactly as written — do not infer, embellish, or add anything not present in the text. If a field is not found, use an empty string or empty array.

CV TEXT:
${truncated}

Return ONLY this exact JSON structure — no markdown, no explanation:
{
  "personal": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "tagline": ""
  },
  "summary": "",
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "start": "",
      "end": "",
      "bullets": ["exact bullet text as written"]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "start": "",
      "end": "",
      "focus": ""
    }
  ],
  "skills": {
    "technical": "",
    "tools": "",
    "languages": "",
    "certifications": ""
  }
}

Extract only what is explicitly stated. For experience end date, use "Present" if the role is current.`;

        const payload = JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 3000,
          messages: [{ role: 'user', content: parsePrompt }],
        });

        const result = await new Promise((resolve, reject) => {
          const opts = {
            hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`,
              'Content-Length': Buffer.byteLength(payload),
            },
          };
          const apiReq = https.request(opts, apiRes => {
            let data = '';
            apiRes.on('data', c => data += c);
            apiRes.on('end', () => {
              try {
                const groq = JSON.parse(data);
                if (groq.error) return reject(new Error(groq.error.message));
                const text = groq.choices?.[0]?.message?.content || '';
                const cleaned = text.replace(/```json|```/g, '').trim();
                resolve(JSON.parse(cleaned));
              } catch (e) { reject(new Error('Failed to parse AI response: ' + e.message)); }
            });
          });
          apiReq.on('error', reject);
          apiReq.write(payload);
          apiReq.end();
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, profile: result }));

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // GET /api/config → return config (without API key) for HTML tools
  if (req.method === 'GET' && req.url === '/api/config') {
    const cfg = loadConfig();
    if (!cfg) { res.writeHead(404); res.end('{}'); return; }
    const safe = { ...cfg };
    delete safe.groq_api_key; // never expose key to browser
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(safe));
    return;
  }

  // GET /about → always serve about.html (pre-setup accessible)
  if (req.method === 'GET' && (req.url === '/about' || req.url === '/about.html')) {
    const aboutPath = path.join(__dirname, 'about.html');
    if (fs.existsSync(aboutPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(aboutPath).pipe(res);
    } else {
      res.writeHead(404); res.end('about.html not found');
    }
    return;
  }

  // Static files — strip query string before resolving file path
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? '/index.html' : urlPath);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  const cfg = loadConfig();
  const hasKey = !!getGroqKey();
  const base = `http://localhost:${PORT}`;

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           CAREER OPS  — RUNNING             ║');
  console.log('║         Built by Johan Lopez  · v1.0        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  if (!cfg || !cfg.setup_complete) {
    console.log('  ⚠  No profile set up yet.');
    console.log('');
    console.log('  👉 Start here:');
    console.log(`     ${base}/setup.html`);
  } else {
    const name = `${cfg.personal?.first_name || ''} ${cfg.personal?.last_name || ''}`.trim();
    console.log(`  ✓  Profile : ${name}`);
    console.log(`  ✓  API key : ${hasKey ? 'loaded' : '⚠ MISSING — re-run setup'}`);
    console.log('');
    console.log('  🔗 Open in browser:');
    console.log(`     Setup      →  ${base}/setup.html`);
    console.log(`     JD Check   →  ${base}/jd-analyser.html`);
    console.log(`     CV Tailor  →  ${base}/cv-tailor.html`);
    console.log(`     Search Kit →  ${base}/search-kit.html`);
    console.log(`     Compass    →  ${base}/compass.html`);
    console.log(`     Pipeline   →  ${base}/pipeline.html`);
  }
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
