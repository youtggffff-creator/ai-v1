// ============================================
// AI CHATBOT SERVER v2 — ដូច Claude.ai ជាងមុន
// ============================================
// Features: Web search ពិត | Image upload | Database (SQLite) | Smart file detection (Tool Use)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  saveMessage, getHistory, clearHistory, saveFact, getFacts, deleteFact,
  createUser, findUserByEmail, findUserById,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const DOWNLOADS_DIR = path.join(__dirname, 'public', 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '25mb' })); // ធំជាងធម្មតា ព្រោះ file/image base64 ធំ
app.use(express.static('public'));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ សូមដាក់ ANTHROPIC_API_KEY ក្នុង file .env ជាមុនសិន!');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ សូមដាក់ JWT_SECRET ក្នុង file .env ជាមុនសិន! (ត្រូវការសម្រាប់ Sign In)');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================
// AUTH MIDDLEWARE — ត្រួតពិនិត្យ login token
// ============================================
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'សូម Sign in ជាមុនសិន' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session ផុតកំណត់ សូម Sign in ម្តងទៀត' });
  }
}

// ============================================
// AUTH ENDPOINTS — Sign up / Sign in with Email
// ============================================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email និង password ត្រូវការ' });
    if (password.length < 6) return res.status(400).json({ error: 'Password ត្រូវការយ៉ាងតិច ៦ តួអក្សរ' });
    if (findUserByEmail(email)) return res.status(409).json({ error: 'Email នេះមានគណនីរួចហើយ — សូម Sign in ជំនួសវិញ' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createUser(email, passwordHash, name);
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: userId, email: email.toLowerCase().trim(), name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'មិនអាចបង្កើតគណនីបានទេ' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email និង password ត្រូវការ' });

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Email ឬ password មិនត្រឹមត្រូវ' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ឬ password មិនត្រឹមត្រូវ' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'មិនអាច Sign in បានទេ' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'រកគណនីមិនឃើញ' });
  res.json({ user });
});

// ============================================
// FILE GENERATION HELPERS
// ============================================
function createPDF(content, title) {
  const filename = `${slugify(title)}-${crypto.randomBytes(4).toString('hex')}.pdf`;
  const filepath = path.join(DOWNLOADS_DIR, filename);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filepath));
  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(content, { align: 'left' });
  doc.end();
  return filename;
}

async function createDocx(content, title) {
  const filename = `${slugify(title)}-${crypto.randomBytes(4).toString('hex')}.docx`;
  const filepath = path.join(DOWNLOADS_DIR, filename);
  const paragraphs = content.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] }));
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })] }),
        new Paragraph({ children: [new TextRun('')] }),
        ...paragraphs,
      ],
    }],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filepath, buffer);
  return filename;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'document';
}

