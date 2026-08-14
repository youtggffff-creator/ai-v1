// ============================================
// AI CHATBOT SERVER v2 — UCHIRO
// ============================================
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
app.use(express.json({ limit: '25mb' }));
app.use(express.static('public'));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ សូមកំណត់ ANTHROPIC_API_KEY ក្នុង .env!');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ សូមកំណត់ JWT_SECRET ក្នុង .env!');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const MODEL_NAME = process.env.MODEL_NAME || 'claude-opus-5';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL && { baseURL: process.env.ANTHROPIC_BASE_URL }),
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'សូម Sign In ជាមុនសិន' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session ផុតកំណត់ សូម Sign In ម្តងទៀត' });
  }
}

// ============================================
// AUTH ENDPOINTS (/api/auth/*)
// ============================================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email និង password ត្រូវការជាចាំបាច់' });
    if (password.length < 6) return res.status(400).json({ error: 'Password ត្រូវការយ៉ាងតិច ៦ តួអក្សរ' });

    const existingUser = findUserByEmail(email);
    if (existingUser) return res.status(409).json({ error: 'Email នេះមានគណនីរួចហើយ — សូម Sign In ជំនួសវិញ' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createUser(email, passwordHash, name || 'User');
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: userId, email: email.toLowerCase().trim(), name: name || 'User' } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'មិនអាចបង្កើតគណនីបានទេ: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email និង password ត្រូវការជាចាំបាច់' });

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Email ឬ password មិនត្រឹមត្រូវ' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ឬ password មិនត្រឹមត្រូវ' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'មិនអាច Sign In បានទេ: ' + error.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'រកគណនីមិនឃើញ' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// ============================================
// FILE GENERATION HELPERS
// ============================================
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'document';
}

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

function safeCalculate(expression) {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error('កន្សោមមិនត្រឹមត្រូវ');
  }
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expression});`)();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('លទ្ធផលមិនត្រឹមត្រូវ');
  return result;
}

// ============================================
// TOOL DEFINITIONS
// ============================================
const tools = [
  {
    name: 'create_document',
    description: 'បង្កើត file ជា PDF ឬ Word document សម្រាប់ user ទាញយក។',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'ចំណងជើងឯកសារ' },
        content: { type: 'string', description: 'ខ្លឹមសារពេញលេញនៃឯកសារ' },
        format: { type: 'string', enum: ['pdf', 'docx'], description: 'ប្រភេទ file (pdf ឬ docx)' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'remember_fact',
    description: 'រក្សាទុកព័ត៌មានសំខាន់អំពី user ជាអចិន្ត្រៃយ៍។',
    input_schema: {
      type: 'object',
      properties: {
        fact: { type: 'string', description: 'ព័ត៌មានខ្លីមួយប្រយោគដែលត្រូវចងចាំ' },
      },
      required: ['fact'],
    },
  },
  {
    name: 'calculate',
    description: 'គណនាកន្សោមគណិតវិទ្យា (arithmetic) យ៉ាងជាក់លាក់។',
    input_schema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'កន្សោមគណិត ឧទាហរណ៍ "1500 * 1.08"' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_datetime',
    description: 'ទាញយកកាលបរិច្ឆេទ និងម៉ោងបច្ចុប្បន្ន។',
    input_schema: { type: 'object', properties: {} },
  },
];

// ============================================
// MAIN CHAT ENDPOINT
// ============================================
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, attachment } = req.body;
    const sessionId = String(req.userId);
    if (!message && !attachment) return res.status(400).json({ error: 'សូមផ្ញើសារ' });

    const pastMessages = getHistory(sessionId, 20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const facts = getFacts(sessionId);
    const memoryBlock = facts.length
      ? `\n\nThings you remember about the user:\n${facts.map((f) => `- ${f.fact}`).join('\n')}`
      : '';

    const systemPrompt = `You are Uchiro — the user's personal AI assistant, created by KHINSOVANNOREAKYOUT. Personality: sharp, honest, energetic, direct, warm.

Language rule: Reply in English by default. If the user writes in Khmer, reply in Khmer. Otherwise, match the user's language.${memoryBlock}`;

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
        const trimmed = (attachment.textContent || '').slice(0, 30000);
        userContent.push({
          type: 'text',
          text: `[Uploaded file: ${attachment.name}]\n---\n${trimmed}\n---`,
        });
        attachmentLabel = `[file: ${attachment.name}]`;
      }
    }

    userContent.push({ type: 'text', text: message || 'Please inspect the attached file.' });

    let messages = [...pastMessages, { role: 'user', content: userContent }];
    saveMessage(sessionId, 'user', message || attachmentLabel || '[attachment]');

    let downloadUrl = null;
    let finalText = '';
    let newFacts = [];

    for (let turn = 0; turn < 5; turn++) {
      const response = await anthropic.messages.create({
        model: MODEL_NAME,
        max_tokens: 2000,
        system: systemPrompt,
        tools,
        messages,
      });

      const textBlocks = response.content.filter((b) => b.type === 'text');
      if (textBlocks.length) {
        finalText += (finalText ? '\n' : '') + textBlocks.map((b) => b.text).join('\n');
      }

      if (response.stop_reason !== 'tool_use') break;

      messages.push({ role: 'assistant', content: response.content });

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
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: new Date().toISOString() + ' (UTC)',
          });
        }
      }

      if (toolResults.length === 0) break;
      messages.push({ role: 'user', content: toolResults });
    }

    saveMessage(sessionId, 'assistant', finalText, downloadUrl);
    res.json({ reply: finalText, downloadUrl, newFacts });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: 'មានបញ្ហា! សូមពិនិត្យ API Key ឬការកំណត់ Gateway។',
      detail: error.message,
    });
  }
});

// ============================================
// HISTORY ENDPOINTS (គាំទ្រទាំង /api/history/me)
// ============================================
app.get('/api/history/:sessionId', requireAuth, (req, res) => {
  res.json({ history: getHistory(String(req.userId)) });
});

app.delete('/api/history/:sessionId', requireAuth, (req, res) => {
  clearHistory(String(req.userId));
  res.json({ ok: true });
});

// ============================================
// MEMORY ENDPOINTS (គាំទ្រទាំង /api/memory/me និង /api/memory/:factId)
// ============================================
app.get('/api/memory/:sessionId', requireAuth, (req, res) => {
  res.json({ facts: getFacts(String(req.userId)) });
});

app.delete('/api/memory/:factId', requireAuth, (req, res) => {
  deleteFact(req.params.factId);
  res.json({ ok: true });
});

// ============================================
// FILES & HEALTH CHECK
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
