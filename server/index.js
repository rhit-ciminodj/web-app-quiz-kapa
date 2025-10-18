const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'quizzes.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function loadQuizzes() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function saveQuizzes(arr) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

function makeSlug(len = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function validateQuiz(q) {
  if (!q || typeof q !== 'object') return 'Invalid payload';
  if (!q.title || String(q.title).trim().length === 0) return 'Title required';
  if (!Array.isArray(q.questions) || q.questions.length === 0) return 'At least one question required';
  if (q.questions.length > 200) return 'Too many questions';
  for (const [i, qu] of q.questions.entries()) {
    if (!qu.text || String(qu.text).trim().length === 0) return `Question ${i + 1}: text required`;
    if (!Array.isArray(qu.choices) || qu.choices.length < 2) return `Question ${i + 1}: need at least two choices`;
    if (typeof qu.correctIndex !== 'number' || qu.correctIndex < 0 || qu.correctIndex >= qu.choices.length) return `Question ${i + 1}: correctIndex invalid`;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && parsed.pathname === '/api/quizzes') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const err = validateQuiz(payload);
        if (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err }));
        }
        const quizzes = loadQuizzes();
        let slug = makeSlug(7);
        // ensure uniqueness
        while (quizzes.find((q) => q.slug === slug)) slug = makeSlug(7);
        const entry = {
          id: Date.now(),
          slug,
          title: payload.title,
          description: payload.description || '',
          public: payload.public === true,
          questions: payload.questions,
          createdAt: new Date().toISOString(),
        };
        quizzes.push(entry);
        saveQuizzes(quizzes);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ slug: entry.slug, id: entry.id }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /api/quizzes/:slug
  if (req.method === 'GET' && parsed.pathname.startsWith('/api/quizzes/')) {
    const slug = parsed.pathname.split('/').pop();
    const quizzes = loadQuizzes();
    const found = quizzes.find((q) => q.slug === slug);
    if (!found) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(found));
  }

  // static message
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Quiz API running' }));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Quiz API server listening on port ${PORT}`));