// ============================================
// SAFE CALCULATOR — អនុញ្ញាតតែលេខ+សញ្ញាគណិត កុំឲ្យ code injection
// ============================================
function safeCalculate(expression) {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error('កន្សោមមិនត្រឹមត្រូវ — អនុញ្ញាតតែលេខ និងសញ្ញា + - * / ( )');
  }
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expression});`)();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('លទ្ធផលមិនត្រឹមត្រូវ');
  return result;
}

// ============================================
// TOOL DEFINITIONS — Claude សម្រេចចិត្តខ្លួនឯងពេលណាត្រូវហៅ
// ============================================
const tools = [
  {
    // Custom tool — យើងគ្រប់គ្រង logic ខ្លួនឯង
    name: 'create_document',
    description:
      'បង្កើត file ជា PDF ឬ Word document សម្រាប់ user ទាញយក។ ប្រើ tool នេះនៅពេល user ស្នើសុំ report, document, letter, contract ឬអ្វីៗដែលគួរផ្តល់ជា file ដើម្បីរក្សាទុក/បោះពុម្ព/ចែករំលែក — មិនមែនគ្រាន់តែឆ្លើយសំណួរធម្មតា។',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'ចំណងជើងឯកសារ' },
        content: { type: 'string', description: 'ខ្លឹមសារពេញលេញនៃឯកសារ សរសេរឲ្យបានល្អិតល្អន់និងរៀបចំរបៀបរាយបញ្ជី' },
        format: { type: 'string', enum: ['pdf', 'docx'], description: 'ប្រភេទ file ដែល user ចង់បាន (default: pdf)' },
      },
      required: ['title', 'content'],
    },
  },
  {
    // Server-side tool — Anthropic ដំណើរការស្វ័យប្រវត្តិ (យើងមិនត្រូវសរសេរ logic)
    type: 'web_search_20250305',
    name: 'web_search',
  },
  {
    name: 'remember_fact',
    description:
      'រក្សាទុកព័ត៌មានសំខាន់អំពី user ជាអចិន្ត្រៃយ៍ សម្រាប់ចាំក្នុងការសន្ទនាលើកក្រោយ។ ប្រើនៅពេល user ប្រាប់ឈ្មោះ, ចំណូលចិត្ត, គម្រោង, ព័ត៌មានផ្ទាល់ខ្លួន ឬអ្វីៗដែលមានប្រយោជន៍ចាំក្នុងពេលអនាគត។ កុំប្រើសម្រាប់ព័ត៌មានបណ្តោះអាសន្នមិនសំខាន់។',
    input_schema: {
      type: 'object',
      properties: {
        fact: { type: 'string', description: 'ព័ត៌មានខ្លីមួយប្រយោគ ដែលគួរចាំ (ឧទាហរណ៍: "ឈ្មោះ user គឺ Sokha", "user កំពុងសាងសង់ store លក់ស្បែកជើង")' },
      },
      required: ['fact'],
    },
  },
  {
    name: 'calculate',
    description:
      'គណនាកន្សោមគណិតវិទ្យា (arithmetic) យ៉ាងជាក់លាក់ត្រឹមត្រូវ។ ប្រើ tool នេះជំនួសគណនាក្នុងចិត្តរាល់ពេលមានលេខ/គណនាដែលត្រូវការភាពត្រឹមត្រូវខ្ពស់ (ឧទាហរណ៍ គណនាថ្លៃដើម, ភាគរយ, ការប្តូររូបិយប័ណ្ណដោយដៃ)។',
    input_schema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'កន្សោមគណិតវិទ្យា ប្រើតែលេខ + - * / ( ) . ប៉ុណ្ណោះ ឧទាហរណ៍ "1500 * 1.08"' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_datetime',
    description: 'ទាញយកកាលបរិច្ឆេទ និងម៉ោងបច្ចុប្បន្នពិត។ ប្រើនៅពេល user សួរអំពី "ថ្ងៃនេះ", "ឥឡូវនេះ", deadline, ឬត្រូវការគណនាចំនួនថ្ងៃ។',
    input_schema: { type: 'object', properties: {} },
  },
];

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, attachment } = req.body;
    const sessionId = String(req.userId); // គណនី user ម្នាក់ៗចាំ history ដាច់ដោយឡែក
    if (!message && !attachment) return res.status(400).json({ error: 'សូមផ្ញើសារ' });

    // ១. ទាញយក history ចាស់ + memory ដែលធ្លាប់ចាំពី database
    const pastMessages = getHistory(sessionId).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const facts = getFacts(sessionId);
    const memoryBlock = facts.length
      ? `\n\nThings you remember about the user (use naturally, don't just recite them):\n${facts.map((f) => `- ${f.fact}`).join('\n')}`
      : '';

    const systemPrompt = `You are Uchiro — the user's personal AI assistant (their robot / programming companion), created by its founder KHINSOVANNOREAKYOUT. Personality: sharp, honest, energetic, direct, warm.

Language rule: Reply in English by default. If the user writes in Khmer, reply in Khmer. Otherwise, match whatever language the user writes in. Never mix languages within one reply unless the user does.${memoryBlock}`;

    // ២. សាងសង់ user message ថ្មី (អាចមាន text + attachment: image/pdf/text-file)
    const userContent = [];
    let attachmentLabel = null;

    if (attachment) {
      if (attachment.kind === 'image') {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: attachment.mediaType, data: attachment.base64 },
        });
        attachmentLabel = `[image: ${attachment.name}]`;
      } else if (attachment.kind === 'pdf') {
        userContent.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: attachment.base64 },
        });
        attachmentLabel = `[pdf: ${attachment.name}]`;
      } else if (attachment.kind === 'text') {
        const trimmed = attachment.textContent.slice(0, 30000); // កំណត់ទំហំកុំឲ្យ token ច្រើនពេក
        userContent.push({
          type: 'text',
          text: `[Uploaded file: ${attachment.name}]\n---\n${trimmed}\n---`,
        });
        attachmentLabel = `[file: ${attachment.name}]`;
      }
    }

    userContent.push({ type: 'text', text: message || 'Please look at this file.' });

    let messages = [...pastMessages, { role: 'user', content: userContent }];

    // ៣. Save user message ចូល database
    saveMessage(sessionId, 'user', message || attachmentLabel || '[attachment]');

    let downloadUrl = null;
    let finalText = '';
    let usedWebSearch = false;
    let newFacts = [];

    // ៤. Agent loop — Claude អាចហៅ tool ច្រើនដងជាប់គ្នា រហូតដល់ចប់
    for (let turn = 0; turn < 5; turn++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        tools,
        messages,
      });

      // ប្រមូល text ដែល Claude ឆ្លើយ
      const textBlocks = response.content.filter((b) => b.type === 'text');
      if (textBlocks.length) finalText += textBlocks.map((b) => b.text).join('\n');

      // web_search ជា server-side tool — Anthropic ដំណើរការស្រេចក្នុង response តែម្តង
      // (block type ជា 'server_tool_use' / 'web_search_tool_result', មិនមែន 'tool_use' ធម្មតា)
      if (response.content.some((b) => b.type === 'server_tool_use' && b.name === 'web_search')) {
        usedWebSearch = true;
      }

      if (response.stop_reason !== 'tool_use') break; // Claude ឆ្លើយចប់ហើយ (custom tool គ្មានទៀត)

      // ដាក់ assistant turn (រួមទាំង tool_use blocks) ចូល messages
      messages.push({ role: 'assistant', content: response.content });

      // ដំណើរការ custom tool calls (create_document) — web_search Anthropic ធ្វើស្រេចហើយ
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        if (block.name === 'create_document') {
          const { title, content, format = 'pdf' } = block.input;
          const filename = format === 'docx' ? await createDocx(content, title) : createPDF(content, title);
          downloadUrl = `/downloads/${filename}`;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `File "${filename}" was created successfully.`,
          });
        }

        if (block.name === 'remember_fact') {
          const { fact } = block.input;
          saveFact(sessionId, fact);
          newFacts.push(fact);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Remembered: "${fact}"`,
          });
        }

        if (block.name === 'calculate') {
          try {
            const result = safeCalculate(block.input.expression);
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: String(result) });
          } catch (e) {
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error: ${e.message}`, is_error: true });
          }
        }

        if (block.name === 'get_datetime') {
          const now = new Date();
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: now.toISOString() + ' (UTC)',
          });
        }
      }

      if (toolResults.length === 0) break; // គ្មាន custom tool ត្រូវឆ្លើយតប (web_search server-side ស្រេច)
      messages.push({ role: 'user', content: toolResults });
    }

    // ៥. Save assistant reply ចូល database
    saveMessage(sessionId, 'assistant', finalText, downloadUrl);

    res.json({ reply: finalText, downloadUrl, usedWebSearch, newFacts });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'មានបញ្ហា! សូមពិនិត្យ API key ឬ credit របស់អ្នក។',
      detail: error.message,
    });
  }
});

// ============================================
// HISTORY ENDPOINTS
// ============================================
app.get('/api/history/:sessionId', requireAuth, (req, res) => {
  res.json({ history: getHistory(String(req.userId)) });
});

app.delete('/api/history/:sessionId', requireAuth, (req, res) => {
  clearHistory(String(req.userId));
  res.json({ ok: true });
});

// ============================================
// MEMORY ENDPOINTS
// ============================================
app.get('/api/memory/:sessionId', requireAuth, (req, res) => {
  res.json({ facts: getFacts(String(req.userId)) });
});

app.delete('/api/memory/:factId', requireAuth, (req, res) => {
  deleteFact(req.params.factId);
  res.json({ ok: true });
});

// ============================================
// FILES CATALOG — បញ្ជី file ដែលបានបង្កើតរួច
// ============================================
app.get('/api/files', (req, res) => {
  const files = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((f) => f !== '.gitkeep')
    .map((f) => {
      const stat = fs.statSync(path.join(DOWNLOADS_DIR, f));
      return { name: f, url: `/downloads/${f}`, size: stat.size, createdAt: stat.birthtime };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ files });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ Server ដំណើរការនៅ http://localhost:${PORT}`);
});
